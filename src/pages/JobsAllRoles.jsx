import React, { useState, useEffect, useCallback, useRef } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import {
  Search, MapPin, Briefcase, Globe, Loader2, X,
  Calendar, ExternalLink, Wifi, WifiOff, ChevronLeft, ChevronRight
} from 'lucide-react';
import { jobsClient } from '../jobsAllRolesClient';
import { getAvailableCountries, COUNTRY_MAP } from '../utils/countryHelper';

const PAGE_SIZE = 20;

const JobsAllRoles = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('');
  const [availableCountries, setAvailableCountries] = useState([]);
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [clientReady, setClientReady] = useState(true);
  const debounceRef = useRef(null);

  // Fetch available countries from DB
  useEffect(() => {
    const loadCountries = async () => {
      const countries = await getAvailableCountries();
      setAvailableCountries(countries);
    };
    loadCountries();
  }, []);

  // Debounce search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(0);
    }, 400);
    return () => clearTimeout(debounceRef.current);
  }, [search]);

  const fetchJobs = useCallback(async () => {
    if (!jobsClient) { setClientReady(false); return; }
    setLoading(true);
    try {
      const from = page * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      let q = jobsClient
        .from('jobs_all_roles')
        .select('id,role_id,role_name,indeed_search_country,country,location,title,company_name,job_url,job_url_direct,date_posted,is_remote,description', { count: 'exact' })
        .order('date_posted', { ascending: false, nullsFirst: false })
        .order('id', { ascending: false })
        .range(from, to);

      if (debouncedSearch.trim()) {
        const words = debouncedSearch.trim().split(/\s+/);
        const titleFilter = words.map(w => `title.ilike.%${w}%`).join(',');
        const roleFilter = words.map(w => `role_name.ilike.%${w}%`).join(',');
        const companyFilter = words.map(w => `company_name.ilike.%${w}%`).join(',');
        q = q.or(`and(${titleFilter}),and(${roleFilter}),and(${companyFilter})`);
      }

      if (selectedCountry) {
        // Find mapped info for accuracy
        const entry = availableCountries.find(c => c.id === selectedCountry);
        if (entry) {
          const filters = [];
          if (entry.dbValue) filters.push(`indeed_search_country.ilike.%${entry.dbValue}%`);
          if (entry.label) filters.push(`indeed_search_country.ilike.%${entry.label}%`);
          filters.push(`indeed_search_country.ilike.%${selectedCountry}%`);
          q = q.or(filters.join(','));
        } else {
          q = q.ilike('indeed_search_country', `%${selectedCountry}%`);
        }
      }

      if (remoteOnly) {
        q = q.eq('is_remote', true);
      }

      const { data, error, count } = await q;
      if (error) throw error;

      setJobs(data || []);
      setTotal(count || 0);
      if (data && data.length > 0 && !selectedJob) setSelectedJob(data[0]);
      else if (data && data.length > 0) setSelectedJob(data[0]);
    } catch (err) {
      console.error('JobsAllRoles fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, selectedCountry, remoteOnly, page, availableCountries]);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const formatDate = (d) => {
    if (!d) return 'Unknown date';
    const date = new Date(d);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getLogo = (name) => (name ? name.charAt(0).toUpperCase() : '?');

  const logoColors = [
    'bg-blue-100 text-blue-700',
    'bg-purple-100 text-[#29FE29]',
    'bg-green-100 text-green-700',
    'bg-orange-100 text-orange-700',
    'bg-pink-100 text-pink-700',
    'bg-indigo-100 text-indigo-700',
  ];
  const getColor = (name) => logoColors[(name?.charCodeAt(0) || 0) % logoColors.length];

  if (!clientReady) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8fafc]">
        <WifiOff size={48} className="text-red-400 mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Database not configured</h2>
        <p className="text-gray-500">Check VITE_JOBS_SUPABASE_URL and VITE_JOBS_SUPABASE_ANON_KEY in your .env file.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <Navbar />

      {/* Hero */}
      <div className="bg-gradient-to-br from-[#1a2a47] via-[#2C76FF] to-[#1e3a6e] pt-28 pb-32 px-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, #2C76FF 0%, transparent 50%), radial-gradient(circle at 80% 20%, #60a5fa 0%, transparent 40%)' }} />
        <div className="relative z-10">
          <span className="inline-block bg-[#2C76FF]/20 text-white text-xs font-bold px-4 py-1.5 rounded-full border border-[#2C76FF]/30 mb-5 uppercase tracking-widest">
            H-1B Visa Sponsorship Database
          </span>
          <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-6 leading-tight">
            Explore <span className="text-[#1E1E1E] bg-[#2C76FF] px-2 rounded-lg">All Roles</span> Across the Globe
          </h1>
          <p className="text-blue-200 text-lg max-w-2xl mx-auto mb-10 opacity-90">
            Browse {total.toLocaleString()}+ jobs scraped from Indeed across multiple countries — updated regularly.
          </p>

          {/* Search Bar */}
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center bg-white rounded-2xl shadow-2xl px-5 py-2">
              <Search size={20} className="text-gray-400 flex-shrink-0" />
              <input
                type="text"
                className="flex-1 py-3 px-4 bg-transparent outline-none text-gray-800 text-base font-medium placeholder-gray-400"
                placeholder="Search by title, role, or company..."
                value={search}
                onChange={e => { setSearch(e.target.value); }}
              />
              {search && (
                <button onClick={() => { setSearch(''); setDebouncedSearch(''); }} className="text-gray-400 hover:text-gray-600 p-1">
                  <X size={18} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main */}
      <div className="max-w-7xl mx-auto px-4 -mt-16 pb-16">
        <div className="flex flex-col lg:flex-row gap-6">

          {/* Sidebar Filters */}
          <aside className="lg:w-60 flex-shrink-0">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-24">
              <h3 className="font-bold text-gray-900 mb-5">Filters</h3>

              {/* Country */}
              <div className="mb-6 relative">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-3">Country</label>
                <div className="relative group">
                  <select
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 bg-gray-50 outline-none focus:border-blue-400 transition-colors appearance-none pr-10"
                    value={selectedCountry}
                    onChange={e => { setSelectedCountry(e.target.value); setPage(0); }}
                  >
                    <option value="">All Countries</option>
                    {availableCountries.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                    <Globe size={16} />
                  </div>
                </div>
                
                {/* Visual Flag Preview for Selected Country */}
                {selectedCountry && (
                  <div className="mt-2 flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-lg border border-blue-100">
                    {(() => {
                      const c = availableCountries.find(x => x.id === selectedCountry);
                      return c ? (
                        <>
                          <img 
                            src={`https://flagcdn.com/w20/${c.flagCode}.png`} 
                            alt={c.name}
                            className="w-4 h-3 object-cover rounded-sm"
                          />
                          <span className="text-[11px] font-bold text-[#2C76FF]">{c.name}</span>
                        </>
                      ) : null;
                    })()}
                  </div>
                )}
              </div>

              {/* Remote */}
              <div className="mb-6">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-3">Work Type</label>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div
                    onClick={() => { setRemoteOnly(p => !p); setPage(0); }}
                    className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${remoteOnly ? 'bg-[#2C76FF] border-[#2C76FF]' : 'border-gray-300 group-hover:border-blue-400'}`}
                  >
                    {remoteOnly && <X size={12} className="text-white" />}
                  </div>
                  <span className={`text-sm font-medium ${remoteOnly ? 'text-gray-900' : 'text-gray-500'}`}>Remote Only</span>
                </label>
              </div>

              {/* Stats */}
              <div className="bg-blue-50 rounded-xl p-4 mt-2">
                <p className="text-xs font-bold text-blue-700 mb-1">Total Results</p>
                <p className="text-2xl font-extrabold text-[#2C76FF]">{total.toLocaleString()}</p>
                <p className="text-xs text-blue-600 mt-0.5">matching jobs</p>
              </div>

              {(selectedCountry || remoteOnly) && (
                <button
                  onClick={() => { setSelectedCountry(''); setRemoteOnly(false); setPage(0); }}
                  className="mt-4 w-full text-sm text-blue-600 font-semibold hover:underline"
                >
                  Clear filters
                </button>
              )}
            </div>
          </aside>

          {/* Job List + Detail */}
          <div className="flex-1 min-w-0 flex flex-col xl:flex-row gap-6">

            {/* List */}
            <div className="xl:w-[420px] flex-shrink-0 flex flex-col gap-4">
              {loading ? (
                <div className="bg-white rounded-2xl p-16 flex flex-col items-center justify-center shadow-sm border border-gray-100">
                  <Loader2 className="animate-spin text-blue-600 mb-3" size={36} />
                  <p className="text-gray-400 text-sm font-medium">Fetching jobs...</p>
                </div>
              ) : jobs.length === 0 ? (
                <div className="bg-white rounded-2xl p-16 text-center shadow-sm border border-gray-100">
                  <Search size={40} className="text-gray-200 mx-auto mb-4" />
                  <h3 className="text-lg font-bold text-gray-900 mb-2">No jobs found</h3>
                  <p className="text-gray-500 text-sm">Try a different search or remove filters.</p>
                </div>
              ) : (
                jobs.map(job => (
                  <div
                    key={job.id}
                    onClick={() => setSelectedJob(job)}
                    className={`bg-white rounded-2xl p-5 border cursor-pointer transition-all duration-200 shadow-sm hover:shadow-md hover:border-blue-100 ${selectedJob?.id === job.id ? 'border-blue-400 ring-1 ring-blue-400/20' : 'border-gray-100'}`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-black flex-shrink-0 ${getColor(job.company_name)}`}>
                        {getLogo(job.company_name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-900 text-sm leading-snug truncate mb-1">{job.title || '—'}</h3>
                        <p className="text-[#2C76FF] text-xs font-semibold flex items-center gap-1 mb-2">
                          <Briefcase size={12} /> {job.company_name || 'Unknown'}
                        </p>
                        <div className="flex flex-wrap items-center gap-2">
                          {job.location && (
                            <span className="text-gray-500 text-[11px] flex items-center gap-1">
                              <MapPin size={11} /> {job.location}
                            </span>
                          )}
                          {job.country && (
                            <span className="text-gray-400 text-[11px] flex items-center gap-1">
                              <Globe size={11} /> {job.country}
                            </span>
                          )}
                          {job.is_remote && (
                            <span className="px-2 py-0.5 bg-green-50 text-green-700 text-[10px] font-bold rounded-full border border-green-100">
                              Remote
                            </span>
                          )}
                        </div>
                        {job.role_name && (
                          <span className="mt-2 inline-block px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-bold rounded border border-blue-100">
                            {job.role_name}
                          </span>
                        )}
                      </div>
                    </div>
                    {job.date_posted && (
                      <p className="text-[11px] text-gray-400 mt-3 flex items-center gap-1">
                        <Calendar size={11} /> {formatDate(job.date_posted)}
                      </p>
                    )}
                  </div>
                ))
              )}

              {/* Pagination */}
              {!loading && totalPages > 1 && (
                <div className="flex items-center justify-between bg-white rounded-2xl px-5 py-4 shadow-sm border border-gray-100">
                  <button
                    disabled={page === 0}
                    onClick={() => setPage(p => p - 1)}
                    className="flex items-center gap-1 text-sm font-semibold text-gray-600 disabled:opacity-30 hover:text-blue-600 transition-colors"
                  >
                    <ChevronLeft size={16} /> Prev
                  </button>
                  <span className="text-xs text-gray-500 font-medium">
                    Page {page + 1} of {totalPages}
                  </span>
                  <button
                    disabled={page >= totalPages - 1}
                    onClick={() => setPage(p => p + 1)}
                    className="flex items-center gap-1 text-sm font-semibold text-gray-600 disabled:opacity-30 hover:text-blue-600 transition-colors"
                  >
                    Next <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </div>

            {/* Detail Panel */}
            <div className="flex-1 min-w-0">
              {selectedJob ? (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 sticky top-24">
                  {/* Header */}
                  <div className="flex items-start gap-5 mb-6 pb-6 border-b border-gray-100">
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black flex-shrink-0 ${getColor(selectedJob.company_name)}`}>
                      {getLogo(selectedJob.company_name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h2 className="text-xl font-extrabold text-gray-900 mb-1 leading-tight">{selectedJob.title}</h2>
                      <p className="text-[#2C76FF] font-bold text-sm flex items-center gap-1.5 mb-3">
                        <Briefcase size={14} /> {selectedJob.company_name || 'Unknown Company'}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {selectedJob.location && (
                          <span className="flex items-center gap-1 text-xs text-gray-600 bg-gray-50 px-3 py-1 rounded-full border border-gray-100">
                            <MapPin size={12} /> {selectedJob.location}
                          </span>
                        )}
                        {selectedJob.country && (
                          <span className="flex items-center gap-1 text-xs text-gray-600 bg-gray-50 px-3 py-1 rounded-full border border-gray-100">
                            <Globe size={12} /> {selectedJob.country}
                          </span>
                        )}
                        {selectedJob.is_remote && (
                          <span className="flex items-center gap-1 text-xs text-green-700 bg-green-50 px-3 py-1 rounded-full border border-green-100 font-semibold">
                            <Wifi size={12} /> Remote
                          </span>
                        )}
                        {selectedJob.date_posted && (
                          <span className="flex items-center gap-1 text-xs text-gray-500 bg-gray-50 px-3 py-1 rounded-full border border-gray-100">
                            <Calendar size={12} /> {formatDate(selectedJob.date_posted)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Badges */}
                  <div className="flex flex-wrap gap-2 mb-6">
                    {selectedJob.role_name && (
                      <span className="px-3 py-1.5 bg-blue-50 text-blue-700 text-xs font-bold rounded-lg border border-blue-100">
                        {selectedJob.role_name}
                      </span>
                    )}
                    {selectedJob.indeed_search_country && (
                      <span className="px-3 py-1.5 bg-[#2C76FF]/10 text-[#2C76FF] text-xs font-bold rounded-lg border border-[#2C76FF]/20">
                        Indeed: {selectedJob.indeed_search_country}
                      </span>
                    )}
                  </div>

                  {/* Apply Buttons */}
                  <div className="flex flex-wrap gap-3 mb-6">
                    {selectedJob.job_url_direct && (
                      <a
                        href={selectedJob.job_url_direct}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 bg-[#29FE29] text-[#1E1E1E] px-6 py-3 rounded-xl font-bold text-sm hover:bg-[#25e525] transition-colors shadow-lg shadow-[#29FE29]/20"
                      >
                        Apply Directly <ExternalLink size={14} />
                      </a>
                    )}
                    {selectedJob.job_url && (
                      <a
                        href={selectedJob.job_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 border border-[#2C76FF] text-[#2C76FF] px-6 py-3 rounded-xl font-bold text-sm hover:bg-blue-50 transition-colors"
                      >
                        View on Indeed <ExternalLink size={14} />
                      </a>
                    )}
                  </div>

                  {/* Description */}
                  {selectedJob.description && (
                    <div>
                      <h4 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">Job Description</h4>
                      <div className="bg-gray-50 rounded-xl p-5 max-h-96 overflow-y-auto">
                        <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                          {selectedJob.description}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-16 flex flex-col items-center justify-center text-center">
                  <Briefcase size={48} className="text-gray-200 mb-4" />
                  <h3 className="text-lg font-bold text-gray-400">Select a job to view details</h3>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default JobsAllRoles;
