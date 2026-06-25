// import React, { useState, useEffect, useRef } from 'react';
// import { 
//   Search, Building2, ChevronRight, ChevronLeft, Loader2, Briefcase, ArrowLeft, TrendingUp
// } from 'lucide-react';
// import { supabase } from '../supabaseClient';
// import LogoBox from './LogoBox';
// import AllJobsTab from './AllJobsTab';
// import { isFamous, getCompanyRank, FAMOUS_COMPANIES } from '../utils/famousCompanies';
// import { COUNTRY_MAP } from '../utils/countryHelper';
// import { fetchAllCompanies } from '../utils/rpcFetchers';

// const ITEMS_PER_PAGE = 12;
// const LS_CACHE_KEY_PREFIX = 'cp_companies_list_v17_';
// const LS_TTL_MS = 15 * 60 * 1000; // 15 min localStorage TTL

// // Pre-compile famous companies RegExp once to avoid millions of dynamic RegExp compilations in render/loops
// const FAMOUS_REGEX = new RegExp(
//   `^(${FAMOUS_COMPANIES.map(b => b.toLowerCase().replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')).join('|')})\\b`,
//   'i'
// );

// // In-memory cache to avoid refetching on tab switch
// let _companiesListCache = {
//   data: null,
//   key: null,
//   timestamp: 0
// };

// // Read companies from localStorage
// const lsGet = (key) => {
//   try {
//     const raw = localStorage.getItem(LS_CACHE_KEY_PREFIX + key);
//     if (!raw) return null;
//     const parsed = JSON.parse(raw);
//     if (parsed && parsed.ts && (Date.now() - parsed.ts) < LS_TTL_MS) {
//       return parsed.data;
//     }
//   } catch (_) {}
//   return null;
// };

// // Write companies to localStorage
// const lsSet = (key, data) => {
//   try { localStorage.setItem(LS_CACHE_KEY_PREFIX + key, JSON.stringify({ ts: Date.now(), data })); } catch (_) {}
// };

// const AllCompaniesListTab = ({ onSelectCompany, selectedCountry, dateFilter, viewMode = 'grid' }) => {
//   const allCompaniesRef = useRef([]);
//   const rawRowsRef = useRef([]);
//   const fetchInProgress = useRef(false);
//   const [searchTerm, setSearchTerm]           = useState('');
//   const [localSearchTerm, setLocalSearchTerm] = useState('');
//   const [loading, setLoading]                 = useState(true);
//   const [companies, setCompanies]             = useState([]);
//   const [selectedCompany, setSelectedCompany] = useState(null);
//   const [page, setPage]                       = useState(0);

//   useEffect(() => {
//     (async () => {
//       console.log('--- DB INSPECTION START ---');
//       try {
//         const { data: d1, error: e1 } = await supabase.from('jobs_all_roles').select('*').limit(2);
//         console.log('jobs_all_roles sample details:', JSON.stringify(d1));
//       } catch (err) { console.error('jobs_all_roles err:', err); }

//       try {
//         const { data: d2, error: e2 } = await supabase.rpc('get_companies_fast', {
//           p_countries: null,
//           p_search: null,
//           p_start_date: null,
//           p_end_date: null
//         }).limit(2);
//         console.log('get_companies_fast sample details:', JSON.stringify(d2));
//       } catch (err) { console.error('get_companies_fast err:', err); }
//       console.log('--- DB INSPECTION END ---');
//     })();
//   }, []);

//   const [searchLoading, setSearchLoading] = useState(false);

//   // Load rest of companies when newPage >= 2 (3rd page)
//   const handlePageChange = (newPage) => {
//     if (newPage >= 2 && allCompaniesRef.current.length < rawRowsRef.current.length) {
//       const fullProcessed = processResults(rawRowsRef.current);
//       allCompaniesRef.current = fullProcessed;
//       setCompanies(fullProcessed);
//     }
//     setPage(newPage);
//     window.scrollTo({ top: 0, behavior: 'smooth' });
//   };

//   // If they search, load the full list into state so search works over the entire database
//   useEffect(() => {
//     if (searchTerm.trim() !== '' && allCompaniesRef.current.length < rawRowsRef.current.length) {
//       const fullProcessed = processResults(rawRowsRef.current);
//       allCompaniesRef.current = fullProcessed;
//       setCompanies(fullProcessed);
//     }
//   }, [searchTerm]);

