import React, { useState, useEffect } from 'react';
import { 
  Search, Building2, ChevronRight, Loader2, Briefcase, ArrowLeft, TrendingUp, ChevronLeft, Sparkles, Zap
} from 'lucide-react';
import { supabase } from '../supabaseClient';
import LogoBox from '../components/LogoBox';
import AllJobsTab from './AllJobsTab';
import { isFamous, getCompanyRank } from '../utils/famousCompanies';
import { COUNTRY_MAP } from '../utils/countryHelper';
import { fetchAllCompanies } from '../utils/rpcFetchers';

const ITEMS_PER_PAGE = 12;
const LS_CACHE_KEY_PREFIX = 'cp_companies_v1_';
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

// Helper to clean up DB names for display
const normalizeDisplayName = (name) => {
  if (!name) return '';
  let n = String(name).toLowerCase().trim();

  // Step 1: Aggressive Brand Mapping
  if (n.includes('amazon') || n.includes('aws')) return 'Amazon';
  if (n.includes('google') || n.includes('alphabet')) return 'Google';
  if (n.includes('meta') || n.includes('facebook')) return 'Meta';
  if (n.includes('microsoft')) return 'Microsoft';
  if (n.includes('apple')) return 'Apple';
  if (n.includes('netflix')) return 'Netflix';
  if (n.includes('tesla')) return 'Tesla';
  if (n.includes('nvidia')) return 'NVIDIA';
  if (n.includes('salesforce')) return 'Salesforce';
  if (n.includes('adobe')) return 'Adobe';
  if (n.includes('oracle')) return 'Oracle';
  if (n.includes('intel')) return 'Intel';
  if (n.includes('cisco')) return 'Cisco';
  if (n.includes('ibm')) return 'IBM';
  if (n.includes('pricewaterhousecoopers') || n === 'pwc') return 'PwC';
  if (n.includes('deloitte')) return 'Deloitte';
  if (n.includes('accenture')) return 'Accenture';
  if (n.includes('ernst young') || n === 'ey') return 'EY';
  if (n.includes('kpmg')) return 'KPMG';
  if (n.includes('infosys')) return 'Infosys';
  if (n.includes('tata consultancy') || n === 'tcs') return 'TCS';
  if (n.includes('wipro')) return 'Wipro';
  if (n.includes('jpmorgan') || n.includes('jp morgan')) return 'JPMorgan Chase';
  if (n.includes('goldman sachs')) return 'Goldman Sachs';
  if (n.includes('morgan stanley')) return 'Morgan Stanley';
  if (n.includes('capgemini')) return 'Capgemini';
  
  // Step 2: Generic Cleaning
  let clean = n
    .replace(/\([^)]*\)/g, ' ')
    .replace(/[.,\-\/#!$%\^&\*;:{}=\-_`~()]/g, ' ')
    .replace(/\b(inc|llc|corp|ltd|co|services|com|systems|technologies|group|holdings|usa|us|intl|international|asia|europe|solutions|related)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (clean.length < 2) return name;
  return clean.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
};

const CompaniesTab = ({ onSelectCompany, selectedCountry, dateFilter }) => {
  const [searchTerm, setSearchTerm]       = useState('');
  const [localSearchTerm, setLocalSearchTerm] = useState('');
  const [filter, setFilter]               = useState('All');
  const [loading, setLoading]             = useState(true);
  const [companies, setCompanies]         = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [page, setPage]                   = useState(0);
  const [fetchError, setFetchError]       = useState(null);

  // On first mount: try to warm from localStorage instantly (SWR pattern)
  useEffect(() => {
    bustCompaniesCache();
    const cacheKey = `${selectedCountry}-${dateFilter?.quickDate}-${dateFilter?.from}-${dateFilter?.to}`;
    const lsData = lsGet(cacheKey);
    if (lsData) {
      setCompanies(lsData);
      setLoading(false);
      // Still revalidate in background after a short delay
      setTimeout(() => fetchCompanies(true), 500);
    } else {
      fetchCompanies(false);
    }
  }, []);

  // Reset detail + refetch when country or date changes (skip mount - handled above)
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
    const cacheKey = `${selectedCountry}-${dateFilter?.quickDate}-${dateFilter?.from}-${dateFilter?.to}`;

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

    let rows = [];
    try {
      rows = await fetchAllCompanies(
        selectedCountry || null,
        dateFilter?.from || null,
        dateFilter?.to || null
      );
    } catch (rpcErr) {
      console.warn('[CompaniesTab] RPC failed, using direct fallback:', rpcErr);
      try {
        const { data: fallbackData, error: fallbackErr } = await supabase
          .from('jobs_all_roles')
          .select('company_name')
          .limit(5000);
        if (!fallbackErr && fallbackData) {
          const countMap = {};
          fallbackData.forEach(r => {
            const name = r.company_name || '';
            countMap[name] = (countMap[name] || 0) + 1;
          });
          rows = Object.entries(countMap).map(([company_name, job_count]) => ({ company_name, job_count }));
        } else {
          throw fallbackErr || new Error('Fallback failed');
        }
      } catch (fallbackFinalErr) {
        if (!backgroundOnly) {
          setFetchError('Failed to load companies. Please refresh.');
          setLoading(false);
        }
        return;
      }
    }

    try {
      const grouped = {};
      rows.forEach(row => {
        const dName = normalizeDisplayName(row.company_name);
        const count = Number(row.job_count);
        if (!grouped[dName]) {
          grouped[dName] = { name: dName, rawNames: [row.company_name], count, isFamous: isFamous(dName), rank: getCompanyRank(dName) };
        } else {
          grouped[dName].count += count;
          if (!grouped[dName].rawNames.includes(row.company_name)) grouped[dName].rawNames.push(row.company_name);
        }
      });

      const companyList = Object.values(grouped).map(c => ({
        ...c,
        type: isTechRole(c.name) ? 'TECH' : 'NON-TECH',
      })).sort((a, b) => {
        if (a.isFamous && !b.isFamous) return -1;
        if (!a.isFamous && b.isFamous) return 1;
        if (a.isFamous && b.isFamous && a.rank !== b.rank) return a.rank - b.rank;
        return b.count - a.count;
      });

      if (companyList.length > 0) {
        _companiesCache_v3 = { data: companyList, key: cacheKey, timestamp: Date.now() };
        lsSet(cacheKey, companyList); // persist for next visit
        setCompanies(companyList);
        if (!backgroundOnly) setPage(0);
      }
    } catch (err) {
      if (!backgroundOnly) {
        setFetchError('Failed to process company data. Please refresh.');
      }
    } finally {
      if (!backgroundOnly) setLoading(false);
    }
  };

  const totalJobCount = companies.reduce((sum, c) => sum + c.count, 0);

  const isTechRole = (name) => {
    const techBrands = ['google', 'amazon', 'microsoft', 'meta', 'apple', 'netflix', 'tesla', 'nvidia', 'adobe', 'salesforce', 'oracle', 'intel', 'ibm', 'cisco', 'uber', 'lyft', 'airbnb', 'stripe', 'square', 'zoom', 'slack', 'twitter', 'linkedin'];
    const kw = ['software','engineer','developer','tech','data','ml','ai','cloud','security','devops','web','frontend','backend','fullstack','infrastructure','network','computing','digital','robotics','automation'];
    const lc = String(name).toLowerCase();
    return techBrands.some(b => lc.includes(b)) || kw.some(k => lc.includes(k));
  };

  const countryLabel = selectedCountry
    ? (COUNTRY_MAP[selectedCountry]?.label || selectedCountry)
    : 'All Countries';

  const filteredCompanies = companies.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === 'All' || c.type === filter.toUpperCase();
    return matchesSearch && matchesFilter;
  });

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

        <AllJobsTab fixedCompany={selectedCompany.rawNames} activeFilter="all" countryFilter={selectedCountry} dateFilter={dateFilter} />
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
                  filter === f ? 'bg-[#2C76FF] text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'
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
                onClick={() => setSelectedCompany({ name: company.name, rawNames: company.rawNames })}
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
              onClick={() => setSelectedCompany({ name: company.name, rawNames: company.rawNames })}
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
