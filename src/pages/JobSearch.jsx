import React, { useState, useEffect, useCallback } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Search, MapPin, Briefcase, GraduationCap, FileText, X, Loader2, Building, Calendar, DollarSign } from 'lucide-react';
import useAuth from '../hooks/useAuth';
import { supabase } from '../supabaseClient';
import { fetchJobRoles, filterRoles } from '../utils/rolesSuggestions';
import { isFamous } from '../utils/famousCompanies';

const JOBS_PER_PAGE = 10;

const filterOptions = {
    visa: ['H-1B', 'Green Card', 'OPT', 'CPT', 'TN', 'E-3', 'J-1'],
    location: ['New York', 'California', 'Texas', 'Illinois', 'Washington', 'Massachusetts', 'Remote'],
    education: ["Bachelor's", "Master's", "Doctorate"],
    experience: ['0-2 years', '3-5 years', '6+ years']
};

const JobSearch = () => {
    const { user } = useAuth();
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [activeTab, setActiveTab] = useState('visa');
    const [activeFilters, setActiveFilters] = useState({
        visa: [],
        location: [],
        education: [],
        experience: []
    });

    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [totalJobs, setTotalJobs] = useState(0);
    const [selectedJob, setSelectedJob] = useState(null);
    const [filteredSuggestions, setFilteredSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [allRoles, setAllRoles] = useState([]);

    // Debounce search
    useEffect(() => {
        const t = setTimeout(() => setDebouncedSearch(searchQuery), 400);
        return () => clearTimeout(t);
    }, [searchQuery]);

    // Fetch job roles for suggestions
    useEffect(() => { fetchJobRoles().then(setAllRoles); }, []);

    const fetchJobs = useCallback(async () => {
        setLoading(true);
        try {
            let q = supabase
                .from('job_jobrole_sponsored_sync')
                .select('*', { count: 'exact' })
                .order('wage_num', { ascending: false, nullsFirst: false })
                .order('date_posted', { ascending: false });

            // Strict Search: (Title has all words) OR (Role has all words)
            if (debouncedSearch.trim()) {
                const words = debouncedSearch.trim().split(/\s+/).filter(w => w.length >= 1);
                if (words.length > 0) {
                    const titleCond = `and(${words.map(w => `title.ilike.%${w}%`).join(',')})`;
                    q = q.or(`${titleCond}`);
                }
            }

            // Quick Visa Filter logic (simplified for global search)
            if (activeFilters.visa.length > 0) {
                // Assuming the sponsored_job column or specific visa columns exist. 
                // For now we'll just search for the visa name in the description or sponsored_job field
                const visaFilter = `or(${activeFilters.visa.map(v => `sponsored_job.ilike.%${v}%`).join(',')})`;
                q = q.or(visaFilter);
            }

            if (activeFilters.location.length > 0) {
                const locFilter = `or(${activeFilters.location.map(l => `location.ilike.%${l}%`).join(',')})`;
                q = q.or(locFilter);
            }

            const { data, error, count } = await q.limit(JOBS_PER_PAGE);
            if (error) throw error;

            let jobData = data || [];
            setTotalJobs(count || 0);

            // ── PASS 2: STRICT EXACT NORMALIZED MATCHING (v10) ──
            if (debouncedSearch.trim()) {
                const n = (s) => String(s || '').toLowerCase()
                    .replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "")
                    .trim()
                    .replace(/\s+/g, ' ');
                const nS = n(debouncedSearch);
                jobData = jobData.filter(j => {
                    return n(j.title) === nS;
                });
            }

            // Priority Sort: (1) Visible Salary First, (2) Apply Link, (3) Freshness
            jobData.sort((a, b) => {
                const aHasSal = !!(a.salary && a.salary.trim().length > 0);
                const bHasSal = !!(b.salary && b.salary.trim().length > 0);
                const aHasUrl = !!(a.url || a.apply_url);
                const bHasUrl = !!(b.url || b.apply_url);

                const aScore = (aHasSal ? 100 : 0) + (aHasUrl ? 1 : 0);
                const bScore = (bHasSal ? 100 : 0) + (bHasUrl ? 1 : 0);

                if (aScore !== bScore) return bScore - aScore;

                // Tie-breaker: Newest first
                const dateA = new Date(a.date_posted || 0).getTime();
                const dateB = new Date(b.date_posted || 0).getTime();
                return dateB - dateA;
            });

            setJobs(jobData);
            setTotalJobs(jobData.length); // Use filtered length
            if (jobData.length > 0 && !selectedJob) setSelectedJob(jobData[0]);
        } catch (err) {
            console.error('JobSearch Fetch Error:', err);
        } finally {
            setLoading(false);
        }
    }, [debouncedSearch, activeFilters]);

    useEffect(() => {
        fetchJobs();
    }, [fetchJobs]);

    const handleSearchChange = (e) => {
        const val = e.target.value;
        setSearchQuery(val);
        if (val.trim()) {
            const filtered = filterRoles(allRoles, val, 8);
            setFilteredSuggestions(filtered);
            setShowSuggestions(filtered.length > 0);
        } else {
            setFilteredSuggestions([]);
            setShowSuggestions(false);
        }
    };

    const handleSuggestionClick = (role) => {
        setSearchQuery(role);
        setDebouncedSearch(role);
        setShowSuggestions(false);
    };

    const toggleFilter = (category, value) => {
        setActiveFilters(prev => ({
            ...prev,
            [category]: prev[category].includes(value)
                ? prev[category].filter(v => v !== value)
                : [...prev[category], value]
        }));
    };

    const allActiveFilters = Object.entries(activeFilters).flatMap(([category, values]) =>
        values.map(value => ({ category, value }))
    );

    const getLogo = (co) => (co ? co.charAt(0).toUpperCase() : '?');

    return (
        <div className="min-h-screen bg-[#f8fafc]">
            <Navbar />

            {/* Premium Header */}
            <div className="bg-[#24385E] pt-24 pb-32 px-6 text-center">
                <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-6">
                    Find Your Next <span className="text-[#FDB913]">Sponsored Role</span>
                </h1>
                <p className="text-blue-100 text-lg mb-10 max-w-2xl mx-auto opacity-90">
                    Search through thousands of verified H-1B and Green Card roles from top companies.
                </p>

                {/* Search Bar Container */}
                <div className="max-w-3xl mx-auto relative group">
                    <div className={`relative flex items-center bg-white shadow-2xl transition-all duration-300 ${showSuggestions ? 'rounded-t-3xl border-b border-gray-100' : 'rounded-2xl'}`}>
                        <div className="pl-6 text-gray-400">
                            <Search size={22} />
                        </div>
                        <input
                            type="text"
                            className="w-full py-5 px-5 bg-transparent outline-none text-gray-800 text-lg font-medium"
                            placeholder="Search by job title or role..."
                            value={searchQuery}
                            onChange={handleSearchChange}
                            onFocus={() => searchQuery && setShowSuggestions(true)}
                            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                        />
                        <button className="mr-3 bg-[#24385E] text-white px-8 py-3 rounded-xl font-bold hover:bg-[#1a2a47] transition-colors shadow-lg shadow-blue-900/20">
                            Search
                        </button>
                    </div>

                    {/* Suggestions */}
                    {showSuggestions && filteredSuggestions.length > 0 && (
                        <div className="absolute top-full left-0 right-0 bg-white rounded-b-3xl shadow-2xl z-50 overflow-hidden border-t border-gray-50 animate-in fade-in slide-in-from-top-2 duration-200">
                            {filteredSuggestions.map((role) => (
                                <div
                                    key={role}
                                    onMouseDown={(e) => { e.preventDefault(); handleSuggestionClick(role); }}
                                    className="flex items-center gap-4 px-8 py-4 hover:bg-gray-50 cursor-pointer transition-colors border-b border-gray-50 last:border-0"
                                >
                                    <Search size={16} className="text-gray-300" />
                                    <span className="text-gray-700 font-medium">{role}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Main Content Area */}
            <div className="max-w-7xl mx-auto px-6 -mt-16">
                <div className="flex flex-col lg:flex-row gap-8">

                    {/* Filters Sidebar (Mobile: Modal or Horizontal Scroll) */}
                    <aside className="lg:w-64 flex-shrink-0">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-24">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="font-bold text-gray-900">Filters</h3>
                                {allActiveFilters.length > 0 && (
                                    <button
                                        onClick={() => setActiveFilters({ visa: [], location: [], education: [], experience: [] })}
                                        className="text-xs text-blue-600 font-semibold hover:underline"
                                    >
                                        Clear all
                                    </button>
                                )}
                            </div>

                            {/* Collapsible Filter Groups */}
                            {Object.entries(filterOptions).map(([cat, options]) => (
                                <div key={cat} className="mb-8 last:mb-0">
                                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">{cat}</h4>
                                    <div className="space-y-3">
                                        {options.map(opt => (
                                            <label key={opt} className="flex items-center group cursor-pointer">
                                                <div
                                                    onClick={() => toggleFilter(cat, opt)}
                                                    className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${activeFilters[cat].includes(opt)
                                                        ? 'bg-[#24385E] border-[#24385E]'
                                                        : 'bg-white border-gray-300 group-hover:border-blue-400'
                                                        }`}
                                                >
                                                    {activeFilters[cat].includes(opt) && <X size={12} className="text-white" />}
                                                </div>
                                                <span className={`ml-3 text-sm font-medium transition-colors ${activeFilters[cat].includes(opt) ? 'text-gray-900' : 'text-gray-500 group-hover:text-gray-700'
                                                    }`}>
                                                    {opt}
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </aside>

                    {/* Results Container */}
                    <main className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-6">
                            <p className="text-gray-500 text-sm font-medium">
                                Showing <span className="text-gray-900 font-bold">{totalJobs}</span> matching roles
                            </p>
                            <div className="flex items-center gap-2 text-sm">
                                <span className="text-gray-400">Sort:</span>
                                <select className="bg-transparent font-bold text-gray-900 outline-none cursor-pointer">
                                    <option>Most Recent</option>
                                    <option>Salary: High to Low</option>
                                </select>
                            </div>
                        </div>

                        {loading ? (
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-20 flex flex-col items-center justify-center">
                                <Loader2 className="animate-spin text-blue-600 mb-4" size={40} />
                                <p className="text-gray-400 font-medium italic">Finding the best matches...</p>
                            </div>
                        ) : jobs.length === 0 ? (
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-20 text-center">
                                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <Search size={32} className="text-gray-300" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">No jobs match your search</h3>
                                <p className="text-gray-500 mb-8 max-w-sm mx-auto">Try adjusting your filters or searching for more general role names.</p>
                                <button
                                    onClick={() => { setSearchQuery(''); setActiveFilters({ visa: [], location: [], education: [], experience: [] }); }}
                                    className="px-8 py-3 bg-[#24385E] text-white rounded-xl font-bold shadow-lg"
                                >
                                    Reset all searches
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {jobs.map(job => (
                                    <div
                                        key={job.id}
                                        onClick={() => setSelectedJob(job)}
                                        className={`group bg-white rounded-2xl p-6 border transition-all duration-300 cursor-pointer shadow-sm hover:shadow-md hover:border-blue-100 ${selectedJob?.id === job.id ? 'border-blue-400 ring-1 ring-blue-400/20' : 'border-gray-100'
                                            }`}
                                    >
                                        <div className="flex items-start gap-5">
                                            <div className="w-14 h-14 bg-gray-50 border border-gray-100 rounded-xl flex items-center justify-center text-xl font-black text-[#24385E] flex-shrink-0 group-hover:scale-110 transition-transform">
                                                {getLogo(job.company)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-4 mb-2">
                                                    <div className="w-full">
                                                        {/* Row 1: Salary & Location First */}
                                                        <div className="flex items-center gap-3 mb-2">
                                                            <span className="text-green-600 font-bold text-sm bg-green-50 px-2 py-0.5 rounded border border-green-100">
                                                                {job.salary || '$120k – $180k'}
                                                            </span>
                                                            <span className="text-gray-400 text-sm flex items-center gap-1.5 font-medium">
                                                                <MapPin size={14} /> {job.location || 'USA'}
                                                            </span>
                                                        </div>

                                                        {/* Row 2: Job Title as Main Link */}
                                                        <h3 className="text-lg font-bold transition-colors truncate mb-1">
                                                            <a
                                                                href={job.url || job.apply_url || '#'}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-gray-900 hover:text-[#24385E]"
                                                                style={{ textDecoration: 'none' }}
                                                                onClick={e => { if (!job.url && !job.apply_url) e.preventDefault(); e.stopPropagation(); }}
                                                            >
                                                                {job.title}
                                                            </a>
                                                        </h3>

                                                        {/* Row 3: Company Name as Subtext */}
                                                        <div className="text-[#24385E] font-bold text-sm flex items-center gap-1.5 opacity-75">
                                                            <Briefcase size={14} /> {job.company}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex flex-wrap gap-2 mt-4">
                                                    <span className="px-3 py-1 bg-blue-50 text-blue-700 text-[11px] font-bold rounded-lg border border-blue-100">
                                                        {job.job_role_name || 'Professional'}
                                                    </span>
                                                    {job.sponsored_job && (
                                                        <span className="px-3 py-1 bg-green-50 text-green-700 text-[11px] font-bold rounded-lg border border-green-100">
                                                            Sponsorship Verified
                                                        </span>
                                                    )}
                                                    <span className="px-3 py-1 bg-yellow-50 text-yellow-700 text-[11px] font-bold rounded-lg border border-yellow-100">
                                                        {job.wage_level || 'Lv 2'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </main>
                </div>
            </div>

            <Footer />
        </div>
    );
};

export default JobSearch;
