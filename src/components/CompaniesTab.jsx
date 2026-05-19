// import React, { useState, useEffect, useRef } from 'react';
// import { 
//   Search, Building2, ChevronRight, Loader2, Briefcase, ArrowLeft, TrendingUp, ChevronLeft, Sparkles, Zap
// } from 'lucide-react';
// import { supabase } from '../supabaseClient';
// import LogoBox from '../components/LogoBox';
// import AllJobsTab from './AllJobsTab';
// import { isFamous, getCompanyRank, FAMOUS_COMPANIES } from '../utils/famousCompanies';
// import { COUNTRY_MAP } from '../utils/countryHelper';
// // fetchAllCompanies removed — now using server-side search via get_companies_fast

// const ITEMS_PER_PAGE = 12;
// const LS_CACHE_KEY_PREFIX = 'cp_companies_v16_';
// const LS_TTL_MS = 15 * 60 * 1000; // 15 min localStorage TTL

// // Pre-compile famous companies RegExp once to avoid millions of dynamic RegExp compilations in render/loops
// const FAMOUS_REGEX = new RegExp(
//   `^(${FAMOUS_COMPANIES.map(b => b.toLowerCase().replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')).join('|')})\\b`,
//   'i'
// );

// // In-memory cache to avoid refetching on tab switch
// let _companiesCache_v3 = {
//   data: null,
//   key: null,
//   timestamp: 0
// };
// const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

// // Helper to bust both caches
// export const bustCompaniesCache = () => {
//   _companiesCache_v3 = { data: null, key: null, timestamp: 0 };
// };

// // Read companies from localStorage (instant, sync)
// const lsGet = (key) => {
//   try {
//     const raw = localStorage.getItem(LS_CACHE_KEY_PREFIX + key);
//     if (!raw) return null;
//     const parsed = JSON.parse(raw);
//     if (parsed?.ts && (Date.now() - parsed.ts) < LS_TTL_MS && parsed.data?.length > 0) return parsed.data;
//   } catch (_) {}
//   return null;
// };

// // Write companies to localStorage
// const lsSet = (key, data) => {
//   try { localStorage.setItem(LS_CACHE_KEY_PREFIX + key, JSON.stringify({ ts: Date.now(), data })); } catch (_) {}
// };

// const normalizeDisplayName = (name) => {
//   if (!name) return '';
//   let n = String(name).trim();

//   // 1. Check if it matches any famous company from our FAMOUS_COMPANIES list case-insensitively
//   const lowerName = n.toLowerCase();
//   const match = lowerName.match(FAMOUS_REGEX);
//   if (match) {
//     const matchedLower = match[1].toLowerCase();
//     const originalBrand = FAMOUS_COMPANIES.find(b => b.toLowerCase() === matchedLower);
//     if (originalBrand) return originalBrand;
//   }

//   // 2. Clean common corporate suffixes for clean presentation and deduplication
//   let cleaned = n
//     .replace(/\b(LLC|INC|CORP|CORPORATION|CO|COMPANY|LTD|LIMITED|TECH|TECHNOLOGIES|SYSTEMS|SERVICES|PLATFORMS|SOLUTIONS|GROUP|US|USA|UK)\b/gi, '')
//     .replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, ' ')
//     .replace(/\s+/g, ' ')
//     .trim();

//   if (!cleaned) return n;

//   // Capitalize first letter of each word
//   return cleaned.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
// };

// const isTechRole = (companyName) => {
//   if (!companyName) return false;
//   const lower = companyName.toLowerCase();
//   const kw = [
//     'tech', 'software', 'technology', 'system', 'digital', 'science', 'comput', 'network',
//     'information', 'telecom', 'semiconductor', 'data', 'consulting', 'automation', 'solution',
//     'services', 'intel', 'microsoft', 'google', 'apple', 'amazon', 'meta', 'nvidia'
//   ];
//   return kw.some(k => lower.includes(k));
// };

