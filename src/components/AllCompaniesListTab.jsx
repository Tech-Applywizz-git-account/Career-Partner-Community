import React, { useState, useEffect } from 'react';
import { 
  Search, Building2, ChevronRight, ChevronLeft, Loader2, Briefcase, ArrowLeft, TrendingUp
} from 'lucide-react';
import { supabase } from '../supabaseClient';
import LogoBox from './LogoBox';
import AllJobsTab from './AllJobsTab';
import { isFamous, getCompanyRank } from '../utils/famousCompanies';
import { COUNTRY_MAP } from '../utils/countryHelper';
import { fetchAllCompanies } from '../utils/rpcFetchers';

const ITEMS_PER_PAGE = 12;

const AllCompaniesListTab = ({ onSelectCompany, selectedCountry, dateFilter, viewMode = 'grid' }) => {
  const [searchTerm, setSearchTerm]           = useState('');
  const [localSearchTerm, setLocalSearchTerm] = useState('');
  const [loading, setLoading]                 = useState(true);
  const [companies, setCompanies]             = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [page, setPage]                       = useState(0);

  const [searchLoading, setSearchLoading] = useState(false);

  // Reset detail + refetch when country or date changes
  useEffect(() => {
    setSelectedCompany(null);
    fetchCompanies();
  }, [selectedCountry, dateFilter?.quickDate, dateFilter?.from, dateFilter?.to]);

  // Debounce search + reset page
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchTerm(localSearchTerm);
      setPage(0);
    }, 300);
    return () => clearTimeout(timer);
  }, [localSearchTerm]);

  // Helper to clean up DB names for display
  const normalizeDisplayName = (name) => {
    if (!name) return '';
    let n = String(name).toLowerCase().trim();

    // Step 1: Explicit Brand Mapping — ONLY for Amazon variants as requested
    if (n.includes('amazon') && !n.includes('aws') && !n.includes('web services')) return 'Amazon';
    
    // Step 2: For everything else, keep the original name
    return name.trim();
  };

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

  const fetchCompanies = async () => {
    setLoading(true);
    try {
      const rows = await fetchAllCompanies(
        selectedCountry || null,
        dateFilter?.from || null,
        dateFilter?.to || null
      );

      setCompanies(processResults(rows));
      setPage(0);
    } catch (err) {
      console.error('[AllCompaniesListTab] Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const countryLabel = (Array.isArray(selectedCountry) && selectedCountry.length > 0)
    ? (selectedCountry.length === 1 ? (COUNTRY_MAP[selectedCountry[0]]?.label || selectedCountry[0]) : `${selectedCountry.length} Countries`)
    : 'All Countries';

  const filteredCompanies = companies.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages     = Math.ceil(filteredCompanies.length / ITEMS_PER_PAGE);
  const pagedCompanies = filteredCompanies.slice(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE);
 
  // ── Detail view ───────────────────────────────────────────────────────────────
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
            <LogoBox name={selectedCompany.name} size={64} className="rounded-xl border border-gray-100 shadow-sm" />
            <div>
              <h2 className="text-2xl font-[900] text-[#1E1E1E]">{selectedCompany.name}</h2>
              <p className="text-gray-500 font-bold">Showing all active job openings</p>
            </div>
          </div>
        </div>
 
        <AllJobsTab fixedCompany={selectedCompany.originalNames} activeFilter="all" countryFilter={selectedCountry} dateFilter={dateFilter} isCompact={true} />
      </div>
    );
  }
 
  // ── Loading ───────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-10 h-10 text-[#2C76FF] animate-spin mb-4" />
        <p className="text-gray-500 font-bold">Loading Companies...</p>
      </div>
    );
  }
 
  // ── List view ─────────────────────────────────────────────────────────────────
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-3xl font-[900] text-[#2C76FF] mb-1">All Companies</h2>
        <p className="text-sm font-bold text-gray-400">
          {filteredCompanies.length.toLocaleString()} {filteredCompanies.length === 1 ? 'company' : 'companies'} in {countryLabel}
          {filteredCompanies.length !== companies.length && ` (filtered from ${companies.length.toLocaleString()} total)`}
        </p>
      </div>
 
      {/* Search */}
      <div className="relative mb-8">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Search companies..."
          value={localSearchTerm}
          onChange={(e) => setLocalSearchTerm(e.target.value)}
          className="w-full bg-white border border-gray-200 rounded-2xl pl-12 pr-4 py-4 text-base font-bold text-[#1E1E1E] outline-none focus:ring-2 focus:ring-[#2C76FF]/50 focus:border-[#2C76FF] transition-all shadow-sm"
        />
      </div>
 
      {/* Content */}
      {pagedCompanies.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <Building2 size={48} className="mb-3 opacity-40" />
          <p className="font-bold">No companies found matching "{searchTerm}"</p>
        </div>
      ) : viewMode === 'list' ? (
        <div className="flex flex-col gap-3">
          {pagedCompanies.map((company, idx) => (
            <div
              key={idx}
              onClick={() => {
                setSelectedCompany(company);
                onSelectCompany(company.name, company.originalNames);
              }}
              className="group bg-white rounded-xl p-4 border border-gray-100 shadow-sm hover:shadow-md hover:border-[#2C76FF]/20 transition-all cursor-pointer flex items-center gap-4"
            >
              <LogoBox name={company.name} size={40} className="rounded-lg overflow-hidden border border-gray-50 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-[15px] font-black text-gray-900 group-hover:text-[#2C76FF] transition-colors truncate">
                    {company.name}
                  </h3>
                  {company.isFamous && <TrendingUp size={12} className="text-[#2C76FF] shrink-0" />}
                </div>
                <div className="flex items-center gap-3 text-[11px] font-bold text-gray-400">
                   <div className="flex items-center gap-1">
                      <Briefcase size={12} />
                      {company.count.toLocaleString()} {company.count === 1 ? 'job' : 'jobs'}
                   </div>
                </div>
              </div>
              <ChevronRight size={16} className="text-gray-300 group-hover:text-[#2C76FF] transition-colors shrink-0" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {pagedCompanies.map((company, idx) => (
            <div
              key={idx}
              onClick={() => {
                setSelectedCompany(company);
                onSelectCompany(company.name, company.originalNames);
              }}
              className="group relative bg-white rounded-xl p-5 border border-gray-200 shadow-sm hover:shadow-md hover:border-[#2C76FF]/30 transition-all duration-200 cursor-pointer flex items-center gap-5"
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

export default AllCompaniesListTab;