//   // Reset detail + refetch when country or date changes
//   useEffect(() => {
//     setSelectedCompany(null);
//     fetchInProgress.current = false; // allow a fresh fetch on filter change
//     fetchCompanies(false);
//   }, [selectedCountry, dateFilter?.quickDate, dateFilter?.from, dateFilter?.to]);

//   // Debounce search + reset page
//   useEffect(() => {
//     const timer = setTimeout(() => {
//       setSearchTerm(localSearchTerm);
//       setPage(0);
//     }, 300);
//     return () => clearTimeout(timer);
//   }, [localSearchTerm]);

//   // Helper to clean up DB names for display
//   const normalizeDisplayName = (name) => {
//     if (!name) return '';
//     let n = String(name).trim();

//     // 1. Check if it matches any famous company from our FAMOUS_COMPANIES list case-insensitively
//     const lowerName = n.toLowerCase();
//     const match = lowerName.match(FAMOUS_REGEX);
//     if (match) {
//       const matchedLower = match[1].toLowerCase();
//       const originalBrand = FAMOUS_COMPANIES.find(b => b.toLowerCase() === matchedLower);
//       if (originalBrand) return originalBrand;
//     }

//     // 2. Clean common corporate suffixes for clean presentation and deduplication
//     let cleaned = n
//       .replace(/\b(LLC|INC|CORP|CORPORATION|CO|COMPANY|LTD|LIMITED|TECH|TECHNOLOGIES|SYSTEMS|SERVICES|PLATFORMS|SOLUTIONS|GROUP|US|USA|UK)\b/gi, '')
//       .replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, ' ')
//       .replace(/\s+/g, ' ')
//       .trim();

//     if (!cleaned) return n;

//     // Capitalize first letter of each word
//     return cleaned.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
//   };

//   const processResults = (rows) => {
//     const aggMap = new Map();

//     for (let i = 0; i < rows.length; i++) {
//       const row = rows[i];
//       const canonicalName = normalizeDisplayName(row.company_name);

//       if (!aggMap.has(canonicalName)) {
//         aggMap.set(canonicalName, {
//           name: canonicalName,
//           originalNames: new Set([row.company_name]),
//           count: Number(row.job_count),
//           isFamous: isFamous(row.company_name),
//         });
//       } else {
//         const existing = aggMap.get(canonicalName);
//         existing.count += Number(row.job_count);
//         existing.originalNames.add(row.company_name);
//         if (isFamous(row.company_name)) existing.isFamous = true;
//       }
//     }

//     const aggregated = Array.from(aggMap.values()).map(item => ({
//       ...item,
//       originalNames: Array.from(item.originalNames),
//       rank: item.isFamous ? getCompanyRank(item.name) : 999
//     }));

//     const famous = aggregated.filter(i => i.isFamous);
//     const regular = aggregated.filter(i => !i.isFamous);

//     // Sort famous by rank, regular by job count
//     famous.sort((a, b) => a.rank - b.rank);
//     regular.sort((a, b) => b.count - a.count);

//     return [...famous, ...regular];
//   };

//   const fetchCompanies = async (backgroundOnly = false) => {
//     // Prevent concurrent fetches from racing each other and aborting the chunk processor
//     if (!backgroundOnly && fetchInProgress.current) return;
//     if (!backgroundOnly) fetchInProgress.current = true;
//     const activeCountries = Array.isArray(selectedCountry) ? selectedCountry : (selectedCountry ? [selectedCountry] : []);
//     const countryKey = activeCountries.length > 0 ? activeCountries.slice().sort().join(',') : 'all';
//     const dateStr = dateFilter?.quickDate === 'all' || !dateFilter ? 'all' : `${dateFilter.from || ''}_${dateFilter.to || ''}`;
//     const cacheKey = `${countryKey}_${dateStr}`;

//     // 1. Memory cache check
//     if (_companiesListCache.key === cacheKey && _companiesListCache.data && (Date.now() - _companiesListCache.timestamp) < LS_TTL_MS) {
//       allCompaniesRef.current = _companiesListCache.data;
//       rawRowsRef.current = _companiesListCache.data;
//       setCompanies(_companiesListCache.data.slice(0, 24));
//       if (!backgroundOnly) setLoading(false);
//       return;
//     }