// const CompaniesTab = ({ onSelectCompany, selectedCountry, dateFilter, viewMode = 'grid' }) => {
//   const allCompaniesRef = useRef([]);
//   const rawRowsRef = useRef([]);
//   const fetchInProgress = useRef(false);
//   const [searchTerm, setSearchTerm]       = useState('');
//   const [localSearchTerm, setLocalSearchTerm] = useState('');
//   const [filter, setFilter]               = useState('All');
//   const [loading, setLoading]             = useState(true);
//   const [searchLoading, setSearchLoading] = useState(false);
//   const [companies, setCompanies]         = useState([]);
//   const [selectedCompany, setSelectedCompany] = useState(null);
//   const [page, setPage]                   = useState(0);
//   const [fetchError, setFetchError]       = useState(null);

//   const countryLabel = (Array.isArray(selectedCountry) && selectedCountry.length > 0)
//     ? (selectedCountry.length === 1 ? (COUNTRY_MAP[selectedCountry[0]]?.label || selectedCountry[0]) : `${selectedCountry.length} Countries`)
//     : 'All Countries';

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

//   // If they filter, load the full list into state so filter works over the entire database
//   useEffect(() => {
//     if (filter !== 'All' && allCompaniesRef.current.length < rawRowsRef.current.length) {
//       const fullProcessed = processResults(rawRowsRef.current);
//       allCompaniesRef.current = fullProcessed;
//       setCompanies(fullProcessed);
//     }
//   }, [filter]);

//   // On first mount: serve from cache instantly, then let the dependency effect handle fetching
//   useEffect(() => {
//     bustCompaniesCache();
//     const activeCountries = Array.isArray(selectedCountry) ? selectedCountry : (selectedCountry ? [selectedCountry] : []);
//     const countriesStr = activeCountries.length > 0 ? activeCountries.slice().sort().join(',') : 'all';
//     const cacheKey = `${countriesStr}-${dateFilter?.quickDate}-${dateFilter?.from}-${dateFilter?.to}`;
//     const lsData = lsGet(cacheKey);
//     if (lsData) {
//       allCompaniesRef.current = lsData;
//       rawRowsRef.current = lsData;
//       setCompanies(lsData);
//       setLoading(false);
//       fetchInProgress.current = false;
//     }
//     // No else — the dependency effect below will call fetchCompanies on mount too
//   }, []);

//   // Reset detail + refetch when country or date changes
//   useEffect(() => {
//     setSelectedCompany(null);
//     fetchInProgress.current = false; // allow a fresh fetch on filter change
//     fetchCompanies(false);
//   }, [selectedCountry, dateFilter?.quickDate, dateFilter?.from, dateFilter?.to]);

//   // Debounce search input + reset page
//   useEffect(() => {
//     const timer = setTimeout(() => {
//       setSearchTerm(localSearchTerm);
//       setPage(0);
//     }, 300);
//     return () => clearTimeout(timer);
//   }, [localSearchTerm]);

//   // Reset page when filter changes
//   useEffect(() => { setPage(0); }, [filter]);

//   // backgroundOnly=true → skip setLoading so UI stays responsive during revalidation
//   const fetchCompanies = async (backgroundOnly = false) => {
//     // Prevent concurrent fetches from racing each other
//     if (!backgroundOnly && fetchInProgress.current) return;
//     if (!backgroundOnly) fetchInProgress.current = true;
//     const activeCountries = Array.isArray(selectedCountry) ? selectedCountry : (selectedCountry ? [selectedCountry] : []);
//     const countriesStr = activeCountries.length > 0 ? activeCountries.slice().sort().join(',') : 'all';
//     const cacheKey = `${countriesStr}-${dateFilter?.quickDate}-${dateFilter?.from}-${dateFilter?.to}`;

//     // In-memory cache hit
//     if (
//       !backgroundOnly &&
//       _companiesCache_v3.data &&
//       _companiesCache_v3.data.length > 0 &&
//       _companiesCache_v3.key === cacheKey &&
//       (Date.now() - _companiesCache_v3.timestamp) < CACHE_TTL
//     ) {
//       allCompaniesRef.current = _companiesCache_v3.data;
//       rawRowsRef.current = _companiesCache_v3.data;
//       setCompanies(_companiesCache_v3.data.slice(0, 24));
//       setLoading(false);
//       return;
//     }

