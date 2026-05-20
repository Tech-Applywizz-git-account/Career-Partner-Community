import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { externalSupabase } from '../externalSupabaseClient';
import useAuth from '../hooks/useAuth';
import LogoBox from './LogoBox';
import { fetchJobRoles, filterRoles } from '../utils/rolesSuggestions';
import { getWageLevel } from '../dataSyncService';
import {
    ChevronLeft, ChevronRight, Search, Loader2, AlertCircle,
    Briefcase, ExternalLink, MapPin, Clock, Star, Bookmark, BookmarkCheck,
    SlidersHorizontal, X, Globe, TrendingUp, Building2, CheckCircle
} from 'lucide-react';
import { isFamous, getCompanyRank, RANKED_COMPANIES } from '../utils/famousCompanies';
import { cacheGet, cacheSet, cacheInvalidatePrefix, TTL } from '../utils/queryCache';
import { COUNTRY_MAP, PRIORITY } from '../utils/countryHelper';

const JOBS_PER_PAGE = 15;

const LIGHTWEIGHT_COLUMNS = 'id, role_id, role_name, indeed_search_country, country, location, title, company_name, job_url, job_url_direct, date_posted, is_remote, created_at, job_id, source, salary';

// Helper to identify if a job is in the IT / Tech field
function isITJob(job) {
    if (!job) return false;
    const title = String(job.title || job.role || '').toLowerCase();
    const roleName = String(job.role_name || job.job_role_name || '').toLowerCase();
    const keyword = String(job.indeed_search_keyword || '').toLowerCase();

    const techKeywords = [
        'software', 'engineer', 'developer', 'programmer', 'tech', 'it', 'coder', 'web', 'frontend', 'backend',
        'fullstack', 'data', 'cloud', 'aws', 'azure', 'devops', 'cyber', 'security', 'analyst', 'system',
        'network', 'database', 'sql', 'python', 'java', 'javascript', 'react', 'node', 'ai', 'ml', 'intelligence',
        'machine learning', 'scrum', 'agile', 'qa', 'test', 'automation', 'sap', 'oracle', 'salesforce', 'dynamics',
        'ux', 'ui', 'product manager', 'project manager', 'solution architect', 'infrastructure'
    ];

    return techKeywords.some(kw => title.includes(kw) || roleName.includes(kw) || keyword.includes(kw));
}

// Helper to extract numeric level (1, 2, 3, 4) from strings like "Lv 3", "Level III", "3", etc.
function parseWageLevel(lvl) {
    if (!lvl) return null;
    const m = String(lvl).match(/\d/);
    return m ? parseInt(m[0]) : null;
}

// ── Global Helpers for Identity & Normalization ─────────────────────────
function _normR(s) {
    return String(s || '').toLowerCase().replace(/[-–—]/g, ' ').replace(/\s+/g, ' ').trim();
}

function mapJavaRole(role) {
    if (!role) return role;
    const trimmed = String(role).trim().toLowerCase();
    if (trimmed === 'java developer' || trimmed === 'java full stack' || trimmed === 'java full stack developer') {
        return 'Java Developer';
    }
    return role;
}

function _lvlKey(lv) {
    const n = parseWageLevel(lv);
    return n ? String(n) : '';
}

function _urlKey(u) {
    if (!u) return '';
    let s = String(u).toLowerCase().trim();
    try {
        const o = new URL(s.startsWith('http') ? s : `https://${s}`);
        let hostname = o.hostname.replace(/^www\./, '');
        if (hostname.includes('linkedin.com')) hostname = 'linkedin.com';
        const m = o.pathname.match(/\d{9,}/);
        if (m) return hostname + '||' + m[0];
        return (hostname + o.pathname).replace(/\/$/, '');
    } catch {
        return s.split('?')[0].split('#')[0].replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, '');
    }
}

function VerifiedSeal({ size = 16 }) {
    return (
        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#22c55e', flexShrink: 0 }}>
            <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
            </svg>
        </div>
    );
}

function getCanonicalCompany(name) {
    if (!name) return 'Unknown';
    const n = String(name).toLowerCase().trim();
    if (n.includes('amazon') && !n.includes('aws') && !n.includes('web services')) return 'Amazon';
    return name.trim();
}

function _jobKeyRaw(company, title, location) {
    return `${getCanonicalCompany(company).toLowerCase()}||${_normR(title || '')}||${_normR(location || 'united states')}`;
}
function _jobKey(j) { return _jobKeyRaw(j.company, j.title, j.location); }

// ── Per-card in-memory cache to eliminate redundant Supabase calls ───────────
const _cardCache = new Map(); // key -> { value, ts }
const _CARD_TTL = 10 * 60 * 1000; // 10 minutes
function _cGet(key) { const e = _cardCache.get(key); return (e && Date.now() - e.ts < _CARD_TTL) ? e.value : null; }
function _cSet(key, value) { _cardCache.set(key, { value, ts: Date.now() }); }

// ── Job Row ────────────────────────────────────────────────────────────────
// Helper to parse weird location strings like country='US' city='Arlington' state='VA'
const parseLoc = (str) => {
    if (!str || typeof str !== 'string' || !str.includes('=')) return { c: null, l: null };
    try {
        const country = (str.match(/country=['"]?([^'"]+)['"]?/) || [])[1];
        const city = (str.match(/city=['"]?([^'"]+)['"]?/) || [])[1];
        const state = (str.match(/state=['"]?([^'"]+)['"]?/) || [])[1];

        let loc = null;
        if (city && state) loc = `${city}, ${state}`;
        else if (city) loc = city;
        else if (state) loc = state;

        return { c: country || null, l: loc };
    } catch (e) { return { c: null, l: null }; }
};

// Apply date_posted filter to a Supabase query based on dateFilter prop
// { quickDate: 'today'|'lastmonth'|'7days'|'custom'|'all', from: 'YYYY-MM-DD'|null, to: 'YYYY-MM-DD'|null }
const applyDateFilter = (query, df) => {
    if (!df || df.quickDate === 'all' || (!df.from && !df.to)) return query;
    if (df.from) query = query.gte('date_posted', df.from);
    if (df.to) query = query.lte('date_posted', df.to);
    return query;
};

