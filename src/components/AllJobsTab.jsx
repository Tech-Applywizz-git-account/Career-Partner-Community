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
    // Aggressive brand matching to consolidate variants like "Amazon.com" or "AWS"
    if (n.includes('amazon') || n.includes('aws')) return 'Amazon';
    if (n.includes('google') || n.includes('alphabet')) return 'Google';
    if (n.includes('meta') || n.includes('facebook')) return 'Meta';
    if (n.includes('microsoft')) return 'Microsoft';
    if (n.includes('apple')) return 'Apple';
    return name;
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
// { quickDate: 'today'|'yesterday'|'7days'|'custom'|'all', from: 'YYYY-MM-DD'|null, to: 'YYYY-MM-DD'|null }
const applyDateFilter = (query, df) => {
    if (!df || df.quickDate === 'all' || (!df.from && !df.to)) return query;
    if (df.from) query = query.gte('date_posted', df.from);
    if (df.to) query = query.lte('date_posted', df.to);
    return query;
};

const JobRow = ({ job, isSaved, onSave }) => {
    const [hovered, setHovered] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
    const [filingCount, setFilingCount] = useState(job.lca_filings || null);
    const [wageInfo, setWageInfo] = useState({
        level: job.wage_level || 'Level 2',
        loading: !job.wage_level
    });

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 1024);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Self-enrichment for filings and wage level if missing (cached to avoid redundant DB hits)
    useEffect(() => {
        if (!job.company && !job.title) return;
        const fetchData = async () => {
            // --- Filing Count ---
            if (job.lca_filings !== undefined) {
                setFilingCount(job.lca_filings || null);
            } else {
                const fKey = `filing:${String(job.company || '').toLowerCase()}`;
                const hit = _cGet(fKey);
                if (hit !== null) {
                    setFilingCount(hit || null);
                } else {
                    try {
                        const normalize = (name) => {
                            if (!name) return '';
                            return name.toLowerCase()
                                .replace(/\([^)]*\)/g, ' ')
                                .replace(/[.,\-\/#!$%\^&\*;:{}=\-_`~()]/g, ' ')
                                .replace(/\b(inc|llc|corp|ltd|co|services|com|systems|technologies|group|holdings|usa|us|intl|international|solutions|aws|related|web|tech|software|management|financial|insurance|banking|health|healthcare|travel|company)\b/g, ' ')
                                .replace(/\s+/g, ' ').trim();
                        };
                        const coreTerm = normalize(job.company).split(' ')[0] || normalize(job.company);
                        const { data } = await supabase.from('h1b_sponsor_finder').select('"LCA Filings"').ilike('Company', `%${coreTerm}%`).limit(1);
                        const count = (data && data[0]) ? (parseInt(data[0]["LCA Filings"]) || 0) : 0;
                        _cSet(fKey, count);
                        setFilingCount(count || null);
                    } catch (e) { setFilingCount(null); }
                }
            }

            // --- Wage Level ---
            if (job.wage_level) {
                setWageInfo({ level: job.wage_level, loading: false });
            } else if (job.title) {
                const wKey = `wage:${String(job.title || '').toLowerCase().slice(0, 50)}:${String(job.location || '').toLowerCase().slice(0, 20)}`;
                const hitW = _cGet(wKey);
                if (hitW !== null) {
                    setWageInfo({ level: hitW, loading: false });
                } else {
                    try {
                        const res = await getWageLevel(job.title, job.location, job.salary);
                        const level = (res && res[0]) ? (res[0]['Wage Level'] || 'Level 2') : 'Level 2';
                        _cSet(wKey, level);
                        setWageInfo({ level, loading: false });
                    } catch (e) {
                        setWageInfo({ level: 'Level 2', loading: false });
                    }
                }
            }
        };
        fetchData();
    }, [job.company, job.title, job.lca_filings]);

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

    const getLevelValue = () => {
        const match = (wageInfo.level || '').match(/\d/);
        return match ? parseInt(match[0]) : 2;
    };
    const levelPercent = (getLevelValue() / 4) * 100;

    return (
        <div
            className="bg-white rounded-[24px] border border-[#f0f0f0] mb-5 shadow-sm hover:shadow-xl hover:border-[#2C76FF]/20 transition-all duration-300 flex flex-col lg:flex-row overflow-hidden group"
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
                    {filingCount !== null && (
                        <div className="bg-[#f0f7ff] text-[#2C76FF] px-3 py-1 rounded-full text-[11px] font-bold border border-[#2C76FF]/10">
                            📊 {filingCount.toLocaleString()} LCA Filings
                        </div>
                    )}
                    {filingCount > 100 && (
                        <div className="bg-[#eaffea] text-[#1E1E1E] px-3 py-1 rounded-full text-[11px] font-bold border border-[#29FE29]/20">
                            🔥 High Volume
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
                    {filingCount !== null && (
                        <div className="flex items-center gap-2.5 text-[#334155] font-semibold">
                            <TrendingUp size={18} className="text-[#94a3b8]" />
                            <span className="text-[14px]">{filingCount.toLocaleString()} LCA Filings</span>
                        </div>
                    )}
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
                                style={{ backgroundColor: '#78EB54', color: '#FFFFFF' }}
                            >
                                Apply Now <ExternalLink size={20} className="stroke-[2.5]" />
                            </Link>
                        ) : (
                            <a
                                href={job.url || job.apply_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="h-12 px-8 rounded-full flex items-center justify-center gap-2.5 font-extrabold text-[15px] transition-all active:scale-95"
                                style={{ backgroundColor: '#78EB54', color: '#FFFFFF' }}
                            >
                                Apply Now <ExternalLink size={20} className="stroke-[2.5]" />
                            </a>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

// SUGGESTED_ROLES is now fetched dynamically from Supabase via rolesSuggestions utility

// ── Main Component ─────────────────────────────────────────────────────────
const AllJobsTab = ({
    searchTerm: propSearchTerm = '',
    activeFilter: propActiveFilter = 'all',
    countryFilter = null,
    dateFilter = null,
    fixedCompany = null,
    fixedDomain = null
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

        // 1. Normalize URLs and remove duplicates
        const seenUrls = new Set();
        const uniqueList = [];
        list.forEach(j => {
            const uk = _urlKey(j.url);
            if (!uk || seenUrls.has(uk)) return;
            seenUrls.add(uk);
            uniqueList.push(j);
        });

        // 2. Pre-process metadata for sorting
        const enriched = uniqueList.map(j => {
            const hasSal = j.salary && String(j.salary).includes('$');
            const hasLvl = parseWageLevel(j.wage_level) || parseWageLevel(j.wage_num) || parseWageLevel(j.salary);
            const isEligible = !!(hasSal || hasLvl);

            const dateStr = j.date_posted || j.created_at || j.upload_date || j.ingestedAt || '1970-01-01';
            const timestamp = new Date(dateStr).getTime() || 0;
            const wageLvl = parseWageLevel(j.wage_level) || parseWageLevel(j.wage_num) || parseWageLevel(j.salary) || 0;
            const filings = parseInt(j.lca_filings) || 0;
            const brandRank = getCompanyRank(j.company);
            const isFamousCo = brandRank !== Infinity;

            return {
                ...j,
                _isEligible: isEligible,
                _timestamp: timestamp,
                _wageLvl: wageLvl,
                _filings: filings,
                _brandRank: brandRank,
                _isFamous: isFamousCo,
                _uk: _urlKey(j.url)
            };
        });

        // 3. Sorting logic: Priority = Eligibility -> Freshness -> Wage -> Filings
        const jobSorter = (a, b) => {
            if (b._isEligible !== a._isEligible) return b._isEligible ? 1 : -1;
            if (b._timestamp !== a._timestamp) return b._timestamp - a._timestamp;
            if (b._wageLvl !== a._wageLvl) return b._wageLvl - a._wageLvl;
            return b._filings - a._filings;
        };

        // 4. Categorize into Pools
        // Pool A: Famous OR Verified (Aggressive Priority)
        const primaryPool = enriched.filter(j => j._isFamous || j.isVerified);

        // Pool B: Everyone else but have salary info
        const secondaryPool = enriched.filter(j => !(j._isFamous || j.isVerified) && j._isEligible).sort(jobSorter);

        // Pool C: Everyone else with no salary info
        const tertiaryPool = enriched.filter(j => !(j._isFamous || j.isVerified) && !j._isEligible).sort((a, b) => b._timestamp - a._timestamp);

        // 5. Build Interleaved Main Sequence from Primary Pool
        const famousInPrimary = new Map();
        primaryPool.filter(j => j._isFamous).forEach(j => {
            const co = j.company;
            if (!famousInPrimary.has(co)) famousInPrimary.set(co, []);
            famousInPrimary.get(co).push(j);
        });
        famousInPrimary.forEach(jobs => jobs.sort(jobSorter));

        const verifiedInPrimary = primaryPool.filter(j => !j._isFamous && j.isVerified).sort(jobSorter);

        const result = [];
        const finalSeen = new Set();
        let vIdx = 0;

        const coMap = new Map();
        famousInPrimary.forEach((jobs, coName) => coMap.set(coName.toLowerCase(), jobs));

        // Interleaving rounds (famous + verified)
        // We use the RANKED_COMPANIES order for the rounds
        for (let round = 0; round < 20; round++) {
            let foundInRound = 0;
            for (const rankedCo of RANKED_COMPANIES) {
                const searchKey = rankedCo.toLowerCase();
                let group = coMap.get(searchKey);
                if (!group) {
                    // Fallback to partial match if exact match in map fails
                    for (const [key, jobs] of coMap.entries()) {
                        if (key.includes(searchKey) || searchKey.includes(key)) {
                            group = jobs;
                            break;
                        }
                    }
                }

                if (group && group[round]) {
                    const job = group[round];
                    if (!finalSeen.has(job._uk)) {
                        result.push(job);
                        finalSeen.add(job._uk);
                        foundInRound++;

                        // After a famous job, try to insert a verified job to keep variety
                        if (vIdx < verifiedInPrimary.length) {
                            const vJob = verifiedInPrimary[vIdx++];
                            if (!finalSeen.has(vJob._uk)) {
                                result.push(vJob);
                                finalSeen.add(vJob._uk);
                            }
                        }
                    }
                }
            }
            if (foundInRound === 0) break;
        }

        // 6. Append remaining jobs to maintain "Appear Last" rule
        // a. Remaining Primary jobs (famous/verified)
        primaryPool.sort(jobSorter).forEach(j => {
            if (!finalSeen.has(j._uk)) {
                result.push(j);
                finalSeen.add(j._uk);
            }
        });

        // b. Secondary Pool (Unrelated but have Salary)
        secondaryPool.forEach(j => {
            if (!finalSeen.has(j._uk)) {
                result.push(j);
                finalSeen.add(j._uk);
            }
        });

        // c. Tertiary Pool (No Salary Info)
        tertiaryPool.forEach(j => {
            if (!finalSeen.has(j._uk)) {
                result.push(j);
                finalSeen.add(j._uk);
            }
        });

        return result;
    };

    // Main fetch function
    const fetchJobs = async (page, filter, search, level = 'all', country = null) => {
        // Use fixed props if available to bypass fuzzy search
        const activeSearch = (fixedCompany || fixedDomain) ? '' : search;

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

            const fixedStr = (fixedCompany || 'none') + '_' + (fixedDomain || 'none');
            const listCacheKey = `${filter}|${(activeSearch || '').trim().toLowerCase() || 'none'}|${levelStr}|${country || 'all'}|${dateStr}|${fixedStr}`;

            // country is a COUNTRY_MAP key like "USA", "INDIA", "UK" — look it up directly
            const countryEntry = country ? COUNTRY_MAP[country] : null;
            const fullName = countryEntry?.label || null; // e.g. "United States", "India"
            const LS_KEY = `ajt_v19_${listCacheKey}`; // bumped: fixes country filter bug
            const LS_TTL_MS = 10 * 60 * 1000; // 10 minutes
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

            // ── FAST PATH: serve from in-memory Map cache (tab switches) ─────────
            if (processedListCache.current.has(listCacheKey)) {
                const cached = processedListCache.current.get(listCacheKey);
                const pagedResults = cached.list.slice(from, from + JOBS_PER_PAGE);
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
            // PROGRESSIVE LOADING  —  STALE WHILE REVALIDATE (SWR)
            //
            // Phase 1 (QUICK — shows in 1-3s first time, 50ms on repeat):
            //   3 focused parallel queries, each LIMIT 150 (= 10 pages × 15 records).
            //   Results displayed immediately. Written to localStorage for instant
            //   future loads (quick-cache TTL: 30 min).
            //
            // Phase 2 (BACKGROUND — runs after Phase 1 is on screen):
            //   Full fetch (ranked + 2500 verified + deep-fetch by URL) fires in a
            //   background async IIFE. When done: upgrades Map cache + localStorage
            //   so pages 11+ are available this session AND next open is 50ms.
            // ══════════════════════════════════════════════════════════════════════

            const QUICK_LS_KEY = `ajt_quick_v19_${listCacheKey}`; // bumped: fixes country filter bug
            const QUICK_TTL_MS = 30 * 60 * 1000; // 30 min

            // ── Quick-cache hit? ────────────────────────────────────────────────
            try {
                const qRaw = localStorage.getItem(QUICK_LS_KEY);
                if (qRaw) {
                    const q = JSON.parse(qRaw);
                    if (q?.ts && (Date.now() - q.ts) < QUICK_TTL_MS && q.list?.length > 0) {
                        if (!processedListCache.current.has(listCacheKey))
                            processedListCache.current.set(listCacheKey, { list: q.list, total: q.total });
                        setJobs(q.list.slice(from, from + JOBS_PER_PAGE));
                        setTotalJobs(q.total);
                        setCurrentPage(page);
                        setLoading(false);
                        return;
                    }
                }
            } catch (_) { }

            // ── DEEP PAGE DIRECT FETCH (Page > 10) ──────────────────────────
            // If the user is on a deep page, skip the complex merging phase and
            // fetch the raw DB range directly to avoid hitting Supabase limits
            // with ilike/deep-fetch logic which is only optimized for recent rows.
            if (from >= 150) {
                try {
                    let directQ = supabase.from('jobs_all_roles')
                        .select('*', { count: 'exact' });

                    if (fixedCompany) {
                        if (Array.isArray(fixedCompany)) {
                            directQ = directQ.in('company_name', fixedCompany);
                        } else {
                            directQ = directQ.eq('company_name', fixedCompany);
                        }
                    } else if (fixedDomain) {
                        directQ = directQ.eq('role_name', fixedDomain);
                    } else if (search && search.trim()) {
                        const words = search.trim().toLowerCase()
                            .replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, " ")
                            .split(/\s+/)
                            .filter(w => w.length >= 1);
                        const tC = `and(${words.map(w => `title.ilike.%${w}%`).join(',')})`;
                        const cC = `and(${words.map(w => `company_name.ilike.%${w}%`).join(',')})`;
                        const rC = `and(${words.map(w => `role_name.ilike.%${w}%`).join(',')})`;
                        directQ = directQ.or(`${tC},${cC},${rC}`);
                    }
                    if (country) {
                        // DB stores exact uppercase COUNTRY_MAP keys — simple .eq() is correct
                        directQ = directQ.eq('indeed_search_country', country);
                    }
                    directQ = applyDateFilter(directQ, dateFilter);
                    if (level && level.length > 0) {
                        // wage_level doesn't exist in new schema, but we can try to find it in title or description if needed
                        // for now skipping since user said use the provided table schema
                    }
                    const { data: dData, count: dCount, error: dError } = await directQ
                        .order('date_posted', { ascending: false, nullsFirst: false })
                        .range(from, from + JOBS_PER_PAGE - 1);

                    if (dError) throw dError;

                    let finalData = dData || [];
                    let finalCount = dCount !== null ? dCount : 0;

                    // FALLBACK: If requested page is empty but total matches exist, show the absolute last page
                    if (finalData.length === 0 && finalCount > 0) {
                        const lastPageFrom = Math.max(0, Math.floor((finalCount - 1) / JOBS_PER_PAGE) * JOBS_PER_PAGE);
                        const { data: fData } = await directQ
                            .order('date_posted', { ascending: false, nullsFirst: false })
                            .range(lastPageFrom, finalCount - 1);
                        if (fData && fData.length > 0) {
                            finalData = fData;
                        }
                    }

                    const directJobs = finalData.map(j => ({
                        ...j,
                        company: j.company_name || 'Unknown',
                        url: j.job_url_direct || j.job_url || '',
                        apply_url: j.job_url || j.job_url_direct || '',
                        job_id: j.id,
                        role: j.role_name || j.title || '',
                        job_role_name: j.role_name || j.title || '',
                        isVerified: false,
                        isTeaser: paymentStatus === 'pending'
                    }));

                    if (directJobs.length > 0) {
                        const finalInterleaved = interleaveJobs(directJobs);
                        setJobs(finalInterleaved.length > 0 ? finalInterleaved : directJobs);
                        setTotalJobs(finalCount);
                        setCurrentPage(page);
                        setLoading(false);
                        if (!processedListCache.current.has(listCacheKey)) {
                            processedListCache.current.set(listCacheKey, { list: finalInterleaved.length > 0 ? finalInterleaved : directJobs, total: finalCount });
                        }
                        return;
                    }
                    // If truly no jobs, continue to Phase 1 to let it handle empty state
                } catch (err) {
                    console.error('ajt deep-direct-fetch failure:', err);
                }
            }

            // ── Phase 1: High-Performance Server-Side Search ─────────────────────
            const QUICK_LIMIT = fixedCompany || fixedDomain ? 1000 : 500;
            
            // If we have a fixed company/domain, we use standard query (simple)
            // If we have a search term, we use the optimized search_jobs RPC
            let qList = [];
            let qTotal = 0;

            if (!fixedCompany && !fixedDomain && search && search.trim()) {
                const { data: rpcData, error: rpcErr } = await supabase.rpc('search_jobs', {
                    p_search_term: search.trim(),
                    p_country: country || null,
                    p_start_date: dateFilter?.from || null,
                    p_end_date: dateFilter?.to || null,
                    p_limit: QUICK_LIMIT,
                    p_offset: 0
                });

                if (rpcErr) {
                    console.error('search_jobs RPC failed:', rpcErr);
                    throw rpcErr;
                }
                
                qList = (rpcData || []).map(j => ({
                    ...j,
                    company: j.company_name || 'Unknown',
                    role: j.role_name || j.title || '',
                    job_role_name: j.role_name || j.title || '',
                    url: j.job_url_direct || j.job_url || '',
                    apply_url: j.job_url || j.job_url_direct || '',
                    job_id: j.id,
                    isVerified: false,
                    isTeaser: paymentStatus === 'pending'
                }));
                qTotal = parseInt(rpcData?.[0]?.total_count || 0);
            } else {
                // Standard fallback for non-search or fixed-filter views
                let quickQ = supabase.from('jobs_all_roles')
                    .select('*', { count: 'exact' })
                    .order('date_posted', { ascending: false, nullsFirst: false })
                    .limit(QUICK_LIMIT);

                if (fixedCompany) {
                    if (Array.isArray(fixedCompany)) quickQ = quickQ.in('company_name', fixedCompany);
                    else quickQ = quickQ.eq('company_name', fixedCompany);
                } else if (fixedDomain) {
                    quickQ = quickQ.eq('role_name', fixedDomain);
                }
                
                if (country) quickQ = quickQ.eq('indeed_search_country', country);
                quickQ = applyDateFilter(quickQ, dateFilter);

                const qStdRes = await quickQ;
                if (qStdRes?.error) throw qStdRes.error;
                
                qList = (qStdRes.data || []).map(j => ({
                    ...j,
                    company: j.company_name || 'Unknown',
                    role: j.role_name || j.title || '',
                    job_role_name: j.role_name || j.title || '',
                    url: j.job_url_direct || j.job_url || '',
                    apply_url: j.job_url || j.job_url_direct || '',
                    job_id: j.id,
                    isVerified: false,
                    isTeaser: paymentStatus === 'pending'
                }));
                qTotal = qStdRes.count || qList.length;
            }

            // Client-side search filter (DB already filtered, this is belt-and-suspenders)
            if (!fixedCompany && !fixedDomain && search && search.trim() && qList.length > 0) {
                const sWords = search.trim().toLowerCase()
                    .replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, ' ')
                    .split(/\s+/).filter(w => w.length >= 1);
                qList = qList.filter(j => {
                    const target = `${j.title || ''} ${j.company_name || ''} ${j.role_name || ''}`.toLowerCase();
                    return sWords.every(w => target.includes(w));
                });
            }

            // No LCA enrichment — strictly jobs_all_roles only per requirements

            qList = interleaveJobs(qList);
            // qTotal is already calculated correctly in the Phase 1 blocks above.

            // Store quick result → Map + localStorage
            processedListCache.current.set(listCacheKey, { list: qList, total: qTotal });
            try { localStorage.setItem(QUICK_LS_KEY, JSON.stringify({ ts: Date.now(), total: qTotal, list: qList.slice(0, 150) })); } catch (_) { }

            // ⚡ Show immediately
            const pagedSlice = qList.slice(from, from + JOBS_PER_PAGE);
            if (pagedSlice.length > 0) {
                setJobs(pagedSlice);
                setTotalJobs(qTotal);
                setCurrentPage(page);
                setLoading(false);
            } else if (from >= qList.length && qTotal > qList.length) {
                // Page is beyond locally-fetched data: fetch directly from DB with server-side range
                try {
                    let directQ = supabase.from('jobs_all_roles')
                        .select('*', { count: 'exact' })
                        .order('date_posted', { ascending: false })
                        .range(from, from + JOBS_PER_PAGE - 1);
                    if (search && search.trim()) {
                        const words = search.trim().toLowerCase().split(/\s+/).filter(w => w.length >= 1);
                        const tC = `and(${words.map(w => `title.ilike.%${w}%`).join(',')})`;
                        const cC = `and(${words.map(w => `company_name.ilike.%${w}%`).join(',')})`;
                        directQ = directQ.or(`${tC},${cC}`);
                    }
                    if (level && level.length > 0) {
                        const exp = level.flatMap(l => { const n = l.match(/\d/)?.[0]; if (!n) return [l]; const rom = { '1': 'I', '2': 'II', '3': 'III', '4': 'IV' }[n]; return [l, `Level ${n}`, `Level ${rom}`, n, `Lv ${n}`, `Lv${n}`]; });
                        directQ = directQ.in('wage_level', exp);
                    }
                    const { data: directData, count: directCount } = await directQ;
                    let finalDirectData = directData || [];
                    let finalDirectCount = directCount !== null ? directCount : qTotal;

                    // FALLBACK: If requested page is empty but total matches exist, show the absolute last page
                    if (finalDirectData.length === 0 && finalDirectCount > 0) {
                        const lastPageFrom = Math.max(0, Math.floor((finalDirectCount - 1) / JOBS_PER_PAGE) * JOBS_PER_PAGE);
                        const { data: fData } = await directQ
                            .order('date_posted', { ascending: false })
                            .range(lastPageFrom, finalDirectCount - 1);
                        if (fData && fData.length > 0) {
                            finalDirectData = fData;
                        }
                    }

                    if (finalDirectData.length > 0) {
                        const directJobs = finalDirectData.map(j => ({
                            ...j,
                            job_id: j.id,
                            role: j.role_name || j.title || '',
                            company: j.company_name || 'Unknown',
                            url: j.job_url_direct || j.job_url || '',
                            apply_url: j.job_url || j.job_url_direct || '',
                            isVerified: false,
                            isTeaser: paymentStatus === 'pending'
                        }));
                        setJobs(directJobs);
                        setTotalJobs(finalDirectCount);
                        setCurrentPage(page);
                    } else {
                        setJobs([]);
                        setTotalJobs(qTotal);
                        setCurrentPage(page);
                    }
                } catch (_) {
                    setJobs([]);
                    setTotalJobs(qTotal);
                    setCurrentPage(page);
                }
                setLoading(false);
            } else {
                setJobs(pagedSlice);
                setTotalJobs(qTotal);
                setCurrentPage(page);
                setLoading(false);
            }

            // ── Phase 2: Full background fetch — strictly jobs_all_roles only ──
            (async () => {
                try {
                    const FULL_LIMIT = (fixedCompany || fixedDomain) ? 10000 : 2500;
                    let standardQuery = supabase.from('jobs_all_roles')
                        .select('*', { count: 'exact' })
                        .order('date_posted', { ascending: false, nullsFirst: false })
                        .limit(FULL_LIMIT);

                    if (fixedCompany) {
                        if (Array.isArray(fixedCompany)) {
                            standardQuery = standardQuery.in('company_name', fixedCompany);
                        } else {
                            standardQuery = standardQuery.eq('company_name', fixedCompany);
                        }
                    } else if (fixedDomain) {
                        standardQuery = standardQuery.eq('role_name', fixedDomain);
                    } else if (search && search.trim()) {
                        const words = search.trim().toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, ' ').split(/\s+/).filter(x => x.length >= 1);
                        const roleKeywords = ['analyst', 'developer', 'engineer', 'scientist', 'designer', 'manager', 'lead', 'senior', 'junior', 'architect', 'data', 'software', 'ai', 'ml', 'researcher'];
                        const isRoleS = words.some(x => roleKeywords.includes(x));
                        const tC = `and(${words.map(x => `title.ilike.%${x}%`).join(',')})`;
                        const cC = `and(${words.map(x => `company_name.ilike.%${x}%`).join(',')})`;
                        const rC = `and(${words.map(x => `role_name.ilike.%${x}%`).join(',')})`;
                        standardQuery = standardQuery.or(isRoleS && words.length >= 2 ? `${tC},${rC}` : `${tC},${cC},${rC}`);
                    }
                    if (country) standardQuery = standardQuery.eq('indeed_search_country', country);
                    standardQuery = applyDateFilter(standardQuery, dateFilter);

                    const standardRes = await standardQuery;
                    if (standardRes?.error) return;

                    // Normalize — strictly jobs_all_roles only
                    let fullList = (standardRes.data || []).map(j => ({
                        ...j,
                        company: j.company_name || 'Unknown',
                        role: j.role_name || j.title || '',
                        job_role_name: j.role_name || j.title || '',
                        url: j.job_url_direct || j.job_url || '',
                        apply_url: j.job_url || j.job_url_direct || '',
                        job_id: j.id,
                        isVerified: false,
                        isTeaser: paymentStatus === 'pending'
                    }));

                    // Client-side search filter
                    if (search && search.trim()) {
                        const sWords = search.trim().toLowerCase().split(/\s+/).filter(w => w.length >= 1);
                        fullList = fullList.filter(j => {
                            const target = `${j.title || ''} ${j.company_name || ''} ${j.role_name || ''}`.toLowerCase();
                            return sWords.every(w => target.includes(w));
                        });
                    }

                    const interleaved = interleaveJobs(fullList);
                    const fullTotal = (search && search.trim()) ? interleaved.length : (standardRes.count || interleaved.length);

                    // Upgrade both caches — pages 11+ now available
                    processedListCache.current.set(listCacheKey, { list: interleaved, total: fullTotal });
                    try {
                        localStorage.setItem(`ajt_v19_${listCacheKey}`, JSON.stringify({ ts: Date.now(), total: fullTotal, list: interleaved.slice(0, 500) }));
                        localStorage.removeItem(QUICK_LS_KEY);
                    } catch (_) { }
                } catch (_) { /* silent — Phase 1 data already on screen */ }
            })();
        } catch (err) {
            console.error('AllJobsTab fetchJobs error:', err);
            setError(err.message || 'Failed to load jobs');
        } finally {
            setLoading(false);
        }
    };


    // Trigger fetch when search, filter, country, date, or fixed props change
    useEffect(() => {
        if (isInitialLoadDone) {
            // Clear in-memory + localStorage cache when criteria changes
            processedListCache.current.clear();
            fetchJobs(1, activeFilter, debouncedSearch, levelFilter, countryFilter);
        }
    }, [activeFilter, debouncedSearch, levelFilter, countryFilter, isInitialLoadDone,
        dateFilter?.quickDate, dateFilter?.from, dateFilter?.to,
        fixedCompany, fixedDomain]);

    // ── Silent background preloader ──────────────────────────────────────────
    // After the current tab finishes loading, silently preload the OTHER tab
    // so switching between 'All Jobs' ↔ 'Human Verified' is instant from cache.
    // Only runs when: no search/level filters, no active loading, and the other
    // tab's cache slot is empty for this session.
    useEffect(() => {
        if (!isInitialLoadDone || loading || debouncedSearch || levelFilter.length > 0) return;

        const otherFilter = activeFilter === 'all' ? 'verified' : 'all';
        const otherKey = `${otherFilter}|none|all|${countryFilter || 'all'}`;

        // Only preload if the other tab hasn't been cached yet this session
        if (processedListCache.current.has(otherKey)) return;

        // Delay slightly so the current tab's enrichment (LCA, wages) finishes first
        const timer = setTimeout(() => {
            // Silent fetch: run the full fetchJobs logic for the other tab
            // but suppress all UI state updates (setJobs, setLoading, etc.)
            // The Map cache will be populated — hitting the tab will be instant.
            const silentFetch = async () => {
                try {
                    const levelStr = 'all';
                    const silentKey = `${otherFilter}|none|${levelStr}|${countryFilter || 'all'}`;
                    if (processedListCache.current.has(silentKey)) return;

                    // Strictly jobs_all_roles only
                    let sQ = supabase.from('jobs_all_roles')
                        .select('*', { count: 'exact' })
                        .order('date_posted', { ascending: false, nullsFirst: false })
                        .limit(500);

                    if (countryFilter) sQ = sQ.eq('indeed_search_country', countryFilter);
                    sQ = applyDateFilter(sQ, dateFilter);

                    const sRes = await sQ;
                    if (sRes?.error) return;

                    const silentJobs = (sRes.data || []).map(j => ({
                        ...j,
                        company: j.company_name || 'Unknown',
                        role: j.role_name || j.title || '',
                        job_role_name: j.role_name || j.title || '',
                        url: j.job_url_direct || j.job_url || '',
                        apply_url: j.job_url || j.job_url_direct || '',
                        job_id: j.id,
                        isVerified: false,
                        isTeaser: paymentStatus === 'pending'
                    }));

                    const interleaved = interleaveJobs(silentJobs);
                    const actualTotal = sRes.count || interleaved.length;
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
        if (totalPages <= 7) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            if (currentPage <= 4) {
                for (let i = 1; i <= 5; i++) pages.push(i);
                pages.push('...', totalPages);
            } else if (currentPage >= totalPages - 3) {
                pages.push(1, '...');
                for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
            } else {
                pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
            }
        }
        return pages;
    };

    return (
        <div style={{ fontFamily: 'inherit' }}>
            {/* Internal headers/filters removed in favor of global dashboard filters */}

            {/* ── Verified filter banner ── */}
            {activeFilter === 'verified' && !loading && (
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
                    {jobs.map((job, i) => (
                        <JobRow
                            key={`${job.id || job.url || 'job'}_${i}`}
                            job={{
                                ...job,
                                isVerified: job.isVerified || verifiedSet?.has(job.company)
                            }}
                            isSaved={savedJobIds.has(String(job.id || job.job_id || ''))}
                            onSave={handleSave}
                        />
                    ))}

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
    );
};

export default AllJobsTab;