//     if (!backgroundOnly) {
//       setLoading(true);
//       setFetchError(null);
//     }

//     try {
//       // Fetch all unique companies in the database via the fast get_companies_fast_json RPC
//       const { data: fastData, error: fastErr } = await supabase.rpc('get_companies_fast_json', {
//         p_countries: activeCountries.length > 0 ? activeCountries : null,
//         p_search:  null,
//         p_start_date: dateFilter?.from || null,
//         p_end_date:   dateFilter?.to || null,
//       });

//       if (fastErr) throw fastErr;

//       const rows = fastData || [];
//       rawRowsRef.current = rows;

//       if (backgroundOnly) {
//         // Silently process full list in background and write to cache
//         const fullProcessed = processResults(rows);
//         _companiesCache_v3 = { data: fullProcessed, key: cacheKey, timestamp: Date.now() };
//         lsSet(cacheKey, fullProcessed);
//         allCompaniesRef.current = fullProcessed;
//         setCompanies(fullProcessed);
//       } else {
//         // Fast initial response: process only first 1000 rows to show page 1 instantly
//         const initialProcessed = processResults(rows.slice(0, 1000));
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
//             type: item.type,
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
//                 type: isTechRole(row.company_name) ? 'TECH' : 'NON-TECH',
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

//             _companiesCache_v3 = { data: fullProcessed, key: cacheKey, timestamp: Date.now() };
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
//       if (!backgroundOnly) {
//         setLoading(false);
//         fetchInProgress.current = false;
//       }

//     } catch (err) {
//       console.error('[CompaniesTab] Error:', err);
//       if (!backgroundOnly) {
//         setFetchError('Failed to load companies. Please refresh.');
//         setLoading(false);
//         fetchInProgress.current = false;
//       }
//     }
//   };

//   // Shared row processor — highly optimized to prevent UI freezing
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
//           type: isTechRole(row.company_name) ? 'TECH' : 'NON-TECH'
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

//   const filteredCompanies = companies.filter(c => {
//     const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase());
//     const matchesFilter = filter === 'All' || c.type === filter.toUpperCase();
//     return matchesSearch && matchesFilter;
//   });

//   const totalJobCount = companies.reduce((sum, c) => sum + c.count, 0);

//   const topTier = companies.filter(c => c.isFamous && c.rank < 15 && c.count > 0).slice(0, 10);

//   const totalPages   = Math.ceil(filteredCompanies.length / ITEMS_PER_PAGE);
//   const pagedCompanies = filteredCompanies.slice(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE);

//   // ── Detail view ──────────────────────────────────────────────────────────────
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
//             <LogoBox name={selectedCompany.name} size={64} className="rounded-2xl border border-gray-100 shadow-sm" />
//             <div>
//               <h2 className="text-2xl font-[900] text-[#1E1E1E]">{selectedCompany.name}</h2>
//               <p className="text-gray-500 font-bold">Showing all active job openings in {countryLabel}</p>
//             </div>
//           </div>
//         </div>

//         <AllJobsTab fixedCompany={selectedCompany.originalNames} activeFilter="all" countryFilter={selectedCountry} dateFilter={dateFilter} isCompact={true} />
//       </div>
//     );
//   }