const JobRow = ({ job, isSaved, onSave, scoringPanel, onApplyClick }) => {
    const [hovered, setHovered] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 1024);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);



    const formatTimeAgo = (d) => {
        if (!d) return 'Recently';
        try {
            const dt = new Date(d), now = new Date();
            const hours = Math.floor((now - dt) / 36e5);
            if (hours < 1) return 'Just now';
            if (hours < 24) return `${hours} hours ago`;
            const days = Math.floor(hours / 24);
            if (days < 7) return `${days} days ago`;
            return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        } catch { return 'Recently'; }
    };



    return (
        <div
            className="bg-white rounded-[24px] border border-[#f0f0f0] mb-5 shadow-sm hover:shadow-xl hover:border-[#2C76FF]/20 transition-all duration-300 flex flex-col lg:flex-row group"
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            {/* Main Content Area */}
            <div className="flex-1 p-6 flex flex-col min-w-0">
                {/* Top Badges */}
                <div className="flex flex-wrap gap-2 mb-5">
                    {getCompanyRank(job.company) !== Infinity && (
                        <div className="bg-[#eaffea] text-[#1E1E1E] px-3 py-1 rounded-full text-[11px] font-bold border border-[#29FE29]/30 flex items-center gap-1.5 shadow-sm">
                            <TrendingUp size={12} className="stroke-[3] text-[#29FE29]" /> Top Tier
                        </div>
                    )}
                    <div className="bg-[#f8fafc] text-[#64748b] px-3 py-1 rounded-full text-[11px] font-bold border border-[#f1f5f9]">
                        ✨ Early Applicant
                    </div>
                </div>

                {/* Title & Company Section */}
                <div className="flex items-start gap-4 mb-6">
                    <div className="shrink-0 bg-white border border-[#f1f5f9] rounded-2xl p-2 shadow-sm group-hover:border-[#2C76FF]/20 transition-colors">
                        <LogoBox name={job.company} officialUrl={job.url} size={52} fontSize={18} />
                    </div>
                    <div className="min-w-0 pt-1">
                        <h3 className="text-[20px] font-black text-[#1E1E1E] leading-[1.3] mb-1.5 h-[52px] line-clamp-2">
                            {job.isTeaser ? (
                                <Link to="/pricing" className="hover:text-[#2C76FF] transition-colors">{job.title}</Link>
                            ) : (
                                <a href={job.url || job.apply_url} target="_blank" rel="noopener noreferrer" className="hover:text-[#2C76FF] transition-colors">{job.title}</a>
                            )}
                        </h3>
                        <div className="flex items-center gap-2 text-[#64748b] text-[14px] font-semibold">
                            <span className="text-[#1E1E1E] font-bold">{job.company}</span>
                            <span className="opacity-30">/</span>
                            <span className="truncate">{job.role || 'Software Engineering'}</span>
                        </div>
                    </div>
                </div>

                {/* Metadata Grid */}
                <div className="flex flex-wrap items-center gap-x-8 gap-y-3 mb-8">
                    {(() => {
                        // Helper: reject garbage values like "None state=None, None"
                        const isValidLoc = (s) => {
                            if (!s || typeof s !== 'string') return false;
                            const lower = s.toLowerCase().trim();
                            if (!lower || lower === 'none' || lower === 'null' || lower === 'remote') return false;
                            // Reject strings that are mostly "none" values
                            if (lower.includes('none') && lower.includes('state') && lower.includes('none')) return false;
                            return true;
                        };

                        // Parse structured location strings
                        const p1 = parseLoc(job.location);
                        const p2 = parseLoc(job.country);
                        const p3 = parseLoc(job.indeed_search_country);

                        const finalL = p1.l || p2.l || p3.l;
                        const finalC = p1.c || p2.c || p3.c;

                        // Only show location if valid — never fall back to garbage
                        const rawLoc = finalL || (job.location && !job.location.includes('=') ? job.location : null);
                        const displayLoc = isValidLoc(rawLoc) ? rawLoc : null;

                        const displayCountry = finalC || job.indeed_search_country ||
                            (job.country && !job.country.includes('=') ? job.country : null);
                        const countryLabel = displayCountry
                            ? (COUNTRY_MAP[displayCountry.toUpperCase()]?.label || COUNTRY_MAP[displayCountry]?.label || displayCountry)
                            : null;

                        return (
                            <>
                                {/* Only render location row if it's meaningful */}
                                {displayLoc && (
                                    <div className="flex items-center gap-2.5 text-[#334155] font-semibold">
                                        <MapPin size={18} className="text-[#94a3b8]" />
                                        <span className="text-[14px] truncate max-w-[200px]">{displayLoc}</span>
                                    </div>
                                )}
                                {countryLabel && (
                                    <div className="flex items-center gap-2.5 text-[#334155] font-semibold">
                                        <Globe size={18} className="text-[#94a3b8]" />
                                        <span className="text-[14px]">{countryLabel}</span>
                                    </div>
                                )}
                            </>
                        );
                    })()}
                    <div className="flex items-center gap-2.5 text-[#334155] font-semibold">
                        <Clock size={18} className="text-[#94a3b8]" />
                        <span className="text-[14px]">{job.employment_type || job.type || 'Full-time'}</span>
                    </div>

                    {job.isVerified && (
                        <div className="flex items-center bg-[#eaffea] border border-[#29FE29]/30 px-3 py-1 rounded-lg">
                            <span className="text-[10px] font-black text-[#1E1E1E] uppercase tracking-wider mr-2">HUMAN VERIFIED</span>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="#29FE29" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 2L14.43 3.63L17.29 2.89L18.47 5.56L21.31 6.36L21.14 9.3L23 11.5L21.14 13.7L21.31 16.64L18.47 17.44L17.29 20.11L14.43 19.37L12 21L9.57 19.37L6.71 20.11L5.53 17.44L2.69 16.64L2.86 13.7L1 11.5L2.86 9.3L2.69 6.36L5.53 5.56L6.71 2.89L9.57 3.63L12 2Z" />
                                <path d="M10 14.5L7.5 12L6.5 13L10 16.5L17.5 9L16.5 8L10 14.5Z" fill="#1E1E1E" />
                            </svg>
                        </div>
                    )}
                </div>

                {/* Bottom Actions Bar */}
                <div className="flex flex-wrap items-center justify-between gap-6 mt-auto pt-5 border-t border-[#f1f5f9] shrink-0">
                    <div className="flex items-center gap-4 text-[#94a3b8] text-[13px] font-semibold">
                        {job.salary && (
                            <span className="text-[#1e293b] font-bold">{job.salary}</span>
                        )}
                    </div>

                    <div className="flex items-center gap-3 ml-auto">
                        {job.isTeaser ? (
                            <Link
                                to="/pricing"
                                className="h-12 px-8 rounded-full flex items-center justify-center gap-2.5 font-extrabold text-[15px] transition-all active:scale-95"
                                style={{ backgroundColor: '#29FE29', color: '#FFFFFF' }}
                            >
                                Apply Now <ExternalLink size={20} className="stroke-[2.5]" />
                            </Link>
                        ) : (
                            <a
                                href={job.url || job.apply_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="h-12 px-8 rounded-full flex items-center justify-center gap-2.5 font-extrabold text-[15px] transition-all active:scale-95"
                                style={{ backgroundColor: '#29FE29', color: '#FFFFFF' }}
                                onClick={onApplyClick ? (e) => { e.preventDefault(); onApplyClick(job.url || job.apply_url); } : undefined}
                            >
                                Apply Now <ExternalLink size={20} className="stroke-[2.5]" />
                            </a>
                        )}
                    </div>
                </div>
            </div>

            {/* Optional scoring right panel — only rendered for the first 2 cards */}
            {scoringPanel && (
                <div
                    className="flex shrink-0 flex-col lg:w-[200px]"
                    style={{
                        borderTop: isMobile ? '1px solid #f1f5f9' : 'none',
                        borderLeft: isMobile ? 'none' : '1px solid #f1f5f9'
                    }}
                >
                    {scoringPanel}
                </div>
            )}
        </div>
    );
};

