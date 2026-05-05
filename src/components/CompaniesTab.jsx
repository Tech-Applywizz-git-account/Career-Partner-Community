import React, { useState, useEffect } from 'react';
import { 
  Search, Building2, ChevronRight, Loader2, Briefcase, ArrowLeft, TrendingUp, ChevronLeft, Sparkles, Zap
} from 'lucide-react';
import { supabase } from '../supabaseClient';
import LogoBox from '../components/LogoBox';
import AllJobsTab from './AllJobsTab';
import { isFamous, getCompanyRank } from '../utils/famousCompanies';
import { COUNTRY_MAP } from '../utils/countryHelper';
// fetchAllCompanies removed — now using server-side search via get_companies_fast

const ITEMS_PER_PAGE = 12;
const LS_CACHE_KEY_PREFIX = 'cp_companies_v8_';
const LS_TTL_MS = 15 * 60 * 1000; // 15 min localStorage TTL

// In-memory cache to avoid refetching on tab switch
let _companiesCache_v3 = {
  data: null,
  key: null,
  timestamp: 0
};
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

// Helper to bust both caches
export const bustCompaniesCache = () => {
  _companiesCache_v3 = { data: null, key: null, timestamp: 0 };
};

// Read companies from localStorage (instant, sync)
const lsGet = (key) => {
  try {
    const raw = localStorage.getItem(LS_CACHE_KEY_PREFIX + key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed?.ts && (Date.now() - parsed.ts) < LS_TTL_MS && parsed.data?.length > 0) return parsed.data;
  } catch (_) {}
  return null;
};

// Write companies to localStorage
const lsSet = (key, data) => {
  try { localStorage.setItem(LS_CACHE_KEY_PREFIX + key, JSON.stringify({ ts: Date.now(), data })); } catch (_) {}
};

const normalizeDisplayName = (name) => {
  if (!name) return '';
  let n = String(name).toLowerCase().trim();

  // Step 1: Explicit Brand Mapping — ONLY for Amazon variants as requested
  if (n.includes('amazon') && !n.includes('aws') && !n.includes('web services')) return 'Amazon';
  
  // Step 2: For everything else, keep the original name
  return name.trim();
};