//   // ── Loading — skeleton cards instead of spinner for faster perceived load ────
//   if (loading) {
//     return (
//       <div className="animate-in fade-in duration-300">
//         <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
//           <div>
//             <div className="h-8 w-64 bg-gray-100 rounded-xl animate-pulse mb-2" />
//             <div className="h-4 w-40 bg-gray-100 rounded-lg animate-pulse" />
//           </div>
//           <div className="h-12 flex-1 max-w-xl bg-gray-100 rounded-xl animate-pulse" />
//         </div>
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
//           {Array.from({ length: 12 }).map((_, i) => (
//             <div key={i} className="bg-white rounded-xl p-5 border border-gray-100 flex items-center gap-4 h-[76px]">
//               <div className="w-14 h-14 rounded-lg bg-gray-100 animate-pulse shrink-0" />
//               <div className="flex-1">
//                 <div className="h-4 bg-gray-100 rounded animate-pulse mb-2 w-3/4" />
//                 <div className="h-3 bg-gray-50 rounded animate-pulse w-1/3" />
//               </div>
//             </div>
//           ))}
//         </div>
//       </div>
//     );
//   }

//   // ── Error state ───────────────────────────────────────────────────────────────
//   if (fetchError) {
//     return (
//       <div className="flex flex-col items-center justify-center py-32 text-center">
//         <Building2 size={40} className="mb-3 text-red-300" />
//         <p className="font-black text-[#1E1E1E] mb-2">Unable to load companies</p>
//         <p className="text-sm text-gray-400 font-bold mb-6">{fetchError}</p>
//         <button
//           onClick={() => { bustCompaniesCache(); fetchCompanies(); }}
//           className="px-6 py-3 bg-[#2C76FF] text-white font-bold rounded-xl hover:bg-[#1a5fd4] transition-all shadow-md"
//         >
//           Try Again
//         </button>
//       </div>
//     );
//   }

//   // ── List view ─────────────────────────────────────────────────────────────────
//   return (

//     <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
//       {/* Header */}
//       <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
//         <div>
//           <h2 className="text-3xl font-[900] text-[#1E1E1E] mb-1">Companies that Sponsor</h2>
//           <div className="flex items-center gap-3">
//             <p className="text-sm font-bold text-gray-400">
//               {filteredCompanies.length.toLocaleString()} brands in {countryLabel}
//             </p>
//             <div className="w-1 h-1 rounded-full bg-gray-300" />
//             <p className="text-sm font-bold text-[#2C76FF]">
//               {totalJobCount.toLocaleString()} total job links
//             </p>
//           </div>
//         </div>

//         <div className="flex items-center gap-4 flex-1 max-w-xl">
//           <div className="relative flex-1">
//             <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
//             <input
//               type="text"
//               placeholder="Search companies..."
//               value={localSearchTerm}
//               onChange={(e) => setLocalSearchTerm(e.target.value)}
//               className="w-full bg-white border border-gray-200 rounded-xl pl-12 pr-4 py-3 text-sm font-bold text-[#1E1E1E] outline-none focus:ring-2 focus:ring-[#2C76FF]/20 focus:border-[#2C76FF] transition-all"
//             />
//           </div>

//           <div className="flex items-center bg-gray-50 p-1 rounded-xl border border-gray-200 shrink-0">
//             {['All', 'Tech', 'Non-Tech'].map((f) => (
//               <button
//                 key={f}
//                 onClick={() => setFilter(f)}
//                 className={`px-4 py-2 rounded-lg text-xs font-black transition-all ${
//                   filter === f ? '!bg-[#2C76FF] !text-white shadow-lg' : 'text-gray-500 hover:bg-gray-100 hover:text-[#1E1E1E]'
//                 }`}
//               >
//                 {f}
//               </button>
//             ))}
//           </div>
//         </div>
//       </div>