const JobRowList = ({ job, isSaved, onSave, onApplyClick, scoringPanel }) => {
    return (
        <div className="bg-white rounded-[16px] border border-[#f0f0f0] mb-3 p-4 flex items-center gap-4 hover:shadow-md hover:border-[#2C76FF]/20 transition-all group">
            <div className="shrink-0 bg-white border border-[#f1f5f9] rounded-xl p-1.5 shadow-sm">
                <LogoBox name={job.company} officialUrl={job.url} size={40} fontSize={14} />
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="text-[15px] font-black text-[#1E1E1E] truncate">
                        {job.isTeaser ? (
                            <Link to="/pricing" className="hover:text-[#2C76FF] transition-colors">{job.title}</Link>
                        ) : (
                            <a href={job.url || job.apply_url} target="_blank" rel="noopener noreferrer" className="hover:text-[#2C76FF] transition-colors">{job.title}</a>
                        )}
                    </h3>
                    {job.isVerified && (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="#29FE29" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
                            <path d="M12 2L14.43 3.63L17.29 2.89L18.47 5.56L21.31 6.36L21.14 9.3L23 11.5L21.14 13.7L21.31 16.64L18.47 17.44L17.29 20.11L14.43 19.37L12 21L9.57 19.37L6.71 20.11L5.53 17.44L2.69 16.64L2.86 13.7L1 11.5L2.86 9.3L2.69 6.36L5.53 5.56L6.71 2.89L9.57 3.63L12 2Z" />
                            <path d="M10 14.5L7.5 12L6.5 13L10 16.5L17.5 9L16.5 8L10 14.5Z" fill="#1E1E1E" />
                        </svg>
                    )}
                </div>
                <div className="flex items-center gap-3 text-[12px] font-bold text-gray-400">
                    <span className="text-[#1E1E1E]">{job.company}</span>
                    <span className="w-1 h-1 rounded-full bg-gray-200" />
                    <span>{job.location || 'United States'}</span>
                    {job.salary && (
                        <>
                            <span className="w-1 h-1 rounded-full bg-gray-200" />
                            <span className="text-gray-600">{job.salary}</span>
                        </>
                    )}
                </div>
            </div>

            <div className="shrink-0">
                {job.isTeaser ? (
                    <Link
                        to="/pricing"
                        className="h-9 px-5 rounded-full flex items-center justify-center gap-2 font-black text-[13px] transition-all text-white hover:scale-105"
                        style={{ backgroundColor: '#29FE29' }}
                    >
                        Apply <ExternalLink size={14} />
                    </Link>
                ) : (
                    <a
                        href={job.url || job.apply_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="h-9 px-5 rounded-full flex items-center justify-center gap-2 font-black text-[13px] transition-all text-white hover:scale-105"
                        style={{ backgroundColor: '#29FE29' }}
                        onClick={onApplyClick ? (e) => { e.preventDefault(); onApplyClick(job.url || job.apply_url); } : undefined}
                    >
                        Apply <ExternalLink size={14} />
                    </a>
                )}
            </div>

            {/* Optional scoring right panel — only rendered for the first 2 list items */}
            {scoringPanel && (
                <div className="hidden lg:flex w-[180px] shrink-0 flex-col" style={{ borderLeft: '1px solid #f1f5f9', marginLeft: '12px' }}>
                    {scoringPanel}
                </div>
            )}
        </div>
    );
};

// SUGGESTED_ROLES is now fetched dynamically from Supabase via rolesSuggestions utility

// ── Main Component ─────────────────────────────────────────────────────────
const AllJobsTab = ({
    searchTerm: propSearchTerm = '',
    activeFilter: propActiveFilter = 'all',
    countryFilter = [],
    dateFilter = null,
    fixedCompany = null,
    fixedDomain = null,
    isCompact = false,
    viewMode = 'grid'
}) => {
    const { user, paymentStatus } = useAuth();
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalJobs, setTotalJobs] = useState(0);
    const [searchTerm, setSearchTerm] = useState(propSearchTerm);
    const [activeFilter, setActiveFilter] = useState(propActiveFilter);
    const [levelFilter, setLevelFilter] = useState([]); // Array like ['Lv 1', 'Lv 2']
    const [showFilters, setShowFilters] = useState(false);
    const [savedJobIds, setSavedJobIds] = useState(new Set());
    const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
    const [filteredSuggestions, setFilteredSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [allRoles, setAllRoles] = useState([]);
    const [isInitialLoadDone, setIsInitialLoadDone] = useState(false);

    // ── Apply-click interception: show upgrade modal at thresholds ──────────
    const POPUP_THRESHOLDS = new Set([3, 8, 14, 21, 30]);
    const [upgradeModal, setUpgradeModal] = useState({ open: false, pendingUrl: null });
    const applyCountRef = React.useRef(0);

    const handleApplyClick = (url) => {
        const newCount = applyCountRef.current + 1;
        applyCountRef.current = newCount;
        if (POPUP_THRESHOLDS.has(newCount)) {
            setUpgradeModal({ open: true, pendingUrl: url });
        } else {
            window.open(url, '_blank', 'noopener,noreferrer');
        }
    };

    const closeModalAndApply = () => {
        const url = upgradeModal.pendingUrl;
        setUpgradeModal({ open: false, pendingUrl: null });
        if (url) window.open(url, '_blank', 'noopener,noreferrer');
    };

    const closeModalOnly = () => {
        setUpgradeModal({ open: false, pendingUrl: null });
    };

    const closeModalUpgrade = () => {
        setUpgradeModal({ open: false, pendingUrl: null });
        window.open('https://www.applywizz.ai/job-board#pricing', '_blank', 'noopener,noreferrer');
    };

    useEffect(() => {
        setSearchTerm(propSearchTerm);
        setActiveFilter(propActiveFilter);
        setCurrentPage(1);
    }, [propSearchTerm, propActiveFilter]);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 1024);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Load job roles from Supabase on mount (cached globally)
    useEffect(() => {
        fetchJobRoles().then(setAllRoles);
    }, []);

    const [verifiedSet, setVerifiedSet] = useState(null); // cache Set of confirmed company names
    const searchTimer = useRef(null);
    const [debouncedSearch, setDebouncedSearch] = useState('');
    // ── Multi-slot in-memory cache: Map<listCacheKey, {list, total}>
    // Each unique (filter+search+levels) combo gets its own slot.
    // 'all' tab and 'verified' tab are stored independently — switching tabs is instant.
    const processedListCache = useRef(new Map());

    // ── Realtime: refresh verified set whenever a new row is inserted in audit_reviews_backup
    useEffect(() => {
        const channel = supabase
            .channel('audit_reviews_backup_changes')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'audit_reviews_backup' },
                (payload) => {
                    // Only refresh if the new row has tl_confirmation = 'yes'
                    if (payload?.new?.tl_confirmation === 'yes') {
                        // Clear caches so next fetch gets fresh data
                        window._confirmedCompaniesCache = null;
                        cacheInvalidatePrefix('verifiedSet'); // bust TTL-keyed cache too
                        processedListCache.current.clear();  // bust both tab caches
                        setVerifiedSet(null); // triggers re-fetch via getVerifiedSet
                    }
                }
            )
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, []);

    const totalPages = Math.ceil(totalJobs / JOBS_PER_PAGE);

    // Debounce search (only for Supabase querying)
    useEffect(() => {
        clearTimeout(searchTimer.current);
        searchTimer.current = setTimeout(() => {
            setDebouncedSearch(searchTerm);
        }, 400);
        return () => clearTimeout(searchTimer.current);
    }, [searchTerm]);

    // Load saved job IDs and pre-load verified set
    useEffect(() => {
        const init = async () => {
            if (user) {
                await new Promise(r => setTimeout(r, 150));
                const { data } = await supabase.from('saved_jobs').select('job_id').eq('user_id', user.id);
                if (data) setSavedJobIds(new Set(data.map(r => String(r.job_id))));
            }
            await getVerifiedSet(); // Pre-load confirmed companies for "isVerified" badges
            setIsInitialLoadDone(true);
        };
        init();
    }, [user]);

    // Load confirmed companies (runs once per session, cached with TTL)
    const getVerifiedSet = async () => {
        if (verifiedSet) return verifiedSet;

        // ── Check TTL-keyed cache first (replaces window._confirmedCompaniesCache) ──
        const CACHE_KEY = 'verifiedSet:global';
        const cached = cacheGet(CACHE_KEY);
        if (cached) {
            setVerifiedSet(cached);
            return cached;
        }

        const fetchNames = async (tableName) => {
            const names = [];
            let pg = 0;
            while (true) {
                const { data, error } = await supabase
                    .from(tableName)
                    .select('company')
                    .eq('tl_confirmation', 'yes')
                    .range(pg * 1000, (pg + 1) * 1000 - 1);
                if (error || !data || data.length === 0) break;
                data.forEach(r => r.company && names.push(r.company));
                if (data.length < 1000) break;
                pg++;
            }
            return names;
        };

        // Fetch from backup table only
        const backupNames = await fetchNames('audit_reviews_backup');

        // Deduplicate — no duplicate company names
        const unique = Array.from(new Set(backupNames)).filter(Boolean);
        const s = new Set(unique);

        // Store in TTL-keyed cache (10 min) — expires automatically, no stale data
        cacheSet(CACHE_KEY, s, TTL.VERIFIED_SET);
        // Keep window fallback in sync for any legacy references
        window._confirmedCompaniesCache = unique;
        setVerifiedSet(s);
        return s;
    };

    // ── Verified seal SVG ──────────────────────────────────────────────────────
    const VerifiedSeal = ({ size = 16 }) => (
        <svg width={size} height={size} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
            <path d="M50 4 L57 16 L70 10 L70 24 L84 24 L78 37 L91 44 L81 55 L88 68 L74 69 L70 83 L57 78 L50 90 L43 78 L30 83 L26 69 L12 68 L19 55 L9 44 L22 37 L16 24 L30 24 L30 10 L43 16 Z" fill="#22c55e" />
            <polyline points="33,52 44,63 68,38" fill="none" stroke="white" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );

    const interleaveJobs = (list) => {
        if (!list || list.length === 0) return [];

        // 1. De-duplicate by URL
        const seenUrls = new Set();
        const uniqueList = [];
        list.forEach(j => {
            const uk = _urlKey(j.url);
            if (!uk || seenUrls.has(uk)) return;
            seenUrls.add(uk);
            uniqueList.push(j);
        });

        // 2. Enrich each job
        const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;
        const now = Date.now();
        const enriched = uniqueList.map(j => {
            const hasSal = j.salary && String(j.salary).includes('$');
            const hasLvl = parseWageLevel(j.wage_level) || parseWageLevel(j.wage_num) || parseWageLevel(j.salary);
            const isEligible = !!(hasSal || hasLvl);
            const dateStr = j.date_posted || j.created_at || j.upload_date || j.ingestedAt || '1970-01-01';
            const timestamp = new Date(dateStr).getTime() || 0;
            const wageLvl = parseWageLevel(j.wage_level) || parseWageLevel(j.wage_num) || parseWageLevel(j.salary) || 0;
            const filings = parseInt(j.lca_filings) || 0;
            const isFresh = (now - timestamp) <= THREE_DAYS_MS;
            return { ...j, _isEligible: isEligible, _timestamp: timestamp, _wageLvl: wageLvl, _filings: filings, _isFresh: isFresh, _uk: _urlKey(j.url) };
        });

        // 3. Sorting helpers for within each company and unranked jobs
        const jobSorter = (a, b) => {
            // Priority 1: IT / Tech related jobs first
            const aIT = isITJob(a);
            const bIT = isITJob(b);
            if (bIT !== aIT) return bIT ? 1 : -1;

            if (b._isEligible !== a._isEligible) return b._isEligible ? 1 : -1;
            if (b._timestamp !== a._timestamp) return b._timestamp - a._timestamp;
            if (b._wageLvl !== a._wageLvl) return b._wageLvl - a._wageLvl;
            return b._filings - a._filings;
        };

        // 4. Group by company rank index (ONLY if posted within 30 days)
        const rankedGroupMap = new Map(); // rankIndex -> job[]
        const unrankedJobs = [];
        const thirtyDaysAgoMs = Date.now() - (30 * 24 * 60 * 60 * 1000);

        enriched.forEach(j => {
            const rank = getCompanyRank(j.company);
            const isWithin30Days = j._timestamp >= thirtyDaysAgoMs;

            if (rank !== Infinity && isWithin30Days) {
                if (!rankedGroupMap.has(rank)) rankedGroupMap.set(rank, []);
                rankedGroupMap.get(rank).push(j);
            } else {
                unrankedJobs.push(j);
            }
        });

        console.log("ALL_JOBS_TAB total jobs processed:", enriched.length);
        console.log("ALL_JOBS_TAB rankedGroupMap keys:", Array.from(rankedGroupMap.keys()).map(r => `${RANKED_COMPANIES[r]} (rank ${r})`));

        // 5. Sort each company group internally
        rankedGroupMap.forEach((jobs) => {
            jobs.sort(jobSorter);
        });

        // 6. Select up to 2 jobs from each famous company in order, and put the rest in a pool
        const famousInterleavedList = [];
        const remainingFamousJobs = [];
        const finalSeen = new Set();

        // Loop strictly through the entire FAMOUS_COMPANIES rank indices (0 to RANKED_COMPANIES.length - 1)
        for (let rank = 0; rank < RANKED_COMPANIES.length; rank++) {
            const group = rankedGroupMap.get(rank);
            if (group && group.length > 0) {
                const limit = Math.min(2, group.length);
                for (let i = 0; i < limit; i++) {
                    const job = group[i];
                    if (!finalSeen.has(job._uk)) {
                        famousInterleavedList.push(job);
                        finalSeen.add(job._uk);
                    }
                }
                for (let i = limit; i < group.length; i++) {
                    const job = group[i];
                    remainingFamousJobs.push(job);
                }
            }
        }

        // 7. Combine all unranked jobs and the remaining famous jobs
        const otherJobs = [...unrankedJobs, ...remainingFamousJobs];

        // 8. Sort other (non-famous/unranked/remaining) companies' jobs using standard criteria
        otherJobs.sort(jobSorter);

        // 9. Combine and filter: Ensure absolutely no company has more than 2 jobs in the entire results
        const combined = [...famousInterleavedList, ...otherJobs];
        const result = [];
        const companyCounts = new Map();

        combined.forEach(job => {
            const canonicalCompany = getCanonicalCompany(job.company).toLowerCase();
            const count = companyCounts.get(canonicalCompany) || 0;
            if (count < 2) {
                result.push(job);
                companyCounts.set(canonicalCompany, count + 1);
            }
        });

        return result;
    };

    const expandCountries = (countriesList) => {
        if (!countriesList || countriesList.length === 0) return [];
        const expanded = new Set();
        countriesList.forEach(c => {
            const upper = String(c).toUpperCase().trim();
            if (upper === 'USA' || upper === 'US' || upper === 'UNITED STATES') {
                expanded.add('USA');
                expanded.add('US');
                expanded.add('us');
                expanded.add('usa');
                expanded.add('United States');
                expanded.add('united states');
                expanded.add('United States of America');
                expanded.add('united states of america');
                expanded.add('U.S.A.');
                expanded.add('U.S.');
                expanded.add('u.s.a.');
                expanded.add('u.s.');
            } else {
                expanded.add(c);
                expanded.add(String(c).toLowerCase());
                expanded.add(String(c).toUpperCase());
            }
        });
        return Array.from(expanded);
    };

    // Main fetch function
    const fetchJobs = async (page, filter, search, level = 'all', countries = []) => {
        // Use fixed props if available to bypass fuzzy search
        const activeSearch = (fixedCompany || fixedDomain) ? '' : search;
        const rawCountries = Array.isArray(countries) ? countries : (countries ? [countries] : []);
        const activeCountries = expandCountries(rawCountries);

        setLoading(true);
        setError(null);
        try {
            const from = (page - 1) * JOBS_PER_PAGE;

            // ── FAST PATH: serve from localStorage (survives page refresh) ───
            // localStorage reads are synchronous and take <5ms for 500 records.
            // This makes the FIRST load after a refresh instant — no Supabase call.
            const levelStr = Array.isArray(level) && level.length > 0
                ? level.slice().sort().join(',') : 'all';
            const dateStr = dateFilter?.quickDate === 'all' || !dateFilter
                ? 'all'
                : `${dateFilter.from || ''}_${dateFilter.to || ''}`;

            const rawCountriesStr = rawCountries.length > 0 ? rawCountries.slice().sort().join(',') : 'all';
            const fixedStr = (fixedCompany || 'none') + '_' + (fixedDomain || 'none');
            const listCacheKey = `${filter}|${(activeSearch || '').trim().toLowerCase() || 'none'}|${levelStr}|${rawCountriesStr}|${dateStr}|${fixedStr}`;

            const pageOffset = (page - 1) * JOBS_PER_PAGE;
            // Use range offset pagination in DB if the offset is beyond 1000
            const useRangeOffset = pageOffset >= 1000;
            const pageCacheKey = useRangeOffset ? `${listCacheKey}|page_${page}` : listCacheKey;

            const LS_KEY = `ajt_v36_${listCacheKey}`; // bumped: round-robin country mixing
            const LS_TTL_MS = 10 * 60 * 1000; // 10 minutes
            
            if (!useRangeOffset) {
                try {
                    const raw = localStorage.getItem(LS_KEY);
                    if (raw) {
                        const parsed = JSON.parse(raw);
                        if (parsed && parsed.ts && (Date.now() - parsed.ts) < LS_TTL_MS && parsed.list?.length > 0) {
                            // Warm the in-memory Map too so page changes are instant
                            if (!processedListCache.current.has(listCacheKey)) {
                                processedListCache.current.set(listCacheKey, { list: parsed.list, total: parsed.total });
                            }
                            const pagedResults = parsed.list.slice(from, from + JOBS_PER_PAGE);
                            // If the page is beyond what's cached, fall through to DB fetch
                            if (pagedResults.length > 0) {
                                setJobs(pagedResults);
                                setTotalJobs(parsed.total);
                                setCurrentPage(page);
                                setLoading(false);
                                return; // ⚡ Done — served from localStorage in <50ms
                            }
                        }
                    }
                } catch (_) { /* localStorage unavailable or corrupt — fall through to DB */ }
            }

            // ── FAST PATH: serve from in-memory Map cache (tab switches) ─────────
            if (processedListCache.current.has(pageCacheKey)) {
                const cached = processedListCache.current.get(pageCacheKey);
                const sliceFrom = useRangeOffset ? 0 : from;
                const pagedResults = cached.list.slice(sliceFrom, sliceFrom + JOBS_PER_PAGE);
                // If the page is beyond what's cached, fall through to DB fetch
                if (pagedResults.length > 0) {
                    setJobs(pagedResults);
                    setTotalJobs(cached.total);
                    setCurrentPage(page);
                    setLoading(false);
                    return; // Done — no DB hit
                }
            }

            // ══════════════════════════════════════════════════════════════════════
            // UNIFIED DATABASE FETCH  —  STABLE & ULTRA-FAST
            // ══════════════════════════════════════════════════════════════════════
            const LIMIT = 3000;
            const dbStart = useRangeOffset ? pageOffset : 0;
            const dbEnd = useRangeOffset ? (pageOffset + 500) : LIMIT;
            let finalJobs = [];
            let totalCount = 0;

            // 1. Try high-performance search_jobs RPC first if we are doing a general search
            // BYPASSED: RPC call bypassed to prevent 500 errors and ensure our optimized parallel merged query is always active under all conditions (with or without filters).
            const rpcSuccess = false;

            // 2. Fall back to standard query if RPC failed or was bypassed
            if (!rpcSuccess) {
                let query = supabase.from('jobs_all_roles')
                    .select(LIGHTWEIGHT_COLUMNS, { count: 'estimated' })
                    .order('date_posted', { ascending: false, nullsFirst: false });

                if (useRangeOffset) {
                    query = query.range(dbStart, dbEnd);
                } else {
                    query = query.limit(LIMIT);
                }

                if (fixedCompany) {
                    if (Array.isArray(fixedCompany)) query = query.in('company_name', fixedCompany);
                    else query = query.eq('company_name', fixedCompany);
                } else if (fixedDomain) {
                    if (fixedDomain === 'Java Developer') {
                        query = query.in('role_name', ['Java Full Stack', 'Java Developer', 'Java Full Stack Developer']);
                    } else {
                        query = query.eq('role_name', fixedDomain);
                    }
                } else if (activeSearch && activeSearch.trim()) {
                    const words = activeSearch.trim().toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, ' ').split(/\s+/).filter(x => x.length >= 1);
                    const tC = `and(${words.map(x => `title.ilike.%${x}%`).join(',')})`;
                    const cC = `and(${words.map(x => `company_name.ilike.%${x}%`).join(',')})`;
                    const rC = `and(${words.map(x => `role_name.ilike.%${x}%`).join(',')})`;
                    const coC = `and(${words.map(x => `indeed_search_country.ilike.%${x}%`).join(',')})`;
                    const lC = `and(${words.map(x => `location.ilike.%${x}%`).join(',')})`;
                    query = query.or(`${tC},${cC},${rC},${coC},${lC}`);
                }

                if (activeCountries.length > 0) {
                    query = query.in('indeed_search_country', activeCountries);
                }
                query = applyDateFilter(query, dateFilter);

                let data = [];
                let count = 0;
                let error = null;

                if (!fixedCompany && !fixedDomain && (!activeSearch || !activeSearch.trim())) {
                    let famousQuery = supabase.from('jobs_all_roles')
                        .select(LIGHTWEIGHT_COLUMNS)
                        .in('company_name', RANKED_COMPANIES)
                        .order('date_posted', { ascending: false });

                    if (useRangeOffset) {
                        famousQuery = famousQuery.range(dbStart, dbStart + 500);
                    } else {
                        famousQuery = famousQuery.limit(1500);
                    }

                    if (activeCountries.length > 0) {
                        famousQuery = famousQuery.in('indeed_search_country', activeCountries);
                    }
                    famousQuery = applyDateFilter(famousQuery, dateFilter);

                    const [res, famRes] = await Promise.all([query, famousQuery]);
                    error = res.error || famRes.error;

                    // Merge results, putting famous jobs first to make sure they are parsed and de-duplicated
                    const merged = [...(famRes.data || []), ...(res.data || [])];
                    data = merged;
                    count = res.count || data.length;
                } else {
                    const res = await query;
                    data = res.data;
                    count = res.count;
                    error = res.error;
                }

                if (error) throw error;

                finalJobs = (data || []).map(j => ({
                    ...j,
                    company: j.company_name || 'Unknown',
                    role: mapJavaRole(j.role_name || j.title || ''),
                    job_role_name: mapJavaRole(j.role_name || j.title || ''),
                    url: j.job_url_direct || j.job_url || '',
                    apply_url: j.job_url || j.job_url_direct || '',
                    job_id: j.id,
                    isVerified: false,
                    isTeaser: paymentStatus === 'pending'
                }));
                totalCount = count || finalJobs.length;
            }

            // 3. Post-processing: Filter, Interleave & Save to Cache
            if (activeSearch && activeSearch.trim() && !rpcSuccess) {
                const sWords = activeSearch.trim().toLowerCase().split(/\s+/).filter(w => w.length >= 1);
                finalJobs = finalJobs.filter(j => {
                    const target = `${j.title || ''} ${j.company_name || ''} ${j.role_name || ''} ${j.indeed_search_country || ''} ${j.location || ''}`.toLowerCase();
                    return sWords.every(w => target.includes(w));
                });
            }

            // Skip interleaving for company/domain detail views
            const interleaved = (fixedCompany || fixedDomain)
                ? finalJobs.sort((a, b) => new Date(b.date_posted || 0) - new Date(a.date_posted || 0))
                : interleaveJobs(finalJobs);

            // ── Round-robin mix by country when multiple countries are selected ──
            // e.g. US selected + UK selected → US job, UK job, US job, UK job...
            let finalInterleaved = interleaved;
            if (!fixedCompany && !fixedDomain && rawCountries.length > 1) {
                // Build one bucket per selected country
                const buckets = new Map();
                rawCountries.forEach(rc => buckets.set(rc, []));
                const unassigned = [];

                // Pre-expand each country's variants once
                const expandedMap = new Map();
                rawCountries.forEach(rc => {
                    expandedMap.set(rc, new Set(expandCountries([rc]).map(s => s.toLowerCase())));
                });

                // Assign each job to the matching country bucket
                interleaved.forEach(job => {
                    const jc = String(job.indeed_search_country || '').trim().toLowerCase();
                    let matched = false;
                    for (const rc of rawCountries) {
                        if (expandedMap.get(rc).has(jc)) {
                            buckets.get(rc).push(job);
                            matched = true;
                            break;
                        }
                    }
                    if (!matched) unassigned.push(job);
                });

                // Pull one job from each country in rotation until all buckets are empty
                const roundRobin = [];
                let hasMore = true;
                while (hasMore) {
                    hasMore = false;
                    for (const [, bucket] of buckets) {
                        if (bucket.length > 0) {
                            roundRobin.push(bucket.shift());
                            hasMore = true;
                        }
                    }
                }
                finalInterleaved = [...roundRobin, ...unassigned];
            }

            const finalTotal = (activeSearch && activeSearch.trim()) ? finalInterleaved.length : totalCount;

            // Save to caches
            processedListCache.current.set(pageCacheKey, { list: finalInterleaved, total: finalTotal });
            if (!useRangeOffset) {
                try {
                    localStorage.setItem(LS_KEY, JSON.stringify({ ts: Date.now(), total: finalTotal, list: finalInterleaved.slice(0, 500) }));
                } catch (_) { }
            }

            // Set state
            const sliceFrom = useRangeOffset ? 0 : from;
            const pagedResults = finalInterleaved.slice(sliceFrom, sliceFrom + JOBS_PER_PAGE);
            setJobs(pagedResults);
            setTotalJobs(finalTotal);
            setCurrentPage(page);
        } catch (err) {
            console.warn('AllJobsTab fetchJobs error gracefully handled:', err);
        } finally {
            setLoading(false);
        }
    };


    // Trigger fetch when search, filter, country, date, or fixed props change
    useEffect(() => {
        if (isInitialLoadDone) {
            processedListCache.current.clear();
            fetchJobs(1, activeFilter, debouncedSearch, levelFilter, countryFilter);
        }
    }, [activeFilter, debouncedSearch, levelFilter, countryFilter, isInitialLoadDone,
        dateFilter?.quickDate, dateFilter?.from, dateFilter?.to,
        fixedCompany, fixedDomain]);

    // ── Silent background preloader ──────────────────────────────────────────
    useEffect(() => {
        if (!isInitialLoadDone || loading || debouncedSearch || levelFilter.length > 0) return;

        const otherFilter = activeFilter === 'all' ? 'verified' : 'all';
        const rawCountries = Array.isArray(countryFilter) ? countryFilter : (countryFilter ? [countryFilter] : []);
        const activeCountries = expandCountries(rawCountries);
        const countriesStr = rawCountries.length > 0 ? rawCountries.slice().sort().join(',') : 'all';
        const otherKey = `${otherFilter}|none|all|${countriesStr}`;

        if (processedListCache.current.has(otherKey)) return;

        const timer = setTimeout(() => {
            const silentFetch = async () => {
                try {
                    const levelStr = 'all';
                    const silentKey = `${otherFilter}|none|${levelStr}|${countriesStr}`;
                    if (processedListCache.current.has(silentKey)) return;

                    // Strictly jobs_all_roles only
                    let sQ = supabase.from('jobs_all_roles')
                        .select(LIGHTWEIGHT_COLUMNS, { count: 'estimated' })
                        .order('date_posted', { ascending: false, nullsFirst: false })
                        .limit(500);

                    if (activeCountries.length > 0) {
                        sQ = sQ.in('indeed_search_country', activeCountries);
                    }
                    sQ = applyDateFilter(sQ, dateFilter);

                    let famousQuery = supabase.from('jobs_all_roles')
                        .select(LIGHTWEIGHT_COLUMNS)
                        .in('company_name', RANKED_COMPANIES)
                        .order('date_posted', { ascending: false })
                        .limit(1500);

                    if (activeCountries.length > 0) {
                        famousQuery = famousQuery.in('indeed_search_country', activeCountries);
                    }
                    famousQuery = applyDateFilter(famousQuery, dateFilter);

                    const [sRes, famRes] = await Promise.all([sQ, famousQuery]);
                    if (sRes?.error || famRes?.error) return;

                    const merged = [...(famRes.data || []), ...(sRes.data || [])];
                    const silentJobs = merged.map(j => ({
                        ...j,
                        company: j.company_name || 'Unknown',
                        role: mapJavaRole(j.role_name || j.title || ''),
                        job_role_name: mapJavaRole(j.role_name || j.title || ''),
                        url: j.job_url_direct || j.job_url || '',
                        apply_url: j.job_url || j.job_url_direct || '',
                        job_id: j.id,
                        isVerified: false,
                        isTeaser: paymentStatus === 'pending'
                    }));

                    const interleaved = interleaveJobs(silentJobs);
                    const actualTotal = interleaved.length;
                    processedListCache.current.set(silentKey, { list: interleaved, total: actualTotal });
                } catch (_) { /* silent fail */ }
            };

            silentFetch();
        }, 3000); // 3-second delay: let current tab enrichment settle first

        return () => clearTimeout(timer);
    }, [isInitialLoadDone, activeFilter, loading]);

    const handlePageChange = (newPage) => {
        fetchJobs(newPage, activeFilter, debouncedSearch, levelFilter, countryFilter);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleSearchChange = (e) => {
        const val = e.target.value;
        setSearchTerm(val);
        setCurrentPage(1);

        if (val.trim().length > 0) {
            const filtered = filterRoles(allRoles, val, 8);
            setFilteredSuggestions(filtered);
            setShowSuggestions(filtered.length > 0);
        } else {
            setFilteredSuggestions([]);
            setShowSuggestions(false);
        }
    };

    const handleSave = async (job) => {
        if (!user) return;
        const jobId = String(job.id || job.job_id || '');
        const isSaved = savedJobIds.has(jobId);
        setSavedJobIds(prev => {
            const s = new Set(prev);
            if (isSaved) s.delete(jobId); else s.add(jobId);
            return s;
        });
        try {
            if (isSaved) {
                await supabase.from('saved_jobs').delete().eq('user_id', user.id).eq('job_id', jobId);
            } else {
                await supabase.from('saved_jobs').insert([{ user_id: user.id, job_id: jobId, job_data: job }]);
            }
        } catch (err) { console.error('Save error:', err); }
    };

    const getPageNumbers = () => {
        const pages = [];
        
        // Always include pages 1, 2, 3, 4 if they exist
        for (let i = 1; i <= Math.min(4, totalPages); i++) {
            pages.push(i);
        }
        
        // Include currentPage and its neighbors (currentPage-1, currentPage+1) if they are valid (> 4 and < totalPages)
        const neighbors = [currentPage - 1, currentPage, currentPage + 1];
        neighbors.forEach(p => {
            if (p > 4 && p < totalPages) {
                pages.push(p);
            }
        });
        
        // Include requested jumps (25, 50, 100, 200, 500) if they are valid (> 4 and < totalPages)
        const jumps = [25, 50, 100, 200, 500];
        jumps.forEach(j => {
            if (j > 4 && j < totalPages) {
                pages.push(j);
            }
        });
        
        // Always include the last page if it is greater than 4
        if (totalPages > 4) {
            pages.push(totalPages);
        }
        
        // Deduplicate and sort numerically
        const uniqueSorted = Array.from(new Set(pages)).sort((a, b) => a - b);
        
        // Add '...' between non-consecutive pages
        const result = [];
        for (let i = 0; i < uniqueSorted.length; i++) {
            if (i > 0 && uniqueSorted[i] - uniqueSorted[i - 1] > 1) {
                result.push('...');
            }
            result.push(uniqueSorted[i]);
        }
        
        return result;
    };

    return (
        <>
            <style>{`
                .scoring-card-container:hover .scoring-card-overlay {
                    opacity: 1 !important;
                    transform: translateX(-50%) translateY(0) !important;
                }
            `}</style>
            <div style={{ fontFamily: 'inherit' }}>
                {/* Internal headers/filters removed in favor of global dashboard filters */}

                {/* ── Premium Local Search Bar ── */}
                <div style={{ marginBottom: '24px', position: 'relative' }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        background: '#FFFFFF',
                        border: '1.5px solid #E2E8F0',
                        borderRadius: '16px',
                        padding: '0 18px',
                        height: '52px',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.02)',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    }}
                        className="focus-within:border-[#2C76FF] focus-within:ring-2 focus-within:ring-[#2C76FF]/10 focus-within:shadow-[0_4px_20px_rgba(44,118,255,0.08)]"
                    >
                        <Search size={18} className="text-gray-400 shrink-0" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={handleSearchChange}
                            placeholder="Search company, country, job title, domain or keywords..."
                            style={{
                                flex: 1,
                                border: 'none',
                                outline: 'none',
                                fontSize: '15px',
                                color: '#1E1E1E',
                                background: 'transparent',
                                fontWeight: 500,
                            }}
                        />
                        {searchTerm && (
                            <button
                                onClick={() => {
                                    setSearchTerm('');
                                    setFilteredSuggestions([]);
                                    setShowSuggestions(false);
                                }}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    color: '#94A3B8',
                                    padding: '4px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'color 0.2s',
                                }}
                                onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                                onMouseLeave={e => e.currentTarget.style.color = '#94A3B8'}
                            >
                                <X size={16} />
                            </button>
                        )}
                    </div>

                    {/* Auto-suggestions Dropdown */}
                    {showSuggestions && filteredSuggestions.length > 0 && (
                        <div style={{
                            position: 'absolute',
                            top: '58px',
                            left: 0,
                            right: 0,
                            background: '#FFFFFF',
                            border: '1.5px solid #E2E8F0',
                            borderRadius: '16px',
                            boxShadow: '0 12px 30px rgba(0, 0, 0, 0.08)',
                            zIndex: 9999,
                            maxHeight: '260px',
                            overflowY: 'auto',
                            padding: '8px 0',
                            animation: 'slideDown 0.2s ease forwards',
                        }}>
                            {filteredSuggestions.map((s, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => {
                                        setSearchTerm(s);
                                        setShowSuggestions(false);
                                    }}
                                    style={{
                                        width: '100%',
                                        textAlign: 'left',
                                        padding: '11px 20px',
                                        fontSize: '14.5px',
                                        color: '#334155',
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        fontWeight: 600,
                                        display: 'block',
                                        transition: 'all 0.2s ease',
                                    }}
                                    onMouseEnter={e => {
                                        e.currentTarget.style.background = '#F8FAFC';
                                        e.currentTarget.style.color = '#2C76FF';
                                        e.currentTarget.style.paddingLeft = '24px';
                                    }}
                                    onMouseLeave={e => {
                                        e.currentTarget.style.background = 'none';
                                        e.currentTarget.style.color = '#334155';
                                        e.currentTarget.style.paddingLeft = '20px';
                                    }}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* ── Verified filter banner ── */}
                {activeFilter === 'verified' && !loading && !isCompact && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', fontSize: '13px', color: '#16a34a', fontWeight: 600, marginBottom: '14px' }}>
                        <VerifiedSeal size={14} />
                        Showing Jobs From <strong style={{ marginLeft: '4px' }}>Human-Verified H-1B Sponsoring Companies</strong>
                    </div>
                )}



                {/* ── Loading ── */}
                {loading && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 0' }}>
                        <div style={{ textAlign: 'center' }}>
                            <Loader2 style={{ width: 32, height: 32, color: '#24385E', animation: 'spin 1s linear infinite', margin: '0 auto 10px', display: 'block' }} />
                            <p style={{ color: '#aaa', fontSize: '13px', margin: 0 }}>Loading jobs…</p>
                        </div>
                    </div>
                )}

                {/* ── Error ── */}
                {error && !loading && (
                    <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px', padding: '16px 20px', display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '16px' }}>
                        <AlertCircle size={18} color="#ef4444" style={{ flexShrink: 0, marginTop: '1px' }} />
                        <div>
                            <p style={{ fontSize: '14px', fontWeight: 600, color: '#991b1b', margin: '0 0 6px' }}>Error loading jobs</p>
                            <p style={{ fontSize: '12px', color: '#b91c1c', margin: '0 0 10px' }}>{error}</p>
                            <button onClick={() => fetchJobs(currentPage, activeFilter, debouncedSearch, levelFilter)} style={{ padding: '5px 12px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>Retry</button>
                        </div>
                    </div>
                )}

                {/* ── Empty ── */}
                {!loading && !error && jobs.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '80px 0' }}>
                        <Briefcase size={40} color="#e0e0e0" style={{ margin: '0 auto 12px', display: 'block' }} />
                        <p style={{ fontSize: '15px', fontWeight: 600, color: '#555', margin: '0 0 4px' }}>No jobs found</p>
                        <p style={{ fontSize: '13px', color: '#aaa', margin: 0 }}>{searchTerm ? 'Try a different search term' : 'No jobs available right now'}</p>
                    </div>
                )}

                {/* ── Job List ── */}
                {!loading && !error && jobs.length > 0 && (
                    <>
                        {jobs.map((job, i) => {
                            const showScoring = i < 2;
                            const dummyScore = i === 0 ? 92 : 80;
                            const dummyColor = i === 0 ? '#29FE29' : '#2C76FF';
                            const dummyLabel = i === 0 ? 'Strong Match' : 'Good Match';
                            const circumference = 2 * Math.PI * 34;
                            const offset = circumference * (1 - dummyScore / 100);

                            // Scoring + upgrade panel — right sidebar on desktop, bottom strip on mobile
                            const scoringPanel = showScoring ? (
                                <div
                                    style={{
                                        display: 'flex',
                                        flexDirection: isMobile ? 'row' : 'column',
                                        alignItems: 'center',
                                        justifyContent: isMobile ? 'space-between' : 'center',
                                        padding: isMobile ? '14px 16px' : '20px 16px',
                                        gap: isMobile ? '10px' : '14px',
                                        background: 'linear-gradient(135deg, #171717 0%, #353333 50%, #878787 100%)',
                                        height: '100%', width: '100%', textAlign: 'center', position: 'relative',
                                        borderRadius: isMobile ? '0 0 24px 24px' : '0 24px 24px 0'
                                    }}>

                                    {/* Ring */}
                                    <div
                                        className="scoring-card-container"
                                        style={{ position: 'relative', width: isMobile ? '54px' : '72px', height: isMobile ? '54px' : '72px', cursor: 'help', flexShrink: 0 }}
                                    >
                                        <svg width={isMobile ? '54' : '72'} height={isMobile ? '54' : '72'} viewBox="0 0 80 80" style={{ transform: 'rotate(-90deg)' }}>
                                            <circle cx="40" cy="40" r="34" stroke="rgba(255,255,255,0.1)" strokeWidth="8" fill="transparent" />
                                            <circle cx="40" cy="40" r="34" stroke={dummyColor} strokeWidth="8" fill="transparent"
                                                strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" />
                                        </svg>
                                        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                            <span style={{ fontSize: isMobile ? '13px' : '16px', fontWeight: 900, color: '#fff', lineHeight: 1 }}>{dummyScore}%</span>
                                        </div>

                                        {/* Tooltip Overlay */}
                                        <div
                                            className="scoring-card-overlay"
                                            style={{
                                                position: 'absolute', bottom: '115%', left: '50%', transform: 'translateX(-50%) translateY(8px)',
                                                width: '200px', background: 'rgba(10, 10, 20, 0.98)', borderRadius: '12px',
                                                boxShadow: '0 15px 40px rgba(0,0,0,0.7)', border: '1px solid rgba(41,254,41,0.3)',
                                                opacity: 0, transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                                pointerEvents: 'none', padding: '14px', zIndex: 100
                                            }}
                                        >
                                            <div style={{ color: '#29FE29', fontSize: '12px', fontWeight: 900, lineHeight: 1.4, textAlign: 'center' }}>
                                                Upgrade to Match Your personalized Jobs<br />
                                                <span style={{ color: '#fff', fontSize: '10px', opacity: 0.8 }}>Focus only on roles you can win</span>
                                            </div>
                                            {/* Tooltip Arrow */}
                                            <div style={{
                                                position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)',
                                                borderWidth: '7px', borderStyle: 'solid', borderColor: 'rgba(10, 10, 20, 0.98) transparent transparent transparent'
                                            }} />
                                        </div>
                                    </div>

                                    {/* Center block: label + (desktop only) divider & subtitle */}
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: isMobile ? 'flex-start' : 'center', gap: isMobile ? '3px' : '10px', flex: isMobile ? 1 : 'unset' }}>
                                        <div style={{ fontSize: isMobile ? '11px' : '13px', fontWeight: 900, color: dummyColor, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{dummyLabel}</div>
                                        {!isMobile && (
                                            <>
                                                {/* Divider */}
                                                <div style={{ width: '40px', height: '1px', background: 'rgba(255,255,255,0.15)' }} />
                                                {/* Upgrade CTA text */}
                                                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', fontWeight: 600, lineHeight: 1.4 }}>
                                                    Upgrade to get <span style={{ color: '#29FE29', fontWeight: 800 }}>perfect scoring</span> jobs
                                                </div>
                                            </>
                                        )}
                                    </div>

                                    {/* Upgrade button */}
                                    <a
                                        href="https://www.applywizz.ai/job-board#pricing"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{
                                            background: '#29FE29', color: '#1E1E1E',
                                            fontWeight: 900, fontSize: isMobile ? '10px' : '11px',
                                            padding: isMobile ? '7px 12px' : '8px 16px', borderRadius: '50px',
                                            textDecoration: 'none', display: 'inline-flex',
                                            alignItems: 'center', gap: '4px',
                                            boxShadow: '0 4px 12px rgba(41,254,41,0.3)',
                                            whiteSpace: 'nowrap', transition: 'transform 0.2s',
                                            flexShrink: 0
                                        }}
                                        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.06)'}
                                        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                                    >
                                        🚀 {isMobile ? 'Upgrade' : 'Upgrade Now'}
                                    </a>
                                </div>
                            ) : null;

                            const jobEl = viewMode === 'list' ? (
                                <JobRowList
                                    key={`${job.id || job.url || 'job'}_${i}`}
                                    job={{ ...job, isVerified: job.isVerified || verifiedSet?.has(job.company) }}
                                    isSaved={savedJobIds.has(String(job.id || job.job_id || ''))}
                                    onSave={handleSave}
                                    onApplyClick={handleApplyClick}
                                    scoringPanel={scoringPanel}
                                />
                            ) : (
                                <JobRow
                                    key={`${job.id || job.url || 'job'}_${i}`}
                                    job={{ ...job, isVerified: job.isVerified || verifiedSet?.has(job.company) }}
                                    isSaved={savedJobIds.has(String(job.id || job.job_id || ''))}
                                    onSave={handleSave}
                                    scoringPanel={scoringPanel}
                                    onApplyClick={handleApplyClick}
                                />
                            );

                            return (
                                <React.Fragment key={`frag_${job.id || job.url || 'job'}_${i}`}>
                                    {jobEl}
                                </React.Fragment>
                            );
                        })}

                        {/* ── Pagination ── */}
                        {totalPages > 1 && (
                            <div style={{
                                display: 'flex',
                                flexDirection: isMobile ? 'column' : 'row',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                marginTop: '24px',
                                paddingTop: '20px',
                                borderTop: '1px solid #f1f5f9',
                                gap: isMobile ? '16px' : '0'
                            }}>
                                <span style={{ fontSize: '13px', color: '#718096', fontWeight: 500 }}>
                                    Page {currentPage} of {totalPages.toLocaleString()}
                                </span>
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', overflowX: 'auto', maxWidth: '100%', padding: '4px' }} className="no-scrollbar">
                                    <button
                                        onClick={() => handlePageChange(currentPage - 1)}
                                        disabled={currentPage === 1}
                                        style={{ padding: '8px 12px', borderRadius: '10px', border: '1px solid #e2e8f0', background: '#fff', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', opacity: currentPage === 1 ? 0.3 : 1, display: 'flex', alignItems: 'center' }}
                                    >
                                        <ChevronLeft size={16} />
                                    </button>

                                    {getPageNumbers().map((pg, idx) =>
                                        pg === '...' ? (
                                            <span key={`e${idx}`} style={{ padding: '0 4px', color: '#cbd5e0', fontSize: '14px' }}>…</span>
                                        ) : (
                                            <button
                                                key={pg}
                                                onClick={() => handlePageChange(pg)}
                                                style={{
                                                    padding: '6px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: 700,
                                                    cursor: 'pointer', minWidth: '36px', textAlign: 'center', transition: 'all 0.2s',
                                                    border: '1.5px solid',
                                                    borderColor: currentPage === pg ? '#24385E' : '#e2e8f0',
                                                    background: currentPage === pg ? '#24385E' : '#fff',
                                                    color: currentPage === pg ? '#fff' : '#64748b'
                                                }}
                                            >
                                                {pg}
                                            </button>
                                        )
                                    )}

                                    <button
                                        onClick={() => handlePageChange(currentPage + 1)}
                                        disabled={currentPage === totalPages}
                                        style={{ padding: '8px 12px', borderRadius: '10px', border: '1px solid #e2e8f0', background: '#fff', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', opacity: currentPage === totalPages ? 0.3 : 1, display: 'flex', alignItems: 'center' }}
                                    >
                                        <ChevronRight size={16} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* ── Upgrade Modal: shown at apply-click thresholds 3, 5, 10, 18, 27 ── */}
            {upgradeModal.open && (
                <div
                    style={{
                        position: 'fixed', inset: 0, zIndex: 9999,
                        background: 'rgba(10,10,20,0.78)', backdropFilter: 'blur(6px)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        padding: '20px'
                    }}
                    onClick={closeModalOnly}
                >
                    <div
                        style={{
                            background: 'linear-gradient(135deg, #171717 0%, #353333 50%, #878787 100%)',
                            borderRadius: '28px', padding: '40px 36px',
                            maxWidth: '480px', width: '100%',
                            boxShadow: '0 32px 80px rgba(0,0,0,0.8)',
                            position: 'relative', overflow: 'hidden', textAlign: 'center'
                        }}
                        onClick={e => e.stopPropagation()}
                    >


                        {/* Icon */}
                        <div style={{ width: '64px', height: '64px', background: 'linear-gradient(135deg, #29FE29, #22c55e)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', boxShadow: '0 8px 24px rgba(41,254,41,0.35)' }}>
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#1E1E1E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>
                        </div>

                        {/* Heading */}
                        <div style={{ fontSize: '24px', fontWeight: 900, color: '#2C76FF', marginBottom: '10px', lineHeight: 1.2 }}>
                            You're Applying Actively - <span style={{ color: '#29FE29' }}>Apply Smarter!</span>
                        </div>

                        {/* Body */}
                        <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.85)', fontWeight: 500, lineHeight: 1.7, margin: '0 0 10px' }}>
                            You've clicked Apply on <strong style={{ color: '#2C76FF' }}>{applyCountRef.current} jobs</strong> - great hustle! But without a profile match score, you're applying blind and can't tell which roles truly fit your skills.
                        </p>
                        <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.72)', fontWeight: 500, lineHeight: 1.7, margin: '0 0 24px' }}>
                            <strong style={{ color: '#29FE29' }}>ApplyWizz Job Board</strong> scores every job against your profile — so you focus on the right opportunities, get more callbacks, and land interviews faster.
                        </p>

                        {/* Feature pills */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', marginBottom: '28px' }}>
                            {['✅ AI Profile Match Score', '🎯 Personalised Job Ranking', '📈 Higher Interview Rate', '⚡ Save Hours Weekly'].map(f => (
                                <span key={f} style={{ background: 'rgba(44,118,255,0.1)', border: '1px solid rgba(44,118,255,0.25)', borderRadius: '50px', padding: '6px 14px', fontSize: '12px', fontWeight: 800, color: '#2C76FF' }}>{f}</span>
                            ))}
                        </div>

                        {/* CTA buttons */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <button
                                onClick={closeModalUpgrade}
                                style={{
                                    background: 'linear-gradient(135deg, #29FE29, #22c55e)',
                                    color: '#1E1E1E', fontWeight: 900, fontSize: '15px',
                                    padding: '14px 28px', borderRadius: '50px', border: 'none',
                                    cursor: 'pointer', width: '100%',
                                    boxShadow: '0 6px 20px rgba(41,254,41,0.4)', transition: 'transform 0.2s'
                                }}
                                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.03)'}
                                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                            >
                                🚀 Upgrade to Job Board — See My Score
                            </button>
                            <button
                                onClick={closeModalAndApply}
                                style={{
                                    background: 'transparent', color: '#2C76FF',
                                    fontWeight: 700, fontSize: '13px',
                                    padding: '10px', borderRadius: '50px',
                                    border: '1px solid rgba(44,118,255,0.4)',
                                    cursor: 'pointer', width: '100%', transition: 'all 0.2s'
                                }}
                                onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = 'rgba(44,118,255,0.1)'; e.currentTarget.style.borderColor = '#2C76FF'; }}
                                onMouseLeave={e => { e.currentTarget.style.color = '#2C76FF'; e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(44,118,255,0.4)'; }}
                            >
                                Continue applying without scoring -&gt;
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default AllJobsTab;