//     // 2. Local storage cache check
//     const cached = lsGet(cacheKey);
//     if (cached) {
//       allCompaniesRef.current = cached;
//       rawRowsRef.current = cached;
//       setCompanies(cached.slice(0, 24));
//       _companiesListCache = { data: cached, key: cacheKey, timestamp: Date.now() };
//       if (!backgroundOnly) setLoading(false);
//       // Silently update in background
//       fetchCompanies(true);
//       return;
//     }

//     if (!backgroundOnly) {
//       setLoading(true);
//     }

//     try {
//       console.time('RPC_CALL');
//       const { data: fastData, error: fastErr } = await supabase.rpc('get_companies_fast_json', {
//         p_countries: activeCountries.length > 0 ? activeCountries : null,
//         p_search:  null,
//         p_start_date: dateFilter?.from || null,
//         p_end_date:   dateFilter?.to || null,
//       });
//       console.timeEnd('RPC_CALL');

//       if (fastErr) throw fastErr;
//       const rows = fastData || [];
//       console.log('Total rows received:', rows.length);
//       rawRowsRef.current = rows;

//       if (backgroundOnly) {
//         // Silently process full list in background and write to cache
//         console.time('processResults_full');
//         const fullProcessed = processResults(rows);
//         console.timeEnd('processResults_full');
//         _companiesListCache = { data: fullProcessed, key: cacheKey, timestamp: Date.now() };
//         lsSet(cacheKey, fullProcessed);
//         allCompaniesRef.current = fullProcessed;
//         setCompanies(fullProcessed);
//       } else {
//         // Fast initial response: process only first 1000 rows to show page 1 instantly
//         console.time('processResults_1000');
//         const initialProcessed = processResults(rows.slice(0, 1000));
//         console.timeEnd('processResults_1000');
//         allCompaniesRef.current = initialProcessed;
//         setCompanies(initialProcessed);
//         setPage(0);
//         setLoading(false);

//         // Chunk-process the FULL list without blocking the main thread.
//         // Each chunk of 5000 rows runs in its own event-loop tick so the browser stays responsive.
//         const CHUNK_SIZE = 5000;
//         const aggMap = new Map();

//         // Seed the map with the already-processed initial rows so we don't lose them
//         for (const item of initialProcessed) {
//           aggMap.set(item.name, {
//             name: item.name,
//             originalNames: new Set(item.originalNames),
//             count: item.count,
//             isFamous: item.isFamous,
//           });
//         }

//         const processChunk = (startIdx) => {
//           // Abort if a newer fetch has replaced the rows reference
//           if (rawRowsRef.current !== rows) {
//             fetchInProgress.current = false;
//             return;
//           }

//           const end = Math.min(startIdx + CHUNK_SIZE, rows.length);
//           for (let i = startIdx; i < end; i++) {
//             const row = rows[i];
//             const canonicalName = normalizeDisplayName(row.company_name);
//             if (!aggMap.has(canonicalName)) {
//               aggMap.set(canonicalName, {
//                 name: canonicalName,
//                 originalNames: new Set([row.company_name]),
//                 count: Number(row.job_count),
//                 isFamous: isFamous(row.company_name),
//               });
//             } else {
//               const existing = aggMap.get(canonicalName);
//               existing.count += Number(row.job_count);
//               existing.originalNames.add(row.company_name);
//               if (isFamous(row.company_name)) existing.isFamous = true;
//             }
//           }

//           if (end < rows.length) {
//             // More chunks remain — yield control to the browser then continue
//             setTimeout(() => processChunk(end), 0);
//           } else {
//             // All rows processed — build the final fully-deduplicated sorted list
//             const aggregated = Array.from(aggMap.values()).map(item => ({
//               ...item,
//               originalNames: Array.from(item.originalNames),
//               rank: item.isFamous ? getCompanyRank(item.name) : 999,
//             }));
//             const famous = aggregated.filter(i => i.isFamous);
//             const regular = aggregated.filter(i => !i.isFamous);
//             famous.sort((a, b) => a.rank - b.rank);
//             regular.sort((a, b) => b.count - a.count);
//             const fullProcessed = [...famous, ...regular];

//             _companiesListCache = { data: fullProcessed, key: cacheKey, timestamp: Date.now() };
//             lsSet(cacheKey, fullProcessed);
//             allCompaniesRef.current = fullProcessed;
//             setCompanies(fullProcessed);
//             fetchInProgress.current = false;
//           }
//         };