//       {/* Top Tier Section */}
//       {!searchTerm && filter === 'All' && topTier.length > 0 && (
//         <div className="mb-12">
//           <div className="flex items-center gap-2 mb-6">
//             <Sparkles size={20} className="text-[#2C76FF]" />
//             <h3 className="text-xl font-black text-[#1E1E1E]">Top Tier Sponsors</h3>
//           </div>
//           <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-2 px-2">
//             {topTier.map((company, idx) => (
//               <div
//                 key={`top-${idx}`}
//                 onClick={() => setSelectedCompany({ name: company.name, originalNames: company.originalNames })}
//                 className="flex-shrink-0 w-44 bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-xl hover:border-[#2C76FF]/30 transition-all cursor-pointer group text-center"
//               >
//                 <div className="flex justify-center mb-4 relative">
//                   <div className="absolute -top-1 -right-1 bg-[#2C76FF] text-white p-1 rounded-full shadow-lg scale-0 group-hover:scale-100 transition-transform z-10">
//                     <Zap size={10} fill="currentColor" />
//                   </div>
//                   <LogoBox name={company.name} size={64} className="rounded-2xl border border-gray-50 shadow-sm" />
//                 </div>
//                 <h4 className="font-black text-[#1E1E1E] text-sm mb-2 truncate group-hover:text-[#2C76FF] transition-colors">
//                   {company.name}
//                 </h4>
//               </div>
//             ))}
//           </div>
//         </div>
//       )}

//       {/* Main Grid Header */}
//       <div className="flex items-center gap-2 mb-6">
//         <TrendingUp size={20} className="text-gray-400" />
//         <h3 className="text-xl font-black text-[#1E1E1E]">
//           {searchTerm ? 'Search Results' : 'All Companies'}
//         </h3>
//       </div>

//       {/* Content */}
//       {pagedCompanies.length === 0 ? (
//         <div className="flex flex-col items-center justify-center py-20 text-gray-400">
//           <Building2 size={40} className="mb-3 opacity-40" />
//           <p className="font-bold">No companies found</p>
//         </div>
//       ) : viewMode === 'list' ? (
//         <div className="flex flex-col gap-3">
//           {pagedCompanies.map((company, idx) => (
//             <div
//               key={idx}
//               onClick={() => onSelectCompany(company.name, company.originalNames)}
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
//               onClick={() => onSelectCompany(company.name, company.originalNames)}
//               className="group relative bg-white rounded-xl p-5 border border-gray-200 shadow-sm hover:shadow-md hover:border-[#2C76FF]/20 transition-all duration-200 cursor-pointer flex items-center gap-5"
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

// export default CompaniesTab;





import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Search, Building2, ChevronRight, Loader2, Briefcase, ArrowLeft, TrendingUp, ChevronLeft, Sparkles, Zap
} from 'lucide-react';
import { supabase } from '../supabaseClient';
import LogoBox from '../components/LogoBox';
import AllJobsTab from './AllJobsTab';
import { isFamous, getCompanyRank, FAMOUS_COMPANIES, FAMOUS_LOWER_MAP } from '../utils/famousCompanies';
import { COUNTRY_MAP } from '../utils/countryHelper';

const ITEMS_PER_PAGE = 12;
const LS_CACHE_KEY_PREFIX = 'cp_companies_raw_v2_'; // raw rows only — keeps size small
const LS_TTL_MS = 20 * 60 * 1000;

// Build cache key helper
const buildCKCompanies = (selectedCountry, dateFilter) => {
  const ac = Array.isArray(selectedCountry) ? selectedCountry : (selectedCountry ? [selectedCountry] : []);
  return `${ac.slice().sort().join(',') || 'all'}_${dateFilter?.from || 'x'}_${dateFilter?.to || 'x'}`;
};

// Store raw rows only (company_name + job_count) — fits easily in 5MB
const lsGetRaw = (key) => {
  try {
    const raw = localStorage.getItem(LS_CACHE_KEY_PREFIX + key);
    if (!raw) return null;
    const p = JSON.parse(raw);
    if (p && p.ts && (Date.now() - p.ts) < LS_TTL_MS && Array.isArray(p.data) && p.data.length > 0) return p.data;
  } catch (_) { }
  return null;
};

const lsSetRaw = (key, rows) => {
  const slim = rows.map(r => ({ c: r.company_name, j: r.job_count }));
  try { localStorage.setItem(LS_CACHE_KEY_PREFIX + key, JSON.stringify({ ts: Date.now(), data: slim })); } catch (_) { }
};

const fromSlimCompanies = (slim) => slim.map(s => ({ company_name: s.c, job_count: s.j }));

