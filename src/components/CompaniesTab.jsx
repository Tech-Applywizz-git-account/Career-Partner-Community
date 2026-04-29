import React, { useState, useEffect } from 'react';
import { 
  Search, Building2, ChevronRight, Loader2, Briefcase, ArrowLeft, TrendingUp, ChevronLeft
} from 'lucide-react';
import { supabase } from '../supabaseClient';
import LogoBox from '../components/LogoBox';
import AllJobsTab from './AllJobsTab';
import { isFamous, getCompanyRank } from '../utils/famousCompanies';
import { COUNTRY_MAP } from '../utils/countryHelper';
import { fetchAllCompanies } from '../utils/rpcFetchers';

const ITEMS_PER_PAGE = 12;

// Helper to clean up DB names for display
const normalizeDisplayName = (name) => {
  if (!name) return '';
  const lc = name.toLowerCase().trim();
  if (lc === 'amazon.com') return 'Amazon';
  if (lc === 'amazon web services (aws)' || lc === 'amazon web services') return 'Amazon Web Services';
  if (lc === 'meta platforms inc' || lc === 'meta platforms' || lc === 'facebook') return 'Meta';
  if (lc === 'google inc' || lc === 'google llc') return 'Google';
  if (lc === 'microsoft corporation' || lc === 'microsoft corp') return 'Microsoft';
  if (lc === 'pricewaterhousecoopers') return 'PwC';
  if (lc === 'deloitte llp' || lc === 'deloitte & touche') return 'Deloitte';
  if (lc === 'accenture llp') return 'Accenture';
  return name;
};

const CompaniesTab = ({ onSelectCompany, selectedCountry, dateFilter }) => {
  const [searchTerm, setSearchTerm]       = useState('');
  const [localSearchTerm, setLocalSearchTerm] = useState('');
  const [filter, setFilter]               = useState('All');
  const [loading, setLoading]             = useState(true);
  const [companies, setCompanies]         = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [page, setPage]                   = useState(0);

  // Reset detail + refetch when country or date changes
  useEffect(() => {
    setSelectedCompany(null);
    fetchCompanies();
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

  const fetchCompanies = async () => {
    setLoading(true);
    try {
      // Fetches ALL companies using paginated RPC calls, bypassing max_rows=1000 cap
      const rows = await fetchAllCompanies(
        selectedCountry || null,
        dateFilter?.from || null,
        dateFilter?.to || null
      );

      const companyList = rows.map(row => {
        const displayName = normalizeDisplayName(row.company_name);
        return {
          name:     displayName,
          rawName:  row.company_name, // keep for strict filtering
          count:    Number(row.job_count),
          isFamous: isFamous(displayName),
          rank:     getCompanyRank(displayName),
          type:     isTechRole(displayName) ? 'TECH' : 'NON-TECH',
        };
      }).sort((a, b) => {
        if (a.isFamous && !b.isFamous) return -1;
        if (!a.isFamous && b.isFamous) return 1;
        if (a.isFamous && b.isFamous && a.rank !== b.rank) return a.rank - b.rank;
        return b.count - a.count;
      });

      setCompanies(companyList);
      setPage(0);
    } catch (err) {
      console.error('[CompaniesTab] Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const isTechRole = (name) => {
    const kw = ['software','engineer','developer','tech','data','ml','ai','cloud','security','devops','web','frontend','backend','fullstack','infrastructure','network'];
    return kw.some(k => String(name).toLowerCase().includes(k));
  };

  const countryLabel = selectedCountry
    ? (COUNTRY_MAP[selectedCountry]?.label || selectedCountry)
    : 'All Countries';

  const filteredCompanies = companies.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === 'All' || c.type === filter.toUpperCase();
    return matchesSearch && matchesFilter;
  });

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
            <LogoBox name={selectedCompany} size={64} className="rounded-xl border border-gray-100 shadow-sm" />
            <div>
              <h2 className="text-2xl font-[900] text-[#1E1E1E]">{normalizeDisplayName(selectedCompany)}</h2>
              <p className="text-gray-500 font-bold">Showing all active job openings in {countryLabel}</p>
            </div>
          </div>
        </div>

        <AllJobsTab fixedCompany={selectedCompany} activeFilter="all" countryFilter={selectedCountry} dateFilter={dateFilter} />
      </div>
    );
  }

  // ── Loading ───────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-10 h-10 text-[#2C76FF] animate-spin mb-4" />
        <p className="text-gray-500 font-bold">Fetching Companies...</p>
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
          <p className="text-sm font-bold text-gray-400">
            {filteredCompanies.length.toLocaleString()} {filteredCompanies.length === 1 ? 'company' : 'companies'} in {countryLabel}
            {filteredCompanies.length !== companies.length && ` (filtered from ${companies.length.toLocaleString()} total)`}
          </p>
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
              onClick={() => setSelectedCompany(company.rawName)}
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