//         // Start chunk processing after the first page is painted
//         setTimeout(() => processChunk(1000), 50);
//         return; // loading already cleared above
//       }
//     } catch (err) {
//       console.error('[AllCompaniesListTab] Error:', err);
//       fetchInProgress.current = false;
//     } finally {
//       if (!backgroundOnly) setLoading(false);
//     }
//   };

//   const countryLabel = (Array.isArray(selectedCountry) && selectedCountry.length > 0)
//     ? (selectedCountry.length === 1 ? (COUNTRY_MAP[selectedCountry[0]]?.label || selectedCountry[0]) : `${selectedCountry.length} Countries`)
//     : 'All Countries';

//   const filteredCompanies = companies.filter(c =>
//     c.name.toLowerCase().includes(searchTerm.toLowerCase())
//   );

//   const totalPages     = Math.ceil(filteredCompanies.length / ITEMS_PER_PAGE);
//   const pagedCompanies = filteredCompanies.slice(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE);

//   // ── Detail view ───────────────────────────────────────────────────────────────
//   if (selectedCompany) {
//     return (
//       <div className="animate-in fade-in slide-in-from-left-4 duration-500">
//         <button
//           onClick={() => setSelectedCompany(null)}
//           className="flex items-center gap-2 mb-6 px-4 py-2 bg-white border border-gray-200 rounded-xl text-[#2C76FF] font-bold hover:bg-gray-50 transition-all shadow-sm group"
//         >
//           <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
//           Back to all companies
//         </button>

//         <div className="bg-white rounded-2xl p-2 border border-gray-100 shadow-sm mb-8">
//           <div className="flex items-center gap-4 p-4">
//             <LogoBox name={selectedCompany.name} size={64} className="rounded-xl border border-gray-100 shadow-sm" />
//             <div>
//               <h2 className="text-2xl font-[900] text-[#1E1E1E]">{selectedCompany.name}</h2>
//               <p className="text-gray-500 font-bold">Showing all active job openings</p>
//             </div>
//           </div>
//         </div>

//         <AllJobsTab fixedCompany={selectedCompany.originalNames} activeFilter="all" countryFilter={selectedCountry} dateFilter={dateFilter} isCompact={true} />
//       </div>
//     );
//   }

//   // ── Loading ───────────────────────────────────────────────────────────────────
//   if (loading) {
//     return (
//       <div className="flex flex-col items-center justify-center py-20">
//         <Loader2 className="w-10 h-10 text-[#2C76FF] animate-spin mb-4" />
//         <p className="text-gray-500 font-bold">Loading Companies...</p>
//       </div>
//     );
//   }

//   // ── List view ─────────────────────────────────────────────────────────────────
//   return (
//     <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
//       {/* Header */}
//       <div className="mb-6">
//         <h2 className="text-3xl font-[900] text-[#2C76FF] mb-1">All Companies</h2>
//         <p className="text-sm font-bold text-gray-400">
//           {filteredCompanies.length.toLocaleString()} {filteredCompanies.length === 1 ? 'company' : 'companies'} in {countryLabel}
//           {filteredCompanies.length !== companies.length && ` (filtered from ${companies.length.toLocaleString()} total)`}
//         </p>
//       </div>

//       {/* Search */}
//       <div className="relative mb-8">
//         <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
//         <input
//           type="text"
//           placeholder="Search companies..."
//           value={localSearchTerm}
//           onChange={(e) => setLocalSearchTerm(e.target.value)}
//           className="w-full bg-white border border-gray-200 rounded-2xl pl-12 pr-4 py-4 text-base font-bold text-[#1E1E1E] outline-none focus:ring-2 focus:ring-[#2C76FF]/50 focus:border-[#2C76FF] transition-all shadow-sm"
//         />
//       </div>

