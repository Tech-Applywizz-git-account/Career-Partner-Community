import React, { useState, useEffect, useCallback } from 'react';
import { Search, Star, Sliders, X, Building, Info, Loader2, ChevronLeft, ChevronRight, ArrowUpDown, User, Briefcase, ExternalLink } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { supabase } from '../supabaseClient';
import CompanyCard from './CompanyCard';
import CompanyJobCard from './CompanyJobCard';
import { getCompanyLogo } from '../utils/logoHelper';
import LogoBox from './LogoBox';
import { fetchJobRoles, filterRoles } from '../utils/rolesSuggestions';
import { isFamous } from '../utils/famousCompanies';

const COMPANIES_PER_PAGE = 3;
const JOBS_PER_PAGE = 2;

// Roles fetched dynamically from Supabase via rolesSuggestions utility

const MigrateHero = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    // Data states
    const [companies, setCompanies] = useState([]);
    const [companiesLoading, setCompaniesLoading] = useState(false);
    const [selectedCompany, setSelectedCompany] = useState(null);
    const [selectedCompanyData, setSelectedCompanyData] = useState(null);
    const [companyJobs, setCompanyJobs] = useState([]);
    const [jobsLoading, setJobsLoading] = useState(false);
    const [jobPage, setJobPage] = useState(1);
    const [totalCompanyJobs, setTotalCompanyJobs] = useState(0);

    // Search & Filter states
    const [companySearch, setCompanySearch] = useState('');
    const [debouncedCompanySearch, setDebouncedCompanySearch] = useState('');
    const [companyPage, setCompanyPage] = useState(1);
    const [totalCompanies, setTotalCompanies] = useState(0);
    const [sortBy, setSortBy] = useState('most_jobs');
    const [allCompanies, setAllCompanies] = useState([]);
    const [filteredSuggestions, setFilteredSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);

    const [filingCounts, setFilingCounts] = useState({});

    // Global name normalizer for consistent lookups (Sync with Homepage)
    const normalizeName = (name) => {
        if (!name) return '';
        let n = name.toLowerCase()
            .replace(/\([^)]*\)/g, ' ')
            .replace(/[.,\-\/#!$%\^&\*;:{}=\-_`~()]/g, ' ')
            .replace(/\b(inc|llc|corp|ltd|co|services|com|systems|technologies|group|holdings|usa|us|intl|international|asia|europe|solutions|aws|related)\b/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
        if (n.includes('amazon')) return 'amazon';
        if (n.includes('google') || n.includes('alphabet')) return 'google';
        if (n.includes('meta') || n.includes('facebook')) return 'meta';
        if (n.includes('microsoft')) return 'microsoft';
        if (n === 'apple' || n.startsWith('apple ')) return 'apple';
        return n;
    };

    // Fetch filing counts for landing page companies
    useEffect(() => {
        if (companies.length === 0) return;
        const fetchFilings = async () => {
            try {
                const rawNames = companies.map(c => c.company).filter(Boolean);
                const searchTerms = new Set();
                rawNames.forEach(n => {
                    const norm = normalizeName(n);
                    if (norm.length > 2) searchTerms.add(norm);
                    const words = norm.split(' ').filter(Boolean);
                    if (words.length >= 2) searchTerms.add(words.slice(0, 2).join(' '));
                    if (words.length >= 1) searchTerms.add(words[0]);
                });

                const searchNames = Array.from(searchTerms).filter(n => n.length > 2);
                if (searchNames.length === 0) return;

                const orFilter = searchNames.map(n => `Company.ilike.*${n.replace(/,/g, '\\,')}*`).join(',');
                const { data } = await supabase
                    .from('h1b_sponsor_finder')
                    .select('Company, "LCA Filings"')
                    .or(orFilter);

                if (data) {
                    const map = {};
                    const sorted = [...data].sort((a, b) => {
                        const valA = typeof a["LCA Filings"] === 'number' ? a["LCA Filings"] : parseInt(String(a["LCA Filings"]).replace(/,/g, '')) || 0;
                        const valB = typeof b["LCA Filings"] === 'number' ? b["LCA Filings"] : parseInt(String(b["LCA Filings"]).replace(/,/g, '')) || 0;
                        return valB - valA;
                    });
                    sorted.forEach(f => {
                        const count = typeof f["LCA Filings"] === 'number' ? f["LCA Filings"] : parseInt(String(f["LCA Filings"]).replace(/,/g, '')) || 0;
                        map[f.Company.toLowerCase()] = count;
                        const norm = normalizeName(f.Company);
                        if (norm && (!map[norm] || map[norm] < count)) map[norm] = count;
                    });
                    setFilingCounts(prev => ({ ...prev, ...map }));
                }
            } catch (err) { console.error("Filing fetch error:", err); }
        };
        fetchFilings();
    }, [companies]);

    // Role state
    const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 1024);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Debounce company search (only for Supabase querying)
    useEffect(() => {
        const t = setTimeout(() => {
            setDebouncedCompanySearch(companySearch);
        }, 500);
        return () => clearTimeout(t);
    }, [companySearch]);

    // Fetch Companies Logic (Mirrors Homepage but without forced auth check for viewing)
    const fetchCompanies = useCallback(async () => {
        // 1. Check if we have a global cache for the processed company list to prevent re-fetching
        if (window._landingPageCompaniesCache_v11 && !debouncedCompanySearch) {
            let arr = [...window._landingPageCompaniesCache_v11];

            // Apply local sorting with Famous Priority
            arr.sort((a, b) => {
                const aF = isFamous(a.company);
                const bF = isFamous(b.company);
                if (aF && !bF) return -1;
                if (!aF && bF) return 1;
                if (sortBy === 'most_jobs') return b.jobCount - a.jobCount;
                if (sortBy === 'highest_wage') return b.maxWageNum - a.maxWageNum;
                return a.company.localeCompare(b.company);
            });

            setTotalCompanies(arr.length);
            const pagedArr = arr.slice(0, 3);
            setCompanies(pagedArr);

            // Auto-select first company on load if none selected
            if (!selectedCompany && pagedArr.length > 0) {
                setSelectedCompany(pagedArr[0].company);
                setSelectedCompanyData(pagedArr[0]);
            }
            return;
        }

        setCompaniesLoading(true);
        try {
            const TARGETS = ['Google', 'Microsoft', 'Meta'];

            // STEP 1: Fetch job counts and info for these companies in ONE batch.
            const { data: jobData, error: jobError } = await supabase
                .from('job_jobrole_sponsored_sync')
                .select('company, job_role_name, wage_level, wage_num')
                .in('company', TARGETS)
                .limit(1000);

            if (jobError) console.warn('Job fetch warning (non-fatal):', jobError);
            const validJobData = jobData || [];

            // Aggregate jobs into unique company stats
            const companyStats = new Map();
            validJobData.forEach(j => {
                const name = j.company;
                if (!name) return;

                if (!companyStats.has(name)) {
                    companyStats.set(name, {
                        company: name,
                        jobCount: 0,
                        maxWageNum: 0,
                        wageLevel: 'Lv 1',
                        industries: new Set()
                    });
                }
                const stats = companyStats.get(name);
                stats.jobCount++;

                const currentWageNum = parseInt(j.wage_num || j.wage_level?.match(/\d/)?.[0] || '1');
                if (currentWageNum > stats.maxWageNum) {
                    stats.maxWageNum = currentWageNum;
                    stats.wageLevel = `Lv ${currentWageNum}`;
                }

                if (j.job_role_name) {
                    const roles = j.job_role_name.split(',').map(r => r.trim()).filter(Boolean);
                    roles.forEach(r => stats.industries.add(r));
                }
            });

            // Ensure every target brand exists in the final array
            TARGETS.forEach(name => {
                if (!companyStats.has(name)) {
                    companyStats.set(name, {
                        company: name,
                        jobCount: 0,
                        maxWageNum: 0,
                        wageLevel: 'Lv 1',
                        industries: new Set()
                    });
                }
            });

            let arr = Array.from(companyStats.values());

            // ── MANDATORY PRECISE FILTERING (v11) ──
            if (debouncedCompanySearch && debouncedCompanySearch.trim()) {
                const n = (s) => String(s || '').toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "").trim().replace(/\s+/g, ' ');
                const nS = n(debouncedCompanySearch);

                arr = arr.filter(c => {
                    const cName = n(c.company);
                    // Allow partial match for the company cards themselves so they don't vanish while typing
                    const matchName = cName.includes(nS) || nS.includes(cName);
                    // Keep role matching strict
                    const matchRole = Array.from(c.industries).some(r => n(r) === nS);
                    return matchName || matchRole;
                });
            }

            arr = arr.map(c => ({
                ...c,
                industries: Array.from(c.industries)
            }));

            // Cache the results
            if (!debouncedCompanySearch) {
                window._landingPageCompaniesCache_v11 = arr;
            }

            // Apply selected sorting with Famous Priority
            arr.sort((a, b) => {
                const aF = isFamous(a.company);
                const bF = isFamous(b.company);
                if (aF && !bF) return -1;
                if (!aF && bF) return 1;
                if (sortBy === 'most_jobs') return b.jobCount - a.jobCount;
                if (sortBy === 'highest_wage') return b.maxWageNum - a.maxWageNum;
                return a.company.localeCompare(b.company);
            });

            setTotalCompanies(arr.length);
            const pagedArr = arr.slice(0, 3);
            setCompanies(pagedArr);

            // Auto-select logic
            if (pagedArr.length > 0) {
                const shouldSelectFirst = !selectedCompany || debouncedCompanySearch;
                if (shouldSelectFirst) {
                    setSelectedCompany(pagedArr[0].company);
                    setSelectedCompanyData(pagedArr[0]);
                }
            }
        } catch (err) {
            const isNetworkError = err.message?.includes('fetch') || !window.navigator.onLine;
            if (!isNetworkError) {
                console.error('Error fetching companies:', err);
            }
            setCompanies([]);
        } finally {
            setCompaniesLoading(false);
        }
    }, [debouncedCompanySearch, sortBy, companyPage]);

    // Fetch Jobs for selected company
    const fetchCompanyJobs = useCallback(async () => {
        if (!selectedCompany) return;

        // Use global cache if available to prevent re-fetching
        const cacheKey = `${selectedCompany}_${jobPage}`;
        if (!window._landingPageJobsCache) window._landingPageJobsCache = {};
        if (window._landingPageJobsCache[cacheKey]) {
            const cached = window._landingPageJobsCache[cacheKey];
            setCompanyJobs(cached.jobs);
            setTotalCompanyJobs(cached.total);
            return;
        }

        setJobsLoading(true);
        try {
            const from = (jobPage - 1) * JOBS_PER_PAGE;
            let q = supabase
                .from('job_jobrole_sponsored_sync')
                .select('*', { count: 'exact' })
                .eq('company', selectedCompany)
                .order('wage_num', { ascending: false, nullsFirst: false })
                .order('date_posted', { ascending: false });

            const { data: rawData, error, count } = await q.range(from, from + JOBS_PER_PAGE - 1);
            if (error) throw error;
            let data = rawData || [];

            // ── MANDATORY PRECISE MATCHING (v11) ──
            if (debouncedCompanySearch && debouncedCompanySearch.trim()) {
                const n = (s) => String(s || '').toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "").trim().replace(/\s+/g, ' ');
                const nS = n(debouncedCompanySearch);

                // If search is NOT a company brand match (prefix or exact), apply strict role matching
                const TARGETS = ['Google', 'Microsoft', 'Meta'];
                const isCompanySearch = TARGETS.some(t => {
                    const nt = n(t);
                    return nt.includes(nS) || nS.includes(nt);
                });

                if (!isCompanySearch) {
                    data = data.filter(j => {
                        const primary = j.title || '';
                        return n(primary) === nS;
                    });
                }
            }

            // Map for compatibility with CompanyJobCard
            const mappedData = (data || []).map(j => ({
                ...j,
                job_id: j.id,
                role: j.job_role_name
            }));

            // Priority Sort: (1) Visible Salary First, (2) Apply Link
            mappedData.sort((a, b) => {
                const aHasSal = !!(a.salary && a.salary.trim().length > 0);
                const bHasSal = !!(b.salary && b.salary.trim().length > 0);
                const aHasUrl = !!(a.url || a.apply_url);
                const bHasUrl = !!(b.url || b.apply_url);

                const aScore = (aHasSal ? 100 : 0) + (aHasUrl ? 1 : 0);
                const bScore = (bHasSal ? 100 : 0) + (bHasUrl ? 1 : 0);

                if (aScore !== bScore) return bScore - aScore;
                return 0;
            });

            setCompanyJobs(mappedData);
            setTotalCompanyJobs(count || 0);

            // Store in cache
            window._landingPageJobsCache[cacheKey] = {
                jobs: mappedData,
                total: count || 0
            };
        } catch (err) {
            const isNetworkError = err.message?.includes('fetch') || !window.navigator.onLine;
            if (!isNetworkError) {
                console.error('Error fetching jobs:', err);
            }
        } finally {
            setJobsLoading(false);
        }
    }, [selectedCompany, jobPage, debouncedCompanySearch]);

    useEffect(() => { fetchCompanies(); }, [debouncedCompanySearch, sortBy, companyPage]);
    useEffect(() => { fetchCompanyJobs(); }, [selectedCompany, jobPage, debouncedCompanySearch]);

    const handleCompanySelect = (co) => {
        setSelectedCompany(co.company);
        setSelectedCompanyData(co);
        setJobPage(1);
    };

    const handleSuggestionClick = (coName) => {
        setCompanySearch(coName);
        setDebouncedCompanySearch(coName); // Instant update on select
        setShowSuggestions(false);
        setCompanyPage(1);
    };

    const handleSearchChange = (e) => {
        const val = e.target.value;
        setCompanySearch(val);
        setCompanyPage(1);

        if (val.trim().length > 0) {
            const filtered = allCompanies
                .filter(c => c.toLowerCase().includes(val.toLowerCase()))
                .slice(0, 8);
            setFilteredSuggestions(filtered);
            setShowSuggestions(filtered.length > 0);
        } else {
            setFilteredSuggestions([]);
            setShowSuggestions(false);
        }
    };

    return (
        <section className="relative overflow-hidden text-center">
            {/* Hero Header Area */}
            <div className="relative pt-24 pb-16 px-6 overflow-hidden">
                <div className="absolute top-0 left-0 right-0 bottom-0 z-0">
                    <img src="/hero-bg.png" alt="Hero Background" className="w-full h-full object-cover object-center" />
                    <div className="absolute inset-0 bg-[#24385E]/40"></div>
                </div>

                <div className="relative z-10">
                    <div className="flex justify-center gap-0.5 mb-3">
                        {[1, 2, 3, 4, 5].map(i => <Star key={i} size={14} className="fill-yellow-400 text-yellow-400 md:w-[16px] md:h-[16px]" />)}
                    </div>
                    <p className="text-white text-[10px] md:text-xs font-bold mb-4 tracking-wide drop-shadow-sm uppercase">Trusted by 30,000+ job seekers</p>
                    <h1 className="text-[24px] md:text-[44px] font-[900] text-white leading-[1.2] md:leading-[1.1] tracking-tight mb-6 drop-shadow-lg max-w-2xl mx-auto px-2">
                        Land your dream job in the U.S.
                    </h1>
                </div>
            </div>

            {/* Content Area: Exact App Clone Dashboard */}
            <div className="relative z-20 mt-12 max-w-7xl mx-auto px-6 pb-20">
                <div className="bg-[#f5f5f7] rounded-[24px] md:rounded-[48px] shadow-2xl overflow-hidden border border-white/50">
                    <div className="pt-6 md:pt-10 pb-4 md:pb-6 px-4 md:px-10 text-left">
                        {/* Full Width Search Bar with Heading as Placeholder */}
                        {/* <div className="relative w-full">
                            <div className={`
                                bg-white border-2 transition-all duration-300 flex items-center gap-2 md:gap-3 px-3 md:px-5 h-12 md:h-16 rounded-xl md:rounded-2xl shadow-sm
                                ${companySearch ? 'border-[#24385E]' : 'border-[#e2e8f0]'}
                                hover:border-[#24385E] group
                            `}>
                                <Search size={isMobile ? 18 : 24} className={`${companySearch ? 'text-[#24385E]' : 'text-gray-400'} transition-colors`} strokeWidth={2.5} />
                                <input 
                                    value={companySearch}
                                    onChange={handleSearchChange}
                                    placeholder={isMobile ? "Search Role..." : "Search for your perfect role."}
                                    className="flex-1 bg-transparent border-none outline-none text-[15px] md:text-lg font-black text-[#24385E] placeholder:text-gray-400 placeholder:font-black placeholder:tracking-tight min-w-0"
                                />
                                {companySearch && (
                                    <button onClick={() => setCompanySearch('')} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
                                        <X size={16} className="text-gray-400" />
                                    </button>
                                )}
                            </div>
                        </div> */}
                    </div>

                    <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', borderTop: '1px solid #ebebeb', minHeight: isMobile ? 'auto' : '700px' }}>
                        {/* LEFT: Company list (Matches App Left Panel) */}
                        <div style={{
                            width: isMobile ? '100%' : '420px',
                            minWidth: isMobile ? '0' : '420px',
                            background: '#f5f5f7',
                            padding: isMobile ? '16px 10px' : '24px 20px',
                            borderRight: isMobile ? 'none' : '1px solid #e8e8e8',
                            display: isMobile && selectedCompany ? 'none' : 'flex',
                            flexDirection: 'column',
                            gap: '0'
                        }}>
                            <div style={{ position: 'relative', marginBottom: '16px' }}>
                                <div style={{
                                    background: showSuggestions && filteredSuggestions.length > 0 ? '#24385E' : '#fff',
                                    borderRadius: showSuggestions && filteredSuggestions.length > 0 ? '30px 30px 0 0' : '60px',
                                    border: showSuggestions && filteredSuggestions.length > 0 ? '1.5px solid rgba(255,255,255,0.1)' : '1.5px solid #d8d8d8',
                                    display: 'flex', alignItems: 'center', gap: '10px', padding: '0 16px', height: '52px',
                                    boxShadow: showSuggestions && filteredSuggestions.length > 0 ? 'none' : '0 2px 8px rgba(0,0,0,0.07)',
                                    position: 'relative', zIndex: 2010,
                                    transition: 'all 0.2s'
                                }}>
                                    <Search size={18} color="#aaa" strokeWidth={2.5} />
                                    <input
                                        value={companySearch}
                                        onChange={handleSearchChange}
                                        onFocus={() => {
                                            if (companySearch.length > 0) setShowSuggestions(true);
                                        }}
                                        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                                        placeholder="Search companies (e.g. Google, Meta)"
                                        style={{
                                            flex: 1,
                                            border: 'none',
                                            outline: 'none',
                                            fontSize: '14px',
                                            fontWeight: 600,
                                            color: showSuggestions && filteredSuggestions.length > 0 ? '#fff' : '#333',
                                            background: 'transparent',
                                            transition: 'color 0.2s'
                                        }}
                                    />
                                    {!isMobile && (
                                        <div style={{ height: '32px', padding: '0 14px', background: '#fff', border: '1.5px solid #ebebeb', borderRadius: '40px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: '#444' }}>
                                            <Sliders size={14} className="text-yellow-500" /> Filters
                                        </div>
                                    )}
                                </div>

                                {/* Suggestions Dropdown (Google Chrome Style) */}
                                {showSuggestions && filteredSuggestions.length > 0 && (
                                    <div style={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        right: 0,
                                        backgroundColor: '#24385E',
                                        borderRadius: '30px',
                                        boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
                                        zIndex: 2000,
                                        overflow: 'hidden',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        animation: 'fadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                                        paddingTop: '52px'
                                    }}>
                                        <div style={{ borderTop: '0.5px solid rgba(255,255,255,0.1)' }}>
                                            {filteredSuggestions.map((coName, idx) => (
                                                <div
                                                    key={coName}
                                                    onMouseDown={(e) => {
                                                        e.preventDefault();
                                                        handleSuggestionClick(coName);
                                                    }}
                                                    style={{
                                                        padding: '12px 20px',
                                                        cursor: 'pointer',
                                                        fontSize: '14px',
                                                        color: '#fff',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '12px',
                                                        transition: 'all 0.15s ease',
                                                        background: 'transparent'
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)';
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.currentTarget.style.backgroundColor = 'transparent';
                                                    }}
                                                >
                                                    <Search size={14} color="#94a3b8" />
                                                    <span style={{ fontWeight: 400 }}>{coName}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div style={{ padding: '0 4px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '12px', color: '#888', fontWeight: 500 }}>{totalCompanies.toLocaleString()} companies</span>
                                <button onClick={() => setSortBy(p => p === 'most_jobs' ? 'highest_wage' : 'most_jobs')} style={{ fontSize: '12px', fontWeight: 700, color: '#24385E', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    {sortBy === 'most_jobs' ? 'Most visas ↑' : 'Highest wage ↑'} <ArrowUpDown size={12} />
                                </button>
                            </div>

                            {/* Company list scrollable area */}
                            <div style={{ overflowY: isMobile ? 'visible' : 'auto', maxHeight: isMobile ? 'none' : '800px', marginBottom: '12px', paddingRight: '4px' }} className="custom-scrollbar">
                                {companiesLoading ? (
                                    <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}><Loader2 className="animate-spin text-[#24385E]" /></div>
                                ) : companies.map((co) => (
                                    <CompanyCard
                                        key={co.company}
                                        company={co.company}
                                        jobCount={co.jobCount}
                                        industries={co.industries}
                                        wageLevel={co.wageLevel}
                                        isMobile={isMobile}
                                        isVerified={true}
                                        isLandingPage={true}
                                        isSelected={selectedCompany === co.company}
                                        lca_filings={filingCounts[co.company.toLowerCase()] || filingCounts[normalizeName(co.company)] || 0}
                                        onClick={() => handleCompanySelect(co)}
                                    />
                                ))}
                            </div>

                            {/* CTA to Signup instead of Pagination */}
                            <div style={{ paddingTop: '10px', textAlign: 'center' }}>
                                <Link
                                    to={user ? "/app" : "/signup"}
                                    style={{
                                        display: 'block',
                                        padding: '12px',
                                        background: '#fff',
                                        border: '1.5px solid #24385E',
                                        borderRadius: '12px',
                                        color: '#24385E',
                                        fontSize: '13px',
                                        fontWeight: 700,
                                        textDecoration: 'none',
                                        transition: 'all 0.2s ease'
                                    }}
                                    onMouseEnter={e => { e.currentTarget.style.background = '#24385E'; e.currentTarget.style.color = '#fff'; }}
                                    onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = '#24385E'; }}
                                >
                                    {user ? "Continue to Dashboard →" : "Get access to all companies →"}
                                </Link>
                            </div>
                        </div>

                        {/* RIGHT: Job detail (Matches App Right Panel) */}
                        <div style={{
                            flex: 1,
                            background: '#fff',
                            padding: isMobile ? '16px 12px' : '20px 32px', // Reduced from 40px
                            textAlign: 'left',
                            display: isMobile && !selectedCompany ? 'none' : 'flex',
                            flexDirection: 'column'
                        }}>
                            {selectedCompany ? (
                                <>
                                    {isMobile && (
                                        <button onClick={() => setSelectedCompany(null)} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#FDB913', border: 'none', color: '#24385E', fontWeight: 900, padding: '8px 16px', borderRadius: '12px', cursor: 'pointer', marginBottom: '16px', fontSize: '12px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>
                                            <ChevronLeft size={16} /> Back to companies
                                        </button>
                                    )}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '8px' : '12px', marginBottom: '12px' }}>
                                        <LogoBox name={selectedCompany} size={isMobile ? 48 : 64} fontSize={isMobile ? 16 : 20} />
                                        <div>
                                            <h3 style={{ fontSize: isMobile ? '18px' : '24px', fontWeight: 800, color: '#111', margin: '0 0 5px' }}>{selectedCompany}</h3>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <ExternalLink size={13} color="#999" />
                                                <a
                                                    href={`https://${selectedCompany.toLowerCase().replace(/\s+/g, '')}.com`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    style={{
                                                        fontSize: '13px',
                                                        color: '#24385E',
                                                        fontWeight: 700,
                                                        textDecoration: 'none',
                                                        transition: 'all 0.2s'
                                                    }}
                                                    onMouseEnter={e => { e.currentTarget.style.textDecoration = 'underline'; e.currentTarget.style.color = '#FDB913'; }}
                                                    onMouseLeave={e => { e.currentTarget.style.textDecoration = 'none'; e.currentTarget.style.color = '#24385E'; }}
                                                >
                                                    {selectedCompany.toLowerCase().replace(/\s+/g, '')}.com
                                                </a>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Company Info row */}
                                    <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', flexWrap: 'wrap', gap: isMobile ? '12px' : '16px', marginBottom: '12px' }}>
                                        <div>
                                            <p style={{ fontSize: '11px', color: '#aaa', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Visa Sponsorship</p>
                                        </div>
                                    </div>

                                    {/* Work authorization note from app */}
                                    <div style={{ background: '#f9fafb', border: '1px solid #f1f1f1', borderRadius: '12px', padding: '12px', marginBottom: '16px' }}>
                                        <h4 style={{ fontSize: '13px', fontWeight: 800, color: '#24385E', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                                            <Info size={16} className="text-yellow-500" /> Work authorization note
                                        </h4>
                                        <p style={{ fontSize: '12px', color: '#666', lineHeight: 1.6, fontWeight: 500 }}>
                                            This company historically sponsors work visas. Wage level <b>{selectedCompanyData?.wageLevel}</b> indicates high salary percentiles relative to prevailing wages.
                                        </p>
                                    </div>

                                    <h4 style={{ fontSize: '15px', fontWeight: 800, color: '#111', marginBottom: '8px' }}>Open Jobs at {selectedCompany}</h4>

                                    {/* Job list scrollable */}
                                    <div style={{ overflowY: isMobile ? 'visible' : 'auto', marginBottom: '16px' }} className="custom-scrollbar">
                                        {jobsLoading ? (
                                            <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}><Loader2 className="animate-spin text-[#24385E]" size={32} /></div>
                                        ) : companyJobs.length > 0 ? (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                {companyJobs.map((job, jobIdx) => (
                                                    <CompanyJobCard key={`${job.id || 'job'}_${jobIdx}`} job={job} isLandingPage={true} isMobile={isMobile} />
                                                ))}
                                            </div>
                                        ) : (
                                            <div style={{ textAlign: 'center', padding: '40px 0', color: '#999', fontSize: '13px' }}>No job data found for this company view.</div>
                                        )}
                                    </div>

                                    {/* CTA to Signup instead of Job Pagination */}
                                    <div style={{ paddingTop: '10px', textAlign: 'center' }}>
                                        <Link
                                            to={user ? "/app" : "/signup"}
                                            style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '8px',
                                                padding: '12px 28px',
                                                background: '#24385E',
                                                borderRadius: '60px',
                                                color: '#fff',
                                                fontSize: '14px',
                                                fontWeight: 800,
                                                textDecoration: 'none',
                                                boxShadow: '0 4px 12px rgba(36,56,94,0.25)',
                                                transition: 'all 0.2s ease'
                                            }}
                                            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(36,56,94,0.35)'; }}
                                            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(36,56,94,0.25)'; }}
                                        >
                                            {user ? "Go to Your Dashboard" : "Get access to all jobs"} <ChevronRight size={18} />
                                        </Link>
                                    </div>
                                </>
                            ) : (
                                <div style={{ minHeight: '300px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#ccc', textAlign: 'center' }}>
                                    <Building size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
                                    <p style={{ fontWeight: 700, fontSize: '18px' }}>Select a company</p>
                                    <p style={{ fontSize: '14px' }}>to view open role sponsorships and wage levels</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </section >
    );
};

export default MigrateHero;