// Pre-compile famous regex once at module level
const FAMOUS_REGEX = new RegExp(
  `^(${FAMOUS_COMPANIES.map(b => b.toLowerCase().replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')).join('|')})\\b`,
  'i'
);

// In-memory cache
let _companiesCache_v3 = { data: null, key: null, timestamp: 0 };
const CACHE_TTL = 10 * 60 * 1000;

export const bustCompaniesCache = () => {
  _companiesCache_v3 = { data: null, key: null, timestamp: 0 };
};

const lsGet = (key) => {
  try {
    const raw = localStorage.getItem(LS_CACHE_KEY_PREFIX + key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed?.ts && (Date.now() - parsed.ts) < LS_TTL_MS && parsed.data?.length > 0) return parsed.data;
  } catch (_) { }
  return null;
};



const normalizeDisplayName = (name) => {
  if (!name) return '';
  const n = String(name).trim();
  const lower = n.toLowerCase();

  // O(1) explicit overrides for known duplicate pairs
  if (lower.startsWith('tesla')) return 'Tesla';
  if (lower.startsWith('tiktok')) return 'TikTok';
  if (lower === 'intel' || lower === 'intel corporation') return 'Intel';
  if (lower.startsWith('kpmg')) return 'KPMG';
  if (lower.startsWith('wipro')) return 'Wipro';
  if (lower.startsWith('target')) return 'Target';
  if (lower.includes('amazon') && !lower.includes('aws') && !lower.includes('web services')) return 'Amazon';

  // O(1) Map lookup — no FAMOUS_COMPANIES.find() loop
  const match = lower.match(FAMOUS_REGEX);
  if (match) {
    const found = FAMOUS_LOWER_MAP.get(match[1].toLowerCase());
    if (found) return found;
  }

  return n;
};

const isTechRole = (companyName) => {
  if (!companyName) return false;
  const lower = companyName.toLowerCase();
  const kw = ['tech', 'software', 'technology', 'system', 'digital', 'science', 'comput', 'network',
    'information', 'telecom', 'semiconductor', 'data', 'consulting', 'automation', 'solution',
    'services', 'intel', 'microsoft', 'google', 'apple', 'amazon', 'meta', 'nvidia'];
  return kw.some(k => lower.includes(k));
};