//       {/* Content */}
//       {pagedCompanies.length === 0 ? (
//         <div className="flex flex-col items-center justify-center py-20 text-gray-400">
//           <Building2 size={48} className="mb-3 opacity-40" />
//           <p className="font-bold">No companies found matching "{searchTerm}"</p>
//         </div>
//       ) : viewMode === 'list' ? (
//         <div className="flex flex-col gap-3">
//           {pagedCompanies.map((company, idx) => (
//             <div
//               key={idx}
//               onClick={() => {
//                 setSelectedCompany(company);
//                 onSelectCompany(company.name, company.originalNames);
//               }}
//               className="group bg-white rounded-xl p-4 border border-gray-100 shadow-sm hover:shadow-md hover:border-[#2C76FF]/20 transition-all cursor-pointer flex items-center gap-4"
//             >
//               <LogoBox name={company.name} size={40} className="rounded-lg overflow-hidden border border-gray-50 shrink-0" />
//               <div className="flex-1 min-w-0">
//                 <div className="flex items-center gap-2">
//                   <h3 className="text-[15px] font-black text-gray-900 group-hover:text-[#2C76FF] transition-colors truncate">
//                     {company.name}
//                   </h3>
//                   {company.isFamous && <TrendingUp size={12} className="text-[#2C76FF] shrink-0" />}
//                 </div>
//                 <div className="flex items-center gap-3 text-[11px] font-bold text-gray-400">
//                 </div>
//               </div>
//               <ChevronRight size={16} className="text-gray-300 group-hover:text-[#2C76FF] transition-colors shrink-0" />
//             </div>
//           ))}
//         </div>
//       ) : (
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
//           {pagedCompanies.map((company, idx) => (
//             <div
//               key={idx}
//               onClick={() => {
//                 setSelectedCompany(company);
//                 onSelectCompany(company.name, company.originalNames);
//               }}
//               className="group relative bg-white rounded-xl p-5 border border-gray-200 shadow-sm hover:shadow-md hover:border-[#2C76FF]/30 transition-all duration-200 cursor-pointer flex items-center gap-5"
//             >
//               <LogoBox name={company.name} size={56} className="rounded-lg overflow-hidden border border-gray-100 shrink-0" />

//               <div className="flex-1 min-w-0">
//                 <div className="flex items-center gap-2">
//                   <h3 className="text-lg font-bold text-gray-900 group-hover:text-[#2C76FF] transition-colors truncate">
//                     {company.name}
//                   </h3>
//                   {company.isFamous && <TrendingUp size={14} className="text-[#2C76FF] shrink-0" />}
//                 </div>
//               </div>

//               <ChevronRight size={20} className="text-gray-300 group-hover:text-[#2C76FF] transition-colors shrink-0" />
//             </div>
//           ))}
//         </div>
//       )}

//       {/* Pagination */}
//       {totalPages > 1 && (
//         <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
//           <button
//             onClick={() => handlePageChange(Math.max(0, page - 1))}
//             disabled={page === 0}
//             className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-[#2C76FF] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-50 transition-all"
//           >
//             <ChevronLeft size={16} /> Previous
//           </button>

//           <span className="text-sm font-bold text-gray-500">
//             Page {page + 1} of {totalPages} &nbsp;·&nbsp; {filteredCompanies.length.toLocaleString()} companies
//           </span>

//           <button
//             onClick={() => handlePageChange(Math.min(totalPages - 1, page + 1))}
//             disabled={page >= totalPages - 1}
//             className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-[#2C76FF] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-50 transition-all"
//           >
//             Next <ChevronRight size={16} />
//           </button>
//         </div>
//       )}
//     </div>
//   );
// };

// export default AllCompaniesListTab;





import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Search, Building2, ChevronRight, ChevronLeft, Loader2, Briefcase, ArrowLeft, TrendingUp
} from 'lucide-react';
import { supabase } from '../supabaseClient';
import LogoBox from './LogoBox';
import AllJobsTab from './AllJobsTab';
import { isFamous, getCompanyRank, FAMOUS_COMPANIES, FAMOUS_LOWER_MAP } from '../utils/famousCompanies';
import { COUNTRY_MAP } from '../utils/countryHelper';
import { fetchAllCompanies } from '../utils/rpcFetchers';

const ITEMS_PER_PAGE = 12;
// localStorage stores the raw rows (company_name + job_count only) — keeps size ~3MB which fits
const LS_RAW_PREFIX = 'cp_companies_raw_v2_';
const LS_TTL = 20 * 60 * 1000; // 20 minutes

// Module-level in-memory cache — survives tab switches within same session
let _memCache = { key: null, data: null, ts: 0 };