const CompaniesTab = ({ onSelectCompany, selectedCountry, dateFilter }) => {
  const [searchTerm, setSearchTerm]       = useState('');
  const [localSearchTerm, setLocalSearchTerm] = useState('');
  const [filter, setFilter]               = useState('All');
  const [loading, setLoading]             = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [companies, setCompanies]         = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [page, setPage]                   = useState(0);
  const [fetchError, setFetchError]       = useState(null);

  const countryLabel = (Array.isArray(selectedCountry) && selectedCountry.length > 0)
    ? (selectedCountry.length === 1 ? (COUNTRY_MAP[selectedCountry[0]]?.label || selectedCountry[0]) : `${selectedCountry.length} Countries`)
    : 'All Countries';

  // On first mount: load top 1000 companies from summary table instantly
  useEffect(() => {
    bustCompaniesCache();
    const activeCountries = Array.isArray(selectedCountry) ? selectedCountry : (selectedCountry ? [selectedCountry] : []);
    const countriesStr = activeCountries.length > 0 ? activeCountries.slice().sort().join(',') : 'all';
    const cacheKey = `${countriesStr}-${dateFilter?.quickDate}-${dateFilter?.from}-${dateFilter?.to}`;
    const lsData = lsGet(cacheKey);
    if (lsData) {
      setCompanies(lsData);
      setLoading(false);
    } else {
      fetchCompanies(false);
    }
  }, []);

  // Reset detail + refetch when country or date changes
  useEffect(() => {
    setSelectedCompany(null);
    fetchCompanies(false);
  }, [selectedCountry, dateFilter?.quickDate, dateFilter?.from, dateFilter?.to]);

  // Debounce search input + reset page
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchTerm(localSearchTerm);
      setPage(0);
    }, 300);
    return () => clearTimeout(timer);
  }, [localSearchTerm]);

  // Reset page when filter changes
  useEffect(() => { setPage(0); }, [filter]);

  // backgroundOnly=true → skip setLoading so UI stays responsive during revalidation
  const fetchCompanies = async (backgroundOnly = false) => {
    const activeCountries = Array.isArray(selectedCountry) ? selectedCountry : (selectedCountry ? [selectedCountry] : []);
    const countriesStr = activeCountries.length > 0 ? activeCountries.slice().sort().join(',') : 'all';
    const cacheKey = `${countriesStr}-${dateFilter?.quickDate}-${dateFilter?.from}-${dateFilter?.to}`;

    // In-memory cache hit
    if (
      !backgroundOnly &&
      _companiesCache_v3.data &&
      _companiesCache_v3.data.length > 0 &&
      _companiesCache_v3.key === cacheKey &&
      (Date.now() - _companiesCache_v3.timestamp) < CACHE_TTL
    ) {
      setCompanies(_companiesCache_v3.data);
      setLoading(false);
      return;
    }

    if (!backgroundOnly) {
      setLoading(true);
      setFetchError(null);
    }

    try {
      // Read top 100,000 companies from summary_company_jobs — < 100ms always
      const { data: fastData, error: fastErr } = await supabase.rpc('get_companies_fast', {
        p_countries: activeCountries.length > 0 ? activeCountries : null,
        p_limit:   100000,
        p_offset:  0,
        p_search:  null,
        p_start_date: dateFilter?.from || null,
        p_end_date:   dateFilter?.to || null,
      });

      if (fastErr) throw fastErr;

      const list = processResults(fastData || []);
      _companiesCache_v3 = { data: list, key: cacheKey, timestamp: Date.now() };
      lsSet(cacheKey, list);
      setCompanies(list);
      if (!backgroundOnly) setLoading(false);

    } catch (err) {
      console.error('[CompaniesTab] Error:', err);
      if (!backgroundOnly) {
        setFetchError('Failed to load companies. Please refresh.');
        setLoading(false);
      }
    }
  };

  // Shared row processor — highly optimized to prevent UI freezing
  const processResults = (rows) => {
    const aggMap = new Map();
    
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const canonicalName = normalizeDisplayName(row.company_name);
      
      if (!aggMap.has(canonicalName)) {
        aggMap.set(canonicalName, {
          name: canonicalName,
          originalNames: new Set([row.company_name]),
          count: Number(row.job_count),
          isFamous: isFamous(row.company_name),
          type: isTechRole(row.company_name) ? 'TECH' : 'NON-TECH'
        });
      } else {
        const existing = aggMap.get(canonicalName);
        existing.count += Number(row.job_count);
        existing.originalNames.add(row.company_name);
        if (isFamous(row.company_name)) existing.isFamous = true;
      }
    }

    const aggregated = Array.from(aggMap.values()).map(item => ({
      ...item,
      originalNames: Array.from(item.originalNames),
      rank: item.isFamous ? getCompanyRank(item.name) : 999
    }));

    const famous = aggregated.filter(i => i.isFamous);
    const regular = aggregated.filter(i => !i.isFamous);
    
    // Sort famous by rank, regular by job count
    famous.sort((a, b) => a.rank - b.rank);
    regular.sort((a, b) => b.count - a.count);
    
    return [...famous, ...regular];
  };

  const filteredCompanies = companies.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === 'All' || c.type === filter.toUpperCase();
    return matchesSearch && matchesFilter;
  });

  const totalJobCount = companies.reduce((sum, c) => sum + c.count, 0);

  const topTier = companies.filter(c => c.isFamous && c.rank < 15 && c.count > 0).slice(0, 10);

  const totalPages   = Math.ceil(filteredCompanies.length / ITEMS_PER_PAGE);
  const pagedCompanies = filteredCompanies.slice(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE);

  // ── Detail view ──────────────────────────────────────────────────────────────
  if (selectedCompany) {
    return (
      <div className="animate-in fade-in slide-in-from-left-4 duration-500">
        <button
          onClick={() => setSelectedCompany(null)}
          className="flex items-center gap-2 mb-6 px-4 py-2 bg-white border border-gray-200 rounded-xl text-[#2C76FF] font-bold hover:bg-gray-50 transition-all shadow-sm group"
        >
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          Back to all companies
        </button>

        <div className="bg-white rounded-2xl p-2 border border-gray-100 shadow-sm mb-8">
          <div className="flex items-center gap-4 p-4">
            <LogoBox name={selectedCompany.name} size={64} className="rounded-2xl border border-gray-100 shadow-sm" />
            <div>
              <h2 className="text-2xl font-[900] text-[#1E1E1E]">{selectedCompany.name}</h2>
              <p className="text-gray-500 font-bold">Showing all active job openings in {countryLabel}</p>
            </div>
          </div>
        </div>

        <AllJobsTab fixedCompany={selectedCompany.originalNames} activeFilter="all" countryFilter={selectedCountry} dateFilter={dateFilter} isCompact={true} />
      </div>
    );
  }

  // ── Loading — skeleton cards instead of spinner for faster perceived load ────
  if (loading) {
    return (
      <div className="animate-in fade-in duration-300">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div>
            <div className="h-8 w-64 bg-gray-100 rounded-xl animate-pulse mb-2" />
            <div className="h-4 w-40 bg-gray-100 rounded-lg animate-pulse" />
          </div>
          <div className="h-12 flex-1 max-w-xl bg-gray-100 rounded-xl animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-5 border border-gray-100 flex items-center gap-4 h-[76px]">
              <div className="w-14 h-14 rounded-lg bg-gray-100 animate-pulse shrink-0" />
              <div className="flex-1">
                <div className="h-4 bg-gray-100 rounded animate-pulse mb-2 w-3/4" />
                <div className="h-3 bg-gray-50 rounded animate-pulse w-1/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Error state ───────────────────────────────────────────────────────────────
  if (fetchError) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <Building2 size={40} className="mb-3 text-red-300" />
        <p className="font-black text-[#1E1E1E] mb-2">Unable to load companies</p>
        <p className="text-sm text-gray-400 font-bold mb-6">{fetchError}</p>
        <button
          onClick={() => { bustCompaniesCache(); fetchCompanies(); }}
          className="px-6 py-3 bg-[#2C76FF] text-white font-bold rounded-xl hover:bg-[#1a5fd4] transition-all shadow-md"
        >
          Try Again
        </button>
      </div>
    );
  }

  // ── List view ─────────────────────────────────────────────────────────────────
  return (

    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <h2 className="text-3xl font-[900] text-[#1E1E1E] mb-1">Companies that Sponsor</h2>
          <div className="flex items-center gap-3">
            <p className="text-sm font-bold text-gray-400">
              {filteredCompanies.length.toLocaleString()} brands in {countryLabel}
            </p>
            <div className="w-1 h-1 rounded-full bg-gray-300" />
            <p className="text-sm font-bold text-[#2C76FF]">
              {totalJobCount.toLocaleString()} total job links
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 flex-1 max-w-xl">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search companies..."
              value={localSearchTerm}
              onChange={(e) => setLocalSearchTerm(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-xl pl-12 pr-4 py-3 text-sm font-bold text-[#1E1E1E] outline-none focus:ring-2 focus:ring-[#2C76FF]/20 focus:border-[#2C76FF] transition-all"
            />
          </div>

          <div className="flex items-center bg-gray-50 p-1 rounded-xl border border-gray-200 shrink-0">
            {['All', 'Tech', 'Non-Tech'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg text-xs font-black transition-all ${
                  filter === f ? '!bg-[#2C76FF] !text-white shadow-lg' : 'text-gray-500 hover:bg-gray-100 hover:text-[#1E1E1E]'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Top Tier Section */}
      {!searchTerm && filter === 'All' && topTier.length > 0 && (
        <div className="mb-12">
          <div className="flex items-center gap-2 mb-6">
            <Sparkles size={20} className="text-[#2C76FF]" />
            <h3 className="text-xl font-black text-[#1E1E1E]">Top Tier Sponsors</h3>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-2 px-2">
            {topTier.map((company, idx) => (
              <div
                key={`top-${idx}`}
                onClick={() => setSelectedCompany({ name: company.name, originalNames: company.originalNames })}
                className="flex-shrink-0 w-44 bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-xl hover:border-[#2C76FF]/30 transition-all cursor-pointer group text-center"
              >
                <div className="flex justify-center mb-4 relative">
                  <div className="absolute -top-1 -right-1 bg-[#2C76FF] text-white p-1 rounded-full shadow-lg scale-0 group-hover:scale-100 transition-transform z-10">
                    <Zap size={10} fill="currentColor" />
                  </div>
                  <LogoBox name={company.name} size={64} className="rounded-2xl border border-gray-50 shadow-sm" />
                </div>
                <h4 className="font-black text-[#1E1E1E] text-sm mb-2 truncate group-hover:text-[#2C76FF] transition-colors">
                  {company.name}
                </h4>
                <div className="bg-[#f0f7ff] text-[#2C76FF] py-1 px-3 rounded-full text-[10px] font-black inline-block">
                  {company.count.toLocaleString()} OPENINGS
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Grid Header */}
      <div className="flex items-center gap-2 mb-6">
        <TrendingUp size={20} className="text-gray-400" />
        <h3 className="text-xl font-black text-[#1E1E1E]">
          {searchTerm ? 'Search Results' : 'All Companies'}
        </h3>
      </div>

      {/* Grid */}
      {pagedCompanies.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <Building2 size={40} className="mb-3 opacity-40" />
          <p className="font-bold">No companies found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {pagedCompanies.map((company, idx) => (
            <div
              key={idx}
              onClick={() => onSelectCompany(company.name, company.originalNames)}
              className="group relative bg-white rounded-xl p-5 border border-gray-200 shadow-sm hover:shadow-md hover:border-[#2C76FF]/20 transition-all duration-200 cursor-pointer flex items-center gap-5"
            >
              <LogoBox name={company.name} size={56} className="rounded-lg overflow-hidden border border-gray-100 shrink-0" />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-gray-900 group-hover:text-[#2C76FF] transition-colors truncate">
                    {company.name}
                  </h3>
                  {company.isFamous && <TrendingUp size={14} className="text-[#2C76FF] shrink-0" />}
                </div>
                <div className="flex items-center gap-1.5 mt-1">
                  <Briefcase size={14} className="text-gray-400" />
                  <span className="text-sm font-bold text-gray-500">
                    {company.count.toLocaleString()} {company.count === 1 ? 'job' : 'jobs'}
                  </span>
                </div>
              </div>

              <ChevronRight size={20} className="text-gray-300 group-hover:text-[#2C76FF] transition-colors shrink-0" />
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
          <button
            onClick={() => { setPage(p => Math.max(0, p - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            disabled={page === 0}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-[#2C76FF] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-50 transition-all"
          >
            <ChevronLeft size={16} /> Previous
          </button>

          <span className="text-sm font-bold text-gray-500">
            Page {page + 1} of {totalPages} &nbsp;·&nbsp; {filteredCompanies.length.toLocaleString()} companies
          </span>

          <button
            onClick={() => { setPage(p => Math.min(totalPages - 1, p + 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            disabled={page >= totalPages - 1}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-[#2C76FF] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-50 transition-all"
          >
            Next <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
};

export default CompaniesTab;