const CompaniesTab = ({ onSelectCompany, selectedCountry, dateFilter, viewMode = 'grid' }) => {
  const fetchInProgress = useRef(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [localSearchTerm, setLocalSearchTerm] = useState('');
  const [filter, setFilter] = useState('All');
  const [fetchError, setFetchError] = useState(null);

  // Lazy initializers: read in-memory cache BEFORE first render → zero spinner flash
  const [companies, setCompanies] = useState(() => {
    const ck = buildCKCompanies(selectedCountry, dateFilter);
    if (_companiesCache_v3.key === ck && _companiesCache_v3.data) return _companiesCache_v3.data;
    return [];
  });
  const [loading, setLoading] = useState(() => {
    const ck = buildCKCompanies(selectedCountry, dateFilter);
    return !(_companiesCache_v3.key === ck && _companiesCache_v3.data);
  });

  const [selectedCompany, setSelectedCompany] = useState(null);
  const [page, setPage] = useState(0);

  const countryLabel = useMemo(() =>
    (Array.isArray(selectedCountry) && selectedCountry.length > 0)
      ? (selectedCountry.length === 1 ? (COUNTRY_MAP[selectedCountry[0]]?.label || selectedCountry[0]) : `${selectedCountry.length} Countries`)
      : 'All Countries'
  , [selectedCountry]);

  // Fires on mount AND when country/date changes
  useEffect(() => {
    setSelectedCompany(null);
    fetchInProgress.current = false;
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

  // ─── Fetch: cache → instant, network → full count in one shot ───
  const fetchCompanies = async (backgroundOnly = false) => {
    if (!backgroundOnly && fetchInProgress.current) return;
    if (!backgroundOnly) fetchInProgress.current = true;

    const activeCountries = Array.isArray(selectedCountry) ? selectedCountry : (selectedCountry ? [selectedCountry] : []);
    const cacheKey = buildCKCompanies(selectedCountry, dateFilter);

    // 1. In-memory cache — zero latency, instant
    if (_companiesCache_v3.key === cacheKey && _companiesCache_v3.data && (Date.now() - _companiesCache_v3.timestamp) < CACHE_TTL) {
      setCompanies(_companiesCache_v3.data);
      if (!backgroundOnly) { setLoading(false); setPage(0); }
      fetchInProgress.current = false;
      return;
    }

    // 2. localStorage raw cache — instant (processes raw rows, serves full count)
    const rawSlim = lsGetRaw(cacheKey);
    if (rawSlim) {
      const rawRows = fromSlimCompanies(rawSlim);
      const processed = processResults(rawRows);
      _companiesCache_v3 = { data: processed, key: cacheKey, timestamp: Date.now() };
      setCompanies(processed);
      if (!backgroundOnly) { setLoading(false); setPage(0); }
      setTimeout(() => fetchCompanies(true), 500);
      fetchInProgress.current = false;
      return;
    }

    // 3. Network fetch — show spinner, then show full count at once
    if (!backgroundOnly) {
      setLoading(true);
      setFetchError(null);
    }

    try {
      const { data: fastData, error: fastErr } = await supabase.rpc('get_companies_fast', {
        p_countries: activeCountries.length > 0 ? activeCountries : null,
        p_limit: 150000,
        p_offset: 0,
        p_search: null,
        p_start_date: dateFilter?.from || null,
        p_end_date: dateFilter?.to || null,
      });

      if (fastErr) throw fastErr;

      const rows = fastData || [];
      const full = processResults(rows);

      _companiesCache_v3 = { data: full, key: cacheKey, timestamp: Date.now() };
      lsSetRaw(cacheKey, rows); // store raw rows — fits in 5MB limit
      setCompanies(full);
      if (!backgroundOnly) { setLoading(false); setPage(0); }
      fetchInProgress.current = false;

    } catch (err) {
      console.error('[CompaniesTab] Error:', err);
      fetchInProgress.current = false;
      if (!backgroundOnly) {
        setFetchError('Failed to load companies. Please refresh.');
        setLoading(false);
      }
    }
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
          isFamous: isFamous(canonicalName),
          type: isTechRole(canonicalName) ? 'TECH' : 'NON-TECH'
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

  // useMemo prevents re-filtering 114K items on every render
  const filteredCompanies = useMemo(() => {
    const st = searchTerm.toLowerCase();
    return companies.filter(c => {
      const matchesSearch = !st || c.name.toLowerCase().includes(st);
      const matchesFilter = filter === 'All' || c.type === filter.toUpperCase();
      return matchesSearch && matchesFilter;
    });
  }, [companies, searchTerm, filter]);

  const totalJobCount = useMemo(() => companies.reduce((sum, c) => sum + c.count, 0), [companies]);
  const topTier = useMemo(() => companies.filter(c => c.isFamous && c.rank < 15 && c.count > 0).slice(0, 10), [companies]);

  const totalPages = Math.ceil(filteredCompanies.length / ITEMS_PER_PAGE);
  const pagedCompanies = useMemo(() =>
    filteredCompanies.slice(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE)
  , [filteredCompanies, page]);

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
                className={`px-4 py-2 rounded-lg text-xs font-black transition-all ${filter === f ? '!bg-[#2C76FF] !text-white shadow-lg' : 'text-gray-500 hover:bg-gray-100 hover:text-[#1E1E1E]'
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

      {/* Content */}
      {pagedCompanies.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <Building2 size={40} className="mb-3 opacity-40" />
          <p className="font-bold">No companies found</p>
        </div>
      ) : viewMode === 'list' ? (
        <div className="flex flex-col gap-3">
          {pagedCompanies.map((company, idx) => (
            <div
              key={idx}
              onClick={() => onSelectCompany(company.name, company.originalNames)}
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