// Build cache key from filter state
const buildCacheKey = (selectedCountry, dateFilter) => {
  const activeCountries = Array.isArray(selectedCountry) ? selectedCountry : (selectedCountry ? [selectedCountry] : []);
  return `${activeCountries.slice().sort().join(',') || 'all'}_${dateFilter?.from || 'x'}_${dateFilter?.to || 'x'}`;
};

// Store RAW rows in localStorage (much smaller than processed objects)
const lsGetRaw = (key) => {
  try {
    const raw = localStorage.getItem(LS_RAW_PREFIX + key);
    if (!raw) return null;
    const p = JSON.parse(raw);
    if (p && p.ts && (Date.now() - p.ts) < LS_TTL && Array.isArray(p.data) && p.data.length > 0) return p.data;
  } catch (_) {}
  return null;
};

const lsSetRaw = (key, rows) => {
  // Store only what's needed for processResults — keeps JSON small
  const slim = rows.map(r => ({ c: r.company_name, j: r.job_count }));
  try { localStorage.setItem(LS_RAW_PREFIX + key, JSON.stringify({ ts: Date.now(), data: slim })); } catch (_) {}
};

// Convert slim storage format back to full row format
const fromSlim = (slim) => slim.map(s => ({ company_name: s.c, job_count: s.j }));

// Pre-compile famous regex once at module level
const FAMOUS_REGEX = new RegExp(
  `^(${FAMOUS_COMPANIES.map(b => b.toLowerCase().replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')).join('|')})\\b`,
  'i'
);

// Pre-build a Set of famous names in lowercase for O(1) lookup
const FAMOUS_SET = new Set(FAMOUS_COMPANIES.map(f => f.toLowerCase()));
const FAMOUS_PREFIX_MAP = new Map();
FAMOUS_COMPANIES.forEach(f => {
  const key = f.toLowerCase().split(' ')[0]; // first word
  if (!FAMOUS_PREFIX_MAP.has(key)) FAMOUS_PREFIX_MAP.set(key, f);
});


const loadingMessages = [
  "Loading companies for you...",
  "Finding companies that match your interests...",
  "Gathering company profiles...",
  "Preparing your company directory...",
  "Discovering top companies...",
  "Searching companies across industries...",
  "Finding employers that are hiring...",
  "Building your company list...",
  "Connecting you with great employers...",
  "Finding companies worth exploring..."
];

const AllCompaniesListTab = ({ onSelectCompany, selectedCountry, dateFilter, viewMode = 'grid' }) => {
  const fetchInProgress = useRef(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [localSearchTerm, setLocalSearchTerm] = useState('');

  // Lazy initializers: read in-memory cache BEFORE first render → zero spinner flash on revisit
  const [companies, setCompanies] = useState(() => {
    const ck = buildCacheKey(selectedCountry, dateFilter);
    if (_memCache.key === ck && _memCache.data) return _memCache.data;
    return [];
  });
  const [loading, setLoading] = useState(() => {
    const ck = buildCacheKey(selectedCountry, dateFilter);
    return !(_memCache.key === ck && _memCache.data);
  });
  
  const [loadingMessageIdx, setLoadingMessageIdx] = useState(0);

  // Rotate loading message randomly every 2 seconds
  useEffect(() => {
    if (!loading) return;
    const interval = setInterval(() => {
      setLoadingMessageIdx(Math.floor(Math.random() * loadingMessages.length));
    }, 2000);
    return () => clearInterval(interval);
  }, [loading]);

  const [selectedCompany, setSelectedCompany] = useState(null);
  const [page, setPage] = useState(0);

  // Reset detail + refetch on country or date changes (also fires on mount for initial load)
  useEffect(() => {
    setSelectedCompany(null);
    fetchInProgress.current = false;
    fetchCompanies(false);
  }, [selectedCountry, dateFilter?.quickDate, dateFilter?.from, dateFilter?.to]);

  // Debounce search + reset page
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchTerm(localSearchTerm);
      setPage(0);
    }, 300);
    return () => clearTimeout(timer);
  }, [localSearchTerm]);

  // Helper to deduplicate and clean DB names
  const normalizeDisplayName = (name) => {
    if (!name) return '';
    const n = String(name).trim();
    const lower = n.toLowerCase();

    // Explicit overrides for known duplicate pairs — O(1) startsWith checks
    if (lower.startsWith('tesla')) return 'Tesla';
    if (lower.startsWith('tiktok')) return 'TikTok';
    if (lower === 'intel' || lower === 'intel corporation') return 'Intel';
    if (lower.startsWith('kpmg')) return 'KPMG';
    if (lower.startsWith('wipro')) return 'Wipro';
    if (lower.startsWith('target')) return 'Target';
    if (lower.includes('amazon') && !lower.includes('aws') && !lower.includes('web services')) return 'Amazon';

    // O(1) Map lookup instead of O(n) FAMOUS_COMPANIES.find()
    const match = lower.match(FAMOUS_REGEX);
    if (match) {
      const found = FAMOUS_LOWER_MAP.get(match[1].toLowerCase());
      if (found) return found;
    }

    return n;
  };

  const processResults = (rows) => {
    const aggMap = new Map();

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (!row.company_name) continue;
      
      const canonicalName = normalizeDisplayName(row.company_name);
      if (!canonicalName || canonicalName.toLowerCase() === 'unknown' || canonicalName.toLowerCase() === 'unknown company') {
        continue;
      }

      if (!aggMap.has(canonicalName)) {
        aggMap.set(canonicalName, {
          name: canonicalName,
          originalNames: new Set([row.company_name]),
          count: Number(row.job_count),
          isFamous: isFamous(canonicalName),
        });
      } else {
        const existing = aggMap.get(canonicalName);
        existing.count += Number(row.job_count);
        existing.originalNames.add(row.company_name);
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

  // ─── Fetch: cache → instant, network → full count in one shot ───
  const fetchCompanies = async (backgroundOnly = false) => {
    if (!backgroundOnly && fetchInProgress.current) return;
    if (!backgroundOnly) fetchInProgress.current = true;

    const ck = buildCacheKey(selectedCountry, dateFilter);

    // 1. In-memory cache — zero latency (survives tab switches)
    if (_memCache.key === ck && _memCache.data && (Date.now() - _memCache.ts) < LS_TTL) {
      setCompanies(_memCache.data);
      if (!backgroundOnly) { setLoading(false); setPage(0); }
      // Silently revalidate in background
      setTimeout(() => fetchCompanies(true), 500);
      fetchInProgress.current = false;
      return;
    }

    // 2. localStorage raw cache — instant (loads raw rows, processes them, serves full count)
    const rawSlim = lsGetRaw(ck);
    if (rawSlim) {
      const rawRows = fromSlim(rawSlim);
      const processed = processResults(rawRows);
      _memCache = { key: ck, data: processed, ts: Date.now() };
      setCompanies(processed);
      if (!backgroundOnly) { setLoading(false); setPage(0); }
      // Silently revalidate in background
      setTimeout(() => fetchCompanies(true), 500);
      fetchInProgress.current = false;
      return;
    }

    // 3. Network fetch — show spinner, then show full count at once
    if (!backgroundOnly) setLoading(true);

    try {
      const rows = await fetchAllCompanies(
        selectedCountry || null,
        dateFilter?.from || null,
        dateFilter?.to || null
      );

      // Process all rows → full count immediately
      const full = processResults(rows);

      // Cache processed data in memory, raw rows in localStorage (fits the 5MB limit)
      _memCache = { key: ck, data: full, ts: Date.now() };
      lsSetRaw(ck, rows);

      setCompanies(full);
      if (!backgroundOnly) { setLoading(false); setPage(0); }
      fetchInProgress.current = false;

    } catch (err) {
      console.error('[AllCompaniesListTab] Error:', err);
      fetchInProgress.current = false;
      if (!backgroundOnly) setLoading(false);
    }
  };


  const countryLabel = useMemo(() =>
    (Array.isArray(selectedCountry) && selectedCountry.length > 0)
      ? (selectedCountry.length === 1 ? (COUNTRY_MAP[selectedCountry[0]]?.label || selectedCountry[0]) : `${selectedCountry.length} Countries`)
      : 'All Countries'
  , [selectedCountry]);

  // useMemo prevents re-filtering 114K items on every render
  const filteredCompanies = useMemo(() =>
    searchTerm
      ? companies.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()))
      : companies
  , [companies, searchTerm]);

  const totalPages = Math.ceil(filteredCompanies.length / ITEMS_PER_PAGE);

  const pagedCompanies = useMemo(() =>
    filteredCompanies.slice(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE)
  , [filteredCompanies, page]);

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
        <p className="text-gray-500 font-bold">{loadingMessages[loadingMessageIdx]}</p>
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