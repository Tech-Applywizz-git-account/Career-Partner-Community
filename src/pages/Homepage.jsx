// import React, { useState, useEffect, useCallback, useRef } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { supabase } from '../supabaseClient';
// import { externalSupabase } from '../externalSupabaseClient';
// import useAuth from '../hooks/useAuth';
// import {
//   Loader2, Search, Briefcase, Heart, CheckSquare, Settings,
//   ChevronLeft, ChevronRight, ArrowUpDown, Eye, Star,
//   MessageSquare, Gift, Archive, Building2, X, Users, Mail,
//   ExternalLink, SlidersHorizontal, HelpCircle, Lock, LogOut, CreditCard,
//   Menu, Zap, Sparkles, Shield, Globe
// } from 'lucide-react';

// import { getCompanyLogo } from '../utils/logoHelper';
// import CompanyCard from '../components/CompanyCard';
// import CompanyJobCard from '../components/CompanyJobCard';
// import Navbar from '../components/Navbar';

// import Testimonials from '../components/Testimonials';
// import FAQ from '../components/FAQ';
// import Footer from '../components/Footer';
// import ProfileTab from '../components/ProfileTab';
// import SavedJobsTab from '../components/SavedJobsTab';
// import AppliedJobsTab from '../components/AppliedJobsTab';
// import PaymentDetailsTab from '../components/PaymentDetailsTab';
// import LogoBox from '../components/LogoBox';
// import AllJobsTab from '../components/AllJobsTab';
// import GlobalSearchHeader from '../components/GlobalSearchHeader';
// import DomainsTab from '../components/DomainsTab';
// import CompaniesTab from '../components/CompaniesTab';
// import H1BSponsorFinder from '../components/H1BSponsorFinder';
// import { fetchJobRoles, filterRoles } from '../utils/rolesSuggestions';
// import { isFamous } from '../utils/famousCompanies';
// import { getWageLevel } from '../dataSyncService';

// // Global name normalizer for consistent lookups
// const normalizeName = (name) => {
//   if (!name) return '';
//   let n = name.toLowerCase()
//     .replace(/\([^)]*\)/g, ' ') // Remove content in parentheses (e.g. (AWS))
//     .replace(/[.,\-\/#!$%\^&\*;:{}=\-_`~()]/g, ' ') // Remove punctuation
//     .replace(/\b(inc|llc|corp|ltd|co|services|com|systems|technologies|group|holdings|usa|us|intl|international|asia|europe|solutions|aws|related)\b/g, ' ')
//     .replace(/\s+/g, ' ')
//     .trim();
//   // Enhanced mapping for major tech entities
//   if (n.includes('amazon')) return 'amazon';
//   if (n.includes('google') || n.includes('alphabet')) return 'google';
//   if (n.includes('meta') || n.includes('facebook')) return 'meta';
//   if (n.includes('microsoft')) return 'microsoft';
//   if (n === 'apple' || n.startsWith('apple ')) return 'apple';
//   return n;
// };

// // Roles fetched dynamically from Supabase via rolesSuggestions utility


// // ─── Teaser Dashboard (unpaid users) ─────────────────────────────────────────

// // ─── Teaser Dashboard (unpaid users) ─────────────────────────────────────────
// const TeaserDashboard = ({ user, signOut, navigate, isMobile, windowWidth, showSidebarDrawer }) => {
//   const [teaserCompanies, setTeaserCompanies] = useState([]);
//   const [selectedTeaserCompany, setSelectedTeaserCompany] = useState(null);
//   const [teaserJobs, setTeaserJobs] = useState([]);
//   const [teaserLoading, setTeaserLoading] = useState(true);
//   const [sidebarOpen, setsidebarOpen] = useState(false);
//   const [mobileActiveCol, setMobileActiveCol] = useState('left'); // 'left' or 'right'
//   const [filingCounts, setFilingCounts] = useState({});

//   const TARGET_NAMES = ['Google', 'Microsoft', 'Meta', 'Amazon', 'Apple'];

//   const S = {
//     page: { display: 'flex', height: '100vh', overflow: 'hidden', background: '#f5f5f7', fontFamily: "'Inter', sans-serif" },
//     sidebar: {
//       width: showSidebarDrawer ? (sidebarOpen ? '280px' : '0') : '260px',
//       minWidth: showSidebarDrawer ? (sidebarOpen ? '280px' : '0') : '260px',
//       background: '#ffffff',
//       borderRight: '1px solid #e8e8e8',
//       display: 'flex',
//       flexDirection: 'column',
//       flexShrink: 0,
//       position: showSidebarDrawer ? 'fixed' : 'relative',
//       zIndex: 9999,
//       height: '100vh',
//       left: 0,
//       top: 0,
//       transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
//       overflow: 'hidden',
//       boxShadow: showSidebarDrawer && sidebarOpen ? '0 0 40px rgba(0,0,0,0.1)' : 'none'
//     },
//     sidebarLogo: { padding: '24px 24px 20px', minWidth: '260px' },
//     sidebarNav: { flex: 1, padding: '0 12px', overflowY: 'auto', minWidth: '260px' },
//     navItem: (active) => ({
//       width: '100%', display: 'flex', alignItems: 'center', gap: '12px',
//       padding: '10px 14px', borderRadius: '12px', fontSize: '14px', fontWeight: active ? 600 : 400,
//       color: active ? '#24385E' : '#666', background: active ? 'rgba(36,56,94,0.07)' : 'transparent',
//       border: 'none', cursor: 'pointer', transition: 'all 180ms ease', marginBottom: '4px',
//       textAlign: 'left',
//     }),
//     sidebarBottom: { padding: '12px 12px 20px', borderTop: '1px solid #efefef', minWidth: '260px' },
//     userRow: { display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 12px 0' },
//     main: { flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' },
//     topBar: {
//       background: '#fff',
//       borderBottom: '1px solid #e8e8e8',
//       display: 'flex',
//       alignItems: 'center',
//       justifyContent: (isMobile || showSidebarDrawer) ? 'space-between' : 'center',
//       gap: '12px',
//       padding: (isMobile || (showSidebarDrawer && windowWidth < 1280)) ? '0 16px' : '11px 24px',
//       height: (isMobile || (showSidebarDrawer && windowWidth < 1280)) ? '60px' : 'auto',
//       flexShrink: 0
//     },
//     content: { flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' },
//     leftCol: {
//       width: isMobile ? '100%' : (windowWidth < 1280 ? '340px' : '460px'),
//       minWidth: isMobile ? '0' : (windowWidth < 1280 ? '340px' : '460px'),
//       background: '#f5f5f7',
//       display: (isMobile && mobileActiveCol === 'right') ? 'none' : 'flex',
//       flexDirection: 'column',
//       overflow: 'hidden',
//       flexShrink: 0
//     },
//     searchWrap: { padding: isMobile ? '16px 12px' : (windowWidth < 1280 ? '16px 14px 10px' : '20px 20px 12px') },
//     searchRow: { display: 'flex', alignItems: 'center', gap: '10px' },
//     searchPill: { flex: 1, display: 'flex', alignItems: 'center', gap: '10px', background: '#fff', border: '1.5px solid #d8d8d8', borderRadius: '60px', padding: '0 16px', height: isMobile ? '46px' : '52px', boxShadow: '0 2px 8px rgba(0,0,0,0.07)' },
//     searchInput: { flex: 1, border: 'none', outline: 'none', fontSize: isMobile ? '14px' : '15px', color: '#333', background: 'transparent', minWidth: 0 },
//     countRow: { padding: '0 20px 8px', textAlign: 'center', fontSize: '13px', color: '#888' },
//     companyList: { flex: 1, overflowY: 'auto', padding: isMobile ? '0 10px 24px' : '0 16px 24px', scrollbarWidth: 'none' },
//     rightCol: {
//       flex: 1,
//       background: '#fff',
//       display: (isMobile && mobileActiveCol === 'left') ? 'none' : 'flex',
//       flexDirection: 'column',
//       overflow: 'hidden'
//     },
//     rightScroll: { flex: 1, overflowY: 'auto', padding: isMobile ? '20px' : '32px 40px', scrollbarWidth: 'none' },
//   };

//   useEffect(() => {
//     (async () => {
//       try {
//         const { data, error } = await supabase
//           .from('job_jobrole_sponsored_sync')
//           .select('*')
//           .in('company', TARGET_NAMES)
//           .order('wage_num', { ascending: false });

//         if (error) throw error;
//         if (!data) return;

//         const grouped = {};
//         TARGET_NAMES.forEach(name => {
//           const companyData = data.filter(j => j.company === name);
//           if (companyData.length > 0) {
//             grouped[name] = {
//               company: name,
//               jobs: companyData.slice(0, 3).map(j => ({ ...j, isTeaser: true })),
//               jobCount: companyData.length,
//               wageLevel: companyData[0].wage_level || 'Lv 2'
//             };
//           }
//         });

//         const list = Object.values(grouped);
//         setTeaserCompanies(list);
//         if (list.length > 0) {
//           setSelectedTeaserCompany(list[0]);
//           setTeaserJobs(list[0].jobs);
//         }
//       } catch (err) {
//         console.error('Teaser fetch error:', err);
//       } finally {
//         setTeaserLoading(false);
//       }
//     })();
//   }, []);

//   // Fetch filing counts for featured companies
//   useEffect(() => {
//     if (teaserCompanies.length === 0) return;
//     const fetchFilings = async () => {
//       try {
//         const names = teaserCompanies.map(c => c.company);
//         const searchNames = [...new Set(names.map(n => normalizeName(n)))];
//         const { data } = await supabase
//           .from('h1b_sponsors')
//           .select('Company, "LCA Filings"')
//           .or(searchNames.map(n => `Company.ilike.%${n}%`).join(','));

//         if (data) {
//           const map = {};
//           // Sort descending so highest match wins
//           const sorted = [...data].sort((a, b) => {
//             const valA = typeof a["LCA Filings"] === 'number' ? a["LCA Filings"] : parseInt(String(a["LCA Filings"]).replace(/,/g, '')) || 0;
//             const valB = typeof b["LCA Filings"] === 'number' ? b["LCA Filings"] : parseInt(String(b["LCA Filings"]).replace(/,/g, '')) || 0;
//             return valB - valA;
//           });

//           sorted.forEach(f => {
//             const norm = normalizeName(f.Company);
//             const count = typeof f["LCA Filings"] === 'number' ? f["LCA Filings"] : parseInt(String(f["LCA Filings"]).replace(/,/g, '')) || 0;

//             map[f.Company.toLowerCase()] = count;
//             if (norm) {
//               if (!map[norm] || map[norm] < count) map[norm] = count;
//               const words = norm.split(' ').filter(Boolean);
//               if (words.length >= 1) {
//                 const firstWord = words[0];
//                 if (firstWord.length > 3 && (!map[firstWord] || map[firstWord] < count)) {
//                   map[firstWord] = count;
//                 }
//               }
//               if (words.length >= 2) {
//                 const firstTwo = words[0] + ' ' + words[1];
//                 if (firstTwo.length > 5 && (!map[firstTwo] || map[firstTwo] < count)) {
//                   map[firstTwo] = count;
//                 }
//               }
//             }
//           });
//           setFilingCounts(map);
//         }
//       } catch (err) { console.error("Teaser filings error:", err); }
//     };
//     fetchFilings();
//   }, [teaserCompanies]);

//   const handleSelect = (c) => {
//     setSelectedTeaserCompany(c);
//     setTeaserJobs(c.jobs);
//     if (isMobile) setMobileActiveCol('right');
//   };

//   return (
//     <div style={S.page}>
//       {isMobile && sidebarOpen && (
//         <div onClick={() => setsidebarOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9998 }} />
//       )}

//       {/* Sidebar */}
//       <aside style={S.sidebar}>
//         <div style={S.sidebarLogo}>
//           <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
//             <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }} onClick={() => navigate('/')}>
//               <div style={{ position: 'relative' }}>
//                 <div style={{ width: '42px', height: '42px', background: '#24385E', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', transform: 'rotate(12deg)' }}>
//                   <span style={{ color: '#fff', fontWeight: 900, fontSize: '10px' }}>H1-B</span>
//                 </div>
//                 <div style={{ position: 'absolute', top: '-4px', right: '-4px', width: '14px', height: '14px', background: '#EAB308', borderRadius: '50%', border: '2px solid #fff' }}></div>
//               </div>
//               <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
//                 <span style={{ fontSize: '20px', fontWeight: 800, color: '#24385E' }}>Wage</span>
//                 <span style={{ fontSize: '20px', fontWeight: 800, color: '#EAB308' }}>Trail</span>
//               </div>
//             </div>
//             {isMobile && (
//               <button onClick={() => setsidebarOpen(false)} style={{ background: 'transparent', border: 'none', color: '#666' }}>
//                 <X size={24} />
//               </button>
//             )}
//           </div>
//         </div>

//         <nav style={S.sidebarNav}>
//           <button style={S.navItem(true)} onClick={() => { if (isMobile) setsidebarOpen(false); }}>
//             <Building2 size={18} strokeWidth={2.2} />
//             <span>Dashboard</span>
//           </button>
//           <button style={S.navItem(false)} onClick={() => { navigate('/pricing'); if (isMobile) setsidebarOpen(false); }}>
//             <Gift size={18} strokeWidth={1.6} />
//             <span>Pricing Plans</span>
//           </button>
//         </nav>

//         <div style={S.sidebarBottom}>
//           <button style={{ ...S.navItem(false), color: '#ef4444' }} onClick={signOut}>
//             <LogOut size={18} strokeWidth={1.6} />
//             <span>Logout</span>
//           </button>
//           <div style={S.userRow}>
//             <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: '#24385E', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700, color: '#fff', flexShrink: 0 }}>
//               {(user?.email?.[0] || 'U').toUpperCase()}
//             </div>
//             <div style={{ minWidth: 0 }}>
//               <p style={{ fontSize: '13px', fontWeight: 600, color: '#1a1a1a', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email?.split('@')[0] || 'User'}</p>
//               <p style={{ fontSize: '11px', color: '#999', margin: 0 }}>Preview Participant</p>
//             </div>
//           </div>
//         </div>
//       </aside>

//       {/* Main Content */}
//       <div style={S.main}>
//         <header style={S.topBar}>
//           {(isMobile || showSidebarDrawer) && (
//             <button onClick={() => setsidebarOpen(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px', marginLeft: '-8px' }}>
//               <Menu size={24} color="#24385E" />
//             </button>
//           )}
//           <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
//             <Building2 size={20} color="#24385E" />
//             <span style={{ fontSize: isMobile ? '13px' : '15px', fontWeight: 700, color: '#1a1a1a' }}>Limited Preview — Unlock Full Access</span>
//           </div>
//           {!isMobile && (
//             <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: '12px' }}>
//               <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#24385E' }} />
//               <div style={{ width: '36px', height: '3px', background: '#24385E', borderRadius: '3px' }} />
//               <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#24385E' }} />
//               <div style={{ width: '36px', height: '3px', background: '#ddd', borderRadius: '3px' }} />
//               <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ddd' }} />
//             </div>
//           )}
//         </header>

//         <div style={S.content}>
//           <div style={S.leftCol}>
//             <div style={S.searchWrap}>
//               <div style={S.searchRow}>
//                 <div style={S.searchPill}>
//                   <Search size={18} color="#94a3b8" />
//                   <input style={S.searchInput} type="text" placeholder="Search companies (Unlock full search)" disabled />
//                 </div>
//               </div>
//             </div>
//             <div style={S.countRow}>Showing <strong style={{ color: '#333' }}>Featured</strong> Human verified companies</div>

//             <div style={S.companyList}>
//               {teaserLoading ? (
//                 <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
//                   <Loader2 className="w-6 h-6 text-[#24385E] animate-spin" />
//                 </div>
//               ) : teaserCompanies.map((c, i) => (
//                 <CompanyCard
//                   key={c.company + i}
//                   company={c.company}
//                   isMobile={isMobile}
//                   isVerified={true}
//                   wageLevel={c.wageLevel}
//                   lca_filings={filingCounts[c.company.toLowerCase()] || filingCounts[normalizeName(c.company)] || (() => { const w = normalizeName(c.company).split(' ').filter(Boolean); return (w.length >= 2 ? filingCounts[w[0] + ' ' + w[1]] : null) || (w.length >= 1 ? filingCounts[w[0]] : null) || 0; })()}
//                   isSelected={selectedTeaserCompany?.company === c.company}
//                   onClick={() => handleSelect(c)}
//                 />
//               ))}

//               <div style={{ marginTop: 24, padding: '24px', background: '#fff', borderRadius: 20, border: '1.5px dashed #d8d8d8', textAlign: 'center' }}>
//                 <Lock size={24} color="#94a3b8" style={{ marginBottom: 12 }} />
//                 <p style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', marginBottom: 6 }}>1,000+ More Companies</p>
//                 <p style={{ fontSize: 11, color: '#64748b', marginBottom: 16 }}>Complete your plan to unlock the full database of sponsoring companies.</p>
//                 <button onClick={() => navigate('/pricing')} style={{ width: '100%', padding: '10px', background: '#24385E', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', fontSize: '13px' }}>Unlock All Companies</button>
//               </div>
//             </div>
//           </div>

//           <div style={S.rightCol}>
//             <div style={S.rightScroll}>
//               {selectedTeaserCompany ? (
//                 <>
//                   {isMobile && (
//                     <button onClick={() => setMobileActiveCol('left')} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', padding: '0 0 16px', color: '#24385E', fontWeight: 700, fontSize: '14px', cursor: 'pointer' }}>
//                       <ChevronLeft size={18} /> Back to list
//                     </button>
//                   )}

//                   <div style={{ background: '#FFF7ED', border: '1.5px solid #FFEDD5', borderRadius: '16px', padding: '20px', marginBottom: '24px', textAlign: 'center' }}>
//                     <p style={{ color: '#9A3412', fontWeight: 800, fontSize: '14px', marginBottom: '8px' }}>🔒 UNLOCK ALL JOBS</p>
//                     <p style={{ color: '#C2410C', fontSize: '12px', fontWeight: 500, marginBottom: '16px' }}>Get access to direct apply links and salary data for {selectedTeaserCompany.company}.</p>
//                     <button onClick={() => navigate('/pricing')} style={{ background: '#2C76FF', color: '#111', fontWeight: 800, padding: '10px 20px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontSize: '13px', width: '100%' }}>Get Full Access →</button>
//                   </div>

//                   <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
//                     <LogoBox name={selectedTeaserCompany.company} size={isMobile ? 50 : 64} fontSize={isMobile ? 16 : 18} />
//                     <div style={{ minWidth: 0 }}>
//                       <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
//                         <h2 style={{ fontSize: isMobile ? 20 : 26, fontWeight: 800, color: '#24385E', margin: 0 }}>{selectedTeaserCompany.company}</h2>
//                         {(() => {
//                           const name = selectedTeaserCompany.company; const cnt = filingCounts[name.toLowerCase()] || filingCounts[normalizeName(name)] || (() => { const w = normalizeName(name).split(' ').filter(Boolean); return (w.length >= 2 ? filingCounts[w[0] + ' ' + w[1]] : null) || (w.length >= 1 ? filingCounts[w[0]] : null) || 0; })(); return cnt > 0 ? (
//                             <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 700, color: '#24385E', background: '#f1f5f9', padding: '3px 8px', borderRadius: '6px' }}>
//                               <Globe size={12} strokeWidth={2.5} />
//                               {cnt.toLocaleString()} Filings
//                             </span>
//                           ) : null;
//                         })()}
//                       </div>
//                       <p style={{ color: '#64748b', margin: 0, fontSize: isMobile ? 12 : 13 }}>{selectedTeaserCompany.jobCount}+ Visa Opportunities Found</p>
//                     </div>
//                   </div>

//                   <div style={{ marginBottom: 32 }}>
//                     <h4 style={{ fontSize: 13, fontWeight: 800, color: '#1a1a1a', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 16 }}>Available Roles</h4>
//                     {teaserJobs.map((job, idx) => (
//                       <CompanyJobCard
//                         key={`${job.id || job.url || 'teaser'}_${idx}`}
//                         job={{ ...job, isVerified: true }}
//                         isMobile={isMobile}
//                         isLandingPage={true}
//                       />
//                     ))}
//                   </div>

//                   <div style={{
//                     padding: isMobile ? '24px' : '40px', background: 'linear-gradient(135deg, #24385E 0%, #1a2b4b 100%)',
//                     borderRadius: 24, textAlign: 'center', color: '#fff', boxShadow: '0 12px 32px rgba(36,56,94,0.2)'
//                   }}>
//                     <Sparkles size={32} color="#2C76FF" style={{ margin: '0 auto 16px' }} />
//                     <h3 style={{ fontSize: isMobile ? 20 : 24, fontWeight: 900, marginBottom: 12 }}>Go Premium</h3>
//                     <p style={{ color: '#94a3b8', marginBottom: 24, fontSize: isMobile ? 14 : 15, maxWidth: 400, margin: '0 auto 24px' }}>
//                       Access direct application links, historical wage data, and exclusive sponsorship insights.
//                     </p>
//                     <button onClick={() => navigate('/pricing')} style={{ padding: '14px 40px', background: '#2C76FF', color: '#24385E', border: 'none', borderRadius: 12, fontWeight: 900, cursor: 'pointer', fontSize: 15 }}>Upgrade Now →</button>
//                   </div>
//                 </>
//               ) : (
//                 <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
//                   <div style={{ textAlign: 'center' }}>
//                     <Building2 size={48} color="#e2e8f0" style={{ marginBottom: 16 }} />
//                     <p style={{ color: '#64748b' }}>Select a company to view roles</p>
//                   </div>
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };


// const JOBS_PER_PAGE = 15;
// const COMPANIES_PER_PAGE = 25;

// const Homepage = () => {
//   const { user, loading: authLoading, subscriptionExpired, signOut, paymentStatus, paymentLoading, refresh: refreshAuth, isAdmin: isAdminFromCtx, role } = useAuth();
//   // Safety net: also check localStorage in case context hasn't hydrated yet
//   const isAdmin = isAdminFromCtx || role === 'admin' || localStorage.getItem('userRole') === 'admin';
//   const navigate = useNavigate();
//   const [isMobile, setIsMobile] = useState(window.innerWidth < 960);
//   const [windowWidth, setWindowWidth] = useState(window.innerWidth);
//   const [showSidebarDrawer, setShowSidebarDrawer] = useState(window.innerWidth < 1280);
//   const [sidebarOpen, setsidebarOpen] = useState(false);
//   const [mobileActiveCol, setMobileActiveCol] = useState('left'); // 'left' or 'right'
//   const [countryFilter, setCountryFilter] = useState('USA');

//   useEffect(() => {
//     const handleResize = () => {
//       const width = window.innerWidth;
//       setWindowWidth(width);
//       const isMob = width < 960;
//       setIsMobile(isMob);
//       const isDrawer = width < 1280;
//       setShowSidebarDrawer(isDrawer);
//       if (!isDrawer) setsidebarOpen(false);
//     };
//     window.addEventListener('resize', handleResize);
//     return () => window.removeEventListener('resize', handleResize);
//   }, []);

//   const handleLogout = async () => {
//     await signOut();
//     navigate('/', { replace: true });
//   };

//   const [activeView, setActiveView] = useState('all_companies');
//   const [companies, setCompanies] = useState([]);
//   const [companiesLoading, setCompaniesLoading] = useState(false);
//   const [companySearch, setCompanySearch] = useState('');
//   const [debouncedCompanySearch, setDebouncedCompanySearch] = useState('');
//   const [totalCompanies, setTotalCompanies] = useState(0);
//   const [companyPage, setCompanyPage] = useState(1);
//   const [sortBy, setSortBy] = useState('highest_wage');
//   const [selectedCompany, setSelectedCompany] = useState(null);
//   const [selectedCompanyData, setSelectedCompanyData] = useState(null);
//   const [companyJobs, setCompanyJobs] = useState([]);
//   const [jobsLoading, setJobsLoading] = useState(false);
//   const [totalCompanyJobs, setTotalCompanyJobs] = useState(0);
//   const [jobPage, setJobPage] = useState(1);
//   const [jobSearch, setJobSearch] = useState('');
//   const [debouncedJobSearch, setDebouncedJobSearch] = useState('');
//   const [jobLevelFilter, setJobLevelFilter] = useState([]);
//   const [savedJobIds, setSavedJobIds] = useState(new Set());
//   const [appliedJobIds, setAppliedJobIds] = useState(new Set());
//   const [allProcessedCompanies, setAllProcessedCompanies] = useState(window._allProcessedCompanies || []);
//   const [isInitialLoadDone, setIsInitialLoadDone] = useState(!!window._allProcessedCompanies);
//   const [levelFilter, setLevelFilter] = useState([]); // Array like ['Lv 1', 'Lv 2']
//   const [showCompanyFilters, setShowCompanyFilters] = useState(false);
//   const [showJobFilters, setShowJobFilters] = useState(false);
//   const [filteredSuggestions, setFilteredSuggestions] = useState([]);
//   const [showSuggestions, setShowSuggestions] = useState(false);
//   const [allRoles, setAllRoles] = useState([]);
//   const [jobFilteredSuggestions, setJobFilteredSuggestions] = useState([]);
//   const [showJobSuggestions, setShowJobSuggestions] = useState(false);
//   const [filingCounts, setFilingCounts] = useState({});
//   const activeCompanyRef = useRef(null);

//   // Sync ref with state
//   useEffect(() => {
//     activeCompanyRef.current = selectedCompany;
//   }, [selectedCompany]);

//   // Moved normalizeName to top level

//   // Fetch filing counts for the current page of companies
//   useEffect(() => {
//     const rawNames = companies.map(c => c.company).filter(Boolean);
//     if (rawNames.length === 0) return;

//     const fetchFilings = async () => {
//       try {
//         // Generate search terms: core name + first two words + first word
//         const searchTerms = new Set();
//         rawNames.forEach(n => {
//           const norm = normalizeName(n);
//           if (norm.length > 2) searchTerms.add(norm);
//           const words = norm.split(' ').filter(Boolean);
//           if (words.length >= 2) searchTerms.add(words.slice(0, 2).join(' '));
//           if (words.length >= 1) searchTerms.add(words[0]);
//         });

//         const searchNames = Array.from(searchTerms).filter(n => n.length > 2);
//         if (searchNames.length === 0) return;

//         // PostgREST .or() filter string uses '*' as the wildcard for ilike
//         const orFilter = searchNames.map(n => `Company.ilike.*${n.replace(/,/g, '\\,')}*`).join(',');

//         const { data, error } = await supabase
//           .from('h1b_sponsors')
//           .select('Company, "LCA Filings"')
//           .or(orFilter);

//         if (error) {
//           console.warn("Filing count fetch error:", error);
//           return;
//         }

//         if (data) {
//           const map = {};
//           // Sort descending so highest match wins for generic terms
//           const sorted = [...data].sort((a, b) => {
//             const valA = typeof a["LCA Filings"] === 'number' ? a["LCA Filings"] : parseInt(String(a["LCA Filings"]).replace(/,/g, '')) || 0;
//             const valB = typeof b["LCA Filings"] === 'number' ? b["LCA Filings"] : parseInt(String(b["LCA Filings"]).replace(/,/g, '')) || 0;
//             return valB - valA;
//           });

//           sorted.forEach(f => {
//             const norm = normalizeName(f.Company);
//             const count = typeof f["LCA Filings"] === 'number' ? f["LCA Filings"] : parseInt(String(f["LCA Filings"]).replace(/,/g, '')) || 0;

//             map[f.Company.toLowerCase()] = count;
//             if (norm) {
//               // If the filing record normalized name starts with our normalized company name (e.g. "merck sharp dohme" starts with "merck")
//               // we should store it under the core name if it's the best count found so far.
//               if (!map[norm] || map[norm] < count) map[norm] = count;

//               const words = norm.split(' ').filter(Boolean);
//               // Also map to the very first word if it's long enough, for extremely aggressive matching (e.g. Merck)
//               if (words.length >= 1) {
//                 const firstWord = words[0];
//                 if (firstWord.length > 3 && (!map[firstWord] || map[firstWord] < count)) {
//                   map[firstWord] = count;
//                 }
//               }
//               if (words.length >= 2) {
//                 const firstTwo = words[0] + ' ' + words[1];
//                 if (firstTwo.length > 5 && (!map[firstTwo] || map[firstTwo] < count)) {
//                   map[firstTwo] = count;
//                 }
//               }
//             }
//           });
//           setFilingCounts(prev => ({ ...prev, ...map }));
//         }
//       } catch (err) { console.error("Error in fetchFilings effect:", err); }
//     };
//     fetchFilings();
//   }, [companies]);


//   // Fetch job roles from Supabase on mount (globally cached)
//   useEffect(() => { fetchJobRoles().then(setAllRoles); }, []);

//   const handleCompanySearchChange = (e) => {
//     const val = e.target.value;
//     setCompanySearch(val);
//     setCompanyPage(1);
//     if (val.trim().length > 0) {
//       // Suggest companies from allProcessedCompanies instead of roles
//       const words = val.toLowerCase().trim().split(/\s+/).filter(w => w.length >= 1);
//       const filteredComps = (allProcessedCompanies || [])
//         .filter(c => {
//           const name = c.company.toLowerCase();
//           return words.every(w => name.includes(w));
//         });

//       // Auto-update right pane synchronously
//       if (filteredComps.length > 0 && selectedCompany !== filteredComps[0].company) {
//         setSelectedCompany(filteredComps[0].company);
//         setSelectedCompanyData(filteredComps[0]);
//       }

//       const filtered = filteredComps.slice(0, 8).map(c => c.company);

//       setFilteredSuggestions(filtered);
//       setShowSuggestions(filtered.length > 0);
//     } else {
//       setFilteredSuggestions([]);
//       setShowSuggestions(false);
//     }
//   };

//   const handleJobSearchChange = (e) => {
//     const val = e.target.value;
//     setJobSearch(val);
//     setJobPage(1);
//     if (val.trim().length > 0) {
//       const filtered = filterRoles(allRoles, val, 8);
//       setJobFilteredSuggestions(filtered);
//       setShowJobSuggestions(filtered.length > 0);
//     } else {
//       setJobFilteredSuggestions([]);
//       setShowJobSuggestions(false);
//     }
//   };

//   // Ensure robust clearing/setting on explicit suggestion click
//   const handleSuggestionClick = (companyName) => {
//     setCompanySearch(companyName);
//     setDebouncedCompanySearch(companyName);
//     setShowSuggestions(false);
//     setCompanyPage(1);
//     // Explicit override without async interference
//     setSelectedCompany('');
//     setTimeout(() => {
//       setSelectedCompany(companyName);
//       const found = allProcessedCompanies.find(c => c.company === companyName);
//       if (found) setSelectedCompanyData(found);
//     }, 10);
//   };

//   const handleJobSuggestionClick = (role) => {
//     setJobSearch(role);
//     setDebouncedJobSearch(role); // Instant update on select
//     setShowJobSuggestions(false);
//     setJobPage(1);
//     fetchCompanyJobs(1, role, jobLevelFilter); // Explicit call to avoid a 'nothing' moment
//   };

//   useEffect(() => { const t = setTimeout(() => setDebouncedCompanySearch(companySearch), 400); return () => clearTimeout(t); }, [companySearch]);
//   useEffect(() => { const t = setTimeout(() => setDebouncedJobSearch(jobSearch), 400); return () => clearTimeout(t); }, [jobSearch]);

//   const fetchCompanies = useCallback(async () => {
//     if (!user || subscriptionExpired || paymentLoading || (paymentStatus === 'pending' && !isAdmin)) return;

//     // ── 1. In-memory cache hit (fastest — no re-render needed) ──────────────
//     if (isInitialLoadDone && allProcessedCompanies.length > 0) {
//       let arr = [...allProcessedCompanies];
//       if (debouncedCompanySearch && debouncedCompanySearch.trim()) {
//         const words = debouncedCompanySearch.toLowerCase().trim().split(/\s+/).filter(w => w.length >= 1);
//         arr = arr.filter(n => {
//           const name = n.company.toLowerCase();
//           const words = debouncedCompanySearch.toLowerCase().trim().split(/\s+/).filter(w => w.length >= 1);
//           // Rule: (Title contains ALL words) OR (At least one Role contains ALL words)
//           const nameMatches = words.every(w => name.includes(w));
//           const roleMatches = (n.industries || []).some(role => {
//             const r = role.toLowerCase();
//             return words.every(w => r.includes(w));
//           });
//           return nameMatches || roleMatches;
//         });
//       }
//       if (levelFilter && levelFilter.length > 0) {
//         arr = arr.filter(n => {
//           // If no levels are tracked yet (preliminary load), use the max level as before
//           if (!n.wageLevels || n.wageLevels.size === 0) return levelFilter.includes(n.wageLevel);
//           // Otherwise, show company if ANY of its levels match the filter
//           return levelFilter.some(lvl => n.wageLevels.has(lvl));
//         });
//       }
//       // Consolidated filter logic above replaces the redundant blocks here
//       // Primary sort: Famous first. Secondary sort: Selected criteria.
//       arr.sort((a, b) => {
//         if (sortBy === 'highest_wage') {
//           if (b.maxWageNum !== a.maxWageNum) return b.maxWageNum - a.maxWageNum;
//         }
//         const aFamous = isFamous(a.company);
//         const bFamous = isFamous(b.company);
//         if (aFamous && !bFamous) return -1;
//         if (!aFamous && bFamous) return 1;
//         return a.company.localeCompare(b.company);
//       });
//       setTotalCompanies(arr.length);
//       const from = (companyPage - 1) * COMPANIES_PER_PAGE;
//       const paginated = arr.slice(from, from + COMPANIES_PER_PAGE);
//       setCompanies(paginated);
//       if (!isMobile && paginated.length > 0) {
//         if (debouncedCompanySearch && debouncedCompanySearch.trim().length > 0) {
//           if (selectedCompany !== paginated[0].company) {
//             setSelectedCompany(paginated[0].company);
//             setSelectedCompanyData(paginated[0]);
//           }
//         } else if (!selectedCompany || !arr.some(c => c.company === selectedCompany)) {
//           setSelectedCompany(paginated[0].company);
//           setSelectedCompanyData(paginated[0]);
//         }
//       }
//       return;
//     }

//     // ── 2. sessionStorage cache hit (survives navigation, avoids full re-fetch) ──
//     try {
//       const cached = sessionStorage.getItem('_companiesCache_v10');
//       if (cached) {
//         const parsed = JSON.parse(cached);
//         if (parsed && parsed.length > 0) {
//           window._allProcessedCompanies = parsed;
//           setAllProcessedCompanies(parsed);
//           setIsInitialLoadDone(true);
//           let arr = [...parsed];
//           if (debouncedCompanySearch && debouncedCompanySearch.trim()) {
//             const words = debouncedCompanySearch.toLowerCase().trim().split(/\s+/).filter(w => w.length >= 1);
//             arr = arr.filter(n => {
//               const name = n.company.toLowerCase();
//               const nameMatches = words.every(w => name.includes(w));
//               const roleMatches = (n.industries || []).some(role => {
//                 const r = role.toLowerCase();
//                 return words.every(w => r.includes(w));
//               });
//               return nameMatches || roleMatches;
//             });
//           }
//           if (levelFilter && levelFilter.length > 0) {
//             arr = arr.filter(n => {
//               if (!n.wageLevels || n.wageLevels.length === 0) return levelFilter.includes(n.wageLevel);
//               // Handle both Set (from live processing) and Array (from JSON parse)
//               const levels = Array.isArray(n.wageLevels) ? new Set(n.wageLevels) : n.wageLevels;
//               return levelFilter.some(lvl => levels.has(lvl));
//             });
//           }
//           // Priority Sort: Famous First
//           arr.sort((a, b) => {
//             if (sortBy === 'highest_wage') {
//               if (b.maxWageNum !== a.maxWageNum) return b.maxWageNum - a.maxWageNum;
//             }
//             const aFamous = isFamous(a.company);
//             const bFamous = isFamous(b.company);
//             if (aFamous && !bFamous) return -1;
//             if (!aFamous && bFamous) return 1;
//             return a.company.localeCompare(b.company);
//           });
//           setTotalCompanies(arr.length);
//           const paginated = arr.slice(0, COMPANIES_PER_PAGE);
//           setCompanies(paginated);
//           if (!isMobile && paginated.length > 0) {
//             if (debouncedCompanySearch && debouncedCompanySearch.trim().length > 0) {
//               if (selectedCompany !== paginated[0].company) {
//                 setSelectedCompany(paginated[0].company);
//                 setSelectedCompanyData(paginated[0]);
//               }
//             } else if (!selectedCompany || !arr.some(c => c.company === selectedCompany)) {
//               setSelectedCompany(paginated[0].company);
//               setSelectedCompanyData(paginated[0]);
//             }
//           }
//           return;
//         }
//       }
//     } catch (e) { /* sessionStorage may be unavailable */ }

//     if (paymentStatus !== 'paid' && paymentStatus !== 'active') return;

//     setCompaniesLoading(true);
//     try {
//       // ── 3. FAST FIRST PAGE: Show initial companies quickly (single query, no pagination loops) ──

//       const fetchAllConfirmed = async (tableName) => {
//         const records = [];
//         let pg = 0;
//         while (true) {
//           const { data, error } = await supabase
//             .from(tableName)
//             .select('company, role, domain, salary, remarks')
//             .eq('tl_confirmation', 'yes')
//             .range(pg * 1000, (pg + 1) * 1000 - 1);
//           if (error || !data || data.length === 0) break;
//           data.forEach(r => r.company && records.push(r));
//           if (data.length < 1000) break;
//           pg++;
//         }
//         return records;
//       };

//       const [backupResults, jobsRes] = await Promise.all([
//         fetchAllConfirmed('audit_reviews_backup'),
//         supabase.from('job_jobrole_sponsored_sync').select('company, job_role_name, wage_level, wage_num').limit(5000)
//       ]);

//       const allVerified = [...backupResults];
//       const confirmedNames = Array.from(new Set(allVerified.map(r => r.company))).filter(Boolean);

//       let jobData = jobsRes.data || [];

//       // If jobs table has more than 5000, fetch remaining pages in background
//       if (jobData.length === 5000) {
//         // Show first-page results immediately using the data we have, then fill in more
//         buildAndSetCompanies(confirmedNames, jobData, allVerified, true);

//         // Background: fetch remaining pages without blocking UI
//         let p = 1;
//         const delay = (ms) => new Promise(res => setTimeout(res, ms));
//         while (p <= 20) { // Cap at 100k jobs (20 * 5000) to be safe
//           await delay(300); // Small cooldown
//           const { data: moreJobs } = await supabase
//             .from('job_jobrole_sponsored_sync')
//             .select('company, job_role_name, wage_level, wage_num')
//             .range(p * 5000, (p + 1) * 5000 - 1);
//           if (!moreJobs || moreJobs.length === 0) break;
//           jobData = jobData.concat(moreJobs);
//           if (moreJobs.length < 5000) break;
//           p++;
//         }
//       }

//       buildAndSetCompanies(confirmedNames, jobData, allVerified, false);

//     } catch (err) {
//       if (!err.message?.includes('fetch') && window.navigator.onLine) {
//         console.error("fetchCompanies Error:", err);
//       }
//     } finally {
//       setCompaniesLoading(false);
//     }

//     function buildAndSetCompanies(confirmedNames, jobData, allVerified = [], preliminary) {
//       const companyStats = new Map();
//       const normToOrig = new Map();

//       confirmedNames.forEach(name => {
//         const stats = { company: name, jobCount: 0, maxWageNum: 0, wageLevel: 'Lv 1', wageLevels: new Set(), industries: new Set() };
//         companyStats.set(name, stats);
//         const norm = normalizeName(name);
//         if (norm && !normToOrig.has(norm)) normToOrig.set(norm, name);
//       });

//       const getHeuristicLevel = (title, salary) => {
//         // Disabled heuristic: DOL Wage Levels depend entirely on SOC codes and location prevailing wages, not absolute salary scale or internal job titles.
//         return 0;
//       };

//       const getStatsFor = (rawName) => {
//         if (!rawName) return null;
//         if (companyStats.has(rawName)) return companyStats.get(rawName);
//         const norm = normalizeName(rawName);
//         if (normToOrig.has(norm)) return companyStats.get(normToOrig.get(norm));
//         return null;
//       };

//       allVerified.forEach(v => {
//         const s = getStatsFor(v.company);
//         if (s) {
//           s.jobCount++;
//           if (v.role) s.industries.add(v.role);
//           if (v.domain) s.industries.add(v.domain);
//           const rawLevel = String(v.wage_level || v.salary_level || v.salary || v.remarks || '').toUpperCase();
//           let wageNum = 0;
//           const explicitMatch = rawLevel.match(/LV\s*(\d)/) || rawLevel.match(/LEVEL\s*(\d)/);
//           if (explicitMatch) wageNum = parseInt(explicitMatch[1]);
//           else if (rawLevel.match(/\bIV\b/) || rawLevel.match(/\bLEVEL 4\b/)) wageNum = 4;
//           else if (rawLevel.match(/\bIII\b/) || rawLevel.match(/\bLEVEL 3\b/)) wageNum = 3;
//           else if (rawLevel.match(/\bII\b/) || rawLevel.match(/\bLEVEL 2\b/)) wageNum = 2;
//           else if (rawLevel.match(/\bI\b/) || rawLevel.match(/\bLEVEL 1\b/)) wageNum = 1;
//           if (wageNum === 0) wageNum = 2; // safely fallback to Lv 2
//           s.wageLevels.add(`Lv ${wageNum}`);
//           if (wageNum > s.maxWageNum) {
//             s.maxWageNum = wageNum;
//             s.wageLevel = `Lv ${wageNum}`;
//           }
//         }
//       });

//       jobData.forEach(j => {
//         const s = getStatsFor(j.company);
//         if (s) {
//           s.jobCount++;
//           let currentWage = parseInt(j.wage_num || j.wage_level?.match(/\d/)?.[0] || '0');
//           if (currentWage === 0) currentWage = 2; // safely fallback to Lv 2
//           s.wageLevels.add(`Lv ${currentWage}`);
//           if (currentWage > s.maxWageNum) {
//             s.maxWageNum = currentWage;
//             s.wageLevel = `Lv ${currentWage}`;
//           }
//           if (j.job_role_name) {
//             const roles = j.job_role_name.split(',').map(r => r.trim()).filter(Boolean);
//             roles.forEach(r => s.industries.add(r));
//           }
//         }
//       });

//       let finalArr = Array.from(companyStats.values());

//       if (debouncedCompanySearch && debouncedCompanySearch.trim()) {
//         const words = debouncedCompanySearch.toLowerCase().trim().split(/\s+/).filter(w => w.length >= 1);
//         finalArr.forEach(c => {
//           const industriesArr = Array.from(c.industries);
//           industriesArr.sort((a, b) => {
//             const aLower = a.toLowerCase();
//             const bLower = b.toLowerCase();
//             const aMatch = words.every(w => aLower.includes(w));
//             const bMatch = words.every(w => bLower.includes(w));
//             if (aMatch && !bMatch) return -1;
//             if (!aMatch && bMatch) return 1;
//             return 0;
//           });
//           c.industries = industriesArr; // Keep full list for strict filtering
//         });
//       } else {
//         finalArr.forEach(c => {
//           c.industries = Array.from(c.industries); // Keep full list
//         });
//       }

//       // Final sorting with Famous Priority
//       finalArr.sort((a, b) => {
//         if (sortBy === 'highest_wage') {
//           if (b.maxWageNum !== a.maxWageNum) return b.maxWageNum - a.maxWageNum;
//         }
//         const aFamous = isFamous(a.company);
//         const bFamous = isFamous(b.company);
//         if (aFamous && !bFamous) return -1;
//         if (!aFamous && bFamous) return 1;
//         return a.company.localeCompare(b.company);
//       });

//       window._allProcessedCompanies = finalArr;
//       setAllProcessedCompanies(finalArr);
//       if (!preliminary) {
//         setIsInitialLoadDone(true);
//         try {
//           // Sets don't stringify to JSON arrays automatically, so we map them
//           const serializable = finalArr.map(c => ({ ...c, industries: Array.from(c.industries), wageLevels: Array.from(c.wageLevels) }));
//           sessionStorage.setItem('_companiesCache_v10', JSON.stringify(serializable));
//         } catch (e) { }
//       }

//       let viewArr = finalArr;
//       if (debouncedCompanySearch && debouncedCompanySearch.trim()) {
//         const words = debouncedCompanySearch.toLowerCase().trim().split(/\s+/).filter(w => w.length >= 1);
//         viewArr = viewArr.filter(n => {
//           const name = n.company.toLowerCase();
//           const nameMatches = words.every(w => name.includes(w));
//           const roleMatches = (n.industries || []).some(role => {
//             const r = role.toLowerCase();
//             return words.every(w => r.includes(w));
//           });
//           return nameMatches || roleMatches;
//         });
//       }
//       if (levelFilter && levelFilter.length > 0) {
//         viewArr = viewArr.filter(n => levelFilter.includes(n.wageLevel));
//       }
//       setTotalCompanies(viewArr.length);
//       const from = (companyPage - 1) * COMPANIES_PER_PAGE;
//       const paginated = viewArr.slice(from, from + COMPANIES_PER_PAGE);
//       setCompanies(paginated);
//       if (!isMobile && paginated.length > 0) {
//         if (debouncedCompanySearch && debouncedCompanySearch.trim().length > 0) {
//           if (selectedCompany !== paginated[0].company) {
//             setSelectedCompany(paginated[0].company);
//             setSelectedCompanyData(paginated[0]);
//           }
//         } else if (!selectedCompany || !viewArr.some(c => c.company === selectedCompany)) {
//           setSelectedCompany(paginated[0].company);
//           setSelectedCompanyData(paginated[0]);
//         }
//       }
//     }
//   }, [user, subscriptionExpired, paymentStatus, paymentLoading, debouncedCompanySearch, sortBy, companyPage, isInitialLoadDone, allProcessedCompanies, selectedCompany, levelFilter]);

//   const fetchCompanyJobs = useCallback(async (pageOverride, searchOverride, levelOverride) => {
//     if (!user || !selectedCompany || (paymentStatus !== 'paid' && paymentStatus !== 'pending' && paymentStatus !== 'active') || subscriptionExpired) return;

//     const page = pageOverride || jobPage;
//     // Use the specific right-panel job search IF it exists, otherwise use the main left-panel company filter
//     const search = (searchOverride !== undefined) ? searchOverride : jobSearch;
//     const level = levelOverride || jobLevelFilter;

//     // --- Cache check (bump version to invalidate any stale pre-fix cache) ---
//     if (!window._companyJobsCache) window._companyJobsCache = new Map();
//     const cacheKey = `v2|${selectedCompany}|${page}|${search}|${level}`;
//     const cached = window._companyJobsCache.get(cacheKey);
//     if (cached) {
//       setCompanyJobs(cached.jobs);
//       setTotalCompanyJobs(cached.total);
//       return;
//     }

//     setJobsLoading(true);
//     setCompanyJobs([]); // Immediate clear to prevent stale flash
//     try {
//       const from = (page - 1) * JOBS_PER_PAGE;
//       const to = from + JOBS_PER_PAGE - 1;

//       // 1. Sponsored jobs query
//       let q1 = supabase.from('job_jobrole_sponsored_sync').select('*', { count: 'exact' }).eq('company', selectedCompany);
//       if (search && search.trim()) {
//         const words = search.trim().split(/\s+/).filter(w => w.length >= 1);
//         if (words.length > 0) {
//           const titleCond = `and(${words.map(w => `title.ilike.%${w}%`).join(',')})`;
//           q1 = q1.or(`${titleCond}`);
//         }
//       }
//       if (level && level.length > 0) {
//         const expanded = level.flatMap(l => {
//           const n = l.match(/\d/)?.[0];
//           if (!n) return [l];
//           const roman = { '1': 'I', '2': 'II', '3': 'III', '4': 'IV' }[n];
//           return [l, `Level ${n}`, `Level ${roman}`, n, `Lv ${n}`, `Lv${n}`];
//         });
//         q1 = q1.in('wage_level', expanded);
//       }



//       // 3. Audit reviews backup (human verified)
//       let q3 = supabase.from('audit_reviews_backup').select('*').eq('company', selectedCompany).eq('tl_confirmation', 'yes');
//       if (search && search.trim()) {
//         const words = search.trim().split(/\s+/).filter(w => w.length >= 1);
//         if (words.length > 0) {
//           // backup has no title, but we allow company match. Role search disabled as per 'strictly title' requirement.
//           q3 = q3.filter('domain', 'ilike', '%NON_EXISTENT_NONE%');
//         }
//       }

//       const [resSponsored, resBackup] = await Promise.all([
//         q1.order('wage_num', { ascending: false, nullsFirst: false }).order('date_posted', { ascending: false }),
//         q3.order('audit_date', { ascending: false })
//       ]);

//       // ── Normalize helper ──────────────────────────────────────────────────────
//       const _normR = (s) => String(s || '').toLowerCase()
//         .replace(/[-–—]/g, ' ').replace(/\s+/g, ' ').trim();

//       const _urlKey = (u) => {
//         if (!u) return '';
//         let s = String(u).toLowerCase().trim();
//         try {
//           const urlObj = new URL(s.startsWith('http') ? s : `https://${s}`);
//           let p = (urlObj.hostname + urlObj.pathname).replace(/^www\./, '').replace(/\/$/, '');
//           // Extract job ID (9+ digits) to handle LinkedIn title slugs
//           const m = p.match(/\d{9,}/);
//           if (m) return urlObj.hostname.replace(/^www\./, '') + '||' + m[0];
//           return p;
//         } catch {
//           return s.split('?')[0].split('#')[0].replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, '');
//         }
//       };

//       // Job key for deduplication: STRICT Logical Identity (Company + Title + Location)
//       // We no longer use URL as a key differentiator because duplicate listings often use different tracking URLs
//       const _lvlKey = (lv) => {
//         if (!lv) return '';
//         const m = String(lv).match(/\d/);
//         return m ? m[0] : '';
//       };

//       const _jobKey = (j) => {
//         const co = String(j.company || selectedCompany || '').toLowerCase().trim();
//         const ti = _normR(j.title || '');
//         const lo = _normR(j.location || 'us');
//         return `${co}||${ti}||${lo}`;
//       };

//       // Role key for verification lookup: Company + Domain/Role
//       const _roleKey = (j) => {
//         const co = String(j.company || selectedCompany || '').toLowerCase().trim();
//         const ro = _normR(j.job_role_name || j.role || '');
//         return `${co}||${ro}`;
//       };

//       // ── Pass 1: Flatten + dedup verified jobs (sync + backup) ────────────────
//       const allVerifiedRaw = [
//         ...(resBackup.data || [])
//       ].map(r => ({
//         ...r,
//         title: null, // Strictly from sponsored table only
//         url: r.job_link,
//         date_posted: r.audit_date,
//         job_role_name: r.domain,
//         isVerified: true,
//         isTeaser: paymentStatus === 'pending',
//         job_id: r.job_id || r.id,
//       }));

//       // Dedup verified jobs by role key — sync and backup share the same records
//       const verifiedByRole = new Map(); // roleKey → job
//       allVerifiedRaw.forEach(v => {
//         const rk = _roleKey(v);
//         const existing = verifiedByRole.get(rk);
//         if (!existing) {
//           verifiedByRole.set(rk, v);
//         } else {
//           // Merge: keep richest salary/wage data
//           verifiedByRole.set(rk, {
//             ...existing, ...v,
//             salary: existing.salary || v.salary,
//             wage_level: existing.wage_level || v.wage_level,
//             url: existing.url || v.url,
//             isVerified: true,
//           });
//         }
//       });
//       const verifiedJobs = Array.from(verifiedByRole.values());

//       // ── Pass 1.5: DEEP FETCH sponsored metadata for ALL verified links ────────
//       // This ensures we have the 'title' column for 100% of verified data
//       const deepUrls = [...new Set(allVerifiedRaw.map(v => v.url))].filter(Boolean);
//       const deepIds = [...new Set(allVerifiedRaw.map(v => v.job_id))].filter(Boolean);
//       let deepSponsored = [];
//       if (deepUrls.length > 0 || deepIds.length > 0) {
//         const idNumList = deepIds.map(id => parseInt(id)).filter(n => !isNaN(n));
//         const queries = [
//           deepUrls.length > 0 ? supabase.from('job_jobrole_sponsored_sync').select('*').in('url', deepUrls) : null,
//           idNumList.length > 0 ? supabase.from('job_jobrole_sponsored_sync').select('*').in('id', idNumList) : null,
//           deepIds.length > 0 ? supabase.from('job_jobrole_sponsored_sync').select('*').in('jobId', deepIds) : null
//         ].filter(Boolean);
//         const results = await Promise.all(queries);
//         results.forEach(r => { if (r.data) deepSponsored.push(...r.data); });
//       }

//       // Build a set of verified URLs and job_ids from audit_reviews_backup
//       // so we can filter sponsored jobs to ONLY those that are confirmed
//       const verifiedUrls = new Set();
//       const verifiedJobIds = new Set();
//       allVerifiedRaw.forEach(v => {
//         if (v.url) verifiedUrls.add(_urlKey(v.url));
//         if (v.job_id) verifiedJobIds.add(String(v.job_id));
//       });

//       const allSponsoredRaw = (resSponsored.data || []).map(j => ({
//         ...j,
//         job_id: j.id,
//         title: j.title, // Take the raw title column
//         role: j.job_role_name,
//         isTeaser: paymentStatus === 'pending',
//       }));

//       // Filter: only keep sponsored jobs that have a matching verified record
//       const sponsoredJobs = allSponsoredRaw.filter(j => {
//         const uk = _urlKey(j.url);
//         const jid = String(j.job_id || j.id || '');
//         const jobIdField = String(j.jobId || '');
//         return (uk && verifiedUrls.has(uk)) ||
//                (jid && verifiedJobIds.has(jid)) ||
//                (jobIdField && verifiedJobIds.has(jobIdField)) ||
//                verifiedByRole.has(_roleKey(j));
//       });

//       // ── Pass 2: Map deep-fetched titles BACK to verified records ────────────
//       // This is the critical step: verified jobs must "know" their title and level before deduplication
//       const metaMap = new Map();
//       [...allSponsoredRaw, ...deepSponsored].forEach(s => {
//         const uk = _urlKey(s.url);
//         if (uk) metaMap.set('u:' + uk, s);
//         if (s.id) metaMap.set('i:' + s.id, s);
//         if (s.jobId) metaMap.set('j:' + s.jobId, s);
//       });

//       verifiedJobs.forEach(v => {
//         const uk = _urlKey(v.url);
//         let meta = metaMap.get('u:' + uk) || metaMap.get('i:' + v.job_id) || metaMap.get('j:' + v.job_id);

//         // STRICT SAFETY: Prevent cross-company data leakage!
//         // If an auditor pasted a link for Company B into Company A, reject the metadata to prevent UI contamination.
//         if (meta && meta.company && selectedCompany && _normR(meta.company) !== _normR(selectedCompany)) {
//           const mWords = _normR(meta.company).split(' ').filter(Boolean);
//           const sWords = _normR(selectedCompany).split(' ').filter(Boolean);
//           // Allow loose match (e.g. "Oracle" vs "Oracle America Inc")
//           const looseMatch = mWords.length > 0 && sWords.length > 0 && (mWords[0] === sWords[0]);
//           if (!looseMatch) {
//             meta = null; // Reject corrupted metadata match
//           }
//         }

//         if (meta) {
//           v.title = meta.title;
//           v.id = meta.id;
//           v.wage_level = meta.wage_level || v.wage_level;
//           v.location = meta.location || v.location;
//           v.salary = meta.salary || v.salary;
//         } else {
//           // Fallback matching by company + normalized role/domain
//           const companyJobs = deepSponsored.filter(j => j.company === v.company || j.company === selectedCompany);
//           const vRole = _normR(v.role || v.domain || '');
//           const bestMatch = companyJobs.find(j => _normR(j.title).includes(vRole) || _normR(j.job_role_name).includes(vRole));
//           if (bestMatch) {
//             v.title = bestMatch.title;
//             v.id = bestMatch.id;
//             v.wage_level = bestMatch.wage_level || v.wage_level;
//           }
//         }
//         if (!v.location) v.location = 'united states';
//       });

//       // ── Pass 3: Combine jobs into unique map ────────────────────────────────
//       // Use logical Job Identity (Company + Title + Location) as the primary key
//       // to eliminate duplicates that have different tracking URLs but same content.
//       const finalMap = new Map();

//       // 1. Process sponsored jobs
//       sponsoredJobs.forEach(j => {
//         if (!j.location) j.location = 'united states';
//         const jk = _jobKey(j);
//         const existing = finalMap.get(jk);

//         const curLvl = parseInt(_lvlKey(j.wage_level || j.wage_num) || '1');
//         const exLvl = existing ? parseInt(_lvlKey(existing.wage_level || existing.wage_num) || '0') : 0;

//         // If we have a duplicate link in the pool, keep the one with better metadata (higher level or has salary)
//         if (!existing || curLvl > exLvl || (!existing.salary && j.salary)) {
//           finalMap.set(jk, {
//             ...j,
//             isVerified: verifiedByRole.has(_roleKey(j))
//           });
//         }
//       });

//       // 2. Process verified jobs (merge or add)
//       verifiedJobs.forEach(v => {
//         const jk = _jobKey(v);
//         const existing = finalMap.get(jk);
//         if (!existing) {
//           finalMap.set(jk, v);
//         } else {
//           // Merge verified status and richer data into the sponsored entry
//           const curLvl = parseInt(_lvlKey(v.wage_level) || '1');
//           const exLvl = parseInt(_lvlKey(existing.wage_level) || '1');

//           finalMap.set(jk, {
//             ...existing,
//             ...v,
//             isVerified: true,
//             salary: existing.salary || v.salary,
//             wage_level: exLvl >= curLvl ? existing.wage_level : v.wage_level,
//             url: existing.url || v.url,
//             // Strictly prefer the sponsored title
//             title: existing.title || v.title,
//             job_id: existing.job_id || v.job_id,
//           });
//         }
//       });

//       let unique = Array.from(finalMap.values());

//       // ── pass 4: STRICT EXACT NORMALIZED MATCHING (v11) ──
//       if (search && search.trim()) {
//         const n = (s) => String(s || '').toLowerCase()
//           .replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "")
//           .trim()
//           .replace(/\s+/g, ' ');
//         const nS = n(search);
//         unique = unique.filter(j => {
//           // Field Lockdown: Match only the primary displayed title
//           const primaryTitle = j.title || '';
//           return n(primaryTitle) === nS;
//         });
//       }

//       // --- STRICT LEVEL FILTER (Post-merge) ---
//       if (level && level.length > 0) {
//         const allowedDigits = new Set(level.map(l => l.match(/\d/)?.[0]).filter(Boolean));
//         unique = unique.filter(j => {
//           const jobLvlMatch = String(j.wage_level || '').match(/\d/);
//           let jobLvl = jobLvlMatch ? jobLvlMatch[0] : null;
//           if (!jobLvl) {
//             const s = String(j.wage_level || '').toUpperCase();
//             if (s.match(/\bIV\b/) || s.includes('LEVEL 4')) jobLvl = '4';
//             else if (s.match(/\bIII\b/) || s.includes('LEVEL 3')) jobLvl = '3';
//             else if (s.match(/\bII\b/) || s.includes('LEVEL 2')) jobLvl = '2';
//             else if (s.match(/\bI\b/) || s.includes('LEVEL 1')) jobLvl = '1';
//           }
//           return jobLvl && allowedDigits.has(jobLvl);
//         });
//       }

//       const total = paymentStatus === 'pending' ? Math.min(2, unique.length) : unique.length;

//       // Final Priority Sort: (0) Wage Level (if filtered), (1) Salary First, (2) Verified, (3) Newest
//       unique.sort((a, b) => {
//         // Explictly sort Lv 1 mathematically above Lv 2 when multiple levels selected
//         if (level && level.length > 1) {
//           const getLv = (j) => {
//             const m = String(j.wage_level || j.wage_num || '').match(/\d/);
//             return m ? parseInt(m[0]) : 99;
//           };
//           const wA = getLv(a);
//           const wB = getLv(b);
//           if (wA !== wB) return wA - wB;
//         }

//         const hasSal = (s) => s && s.includes('$');
//         const aHasSal = hasSal(a.salary);
//         const bHasSal = hasSal(b.salary);
//         if (aHasSal && !bHasSal) return -1;
//         if (!aHasSal && bHasSal) return 1;

//         if (a.isVerified && !b.isVerified) return -1;
//         if (!a.isVerified && b.isVerified) return 1;

//         const dateA = new Date(a.date_posted || 0).getTime();
//         const dateB = new Date(b.date_posted || 0).getTime();
//         return dateB - dateA;
//       });

//       // Fetch filing count for this company to show on cards
//       let lcaCount = 0;
//       const { data: sData } = await supabase
//         .from('h1b_sponsors')
//         .select('"LCA Filings"')
//         .ilike('Company', `%${selectedCompany}%`)
//         .limit(1);

//       if (sData && sData[0]) {
//         const val = sData[0]["LCA Filings"];
//         lcaCount = typeof val === 'number' ? val : parseInt(String(val || 0).replace(/,/g, '')) || 0;
//       }

//       const jobsWithFilings = unique.map(j => ({
//         ...j,
//         lca_filings: lcaCount,
//         isTeaser: paymentStatus === 'pending'
//       }));

//       const pagedUnique = jobsWithFilings.slice(from, to + 1);

//       setCompanyJobs(pagedUnique);
//       setJobsLoading(false);

//       // (B) Update wage level badges on both panels from the actual fetched jobs
//       // Extract all wage levels from the FULL job list (not just the paged subset)
//       const discoveredLevels = new Set();
//       jobsWithFilings.forEach(j => {
//         const m = String(j.wage_level || j.wage_num || '').match(/\d/);
//         if (m) discoveredLevels.add(`Lv ${m[0]}`);
//       });
//       if (discoveredLevels.size > 0) {
//         // Update right panel header badges
//         setSelectedCompanyData(prev => {
//           if (!prev) return prev;
//           const existing = prev.wageLevels
//             ? (Array.isArray(prev.wageLevels) ? new Set(prev.wageLevels) : (prev.wageLevels instanceof Set ? new Set(prev.wageLevels) : new Set()))
//             : new Set();
//           let changed = false;
//           discoveredLevels.forEach(l => { if (!existing.has(l)) { existing.add(l); changed = true; } });
//           if (!changed) return prev;
//           return { ...prev, wageLevels: existing };
//         });
//         // Update left panel CompanyCard badges for the current page
//         setCompanies(prev => prev.map(c => {
//           if (c.company !== selectedCompany) return c;
//           const existing = c.wageLevels
//             ? (Array.isArray(c.wageLevels) ? new Set(c.wageLevels) : (c.wageLevels instanceof Set ? new Set(c.wageLevels) : new Set()))
//             : new Set();
//           let changed = false;
//           discoveredLevels.forEach(l => { if (!existing.has(l)) { existing.add(l); changed = true; } });
//           if (!changed) return c;
//           return { ...c, wageLevels: existing };
//         }));
//       }

//       // (A) Calculate wage_level for paged verified-only jobs
//       const jobsNeedingWage = pagedUnique.filter(j => !j.wage_level);
//       if (jobsNeedingWage.length > 0) {
//         await Promise.all(jobsNeedingWage.map(async (j) => {
//           try {
//             const occupation = j.title || '';
//             const location = j.location || '';
//             if (!occupation || occupation === 'null') return;
//             const results = await getWageLevel(occupation, location, j.salary);
//             if (results && results.length > 0) {
//               j.wage_level = results[0]['Wage Level'] || 'Lv 2';
//               j.wage_num = parseInt(j.wage_level.match(/\d/)?.[0] || '2');
//             }
//           } catch (err) {
//             // Silently fail
//           }
//         }));
//         setCompanyJobs([...pagedUnique]); // Update state once enriched
//         // Also update badges with any newly enriched wage levels
//         const enrichedLevels = new Set();
//         pagedUnique.forEach(j => {
//           const m = String(j.wage_level || j.wage_num || '').match(/\d/);
//           if (m) enrichedLevels.add(`Lv ${m[0]}`);
//         });
//         if (enrichedLevels.size > 0) {
//           setSelectedCompanyData(prev => {
//             if (!prev) return prev;
//             const existing = prev.wageLevels
//               ? (Array.isArray(prev.wageLevels) ? new Set(prev.wageLevels) : (prev.wageLevels instanceof Set ? new Set(prev.wageLevels) : new Set()))
//               : new Set();
//             let changed = false;
//             enrichedLevels.forEach(l => { if (!existing.has(l)) { existing.add(l); changed = true; } });
//             if (!changed) return prev;
//             return { ...prev, wageLevels: existing };
//           });
//           setCompanies(prev => prev.map(c => {
//             if (c.company !== selectedCompany) return c;
//             const existing = c.wageLevels
//               ? (Array.isArray(c.wageLevels) ? new Set(c.wageLevels) : (c.wageLevels instanceof Set ? new Set(c.wageLevels) : new Set()))
//               : new Set();
//             let changed = false;
//             enrichedLevels.forEach(l => { if (!existing.has(l)) { existing.add(l); changed = true; } });
//             if (!changed) return c;
//             return { ...c, wageLevels: existing };
//           }));
//         }
//       }

//       // Update cache
//       window._companyJobsCache.set(cacheKey, { jobs: pagedUnique, total });
//       setTotalCompanyJobs(total);
//     } catch (err) {
//       console.error("fetchCompanyJobs Error:", err);
//     } finally {
//       if (activeCompanyRef.current === selectedCompany) {
//         setJobsLoading(false);
//       }
//     }
//   }, [user, selectedCompany, subscriptionExpired, debouncedJobSearch, debouncedCompanySearch, jobSearch, jobPage, jobLevelFilter, paymentStatus]);



//   useEffect(() => {
//     const isPaid = paymentStatus === 'paid' || paymentStatus === 'active';
//     if (user && activeView === 'all_companies' && isPaid) {
//       fetchCompanies();
//     }
//   }, [fetchCompanies, activeView, user, paymentStatus]);

//   // Fetch company jobs when company changes (single trigger, cache prevents re-fetch)
//   useEffect(() => {
//     if (user && selectedCompany && activeView === 'all_companies') {
//       fetchCompanyJobs();
//       if (isMobile) setMobileActiveCol('right');
//     }
//   }, [fetchCompanyJobs, user, selectedCompany, activeView, isMobile]);
//   useEffect(() => { if (user) { fetchSavedJobIds(); fetchAppliedJobIds(); } }, [user]);

//   // ── Realtime: when new tl_confirmation='yes' rows are synced into audit_reviews_backup,
//   //             clear company caches and re-fetch so verified badges update automatically
//   useEffect(() => {
//     if (!user) return;
//     const channel = supabase
//       .channel('hp_audit_backup_insert')
//       .on(
//         'postgres_changes',
//         { event: 'INSERT', schema: 'public', table: 'audit_reviews_backup' },
//         (payload) => {
//           if (payload?.new?.tl_confirmation === 'yes') {
//             // Clear all company caches so next fetchCompanies gets fresh confirmed list
//             window._allProcessedCompanies = null;
//             window._confirmedCompaniesCache = null;
//             window._companyJobsCache = null; // Clear jobs cache as well
//             try { sessionStorage.removeItem('_companiesCache_v10'); } catch (_) { }
//             setIsInitialLoadDone(false);
//             setAllProcessedCompanies([]);
//           }
//         }
//       )
//       .subscribe();
//     return () => { supabase.removeChannel(channel); };
//   }, [user]);


//   const fetchSavedJobIds = async () => {
//     if (!user) return;
//     try {
//       await new Promise(r => setTimeout(r, 100)); // Stagger load to prevent 525
//       const { data, error } = await supabase.from('saved_jobs').select('job_id').eq('user_id', user.id);
//       if (error) throw error;
//       if (data) setSavedJobIds(new Set(data.map(i => String(i.job_id))));
//     } catch (err) {
//       if (!err.message?.includes('fetch') && window.navigator.onLine) {
//         console.error("fetchSavedJobIds Error:", err);
//       }
//     }
//   };
//   const fetchAppliedJobIds = async () => {
//     if (!user) return;
//     try {
//       await new Promise(r => setTimeout(r, 200)); // Stagger load to prevent 525
//       const { data, error } = await supabase.from('applied_jobs').select('job_id').eq('user_id', user.id);
//       if (error) throw error;
//       if (data) setAppliedJobIds(new Set(data.map(i => String(i.job_id))));
//     } catch (err) {
//       if (!err.message?.includes('fetch') && window.navigator.onLine) {
//         console.error("fetchAppliedJobIds Error:", err);
//       }
//     }
//   };

//   const handleSaveJob = async (job) => {
//     if (!user || subscriptionExpired) return;
//     const jobId = job.job_id || job.id || job.audit_id;
//     try {
//       if (savedJobIds.has(String(jobId))) {
//         await supabase.from('saved_jobs').delete().eq('user_id', user.id).eq('job_id', jobId);
//         setSavedJobIds(prev => { const s = new Set(prev); s.delete(String(jobId)); return s; });
//       } else {
//         await supabase.from('saved_jobs').insert([{ user_id: user.id, job_id: jobId, job_data: job }]);
//         setSavedJobIds(prev => { const s = new Set(prev); s.add(String(jobId)); return s; });
//       }
//     } catch (err) { console.error(err); }
//   };

//   const getInitials = (n) => n ? n.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase() : '??';
//   const handleCompanySelect = (c) => {
//     setCompanyJobs([]); // Clear immediately
//     setSelectedCompany(c.company);
//     setSelectedCompanyData(c);
//     setJobPage(1);
//     setJobSearch('');
//     setJobLevelFilter([]); // Correctly reset as empty array
//     if (isMobile) setMobileActiveCol('right');
//   };

//   if (authLoading || paymentLoading) return <div className="h-screen w-screen flex items-center justify-center bg-[#f5f5f7]"><Loader2 className="w-8 h-8 text-[#24385E] animate-spin" /></div>;
//   if (!user) return <div className="h-screen w-screen flex items-center justify-center bg-[#f5f5f7]"><Loader2 className="w-8 h-8 text-[#24385E] animate-spin" /></div>;

//   // ── Payment gate: show teaser if not paid (admins always bypass) ──
//   const isPaid = paymentStatus === 'paid' || paymentStatus === 'active' || paymentStatus === 'completed' || isAdmin;
//   if (!isPaid) return (
//     <TeaserDashboard
//       user={user}
//       signOut={handleLogout}
//       navigate={navigate}
//       isMobile={isMobile}
//       windowWidth={windowWidth}
//       showSidebarDrawer={showSidebarDrawer}
//     />
//   );

//   const navItems = [
//     { id: 'all_companies', label: 'All Companies\nthat Sponsor', icon: Building2 },
//     { id: 'all_jobs', label: 'All Jobs', icon: Briefcase },
//     { id: 'h1b_finder', label: 'H-1B Visa Sponsor Finder', icon: Globe },
//     { id: 'billing', label: 'Billing & Plan', icon: CreditCard },
//   ];

//   /* ─────────────────────────────────────── */
//   /*  INLINE STYLES MATCHING SCREENSHOT 1   */
//   /* ─────────────────────────────────────── */
//   const S = {
//     page: { display: 'flex', height: '100vh', overflow: 'hidden', background: '#f5f5f7', fontFamily: "'Inter', sans-serif" },
//     sidebar: {
//       width: (activeView === 'h1b_finder' && !isMobile) ? '0' : (showSidebarDrawer ? (sidebarOpen ? '280px' : '0') : '260px'),
//       minWidth: (activeView === 'h1b_finder' && !isMobile) ? '0' : (showSidebarDrawer ? (sidebarOpen ? '280px' : '0') : '260px'),
//       background: '#ffffff',
//       borderRight: (activeView === 'h1b_finder' && !isMobile) ? 'none' : '1px solid #e8e8e8',
//       display: 'flex',
//       flexDirection: 'column',
//       flexShrink: 0,
//       position: showSidebarDrawer ? 'fixed' : 'relative',
//       zIndex: 9999,  // Must be above search pill (2010) and suggestions (2000)
//       height: '100vh',
//       left: 0,
//       top: 0,
//       transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
//       overflow: 'hidden',
//       boxShadow: showSidebarDrawer && sidebarOpen ? '0 0 40px rgba(0,0,0,0.1)' : 'none'
//     },
//     sidebarLogo: { padding: '24px 24px 20px', minWidth: '260px' },
//     sidebarNav: { flex: 1, padding: '0 12px', overflowY: 'auto', minWidth: '260px' },
//     navItem: (active) => ({
//       width: '100%', display: 'flex', alignItems: 'center', gap: '12px',
//       padding: '10px 14px', borderRadius: '12px', fontSize: '14px', fontWeight: active ? 600 : 400,
//       color: active ? '#24385E' : '#666', background: active ? 'rgba(36,56,94,0.07)' : 'transparent',
//       border: 'none', cursor: 'pointer', transition: 'all 180ms ease', marginBottom: '4px',
//       textAlign: 'left',
//     }),
//     sidebarBottom: { padding: '12px 12px 20px', borderTop: '1px solid #efefef', minWidth: '260px' },
//     userRow: { display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 12px 0' },
//     main: { flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' },
//     topBar: {
//       background: '#fff',
//       borderBottom: '1px solid #e8e8e8',
//       display: 'flex',
//       alignItems: 'center',
//       justifyContent: (isMobile || showSidebarDrawer) ? 'space-between' : 'center',
//       gap: '12px',
//       padding: (isMobile || (showSidebarDrawer && windowWidth < 1280)) ? '0 16px' : '11px 24px',
//       height: (isMobile || (showSidebarDrawer && windowWidth < 1280)) ? '60px' : 'auto',
//       flexShrink: 0
//     },
//     content: { flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' },
//     leftCol: {
//       width: isMobile ? '100%' : (windowWidth < 1280 ? '340px' : '460px'),
//       minWidth: isMobile ? '0' : (windowWidth < 1280 ? '340px' : '460px'),
//       background: '#f5f5f7',
//       display: (isMobile && mobileActiveCol === 'right') ? 'none' : 'flex',
//       flexDirection: 'column',
//       overflow: 'hidden',
//       flexShrink: 0
//     },
//     searchWrap: { padding: isMobile ? '16px 12px' : (windowWidth < 1280 ? '16px 14px 10px' : '20px 20px 12px') },
//     searchRow: { display: 'flex', alignItems: 'center', gap: '10px' },
//     searchPill: { flex: 1, display: 'flex', alignItems: 'center', gap: '10px', background: '#fff', border: '1.5px solid #d8d8d8', borderRadius: '60px', padding: '0 16px', height: isMobile ? '46px' : '52px', boxShadow: '0 2px 8px rgba(0,0,0,0.07)' },
//     searchInput: { flex: 1, border: 'none', outline: 'none', fontSize: isMobile ? '14px' : '15px', color: '#333', background: 'transparent', minWidth: 0 },
//     filterBtn: { display: 'flex', alignItems: 'center', gap: '8px', background: '#fff', border: '1.5px solid #d8d8d8', borderRadius: '60px', padding: isMobile ? '0 14px' : '0 18px', height: isMobile ? '46px' : '52px', fontSize: '14px', fontWeight: 500, color: '#555', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.07)', whiteSpace: 'nowrap', flexShrink: 0 },
//     countRow: { padding: '0 20px 8px', textAlign: 'center', fontSize: '13px', color: '#888' },
//     companyList: { flex: 1, overflowY: 'auto', padding: isMobile ? '0 10px 24px' : '0 16px 24px', scrollbarWidth: 'none' },
//     rightCol: {
//       flex: 1,
//       background: '#fff',
//       display: (isMobile && mobileActiveCol === 'left') ? 'none' : 'flex',
//       flexDirection: 'column',
//       overflow: 'hidden'
//     },
//     rightScroll: { flex: 1, overflowY: 'auto', padding: isMobile ? '20px' : '32px 40px', scrollbarWidth: 'none' },
//     coLogo: { width: isMobile ? '48px' : '56px', height: isMobile ? '48px' : '56px', borderRadius: '16px', background: '#24385E', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: isMobile ? '16px' : '18px', fontWeight: 900, color: '#fff', flexShrink: 0 },
//     jobSearchPill: { flex: 1, display: 'flex', alignItems: 'center', gap: '10px', background: '#f9f9f9', border: '1.5px solid #e0e0e0', borderRadius: '60px', padding: '0 16px', height: isMobile ? '46px' : '50px' },
//     jobSearchInput: { flex: 1, border: 'none', outline: 'none', fontSize: '14px', color: '#333', background: 'transparent', minWidth: 0 },
//     searchBtn: { height: isMobile ? '46px' : '50px', padding: isMobile ? '0 20px' : '0 28px', background: '#24385E', color: '#fff', border: 'none', borderRadius: '60px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', flexShrink: 0, boxShadow: '0 2px 6px rgba(36,56,94,0.3)' }
//   };

//   return (
//     <div style={S.page}>

//       {/* Sidebar Overlay for Mobile */}
//       {isMobile && sidebarOpen && (
//         <div
//           onClick={() => setsidebarOpen(false)}
//           style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9998 }}
//         />
//       )}

//       {/* ═══════════════ SIDEBAR ═══════════════ */}
//       <aside style={S.sidebar}>
//         {/* Logo */}
//         <div style={S.sidebarLogo}>
//           <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
//             <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }} onClick={() => navigate('/')}>
//               <div style={{ position: 'relative' }}>
//                 <div style={{ width: '42px', height: '42px', background: '#24385E', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', transform: 'rotate(12deg)' }}>
//                   <span style={{ color: '#fff', fontWeight: 900, fontSize: '10px' }}>H1-B</span>
//                 </div>
//                 <div style={{ position: 'absolute', top: '-4px', right: '-4px', width: '14px', height: '14px', background: '#EAB308', borderRadius: '50%', border: '2px solid #fff' }}></div>
//               </div>
//               <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
//                 <span style={{ fontSize: '20px', fontWeight: 800, color: '#24385E' }}>Wage</span>
//                 <span style={{ fontSize: '20px', fontWeight: 800, color: '#EAB308' }}>Trail</span>
//               </div>
//             </div>
//             {isMobile && (
//               <button
//                 onClick={() => setsidebarOpen(false)}
//                 style={{ background: 'transparent', border: 'none', color: '#666' }}
//               >
//                 <X size={24} />
//               </button>
//             )}
//           </div>
//         </div>

//         {/* Nav */}
//         <nav style={S.sidebarNav}>
//           {navItems.map(item => {
//             const Icon = item.icon;
//             const active = activeView === item.id;
//             const isMultiLine = item.label.includes('\n');
//             return (
//               <button key={item.id} style={S.navItem(active)} onClick={() => { setActiveView(item.id); if (isMobile) setsidebarOpen(false); }}
//                 onMouseEnter={e => { if (!active) { e.currentTarget.style.background = '#f5f5f5'; e.currentTarget.style.color = '#333'; } }}
//                 onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#666'; } }}
//               >
//                 <Icon size={18} strokeWidth={active ? 2.2 : 1.6} />
//                 {isMultiLine
//                   ? <span style={{ lineHeight: '1.35' }}>{item.label.split('\n').map((line, i) => i === 0 ? <React.Fragment key="l0">{line}</React.Fragment> : <React.Fragment key={i}><br />{line}</React.Fragment>)}</span>
//                   : <span>{item.label}</span>
//                 }
//               </button>
//             );
//           })}
//         </nav>

//         {/* Bottom */}
//         <div style={S.sidebarBottom}>
//           <button style={S.navItem(activeView === 'settings')} onClick={() => { setActiveView('settings'); if (isMobile) setsidebarOpen(false); }}
//             onMouseEnter={e => { if (activeView !== 'settings') { e.currentTarget.style.background = '#f5f5f5'; } }}
//             onMouseLeave={e => { if (activeView !== 'settings') { e.currentTarget.style.background = 'transparent'; } }}
//           >
//             <Settings size={18} strokeWidth={1.6} /><span>Settings</span>
//           </button>

//           {/* Admin Panel — only visible when role === 'admin' */}
//           {isAdmin && (
//             <button
//               style={{
//                 ...S.navItem(false),
//                 color: '#24385E',
//                 background: 'rgba(36,56,94,0.08)',
//                 border: '1px solid rgba(36,56,94,0.15)',
//                 marginTop: '4px',
//               }}
//               onClick={() => { navigate('/admin'); if (isMobile) setSidebarOpen(false); }}
//               onMouseEnter={e => e.currentTarget.style.background = 'rgba(36,56,94,0.14)'}
//               onMouseLeave={e => e.currentTarget.style.background = 'rgba(36,56,94,0.08)'}
//             >
//               <Shield size={18} strokeWidth={1.8} />
//               <span style={{ fontWeight: 700 }}>Admin Panel</span>
//               <span style={{
//                 marginLeft: 'auto', fontSize: '9px', fontWeight: 800,
//                 background: '#24385E', color: '#fff',
//                 padding: '2px 6px', borderRadius: '20px', letterSpacing: '0.05em',
//                 textTransform: 'uppercase'
//               }}>Admin</span>
//             </button>
//           )}

//           <button
//             style={{ ...S.navItem(false), color: '#ef4444' }}
//             onClick={handleLogout}
//             onMouseEnter={e => e.currentTarget.style.background = '#fef2f2'}
//             onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
//           >
//             <LogOut size={18} strokeWidth={1.6} />
//             <span>Logout</span>
//           </button>

//           <div style={S.userRow}>
//             <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: '#24385E', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700, color: '#fff', flexShrink: 0 }}>
//               {(user?.email?.[0] || 'U').toUpperCase()}
//             </div>
//             <div style={{ minWidth: 0 }}>
//               <p style={{ fontSize: '13px', fontWeight: 600, color: '#1a1a1a', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email?.split('@')[0] || 'User'}</p>
//               <p style={{ fontSize: '11px', color: '#999', margin: 0 }}>software engineer</p>
//             </div>
//           </div>
//         </div>
//       </aside>

//       {/* ═══════════════ MAIN ═══════════════ */}
//       <div style={S.main}>

//         {/* Top bar — hidden for h1b_finder on desktop */}
//         {!(activeView === 'h1b_finder' && !isMobile) && (
//           <div style={S.topBar}>
//             {(isMobile || showSidebarDrawer) && (
//               <button onClick={() => setsidebarOpen(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px', marginLeft: '-8px' }}>
//                 <Menu size={24} color="#24385E" />
//               </button>
//             )}

//             <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
//               {activeView === 'all_companies' ? <Building2 size={20} color="#24385E" /> : <Briefcase size={20} color="#24385E" />}
//               <span style={{ fontSize: isMobile ? '13px' : '15px', fontWeight: 700, color: '#1a1a1a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
//                 {activeView === 'all_companies' ? 'Search open roles by company' : 'Verified Sponsored Jobs'}
//               </span>
//             </div>

//             {!isMobile && (
//               <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: '12px' }}>
//                 <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#24385E' }} />
//                 <div style={{ width: '36px', height: '3px', background: '#24385E', borderRadius: '3px' }} />
//                 <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#24385E' }} />
//                 <div style={{ width: '36px', height: '3px', background: '#ddd', borderRadius: '3px' }} />
//                 <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ddd' }} />
//               </div>
//             )}
//             {isMobile && <div style={{ width: '32px' }} />}
//           </div>
//         )}

//         <div style={S.content}>

//           {/* ━━━━━━ BILLING VIEW ━━━━━━ */}
//           {activeView === 'billing' && (
//             <div style={{ flex: 1, height: '100%', overflowY: 'auto', background: '#fff', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
//               <PaymentDetailsTab />
//             </div>
//           )}

//           {/* ━━━━━━ H-1B FINDER VIEW (full-width, no sidebar) ━━━━━━ */}
//           {activeView === 'h1b_finder' && (
//             <div style={{ flex: 1, height: '100%', overflowY: 'auto', background: '#fff', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
//               {/* Compact nav bar for H1B Finder */}
//               <div style={{
//                 display: 'flex', alignItems: 'center', gap: '12px',
//                 padding: '10px 24px', borderBottom: '1px solid #e8e8e8',
//                 background: '#fff', flexShrink: 0
//               }}>
//                 <button
//                   onClick={() => setActiveView('all_companies')}
//                   style={{
//                     display: 'flex', alignItems: 'center', gap: '6px',
//                     background: 'none', border: '1.5px solid #e0e0e0', borderRadius: '10px',
//                     padding: '7px 14px', cursor: 'pointer', fontSize: '13px', fontWeight: 600,
//                     color: '#24385E', transition: 'all 150ms'
//                   }}
//                   onMouseEnter={e => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.borderColor = '#24385E'; }}
//                   onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.borderColor = '#e0e0e0'; }}
//                 >
//                   <ChevronLeft size={16} />
//                   Back
//                 </button>
//                 <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
//                   <Globe size={18} color="#24385E" />
//                   <span style={{ fontSize: '15px', fontWeight: 800, color: '#1a1a1a' }}>H-1B Visa Sponsor Finder</span>
//                 </div>
//               </div>
//               <H1BSponsorFinder isMobile={isMobile} />
//             </div>
//           )}

//           {/* ━━━━━━ ALL COMPANIES VIEW ━━━━━━ */}
//           {activeView === 'all_companies' && (
//             <>
//               {/* LEFT COLUMN */}
//               <div style={S.leftCol}>

//                 <div style={S.searchWrap}>
//                   <div style={S.searchRow}>
//                     <div style={{ position: 'relative', flex: 1, display: 'flex' }}>
//                       <div style={{
//                         ...S.searchPill,
//                         background: showSuggestions && filteredSuggestions.length > 0 ? '#24385E' : '#fff',
//                         borderRadius: showSuggestions && filteredSuggestions.length > 0 ? '24px 24px 0 0' : '16px',
//                         borderBottom: showSuggestions && filteredSuggestions.length > 0 ? '1px solid rgba(255,255,255,0.1)' : '1px solid #e5e7eb',
//                         transition: 'all 0.2s',
//                         zIndex: 2010
//                       }}>
//                         <Search size={18} color={showSuggestions && filteredSuggestions.length > 0 ? '#94a3b8' : '#999'} style={{ flexShrink: 0 }} />
//                         <input
//                           style={{
//                             ...S.searchInput,
//                             color: showSuggestions && filteredSuggestions.length > 0 ? '#fff' : '#1a1a1a',
//                             transition: 'color 0.2s'
//                           }}
//                           type="text"
//                           value={companySearch}
//                           onChange={handleCompanySearchChange}
//                           onFocus={() => { if (companySearch.length > 0) setShowSuggestions(true); }}
//                           onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
//                           placeholder="Search companies"
//                         />
//                       </div>

//                       {/* Suggestions Dropdown (Google Chrome Style) */}
//                       {showSuggestions && filteredSuggestions.length > 0 && (
//                         <div style={{
//                           position: 'absolute',
//                           top: 0,
//                           left: 0,
//                           right: 0,
//                           backgroundColor: '#24385E',
//                           borderRadius: '24px',
//                           boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
//                           zIndex: 2000,
//                           overflow: 'hidden',
//                           border: '1px solid rgba(255,255,255,0.1)',
//                           animation: 'fadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
//                           paddingTop: '52px'
//                         }}>
//                           <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', marginTop: '4px' }}>
//                             {filteredSuggestions.map((companyName, idx) => (
//                               <div
//                                 key={companyName + idx}
//                                 onMouseDown={(e) => {
//                                   e.preventDefault();
//                                   handleSuggestionClick(companyName);
//                                 }}
//                                 style={{
//                                   padding: '12px 20px',
//                                   cursor: 'pointer',
//                                   fontSize: '13px',
//                                   color: '#fff',
//                                   display: 'flex',
//                                   alignItems: 'center',
//                                   gap: '12px',
//                                   transition: 'all 0.15s ease',
//                                   background: 'transparent'
//                                 }}
//                                 onMouseEnter={(e) => {
//                                   e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)';
//                                 }}
//                                 onMouseLeave={(e) => {
//                                   e.currentTarget.style.backgroundColor = 'transparent';
//                                 }}
//                               >
//                                 <Building2 size={14} color="#94a3b8" />
//                                 <span style={{ fontWeight: 400 }}>{companyName}</span>
//                               </div>
//                             ))}
//                           </div>
//                         </div>
//                       )}
//                     </div>
//                     {!isMobile && (
//                       <button
//                         style={{ ...S.filterBtn, background: showCompanyFilters ? '#24385E' : '#fff', color: showCompanyFilters ? '#fff' : '#555' }}
//                         onClick={() => setShowCompanyFilters(!showCompanyFilters)}
//                       >
//                         <SlidersHorizontal size={15} color={showCompanyFilters ? '#fff' : '#777'} />
//                         Filters {levelFilter.length > 0 ? `(${levelFilter.length})` : ''}
//                       </button>
//                     )}
//                   </div>
//                 </div>

//                 {/* ── Level Filter Buttons (Inside Toggle) ── */}
//                 {showCompanyFilters && (
//                   <div style={{ padding: '0 20px 12px', background: '#fff', borderBottom: '1px solid #efefef', marginBottom: '16px' }}>
//                     <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: '4px' }} className="no-scrollbar">
//                       <button
//                         onClick={() => { setLevelFilter([]); setCompanyPage(1); }}
//                         style={{
//                           padding: '7px 16px',
//                           borderRadius: '20px',
//                           fontSize: '12px',
//                           fontWeight: 800,
//                           whiteSpace: 'nowrap',
//                           cursor: 'pointer',
//                           transition: 'all 200ms ease',
//                           border: '1.5px solid',
//                           borderColor: levelFilter.length === 0 ? '#24385E' : '#ebebeb',
//                           background: levelFilter.length === 0 ? '#24385E' : '#fff',
//                           color: levelFilter.length === 0 ? '#fff' : '#6b7280',
//                           boxShadow: levelFilter.length === 0 ? '0 4px 12px rgba(36, 56, 94, 0.15)' : 'none',
//                         }}
//                       >
//                         All Levels
//                       </button>
//                       {['Lv 1', 'Lv 2', 'Lv 3', 'Lv 4'].map((lv) => {
//                         const active = levelFilter.includes(lv);
//                         return (
//                           <button
//                             key={lv}
//                             onClick={() => {
//                               setLevelFilter(prev => active ? prev.filter(x => x !== lv) : [...prev, lv]);
//                               setCompanyPage(1);
//                             }}
//                             style={{
//                               padding: '7px 16px',
//                               borderRadius: '20px',
//                               fontSize: '12px',
//                               fontWeight: 800,
//                               whiteSpace: 'nowrap',
//                               cursor: 'pointer',
//                               transition: 'all 200ms ease',
//                               border: '1.5px solid',
//                               borderColor: active ? '#24385E' : '#ebebeb',
//                               background: active ? '#24385E' : '#fff',
//                               color: active ? '#fff' : '#6b7280',
//                               boxShadow: active ? '0 4px 12px rgba(36, 56, 94, 0.15)' : 'none',
//                             }}
//                           >
//                             {lv}
//                           </button>
//                         );
//                       })}
//                     </div>
//                   </div>
//                 )}

//                 {/* ── Count + Sort ── */}
//                 <div style={S.countRow}>
//                   Showing <strong style={{ color: '#333' }}>{totalCompanies.toLocaleString()}</strong> Human verified companies
//                 </div>
//                 <div style={{ padding: isMobile ? '0 12px 10px' : '0 20px 12px' }}>
//                   <button onClick={() => { setSortBy(p => p === 'highest_wage' ? 'name' : 'highest_wage'); setCompanyPage(1); }}
//                     style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: '#333', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
//                     {sortBy === 'highest_wage' ? 'Highest wage' : 'By name'} <ArrowUpDown size={13} />
//                   </button>
//                 </div>

//                 {/* ── Company list ── */}
//                 <div style={S.companyList}>
//                   {companiesLoading ? (
//                     <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
//                       <Loader2 className="w-6 h-6 text-[#24385E] animate-spin" />
//                     </div>
//                   ) : companies.length > 0 ? companies.map((c, i) => (
//                     <CompanyCard key={c.company + i} company={c.company} jobCount={c.jobCount}
//                       isMobile={isMobile}
//                       isVerified={true}
//                       lca_filings={filingCounts[c.company.toLowerCase()] || filingCounts[normalizeName(c.company)] || (() => { const w = normalizeName(c.company).split(' ').filter(Boolean); return (w.length >= 2 ? filingCounts[w[0] + ' ' + w[1]] : null) || (w.length >= 1 ? filingCounts[w[0]] : null) || 0; })()}
//                       wageLevel={c.wageLevel} wageLevels={c.wageLevels} industries={c.industries}
//                       isSelected={selectedCompany === c.company} onClick={() => handleCompanySelect(c)} />
//                   )) : (
//                     <p style={{ textAlign: 'center', color: '#aaa', fontSize: '14px', paddingTop: '80px' }}>No companies found</p>
//                   )}
//                   {totalCompanies > COMPANIES_PER_PAGE && (
//                     <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginTop: '8px' }}>
//                       <button onClick={() => setCompanyPage(p => Math.max(1, p - 1))} disabled={companyPage === 1}
//                         style={{ padding: '6px 8px', borderRadius: '8px', border: '1px solid #e0e0e0', background: '#fff', cursor: 'pointer', opacity: companyPage === 1 ? 0.3 : 1 }}>
//                         <ChevronLeft size={14} />
//                       </button>
//                       <span style={{ fontSize: '12px', color: '#666', fontWeight: 500 }}>{companyPage} / {Math.ceil(totalCompanies / COMPANIES_PER_PAGE)}</span>
//                       <button onClick={() => setCompanyPage(p => p + 1)} disabled={companyPage * COMPANIES_PER_PAGE >= totalCompanies}
//                         style={{ padding: '6px 8px', borderRadius: '8px', border: '1px solid #e0e0e0', background: '#fff', cursor: 'pointer', opacity: companyPage * COMPANIES_PER_PAGE >= totalCompanies ? 0.3 : 1 }}>
//                         <ChevronRight size={14} />
//                       </button>
//                     </div>
//                   )}
//                 </div>
//               </div>

//               {/* RIGHT COLUMN */}
//               <div style={S.rightCol}>
//                 <div style={S.rightScroll} className="rightScroll-content">
//                   {selectedCompany ? (
//                     <>
//                       {isMobile && (
//                         <button onClick={() => setMobileActiveCol('left')} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', padding: '0 0 16px', color: '#24385E', fontWeight: 700, fontSize: '14px', cursor: 'pointer' }}>
//                           <ChevronLeft size={18} /> Back to list
//                         </button>
//                       )}

//                       {paymentStatus === 'pending' && (
//                         <div style={{ background: '#FFF7ED', border: '1.5px solid #FFEDD5', borderRadius: '16px', padding: '20px', marginBottom: '24px', textAlign: 'center' }}>
//                           <p style={{ color: '#9A3412', fontWeight: 800, fontSize: '14px', marginBottom: '8px' }}>🔒 UNLOCK ALL JOBS</p>
//                           <p style={{ color: '#C2410C', fontSize: '12px', fontWeight: 500, marginBottom: '16px' }}>Get access to direct apply links and salary data.</p>
//                           <button
//                             onClick={() => navigate('/pricing')}
//                             style={{ background: '#2C76FF', color: '#111', fontWeight: 800, padding: '10px 20px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontSize: '13px', width: '100%' }}
//                           >
//                             Get Full Access →
//                           </button>
//                         </div>
//                       )}

//                       {/* ── Company header ── */}
//                       <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px', gap: '12px' }}>
//                         <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
//                           <LogoBox name={selectedCompany} size={isMobile ? 48 : 56} fontSize={isMobile ? 16 : 18} />
//                           <div style={{ minWidth: 0 }}>
//                             <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
//                               <h2 style={{ fontSize: isMobile ? '18px' : '22px', fontWeight: 800, color: '#111', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{selectedCompany}</h2>
//                               {(() => {
//                                 const name = selectedCompany; const cnt = filingCounts[name.toLowerCase()] || filingCounts[normalizeName(name)] || (() => { const w = normalizeName(name).split(' ').filter(Boolean); return (w.length >= 2 ? filingCounts[w[0] + ' ' + w[1]] : null) || (w.length >= 1 ? filingCounts[w[0]] : null) || 0; })(); return cnt > 0 ? (
//                                   <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 700, color: '#24385E', background: '#f1f5f9', padding: '2px 6px', borderRadius: '6px' }}>
//                                     <Globe size={11} strokeWidth={2.5} />
//                                     {cnt.toLocaleString()} Filings
//                                   </span>
//                                 ) : null;
//                               })()}
//                             </div>
//                             <p style={{ fontSize: '12px', margin: 0, display: 'flex', alignItems: 'center', gap: '4px' }}>
//                               <ExternalLink size={12} color="#999" />
//                               <a
//                                 href={`https://${selectedCompanyData?.domain || `${selectedCompany.toLowerCase().replace(/\s+/g, '')}.com`}`}
//                                 target="_blank"
//                                 rel="noopener noreferrer"
//                                 style={{ color: '#24385E', textDecoration: 'none', fontWeight: 700 }}
//                                 onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
//                                 onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
//                               >
//                                 {selectedCompanyData?.domain || `${selectedCompany.toLowerCase().replace(/\s+/g, '')}.com`}
//                               </a>
//                             </p>
//                           </div>
//                         </div>
//                         {!isMobile && (
//                           <button onClick={() => { setSelectedCompany(null); setSelectedCompanyData(null); }}
//                             style={{ padding: '6px', borderRadius: '8px', background: 'none', border: 'none', cursor: 'pointer' }}
//                             onMouseEnter={e => e.currentTarget.style.background = '#f5f5f5'}
//                             onMouseLeave={e => e.currentTarget.style.background = 'none'}>
//                             <X size={18} color="#aaa" />
//                           </button>
//                         )}
//                       </div>

//                       {/* ── Sponsored count ──
//                       <p style={{ fontSize: '14px', color: '#222', fontWeight: 600, margin: '0 0 14px' }}>
//                         {selectedCompanyData?.jobCount || totalCompanyJobs}+ H-1B visas sponsored
//                       </p> */}

//                       {/* ── Wage badges ── */}
//                       <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '20px' }}>
//                         {(() => {
//                           // Build set of actual levels from the company's wageLevels data
//                           const wl = selectedCompanyData?.wageLevels;
//                           let levelSet;
//                           if (wl) {
//                             const arr = Array.isArray(wl) ? wl : (wl instanceof Set ? Array.from(wl) : []);
//                             levelSet = new Set(arr.map(l => { const m = String(l).match(/\d/); return m ? parseInt(m[0]) : null; }).filter(Boolean));
//                           } else {
//                             const lvl = parseInt(selectedCompanyData?.wageLevel?.match(/\d/)?.[0] || '0');
//                             levelSet = lvl > 0 ? new Set([lvl]) : new Set();
//                           }
//                           return ['Lv 1', 'Lv 2', 'Lv 3', 'Lv 4'].map((lbl, i) => {
//                             const hasLevel = levelSet.has(i + 1);
//                             return (
//                               <span key={lbl} style={{
//                                 fontSize: '11px', fontWeight: 700, padding: '4px 10px', borderRadius: '6px',
//                                 background: hasLevel ? '#24385E' : '#fff',
//                                 color: hasLevel ? '#fff' : '#bbb',
//                                 border: hasLevel ? '1px solid #24385E' : '1px solid #e0e0e0',
//                               }}>{lbl}</span>
//                             );
//                           });
//                         })()}
//                       </div>

//                       {/* ── Level Filters Toggle moved inside Filter Option ── */}
//                       {showJobFilters && (
//                         <div style={{ padding: '0 0 16px', display: 'flex', gap: '6px', overflowX: 'auto', scrollbarWidth: 'none' }} className="no-scrollbar">
//                           <button
//                             onClick={() => { setJobLevelFilter([]); setJobPage(1); }}
//                             style={{
//                               padding: '5px 10px',
//                               borderRadius: '12px',
//                               fontSize: '10px',
//                               fontWeight: 800,
//                               whiteSpace: 'nowrap',
//                               cursor: 'pointer',
//                               transition: 'all 0.2s ease',
//                               border: jobLevelFilter.length === 0 ? '1.5px solid #24385E' : '1.5px solid #e5e7eb',
//                               background: jobLevelFilter.length === 0 ? '#24385E' : '#fff',
//                               color: jobLevelFilter.length === 0 ? '#fff' : '#6b7280',
//                             }}
//                           >
//                             All Levels
//                           </button>
//                           {['Lv 1', 'Lv 2', 'Lv 3', 'Lv 4'].map((lv) => {
//                             const active = jobLevelFilter.includes(lv);
//                             return (
//                               <button
//                                 key={lv}
//                                 onClick={() => { setJobLevelFilter(prev => active ? prev.filter(x => x !== lv) : [...prev, lv]); setJobPage(1); }}
//                                 style={{
//                                   padding: '5px 10px',
//                                   borderRadius: '12px',
//                                   fontSize: '10px',
//                                   fontWeight: 800,
//                                   whiteSpace: 'nowrap',
//                                   cursor: 'pointer',
//                                   transition: 'all 0.2s ease',
//                                   border: active ? '1.5px solid #24385E' : '1.5px solid #e5e7eb',
//                                   background: active ? '#24385E' : '#fff',
//                                   color: active ? '#fff' : '#6b7280',
//                                 }}
//                               >
//                                 {lv}
//                               </button>
//                             );
//                           })}
//                         </div>
//                       )}

//                       {/* ── Job search bar with live suggestions ── */}
//                       <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'stretch' : 'center', gap: '10px', marginBottom: '16px' }}>
//                         <div style={{ position: 'relative', flex: 1 }}>
//                           <div style={{
//                             ...S.jobSearchPill,
//                             background: (showJobSuggestions && jobFilteredSuggestions.length > 0) ? '#24385E' : '#fff',
//                             borderRadius: (showJobSuggestions && jobFilteredSuggestions.length > 0) ? '16px 16px 0 0' : (S.jobSearchPill.borderRadius || '50px'),
//                             borderBottom: (showJobSuggestions && jobFilteredSuggestions.length > 0) ? '1px solid rgba(255,255,255,0.1)' : undefined,
//                             position: 'relative',
//                             zIndex: 2010,
//                             transition: 'all 0.2s'
//                           }}>
//                             <Search size={16} color={(showJobSuggestions && jobFilteredSuggestions.length > 0) ? '#94a3b8' : '#bbb'} style={{ flexShrink: 0 }} />
//                             <input
//                               style={{
//                                 ...S.jobSearchInput,
//                                 color: (showJobSuggestions && jobFilteredSuggestions.length > 0) ? '#fff' : '#1e293b',
//                                 transition: 'color 0.2s',
//                                 background: 'transparent'
//                               }}
//                               type="text"
//                               value={jobSearch}
//                               onChange={handleJobSearchChange}
//                               onFocus={() => { if (jobSearch.trim().length > 0) setShowJobSuggestions(true); }}
//                               onBlur={() => setTimeout(() => setShowJobSuggestions(false), 200)}
//                               placeholder={`Search jobs at ${selectedCompany}`}
//                             />
//                             {jobSearch.length > 0 && (
//                               <button onClick={() => { setJobSearch(''); setJobFilteredSuggestions([]); setShowJobSuggestions(false); }}
//                                 style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
//                                 <X size={16} color="#94a3b8" />
//                               </button>
//                             )}
//                           </div>

//                           {/* Job suggestions dropdown */}
//                           {showJobSuggestions && jobFilteredSuggestions.length > 0 && (
//                             <div style={{
//                               position: 'absolute',
//                               top: 0,
//                               left: 0,
//                               right: 0,
//                               backgroundColor: '#24385E',
//                               borderRadius: '16px',
//                               boxShadow: '0 16px 40px rgba(0,0,0,0.35)',
//                               zIndex: 2000,
//                               overflow: 'hidden',
//                               border: '1px solid rgba(255,255,255,0.1)',
//                               paddingTop: '50px'
//                             }}>
//                               <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
//                                 {jobFilteredSuggestions.map((role) => (
//                                   <div
//                                     key={role}
//                                     onMouseDown={(e) => {
//                                       e.preventDefault();
//                                       handleJobSuggestionClick(role);
//                                     }}
//                                     style={{
//                                       padding: '11px 18px',
//                                       cursor: 'pointer',
//                                       fontSize: '13px',
//                                       color: '#fff',
//                                       display: 'flex',
//                                       alignItems: 'center',
//                                       gap: '12px',
//                                       background: 'transparent',
//                                       transition: 'background 0.15s'
//                                     }}
//                                     onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'; }}
//                                     onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}
//                                   >
//                                     <Search size={13} color="#94a3b8" />
//                                     <span style={{ fontWeight: 400 }}>{role}</span>
//                                   </div>
//                                 ))}
//                               </div>
//                             </div>
//                           )}
//                         </div>
//                         <div style={{ display: 'flex', gap: '8px' }}>
//                           <button
//                             onClick={() => setShowJobFilters(!showJobFilters)}
//                             style={{
//                               ...S.filterBtn, height: isMobile ? '46px' : '50px',
//                               background: showJobFilters ? '#24385E' : '#fff',
//                               color: showJobFilters ? '#fff' : '#555'
//                             }}
//                           >
//                             <SlidersHorizontal size={14} color={showJobFilters ? '#fff' : '#777'} />
//                             Filters
//                           </button>
//                           <button style={S.searchBtn} onClick={() => fetchCompanyJobs(1, jobSearch, jobLevelFilter)}>
//                             Search
//                           </button>
//                         </div>
//                       </div>

//                       {/* ── Job list ── */}
//                       {jobsLoading ? (
//                         <div style={{ display: 'flex', justifyContent: 'center', padding: '64px 0' }}>
//                           <Loader2 className="w-6 h-6 text-[#24385E] animate-spin" />
//                         </div>
//                       ) : companyJobs.length > 0 ? (
//                         <>
//                           {companyJobs.map((job, i) => (
//                             <CompanyJobCard
//                               key={`${job.url || job.id || job.job_id || 'job'}_${i}`}
//                               job={{ ...job, isVerified: true }}
//                               isMobile={isMobile}
//                               isSaved={savedJobIds.has(String(job.id || job.job_id || job.audit_id))}
//                               onSave={handleSaveJob}
//                               lca_filings={filingCounts[selectedCompany.toLowerCase()] || filingCounts[normalizeName(selectedCompany)] || 0}
//                             />
//                           ))}

//                           {/* ── JOB PAGINATION ── */}
//                           {totalCompanyJobs > JOBS_PER_PAGE && (
//                             <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '24px', paddingBottom: '32px' }}>
//                               <button
//                                 onClick={async () => {
//                                   const next = Math.max(1, jobPage - 1);
//                                   if (next === jobPage) return;
//                                   setJobPage(next);
//                                   await new Promise(r => setTimeout(r, 100)); // Stagger load
//                                   document.querySelector('.rightScroll-content')?.scrollTo({ top: 0, behavior: 'smooth' });
//                                 }}
//                                 disabled={jobPage === 1}
//                                 style={{
//                                   padding: '6px 8px', borderRadius: '8px', border: '1px solid #e0e0e0', background: '#fff',
//                                   cursor: 'pointer', opacity: jobPage === 1 ? 0.3 : 1, transition: 'all 0.2s'
//                                 }}>
//                                 <ChevronLeft size={16} color="#24385E" />
//                               </button>

//                               <span style={{ fontSize: '13px', color: '#666', fontWeight: 600 }}>
//                                 {jobPage} / {Math.ceil(totalCompanyJobs / JOBS_PER_PAGE)}
//                               </span>

//                               <button
//                                 onClick={async () => {
//                                   const next = jobPage + 1;
//                                   if (next > Math.ceil(totalCompanyJobs / JOBS_PER_PAGE)) return;
//                                   setJobPage(next);
//                                   await new Promise(r => setTimeout(r, 100)); // Stagger load
//                                   document.querySelector('.rightScroll-content')?.scrollTo({ top: 0, behavior: 'smooth' });
//                                 }}
//                                 disabled={jobPage * JOBS_PER_PAGE >= totalCompanyJobs}
//                                 style={{
//                                   padding: '6px 8px', borderRadius: '8px', border: '1px solid #e0e0e0', background: '#fff',
//                                   cursor: 'pointer', opacity: jobPage * JOBS_PER_PAGE >= totalCompanyJobs ? 0.3 : 1, transition: 'all 0.2s'
//                                 }}>
//                                 <ChevronRight size={16} color="#24385E" />
//                               </button>
//                             </div>
//                           )}
//                         </>
//                       ) : (
//                         <div style={{ textAlign: 'center', padding: '40px 0' }}>
//                           <p style={{ fontSize: '13px', color: '#aaa' }}>No open roles found at the moment.</p>
//                         </div>
//                       )}
//                     </>
//                   ) : (
//                     <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
//                       <div style={{ textAlign: 'center', padding: '20px' }}>
//                         <Building2 size={48} color="#e0e0e0" style={{ margin: '0 auto 12px' }} />
//                         <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#666', margin: '0 0 6px' }}>Select a Company</h3>
//                         <p style={{ fontSize: '13px', color: '#aaa', margin: 0 }}>View sponsoring companies on the left.</p>
//                       </div>
//                     </div>
//                   )}
//                 </div>
//               </div>
//             </>
//           )}

//           {activeView === 'all_jobs' && (
//             <div style={{ flex: 1, height: '100%', overflowY: 'auto', background: '#fff', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
//               <div style={{ padding: isMobile ? '16px 12px 32px' : '32px 40px' }}>
//                 <AllJobsTab />
//               </div>
//             </div>
//           )}

//           {/* Settings / Saved / Applied Views */}
//           {activeView === 'saved' && <div style={{ flex: 1, height: '100%', overflowY: 'auto', background: '#fff', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}><div style={{ padding: isMobile ? '20px 16px' : '40px', maxWidth: '900px', margin: '0 auto' }}><SavedJobsTab /></div></div>}
//           {activeView === 'applied' && <div style={{ flex: 1, height: '100%', overflowY: 'auto', background: '#fff', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}><div style={{ padding: isMobile ? '20px 16px' : '40px', maxWidth: '900px', margin: '0 auto' }}><AppliedJobsTab /></div></div>}
//           {activeView === 'settings' && <div style={{ flex: 1, height: '100%', overflowY: 'auto', background: '#fff', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}><div style={{ padding: isMobile ? '20px 16px' : '40px', maxWidth: '800px', margin: '0 auto' }}><ProfileTab /></div></div>}

//         </div>
//       </div>
//     </div>
//   );
// };

// export default Homepage;





import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { externalSupabase } from '../externalSupabaseClient';
import useAuth from '../hooks/useAuth';
import {
  Loader2, Search, Briefcase, Heart, CheckSquare, Settings,
  ChevronLeft, ChevronRight, ArrowUpDown, Eye, Star,
  MessageSquare, Gift, Archive, Building2, X, Users, Mail,
  ExternalLink, SlidersHorizontal, HelpCircle, Lock, LogOut, CreditCard,
  Menu, Zap, Sparkles, Shield, Globe, Activity
} from 'lucide-react';

import { getCompanyLogo } from '../utils/logoHelper';
import CompanyCard from '../components/CompanyCard';
import CompanyJobCard from '../components/CompanyJobCard';
import Navbar from '../components/Navbar';
import HeroSection from '../components/HeroSection';
import Testimonials from '../components/Testimonials';
import FAQ from '../components/FAQ';
import Footer from '../components/Footer';
import ProfileTab from '../components/ProfileTab';
import SavedJobsTab from '../components/SavedJobsTab';
import AppliedJobsTab from '../components/AppliedJobsTab';
import PaymentDetailsTab from '../components/PaymentDetailsTab';
import LogoBox from '../components/LogoBox';
import AllJobsTab from '../components/AllJobsTab';
import GlobalSearchHeader from '../components/GlobalSearchHeader';
import DomainsTab from '../components/DomainsTab';
import CompaniesTab from '../components/CompaniesTab';
import AllCompaniesListTab from '../components/AllCompaniesListTab';
import H1BSponsorFinderTab from '../components/H1BSponsorFinderTab';
import AdminStatsTab from '../components/AdminStatsTab';
import AppTour from '../components/AppTour';
import { fetchJobRoles, filterRoles } from '../utils/rolesSuggestions';
import { isFamous } from '../utils/famousCompanies';
import { getWageLevel } from '../dataSyncService';

// Global name normalizer for consistent lookups
const normalizeName = (name) => {
  if (!name) return '';
  let n = name.toLowerCase()
    .replace(/\([^)]*\)/g, ' ') // Remove content in parentheses (e.g. (AWS))
    .replace(/[.,\-\/#!$%\^&\*;:{}=\-_`~()]/g, ' ') // Remove punctuation
    .replace(/\b(inc|llc|corp|ltd|co|services|com|systems|technologies|group|holdings|usa|us|intl|international|asia|europe|solutions|aws|related)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  // Enhanced mapping for major tech entities
  if (n.includes('amazon') && !n.includes('aws') && !n.includes('web services')) return 'amazon';
  return n;
};

// Roles fetched dynamically from Supabase via rolesSuggestions utility


// ─── Teaser Dashboard (unpaid users) ─────────────────────────────────────────

// ─── Teaser Dashboard (unpaid users) ─────────────────────────────────────────
const TeaserDashboard = ({ user, signOut, navigate, isMobile }) => {
  const [teaserCompanies, setTeaserCompanies] = useState([]);
  const [selectedTeaserCompany, setSelectedTeaserCompany] = useState(null);
  const [teaserJobs, setTeaserJobs] = useState([]);
  const [teaserLoading, setTeaserLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 1280);
  const [mobileActiveCol, setMobileActiveCol] = useState('left'); // 'left' or 'right'
  const [filingCounts, setFilingCounts] = useState({});

  const TARGET_NAMES = ['Google', 'Microsoft', 'Meta', 'Amazon', 'Apple'];

  const S = {
    page: { display: 'flex', height: '100vh', overflow: 'hidden', background: '#f5f5f7', fontFamily: "'Inter', sans-serif" },
    sidebar: {
      width: sidebarOpen ? '260px' : '0',
      minWidth: sidebarOpen ? '260px' : '0',
      background: '#ffffff',
      borderRight: '1px solid #e8e8e8',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
      position: isMobile ? 'fixed' : 'relative',
      zIndex: 9999,
      height: '100vh',
      left: 0,
      top: 0,
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      overflow: 'hidden',
      boxShadow: isMobile && sidebarOpen ? '0 0 40px rgba(0,0,0,0.1)' : 'none'
    },
    sidebarLogo: { padding: '24px 24px 20px', minWidth: '260px' },
    sidebarNav: { flex: 1, padding: '0 12px', overflowY: 'auto', minWidth: '260px' },
    navItem: (active) => ({
      width: '100%', display: 'flex', alignItems: 'center', gap: '12px',
      padding: '10px 14px', borderRadius: '12px', fontSize: '14px', fontWeight: active ? 600 : 400,
      color: active ? '#24385E' : '#666', background: active ? 'rgba(36,56,94,0.07)' : 'transparent',
      border: 'none', cursor: 'pointer', transition: 'all 180ms ease', marginBottom: '4px',
      textAlign: 'left',
    }),
    sidebarBottom: { padding: '12px 12px 20px', borderTop: '1px solid #efefef', minWidth: '260px' },
    userRow: { display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 12px 0' },
    main: { flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' },
    topBar: {
      background: '#fff',
      borderBottom: '1px solid #e8e8e8',
      display: 'flex',
      alignItems: 'center',
      justifyContent: (isMobile || !sidebarOpen) ? 'space-between' : 'center',
      gap: '12px',
      padding: (isMobile || !sidebarOpen) ? '0 16px' : '11px 24px',
      height: (isMobile || !sidebarOpen) ? '60px' : 'auto',
      flexShrink: 0
    },
    content: { flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' },
    leftCol: {
      width: isMobile ? '100%' : '460px',
      minWidth: isMobile ? '0' : '460px',
      background: '#f5f5f7',
      display: (isMobile && mobileActiveCol === 'right') ? 'none' : 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      flexShrink: 0
    },
    searchWrap: { padding: isMobile ? '16px 12px' : '20px 20px 12px' },
    searchRow: { display: 'flex', alignItems: 'center', gap: '10px' },
    searchPill: { flex: 1, display: 'flex', alignItems: 'center', gap: '10px', background: '#fff', border: '1.5px solid #d8d8d8', borderRadius: '60px', padding: '0 16px', height: isMobile ? '46px' : '52px', boxShadow: '0 2px 8px rgba(0,0,0,0.07)' },
    searchInput: { flex: 1, border: 'none', outline: 'none', fontSize: isMobile ? '14px' : '15px', color: '#333', background: 'transparent', minWidth: 0 },
    countRow: { padding: '0 20px 8px', textAlign: 'center', fontSize: '13px', color: '#888' },
    companyList: { flex: 1, overflowY: 'auto', padding: isMobile ? '0 10px 24px' : '0 16px 24px', scrollbarWidth: 'none' },
    rightCol: {
      flex: 1,
      background: '#fff',
      display: (isMobile && mobileActiveCol === 'left') ? 'none' : 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    },
    rightScroll: { flex: 1, overflowY: 'auto', padding: isMobile ? '20px' : '32px 40px', scrollbarWidth: 'none' },
  };

  useEffect(() => {
    (async () => {
      try {
        const { data, error } = await supabase
          .from('job_jobrole_sponsored_sync')
          .select('*')
          .in('company', TARGET_NAMES)
          .order('wage_num', { ascending: false });

        if (error) throw error;

        if (!data) return;

        const grouped = {};
        TARGET_NAMES.forEach(name => {
          const companyData = data.filter(j => j.company === name);
          if (companyData.length > 0) {
            grouped[name] = {
              company: name,
              jobs: companyData.slice(0, 3).map(j => ({ ...j, isTeaser: true })),
              jobCount: companyData.length,
              wageLevel: companyData[0].wage_level || 'Lv 2',
              // Restore domains & unique levels
              wageLevels: Array.from(new Set(companyData.map(j => j.wage_level).filter(Boolean))),
              domain: companyData[0].url ? new URL(companyData[0].url.startsWith('http') ? companyData[0].url : `https://${companyData[0].url}`).hostname.replace(/^www\./, '') : null
            };
          }
        });

        const list = Object.values(grouped);
        setTeaserCompanies(list);
        if (list.length > 0) {
          setSelectedTeaserCompany(list[0]);
          setTeaserJobs(list[0].jobs);
        }
      } catch (err) {
        console.error('Teaser fetch error:', err);
      } finally {
        setTeaserLoading(false);
      }
    })();
  }, []);

  // Fetch filing counts for featured companies
  useEffect(() => {
    if (teaserCompanies.length === 0) return;
    const fetchFilings = async () => {
      try {
        const names = teaserCompanies.map(c => c.company);
        const searchNames = [...new Set(names.map(n => normalizeName(n)))];
        const { data } = await supabase
          .from('h1b_sponsors')
          .select('Company, "LCA Filings"')
          .or(searchNames.map(n => `Company.ilike.%${n}%`).join(','));

        if (data) {
          const map = {};
          // Sort descending so highest match wins
          const sorted = [...data].sort((a, b) => {
            const valA = typeof a["LCA Filings"] === 'number' ? a["LCA Filings"] : parseInt(String(a["LCA Filings"]).replace(/,/g, '')) || 0;
            const valB = typeof b["LCA Filings"] === 'number' ? b["LCA Filings"] : parseInt(String(b["LCA Filings"]).replace(/,/g, '')) || 0;
            return valB - valA;
          });

          sorted.forEach(f => {
            const norm = normalizeName(f.Company);
            const count = typeof f["LCA Filings"] === 'number' ? f["LCA Filings"] : parseInt(String(f["LCA Filings"]).replace(/,/g, '')) || 0;

            map[f.Company.toLowerCase()] = count;
            if (norm) {
              if (!map[norm] || map[norm] < count) map[norm] = count;
              const words = norm.split(' ').filter(Boolean);
              if (words.length >= 1) {
                const firstWord = words[0];
                if (firstWord.length > 3 && (!map[firstWord] || map[firstWord] < count)) {
                  map[firstWord] = count;
                }
              }
              if (words.length >= 2) {
                const firstTwo = words[0] + ' ' + words[1];
                if (firstTwo.length > 5 && (!map[firstTwo] || map[firstTwo] < count)) {
                  map[firstTwo] = count;
                }
              }
            }
          });
          setFilingCounts(map);
        }
      } catch (err) { console.error("Teaser filings error:", err); }
    };
    fetchFilings();
  }, [teaserCompanies]);

  const handleSelect = (c) => {
    setSelectedTeaserCompany(c);
    setTeaserJobs(c.jobs);
    if (isMobile) setMobileActiveCol('right');
  };

  return (
    <div style={S.page}>
      {sidebarOpen && isMobile && (
        <div onClick={() => setSidebarOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9998 }} />
      )}

      {/* Sidebar */}
      <aside style={S.sidebar}>
        <div style={S.sidebarLogo}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }} onClick={() => navigate('/')}>
              <div style={{ position: 'relative' }}>
                <div style={{ width: '42px', height: '42px', background: '#24385E', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', transform: 'rotate(12deg)' }}>
                  <span style={{ color: '#fff', fontWeight: 900, fontSize: '10px' }}>H1-B</span>
                </div>
                <div style={{ position: 'absolute', top: '-4px', right: '-4px', width: '14px', height: '14px', background: '#EAB308', borderRadius: '50%', border: '2px solid #fff' }}></div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
                <span style={{ fontSize: '20px', fontWeight: 800, color: '#24385E' }}>Career</span>
                <span style={{ fontSize: '20px', fontWeight: 800, color: '#EAB308' }}>Partner</span>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              style={{ 
                background: 'transparent', 
                border: 'none', 
                color: '#999', 
                cursor: 'pointer', 
                padding: '8px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#f5f5f5'; e.currentTarget.style.color = '#2C76FF'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#999'; }}
            >
              <X size={20} strokeWidth={2.5} />
            </button>
          </div>
        </div>

        <nav style={S.sidebarNav}>
          <button style={S.navItem(true)} onClick={() => { if (isMobile) setsidebarOpen(false); }}>
            <Building2 size={18} strokeWidth={2.2} />
            <span>Dashboard</span>
          </button>
          <button style={S.navItem(false)} onClick={() => { navigate('/pricing'); if (isMobile) setsidebarOpen(false); }}>
            <Gift size={18} strokeWidth={1.6} />
            <span>Pricing Plans</span>
          </button>
        </nav>

        <div style={S.sidebarBottom}>
          <button style={{ ...S.navItem(false), color: '#ef4444' }} onClick={signOut}>
            <LogOut size={18} strokeWidth={1.6} />
            <span>Logout</span>
          </button>
          <div style={S.userRow}>
            <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: '#24385E', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700, color: '#fff', flexShrink: 0 }}>
              {(user?.email?.[0] || 'U').toUpperCase()}
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: '13px', fontWeight: 600, color: '#1a1a1a', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email?.split('@')[0] || 'User'}</p>
              <p style={{ fontSize: '11px', color: '#999', margin: 0 }}>Preview Participant</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div style={S.main}>
        <header style={S.topBar}>
          <button onClick={() => setSidebarOpen(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px', marginLeft: '-8px' }}>
            <Menu size={24} color="#24385E" />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Building2 size={20} color="#24385E" />
            <span style={{ fontSize: isMobile ? '13px' : '15px', fontWeight: 700, color: '#1a1a1a' }}>Limited Preview — Unlock Full Access</span>
          </div>
          {!isMobile && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: '12px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#24385E' }} />
              <div style={{ width: '36px', height: '3px', background: '#24385E', borderRadius: '3px' }} />
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#24385E' }} />
              <div style={{ width: '36px', height: '3px', background: '#ddd', borderRadius: '3px' }} />
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ddd' }} />
            </div>
          )}
        </header>

        <div style={S.content}>
          <div style={S.leftCol}>
            <div style={S.searchWrap}>
              <div style={S.searchRow}>
                <div style={S.searchPill}>
                  <Search size={18} color="#94a3b8" />
                  <input style={S.searchInput} type="text" placeholder="Search companies (Unlock full search)" disabled />
                </div>
              </div>
            </div>
            <div style={S.countRow}>Showing <strong style={{ color: '#333' }}>Featured</strong> Human verified companies</div>

            <div style={S.companyList}>
              {teaserLoading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
                  <Loader2 className="w-6 h-6 text-[#24385E] animate-spin" />
                </div>
              ) : teaserCompanies.map((c, i) => (
                <CompanyCard
                  key={c.company + i}
                  company={c.company}
                  isMobile={isMobile}
                  isVerified={true}
                  wageLevel={c.wageLevel}
                  wageLevels={c.wageLevels}
                  officialUrl={c.domain ? (c.domain.startsWith('http') ? c.domain : `https://${c.domain}`) : null}
                  lca_filings={filingCounts[c.company.toLowerCase()] || filingCounts[normalizeName(c.company)] || (() => { const w = normalizeName(c.company).split(' ').filter(Boolean); return (w.length >= 2 ? filingCounts[w[0] + ' ' + w[1]] : null) || (w.length >= 1 ? filingCounts[w[0]] : null) || 0; })()}
                  isSelected={selectedTeaserCompany?.company === c.company}
                  onClick={() => handleSelect(c)}
                />
              ))}

              <div style={{ marginTop: 24, padding: '24px', background: '#fff', borderRadius: 20, border: '1.5px dashed #d8d8d8', textAlign: 'center' }}>
                <Lock size={24} color="#94a3b8" style={{ marginBottom: 12 }} />
                <p style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', marginBottom: 6 }}>1,000+ More Companies</p>
                <p style={{ fontSize: 11, color: '#64748b', marginBottom: 16 }}>Complete your plan to unlock the full database of sponsoring companies.</p>
                <button onClick={() => navigate('/pricing')} style={{ width: '100%', padding: '10px', background: '#24385E', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', fontSize: '13px' }}>Unlock All Companies</button>
              </div>
            </div>
          </div>

          <div style={S.rightCol}>
            <div style={S.rightScroll}>
              {selectedTeaserCompany ? (
                <>
                  {isMobile && (
                    <button onClick={() => setMobileActiveCol('left')} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', padding: '0 0 16px', color: '#24385E', fontWeight: 700, fontSize: '14px', cursor: 'pointer' }}>
                      <ChevronLeft size={18} /> Back to list
                    </button>
                  )}

                  <div style={{ background: '#2C76FF/10', border: '1.5px solid #2C76FF/20', borderRadius: '16px', padding: '20px', marginBottom: '24px', textAlign: 'center' }}>
                    <p style={{ color: '#2C76FF', fontWeight: 800, fontSize: '14px', marginBottom: '8px' }}>🔒 UNLOCK ALL JOBS</p>
                    <p style={{ color: '#1E1E1E', fontSize: '12px', fontWeight: 500, marginBottom: '16px' }}>Get access to direct apply links and salary data for {selectedTeaserCompany.company}.</p>
                    <button onClick={() => navigate('/pricing')} style={{ background: '#2C76FF', color: '#fff', fontWeight: 800, padding: '10px 20px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontSize: '13px', width: '100%' }}>Get Full Access →</button>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                    <LogoBox
                      name={selectedTeaserCompany.company}
                      officialUrl={selectedTeaserCompany.domain ? (selectedTeaserCompany.domain.startsWith('http') ? selectedTeaserCompany.domain : `https://${selectedTeaserCompany.domain}`) : null}
                      size={isMobile ? 50 : 64}
                      fontSize={isMobile ? 16 : 18}
                    />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                        <h2 style={{ fontSize: isMobile ? 20 : 26, fontWeight: 800, color: '#24385E', margin: 0 }}>{selectedTeaserCompany.company}</h2>
                        {(() => {
                          const name = selectedTeaserCompany.company; const cnt = filingCounts[name.toLowerCase()] || filingCounts[normalizeName(name)] || (() => { const w = normalizeName(name).split(' ').filter(Boolean); return (w.length >= 2 ? filingCounts[w[0] + ' ' + w[1]] : null) || (w.length >= 1 ? filingCounts[w[0]] : null) || 0; })(); return cnt > 0 ? (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 700, color: '#24385E', background: '#f1f5f9', padding: '3px 8px', borderRadius: '6px' }}>
                              <Globe size={12} strokeWidth={2.5} />
                              {cnt.toLocaleString()} Filings
                            </span>
                          ) : null;
                        })()}
                      </div>
                      <p style={{ color: '#64748b', margin: 0, fontSize: isMobile ? 12 : 13 }}>{selectedTeaserCompany.jobCount}+ Visa Opportunities Found</p>
                    </div>
                  </div>

                  <div style={{ marginBottom: 32 }}>
                    <h4 style={{ fontSize: 13, fontWeight: 800, color: '#1a1a1a', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 16 }}>Available Roles</h4>
                    {teaserJobs.map((job, idx) => (
                      <CompanyJobCard
                        key={`${job.id || job.url || 'teaser'}_${idx}`}
                        job={{ ...job, isVerified: true }}
                        isMobile={isMobile}
                        isLandingPage={true}
                      />
                    ))}
                  </div>

                  <div style={{
                    padding: isMobile ? '24px' : '40px', background: 'linear-gradient(135deg, #24385E 0%, #1a2b4b 100%)',
                    borderRadius: 24, textAlign: 'center', color: '#fff', boxShadow: '0 12px 32px rgba(36,56,94,0.2)'
                  }}>
                    <Sparkles size={32} color="#2C76FF" style={{ margin: '0 auto 16px' }} />
                    <h3 style={{ fontSize: isMobile ? 20 : 24, fontWeight: 900, marginBottom: 12 }}>Go Premium</h3>
                    <p style={{ color: '#94a3b8', marginBottom: 24, fontSize: isMobile ? 14 : 15, maxWidth: 400, margin: '0 auto 24px' }}>
                      Access direct application links, historical wage data, and exclusive sponsorship insights.
                    </p>
                    <button onClick={() => navigate('/pricing')} style={{ padding: '14px 40px', background: '#2C76FF', color: '#fff', border: 'none', borderRadius: 12, fontWeight: 900, cursor: 'pointer', fontSize: 15 }}>Upgrade Now →</button>
                  </div>
                </>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                  <div style={{ textAlign: 'center' }}>
                    <Building2 size={48} color="#e2e8f0" style={{ marginBottom: 16 }} />
                    <p style={{ color: '#64748b' }}>Select a company to view roles</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


const JOBS_PER_PAGE = 15;
const COMPANIES_PER_PAGE = 25;

const Homepage = () => {
  const { user, loading: authLoading, subscriptionExpired, signOut, paymentStatus, paymentLoading, refresh: refreshAuth, isAdmin: isAdminFromCtx, role, isDummy } = useAuth();
  // Safety net: also check localStorage in case context hasn't hydrated yet
  const isAdmin = isAdminFromCtx || role === 'admin' || localStorage.getItem('userRole') === 'admin';
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1280);
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 1280);
  const [mobileActiveCol, setMobileActiveCol] = useState('left'); // 'left' or 'right'

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1280;
      setIsMobile(mobile);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = async () => {
    await signOut();
    navigate('/', { replace: true });
  };

  const location = window.location.pathname;
  const [activeView, setActiveView] = useState(() => {
    if (location.includes('/h1b-finder')) return 'h1b_finder';
    return 'all_jobs';
  });

  useEffect(() => {
    if (window.location.pathname.includes('/h1b-finder')) {
      setActiveView('h1b_finder');
    }
  }, [window.location.pathname]);
  const [companies, setCompanies] = useState([]);
  const [companiesLoading, setCompaniesLoading] = useState(false);
  const [companySearch, setCompanySearch] = useState('');
  const [debouncedCompanySearch, setDebouncedCompanySearch] = useState('');
  const [totalCompanies, setTotalCompanies] = useState(0);
  const [companyPage, setCompanyPage] = useState(1);
  const [sortBy, setSortBy] = useState('highest_wage');
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [selectedCompanyData, setSelectedCompanyData] = useState(null);
  const [companyJobs, setCompanyJobs] = useState([]);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [totalCompanyJobs, setTotalCompanyJobs] = useState(0);
  const [jobPage, setJobPage] = useState(1);
  const [jobSearch, setJobSearch] = useState('');
  const [debouncedJobSearch, setDebouncedJobSearch] = useState('');
  const [jobLevelFilter, setJobLevelFilter] = useState([]);
  const [savedJobIds, setSavedJobIds] = useState(new Set());
  const [appliedJobIds, setAppliedJobIds] = useState(new Set());
  const [allProcessedCompanies, setAllProcessedCompanies] = useState(window._allProcessedCompanies || []);
  const [isInitialLoadDone, setIsInitialLoadDone] = useState(!!window._allProcessedCompanies);
  const [levelFilter, setLevelFilter] = useState([]); // Array like ['Lv 1', 'Lv 2']
  const [countryFilter, setCountryFilter] = useState([]); // Array like ['USA', 'UK']
  const [dateFilter, setDateFilter] = useState({ quickDate: 'all', from: null, to: null });
  const [activeJobFilter, setActiveJobFilter] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  const [showCompanyFilters, setShowCompanyFilters] = useState(false);
  const [showJobFilters, setShowJobFilters] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [allRoles, setAllRoles] = useState([]);
  const [jobFilteredSuggestions, setJobFilteredSuggestions] = useState([]);
  const [showJobSuggestions, setShowJobSuggestions] = useState(false);
  const [filingCounts, setFilingCounts] = useState({});
  const activeCompanyRef = useRef(null);

  // Sync ref with state
  useEffect(() => {
    activeCompanyRef.current = selectedCompany;
  }, [selectedCompany]);

  // Moved normalizeName to top level

  // Global filing count fetcher disabled per user request
  // (H1B requests should only happen when in the H1B Finder tab)
  useEffect(() => {
    setFilingCounts({});
  }, [activeView]);


  // Fetch job roles from Supabase on mount (globally cached)
  useEffect(() => { fetchJobRoles().then(setAllRoles); }, []);

  const handleCompanySearchChange = (e) => {
    const val = e.target.value;
    setCompanySearch(val);
    setCompanyPage(1);
    if (val.trim().length > 0) {
      // Suggest companies from allProcessedCompanies instead of roles
      const words = val.toLowerCase().trim().split(/\s+/).filter(w => w.length >= 1);
      const filteredComps = (allProcessedCompanies || [])
        .filter(c => {
          const name = c.company.toLowerCase();
          return words.every(w => name.includes(w));
        });

      // Auto-update right pane synchronously
      if (filteredComps.length > 0 && selectedCompany !== filteredComps[0].company) {
        setSelectedCompany(filteredComps[0].company);
        setSelectedCompanyData(filteredComps[0]);
      }

      const filtered = filteredComps.slice(0, 8).map(c => c.company);

      setFilteredSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setFilteredSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleJobSearchChange = (e) => {
    const val = e.target.value;
    setJobSearch(val);
    setJobPage(1);
    if (val.trim().length > 0) {
      const filtered = filterRoles(allRoles, val, 8);
      setJobFilteredSuggestions(filtered);
      setShowJobSuggestions(filtered.length > 0);
    } else {
      setJobFilteredSuggestions([]);
      setShowJobSuggestions(false);
    }
  };

  // Ensure robust clearing/setting on explicit suggestion click
  const handleSuggestionClick = (companyName) => {
    setCompanySearch(companyName);
    setDebouncedCompanySearch(companyName);
    setShowSuggestions(false);
    setCompanyPage(1);
    // Explicit override without async interference
    setSelectedCompany('');
    setTimeout(() => {
      setSelectedCompany(companyName);
      const found = allProcessedCompanies.find(c => c.company === companyName);
      if (found) setSelectedCompanyData(found);
    }, 10);
  };

  const handleJobSuggestionClick = (role) => {
    setJobSearch(role);
    setDebouncedJobSearch(role); // Instant update on select
    setShowJobSuggestions(false);
    setJobPage(1);
    fetchCompanyJobs(1, role, jobLevelFilter); // Explicit call to avoid a 'nothing' moment
  };

  useEffect(() => { const t = setTimeout(() => setDebouncedCompanySearch(companySearch), 400); return () => clearTimeout(t); }, [companySearch]);
  useEffect(() => { const t = setTimeout(() => setDebouncedJobSearch(jobSearch), 400); return () => clearTimeout(t); }, [jobSearch]);

  const fetchCompanies = useCallback(async () => {
    if (!user) return;

    // ── 1. In-memory cache hit (fastest — no re-render needed) ──────────────
    if (isInitialLoadDone && allProcessedCompanies.length > 0) {
      let arr = [...allProcessedCompanies];
      if (debouncedCompanySearch && debouncedCompanySearch.trim()) {
        const words = debouncedCompanySearch.toLowerCase().trim().split(/\s+/).filter(w => w.length >= 1);
        arr = arr.filter(n => {
          const name = n.company.toLowerCase();
          const words = debouncedCompanySearch.toLowerCase().trim().split(/\s+/).filter(w => w.length >= 1);
          // Rule: (Title contains ALL words) OR (At least one Role contains ALL words)
          const nameMatches = words.every(w => name.includes(w));
          const roleMatches = (n.industries || []).some(role => {
            const r = role.toLowerCase();
            return words.every(w => r.includes(w));
          });
          return nameMatches || roleMatches;
        });
      }
      if (levelFilter && levelFilter.length > 0) {
        arr = arr.filter(n => {
          // If no levels are tracked yet (preliminary load), use the max level as before
          if (!n.wageLevels || n.wageLevels.size === 0) return levelFilter.includes(n.wageLevel);
          // Otherwise, show company if ANY of its levels match the filter
          return levelFilter.some(lvl => n.wageLevels.has(lvl));
        });
      }
      // Consolidated filter logic above replaces the redundant blocks here
      // Primary sort: Famous first. Secondary sort: Selected criteria.
      arr.sort((a, b) => {
        if (sortBy === 'highest_wage') {
          if (b.maxWageNum !== a.maxWageNum) return b.maxWageNum - a.maxWageNum;
        }
        const aFamous = isFamous(a.company);
        const bFamous = isFamous(b.company);
        if (aFamous && !bFamous) return -1;
        if (!aFamous && bFamous) return 1;
        return a.company.localeCompare(b.company);
      });
      setTotalCompanies(arr.length);
      const from = (companyPage - 1) * COMPANIES_PER_PAGE;
      const paginated = arr.slice(from, from + COMPANIES_PER_PAGE);
      setCompanies(paginated);
      if (!isMobile && paginated.length > 0) {
        if (debouncedCompanySearch && debouncedCompanySearch.trim().length > 0) {
          if (selectedCompany !== paginated[0].company) {
            setSelectedCompany(paginated[0].company);
            setSelectedCompanyData(paginated[0]);
          }
        } else if (!selectedCompany || !arr.some(c => c.company === selectedCompany)) {
          setSelectedCompany(paginated[0].company);
          setSelectedCompanyData(paginated[0]);
        }
      }
      return;
    }

    // ── 2. sessionStorage cache hit (survives navigation, avoids full re-fetch) ──
    try {
      const cached = sessionStorage.getItem('_companiesCache_v10');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && parsed.length > 0) {
          window._allProcessedCompanies = parsed;
          setAllProcessedCompanies(parsed);
          setIsInitialLoadDone(true);
          let arr = [...parsed];
          if (debouncedCompanySearch && debouncedCompanySearch.trim()) {
            const words = debouncedCompanySearch.toLowerCase().trim().split(/\s+/).filter(w => w.length >= 1);
            arr = arr.filter(n => {
              const name = n.company.toLowerCase();
              const nameMatches = words.every(w => name.includes(w));
              const roleMatches = (n.industries || []).some(role => {
                const r = role.toLowerCase();
                return words.every(w => r.includes(w));
              });
              return nameMatches || roleMatches;
            });
          }
          if (levelFilter && levelFilter.length > 0) {
            arr = arr.filter(n => {
              if (!n.wageLevels || n.wageLevels.length === 0) return levelFilter.includes(n.wageLevel);
              // Handle both Set (from live processing) and Array (from JSON parse)
              const levels = Array.isArray(n.wageLevels) ? new Set(n.wageLevels) : n.wageLevels;
              return levelFilter.some(lvl => levels.has(lvl));
            });
          }
          // Priority Sort: Famous First
          arr.sort((a, b) => {
            if (sortBy === 'highest_wage') {
              if (b.maxWageNum !== a.maxWageNum) return b.maxWageNum - a.maxWageNum;
            }
            const aFamous = isFamous(a.company);
            const bFamous = isFamous(b.company);
            if (aFamous && !bFamous) return -1;
            if (!aFamous && bFamous) return 1;
            return a.company.localeCompare(b.company);
          });
          setTotalCompanies(arr.length);
          const paginated = arr.slice(0, COMPANIES_PER_PAGE);
          setCompanies(paginated);
          if (!isMobile && paginated.length > 0) {
            if (debouncedCompanySearch && debouncedCompanySearch.trim().length > 0) {
              if (selectedCompany !== paginated[0].company) {
                setSelectedCompany(paginated[0].company);
                setSelectedCompanyData(paginated[0]);
              }
            } else if (!selectedCompany || !arr.some(c => c.company === selectedCompany)) {
              setSelectedCompany(paginated[0].company);
              setSelectedCompanyData(paginated[0]);
            }
          }
          return;
        }
      }
    } catch (e) { /* sessionStorage may be unavailable */ }

    // All users have full access — no payment check needed

    setCompaniesLoading(true);
    try {
      // ── 3. FAST FIRST PAGE: Show initial companies quickly (single query, no pagination loops) ──

      const fetchAllConfirmed = async (tableName) => {
        const records = [];
        let pg = 0;
        while (true) {
          const { data, error } = await supabase
            .from(tableName)
            .select('company, role, domain, salary, remarks')
            .eq('tl_confirmation', 'yes')
            .range(pg * 1000, (pg + 1) * 1000 - 1);
          if (error || !data || data.length === 0) break;
          data.forEach(r => r.company && records.push(r));
          if (data.length < 1000) break;
          pg++;
        }
        return records;
      };

      const [backupResults, jobsRes] = await Promise.all([
        fetchAllConfirmed('audit_reviews_backup'),
        supabase.from('job_jobrole_sponsored_sync').select('company, job_role_name, wage_level, wage_num, url').limit(5000)
      ]);

      const allVerified = [...backupResults];
      const confirmedNames = Array.from(new Set(allVerified.map(r => r.company))).filter(Boolean);

      let jobData = jobsRes.data || [];

      // If jobs table has more than 5000, fetch remaining pages in background
      if (jobData.length === 5000) {
        // Show first-page results immediately using the data we have, then fill in more
        buildAndSetCompanies(confirmedNames, jobData, allVerified, true);

        // Background: fetch remaining pages without blocking UI
        let p = 1;
        const delay = (ms) => new Promise(res => setTimeout(res, ms));
        while (p <= 20) { // Cap at 100k jobs (20 * 5000) to be safe
          await delay(300); // Small cooldown
          const { data: moreJobs } = await supabase
            .from('job_jobrole_sponsored_sync')
            .select('company, job_role_name, wage_level, wage_num, url')
            .range(p * 5000, (p + 1) * 5000 - 1);
          if (!moreJobs || moreJobs.length === 0) break;
          jobData = jobData.concat(moreJobs);
          if (moreJobs.length < 5000) break;
          p++;
        }
      }

      buildAndSetCompanies(confirmedNames, jobData, allVerified, false);

    } catch (err) {
      if (!err.message?.includes('fetch') && window.navigator.onLine) {
        console.error("fetchCompanies Error:", err);
      }
    } finally {
      setCompaniesLoading(false);
    }

    function buildAndSetCompanies(confirmedNames, jobData, allVerified = [], preliminary) {
      const companyStats = new Map();
      const normToOrig = new Map();

      confirmedNames.forEach(name => {
        const stats = { company: name, jobCount: 0, maxWageNum: 0, wageLevel: 'Lv 1', wageLevels: new Set(), industries: new Set(), domain: null };
        companyStats.set(name, stats);
        const norm = normalizeName(name);
        if (norm && !normToOrig.has(norm)) normToOrig.set(norm, name);
      });

      const getHeuristicLevel = (title, levelStr) => {
        if (!title) return 0;
        const rt = String(title).toLowerCase();
        // Priority 1: Check levelStr if it contains something useful we missed
        if (levelStr) {
          const lMatch = String(levelStr).match(/\b(I|II|III|IV)\b/i) || String(levelStr).match(/\bLEVEL\s*(\d)\b/i);
          if (lMatch) {
            if (lMatch[1].toUpperCase() === 'IV' || lMatch[1] === '4') return 4;
            if (lMatch[1].toUpperCase() === 'III' || lMatch[1] === '3') return 3;
            if (lMatch[1].toUpperCase() === 'II' || lMatch[1] === '2') return 2;
            if (lMatch[1].toUpperCase() === 'I' || lMatch[1] === '1') return 1;
          }
        }
        // Priority 2: Very coarse title-based guessing (Conservative)
        if (rt.match(/\blead\b|\bstaff\b|\bprincipal\b|\bdirector\b|\bvp\b|\bhead\b|\bchief\b/)) return 4;
        if (rt.match(/\bsenior\b|\bsr[\s.]\b/)) return 3;
        if (rt.match(/\bjunior\b|\bjr[\s.]\b|\bentry\b|\bintern\b|\bgraduate\b/)) return 1;
        return 0; // Return 0 if unsure, don't guess based on salary alone
      };

      const getStatsFor = (rawName) => {
        if (!rawName) return null;
        if (companyStats.has(rawName)) return companyStats.get(rawName);
        const norm = normalizeName(rawName);
        if (normToOrig.has(norm)) return companyStats.get(normToOrig.get(norm));
        return null;
      };

      allVerified.forEach(v => {
        const s = getStatsFor(v.company);
        if (s) {
          s.jobCount++;
          if (v.role) s.industries.add(v.role);
          if (v.domain && v.domain !== 'N/A' && v.domain !== 'null') {
            s.industries.add(v.domain);
            if (!s.domain) s.domain = v.domain;
          }
          const rawLevel = String(v.wage_level || v.salary_level || v.salary || v.remarks || '').toUpperCase();
          let wageNum = 0;
          const explicitMatch = rawLevel.match(/LV\s*(\d)/) || rawLevel.match(/LEVEL\s*(\d)/);
          if (explicitMatch) wageNum = parseInt(explicitMatch[1]);
          else if (rawLevel.match(/\bIV\b/) || rawLevel.match(/\bLEVEL 4\b/)) wageNum = 4;
          else if (rawLevel.match(/\bIII\b/) || rawLevel.match(/\bLEVEL 3\b/)) wageNum = 3;
          else if (rawLevel.match(/\bII\b/) || rawLevel.match(/\bLEVEL 2\b/)) wageNum = 2;
          else if (rawLevel.match(/\bI\b/) || rawLevel.match(/\bLEVEL 1\b/)) wageNum = 1;

          if (wageNum === 0) {
            // Only use heuristic if we have NO explicit level data
            wageNum = getHeuristicLevel(v.role, v.wage_level || v.salary_level || v.remarks);
          }

          if (wageNum > 0) {
            s.wageLevels.add(`Lv ${wageNum}`);
            if (wageNum > s.maxWageNum) {
              s.maxWageNum = wageNum;
              s.wageLevel = `Lv ${wageNum}`;
            }
          }
        }
      });

      jobData.forEach(j => {
        const s = getStatsFor(j.company);
        if (s) {
          s.jobCount++;
          if (j.url && !s.domain) {
            try {
              const u = new URL(j.url.startsWith('http') ? j.url : `https://${j.url}`);
              const dom = u.hostname.replace(/^www\./, '');
              const jobBoards = ['linkedin', 'indeed', 'glassdoor', 'ziprecruiter', 'lever', 'greenhouse', 'ashbyhq', 'myworkday'];
              if (!jobBoards.some(board => dom.includes(board))) {
                s.domain = dom;
              }
            } catch (_) { }
          }
          let currentWage = parseInt(j.wage_num || j.wage_level?.match(/\d/)?.[0] || '0');
          if (currentWage === 0) {
            currentWage = getHeuristicLevel(j.job_role_name, j.wage_level);
          }

          if (currentWage > 0) {
            s.wageLevels.add(`Lv ${currentWage}`);
            if (currentWage > s.maxWageNum) {
              s.maxWageNum = currentWage;
              s.wageLevel = `Lv ${currentWage}`;
            }
          }
          if (j.job_role_name) {
            const roles = j.job_role_name.split(',').map(r => r.trim()).filter(Boolean);
            roles.forEach(r => s.industries.add(r));
          }
        }
      });

      let finalArr = Array.from(companyStats.values());

      if (debouncedCompanySearch && debouncedCompanySearch.trim()) {
        const words = debouncedCompanySearch.toLowerCase().trim().split(/\s+/).filter(w => w.length >= 1);
        finalArr.forEach(c => {
          const industriesArr = Array.from(c.industries);
          industriesArr.sort((a, b) => {
            const aLower = a.toLowerCase();
            const bLower = b.toLowerCase();
            const aMatch = words.every(w => aLower.includes(w));
            const bMatch = words.every(w => bLower.includes(w));
            if (aMatch && !bMatch) return -1;
            if (!aMatch && bMatch) return 1;
            return 0;
          });
          c.industries = industriesArr; // Keep full list for strict filtering
        });
      } else {
        finalArr.forEach(c => {
          c.industries = Array.from(c.industries); // Keep full list
        });
      }

      // Final sorting with Famous Priority
      finalArr.sort((a, b) => {
        if (sortBy === 'highest_wage') {
          if (b.maxWageNum !== a.maxWageNum) return b.maxWageNum - a.maxWageNum;
        }
        const aFamous = isFamous(a.company);
        const bFamous = isFamous(b.company);
        if (aFamous && !bFamous) return -1;
        if (!aFamous && bFamous) return 1;
        return a.company.localeCompare(b.company);
      });

      window._allProcessedCompanies = finalArr;
      setAllProcessedCompanies(finalArr);
      if (!preliminary) {
        setIsInitialLoadDone(true);
        try {
          // Sets don't stringify to JSON arrays automatically, so we map them
          const serializable = finalArr.map(c => ({
            ...c,
            industries: Array.from(c.industries),
            wageLevels: Array.from(c.wageLevels).sort() // Sort for consistency
          }));
          sessionStorage.setItem('_companiesCache_v10', JSON.stringify(serializable));
        } catch (e) { }
      }

      let viewArr = finalArr;
      if (debouncedCompanySearch && debouncedCompanySearch.trim()) {
        const words = debouncedCompanySearch.toLowerCase().trim().split(/\s+/).filter(w => w.length >= 1);
        viewArr = viewArr.filter(n => {
          const name = n.company.toLowerCase();
          const nameMatches = words.every(w => name.includes(w));
          const roleMatches = (n.industries || []).some(role => {
            const r = role.toLowerCase();
            return words.every(w => r.includes(w));
          });
          return nameMatches || roleMatches;
        });
      }
      if (levelFilter && levelFilter.length > 0) {
        viewArr = viewArr.filter(n => {
          const lvls = Array.isArray(n.wageLevels) ? new Set(n.wageLevels) : (n.wageLevels instanceof Set ? n.wageLevels : new Set());
          return levelFilter.some(lvl => lvls.has(lvl));
        });
      }
      setTotalCompanies(viewArr.length);
      const from = (companyPage - 1) * COMPANIES_PER_PAGE;
      const paginated = viewArr.slice(from, from + COMPANIES_PER_PAGE);
      setCompanies(paginated);
      if (!isMobile && paginated.length > 0) {
        if (debouncedCompanySearch && debouncedCompanySearch.trim().length > 0) {
          if (selectedCompany !== paginated[0].company) {
            setSelectedCompany(paginated[0].company);
            setSelectedCompanyData(paginated[0]);
          }
        } else if (!selectedCompany || !viewArr.some(c => c.company === selectedCompany)) {
          setSelectedCompany(paginated[0].company);
          setSelectedCompanyData(paginated[0]);
        }
      }
    }
  }, [user, debouncedCompanySearch, sortBy, companyPage, isInitialLoadDone, allProcessedCompanies, selectedCompany, levelFilter]);

  const fetchCompanyJobs = useCallback(async (pageOverride, searchOverride, levelOverride) => {
    if (!user || !selectedCompany) return;

    const page = pageOverride || jobPage;
    // Use the specific right-panel job search IF it exists, otherwise use the main left-panel company filter
    const search = (searchOverride !== undefined) ? searchOverride : jobSearch;
    const level = levelOverride || jobLevelFilter;

    // --- Cache check (bump version to invalidate any stale pre-fix cache) ---
    if (!window._companyJobsCache) window._companyJobsCache = new Map();
    const cacheKey = `v2|${selectedCompany}|${page}|${search}|${level}`;
    const cached = window._companyJobsCache.get(cacheKey);
    if (cached) {
      setCompanyJobs(cached.jobs);
      setTotalCompanyJobs(cached.total);
      return;
    }

    setJobsLoading(true);
    setCompanyJobs([]); // Immediate clear to prevent stale flash
    try {
      const from = (page - 1) * JOBS_PER_PAGE;
      const to = from + JOBS_PER_PAGE - 1;

      // 1. Sponsored jobs query
      let q1 = supabase.from('job_jobrole_sponsored_sync').select('*', { count: 'exact' }).eq('company', selectedCompany);
      if (search && search.trim()) {
        const words = search.trim().split(/\s+/).filter(w => w.length >= 1);
        if (words.length > 0) {
          const titleCond = `and(${words.map(w => `title.ilike.%${w}%`).join(',')})`;
          q1 = q1.or(`${titleCond}`);
        }
      }
      if (level && level.length > 0) {
        const expanded = level.flatMap(l => {
          const n = l.match(/\d/)?.[0];
          if (!n) return [l];
          const roman = { '1': 'I', '2': 'II', '3': 'III', '4': 'IV' }[n];
          return [l, `Level ${n}`, `Level ${roman}`, n, `Lv ${n}`, `Lv${n}`];
        });
        q1 = q1.in('wage_level', expanded);
      }



      // 3. Audit reviews backup (human verified)
      let q3 = supabase.from('audit_reviews_backup').select('*').eq('company', selectedCompany).eq('tl_confirmation', 'yes');
      if (search && search.trim()) {
        const words = search.trim().split(/\s+/).filter(w => w.length >= 1);
        if (words.length > 0) {
          // backup has no title, but we allow company match. Role search disabled as per 'strictly title' requirement.
          q3 = q3.filter('domain', 'ilike', '%NON_EXISTENT_NONE%');
        }
      }

      const [resSponsored, resBackup] = await Promise.all([
        q1.order('wage_num', { ascending: false, nullsFirst: false }).order('date_posted', { ascending: false }),
        q3.order('audit_date', { ascending: false })
      ]);

      // ── Normalize helper ──────────────────────────────────────────────────────
      const _normR = (s) => String(s || '').toLowerCase()
        .replace(/[-–—]/g, ' ').replace(/\s+/g, ' ').trim();

      const _urlKey = (u) => {
        if (!u) return '';
        let s = String(u).toLowerCase().trim();
        try {
          const urlObj = new URL(s.startsWith('http') ? s : `https://${s}`);
          let p = (urlObj.hostname + urlObj.pathname).replace(/^www\./, '').replace(/\/$/, '');
          // Extract job ID (9+ digits) to handle LinkedIn title slugs
          const m = p.match(/\d{9,}/);
          if (m) return urlObj.hostname.replace(/^www\./, '') + '||' + m[0];
          return p;
        } catch {
          return s.split('?')[0].split('#')[0].replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, '');
        }
      };

      // Job key for deduplication: STRICT Logical Identity (Company + Title + Location)
      // We no longer use URL as a key differentiator because duplicate listings often use different tracking URLs
      const _lvlKey = (lv) => {
        if (!lv) return '';
        const m = String(lv).match(/\d/);
        return m ? m[0] : '';
      };

      const _jobKey = (j) => {
        const co = String(j.company || selectedCompany || '').toLowerCase().trim();
        const ti = _normR(j.title || '');
        const lo = _normR(j.location || 'us');
        return `${co}||${ti}||${lo}`;
      };

      // Role key for verification lookup: Company + Domain/Role
      const _roleKey = (j) => {
        const co = String(j.company || selectedCompany || '').toLowerCase().trim();
        const ro = _normR(j.job_role_name || j.role || '');
        return `${co}||${ro}`;
      };

      // ── Pass 1: Flatten + dedup verified jobs (sync + backup) ────────────────
      const allVerifiedRaw = [
        ...(resBackup.data || [])
      ].map(r => ({
        ...r,
        title: null, // Strictly from sponsored table only
        url: r.job_link,
        date_posted: r.audit_date,
        job_role_name: r.domain,
        isVerified: true,
        isTeaser: paymentStatus === 'pending',
        job_id: r.job_id || r.id,
      }));

      // Dedup verified jobs by role key — sync and backup share the same records
      const verifiedByRole = new Map(); // roleKey → job
      allVerifiedRaw.forEach(v => {
        const rk = _roleKey(v);
        const existing = verifiedByRole.get(rk);
        if (!existing) {
          verifiedByRole.set(rk, v);
        } else {
          // Merge: keep richest salary/wage data
          verifiedByRole.set(rk, {
            ...existing, ...v,
            salary: existing.salary || v.salary,
            wage_level: existing.wage_level || v.wage_level,
            url: existing.url || v.url,
            isVerified: true,
          });
        }
      });
      const verifiedJobs = Array.from(verifiedByRole.values());

      // ── Pass 1.5: DEEP FETCH sponsored metadata for ALL verified links ────────
      // This ensures we have the 'title' column for 100% of verified data
      const deepUrls = [...new Set(allVerifiedRaw.map(v => v.url))].filter(Boolean);
      const deepIds = [...new Set(allVerifiedRaw.map(v => v.job_id))].filter(Boolean);
      let deepSponsored = [];
      if (deepUrls.length > 0 || deepIds.length > 0) {
        const idNumList = deepIds.map(id => parseInt(id)).filter(n => !isNaN(n));
        const queries = [
          deepUrls.length > 0 ? supabase.from('job_jobrole_sponsored_sync').select('*').in('url', deepUrls) : null,
          idNumList.length > 0 ? supabase.from('job_jobrole_sponsored_sync').select('*').in('id', idNumList) : null,
          deepIds.length > 0 ? supabase.from('job_jobrole_sponsored_sync').select('*').in('jobId', deepIds) : null
        ].filter(Boolean);
        const results = await Promise.all(queries);
        results.forEach(r => { if (r.data) deepSponsored.push(...r.data); });
      }

      const sponsoredJobs = [
        ...(resSponsored.data || [])
      ].map(j => ({
        ...j,
        job_id: j.id,
        title: j.title, // Take the raw title column
        role: j.job_role_name,
        isTeaser: paymentStatus === 'pending',
      }));

      // ── Pass 2: Map deep-fetched titles BACK to verified records ────────────
      // This is the critical step: verified jobs must "know" their title and level before deduplication
      const metaMap = new Map();
      [...sponsoredJobs, ...deepSponsored].forEach(s => {
        const uk = _urlKey(s.url);
        if (uk) metaMap.set('u:' + uk, s);
        if (s.id) metaMap.set('i:' + s.id, s);
        if (s.jobId) metaMap.set('j:' + s.jobId, s);
      });

      verifiedJobs.forEach(v => {
        const uk = _urlKey(v.url);
        let meta = metaMap.get('u:' + uk) || metaMap.get('i:' + v.job_id) || metaMap.get('j:' + v.job_id);

        // STRICT SAFETY: Prevent cross-company data leakage!
        // If an auditor pasted a link for Company B into Company A, reject the metadata to prevent UI contamination.
        if (meta && meta.company && selectedCompany && _normR(meta.company) !== _normR(selectedCompany)) {
          const mWords = _normR(meta.company).split(' ').filter(Boolean);
          const sWords = _normR(selectedCompany).split(' ').filter(Boolean);
          // Allow loose match (e.g. "Oracle" vs "Oracle America Inc")
          const looseMatch = mWords.length > 0 && sWords.length > 0 && (mWords[0] === sWords[0]);
          if (!looseMatch) {
            meta = null; // Reject corrupted metadata match
          }
        }

        if (meta) {
          v.title = meta.title;
          v.id = meta.id;
          v.wage_level = meta.wage_level || v.wage_level;
          v.location = meta.location || v.location;
          v.salary = meta.salary || v.salary;
        } else {
          // Fallback matching by company + normalized role/domain
          const companyJobs = deepSponsored.filter(j => j.company === v.company || j.company === selectedCompany);
          const vRole = _normR(v.role || v.domain || '');
          const bestMatch = companyJobs.find(j => _normR(j.title).includes(vRole) || _normR(j.job_role_name).includes(vRole));
          if (bestMatch) {
            v.title = bestMatch.title;
            v.id = bestMatch.id;
            v.wage_level = bestMatch.wage_level || v.wage_level;
          }
        }
        if (!v.location) v.location = 'united states';
      });

      // ── Pass 3: Combine jobs into unique map ────────────────────────────────
      // Use logical Job Identity (Company + Title + Location) as the primary key
      // to eliminate duplicates that have different tracking URLs but same content.
      const finalMap = new Map();

      // 1. Process sponsored jobs
      sponsoredJobs.forEach(j => {
        if (!j.location) j.location = 'united states';
        const jk = _jobKey(j);
        const existing = finalMap.get(jk);

        const curLvl = parseInt(_lvlKey(j.wage_level || j.wage_num) || '1');
        const exLvl = existing ? parseInt(_lvlKey(existing.wage_level || existing.wage_num) || '0') : 0;

        // If we have a duplicate link in the pool, keep the one with better metadata (higher level or has salary)
        if (!existing || curLvl > exLvl || (!existing.salary && j.salary)) {
          finalMap.set(jk, {
            ...j,
            isVerified: verifiedByRole.has(_roleKey(j))
          });
        }
      });

      // 2. Process verified jobs (merge or add)
      verifiedJobs.forEach(v => {
        const jk = _jobKey(v);
        const existing = finalMap.get(jk);
        if (!existing) {
          finalMap.set(jk, v);
        } else {
          // Merge verified status and richer data into the sponsored entry
          const curLvl = parseInt(_lvlKey(v.wage_level) || '1');
          const exLvl = parseInt(_lvlKey(existing.wage_level) || '1');

          finalMap.set(jk, {
            ...existing,
            ...v,
            isVerified: true,
            salary: existing.salary || v.salary,
            wage_level: exLvl >= curLvl ? existing.wage_level : v.wage_level,
            url: existing.url || v.url,
            // Strictly prefer the sponsored title
            title: existing.title || v.title,
            job_id: existing.job_id || v.job_id,
          });
        }
      });

      let unique = Array.from(finalMap.values());

      // ── pass 4: STRICT EXACT NORMALIZED MATCHING (v11) ──
      if (search && search.trim()) {
        const n = (s) => String(s || '').toLowerCase()
          .replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "")
          .trim()
          .replace(/\s+/g, ' ');
        const nS = n(search);
        unique = unique.filter(j => {
          // Field Lockdown: Match only the primary displayed title
          const primaryTitle = j.title || '';
          return n(primaryTitle) === nS;
        });
      }

      // --- STRICT LEVEL FILTER (Post-merge) ---
      if (level && level.length > 0) {
        const allowedDigits = new Set(level.map(l => l.match(/\d/)?.[0]).filter(Boolean));
        unique = unique.filter(j => {
          const jobLvlMatch = String(j.wage_level || '').match(/\d/);
          let jobLvl = jobLvlMatch ? jobLvlMatch[0] : null;
          if (!jobLvl) {
            const s = String(j.wage_level || '').toUpperCase();
            if (s.match(/\bIV\b/) || s.includes('LEVEL 4')) jobLvl = '4';
            else if (s.match(/\bIII\b/) || s.includes('LEVEL 3')) jobLvl = '3';
            else if (s.match(/\bII\b/) || s.includes('LEVEL 2')) jobLvl = '2';
            else if (s.match(/\bI\b/) || s.includes('LEVEL 1')) jobLvl = '1';
          }
          return jobLvl && allowedDigits.has(jobLvl);
        });
      }

      const total = paymentStatus === 'pending' ? Math.min(2, unique.length) : unique.length;

      // Final Priority Sort: (0) Wage Level (if filtered), (1) Salary First, (2) Verified, (3) Newest
      unique.sort((a, b) => {
        // Explictly sort Lv 1 mathematically above Lv 2 when multiple levels selected
        if (level && level.length > 1) {
          const getLv = (j) => {
            const m = String(j.wage_level || j.wage_num || '').match(/\d/);
            return m ? parseInt(m[0]) : 99;
          };
          const wA = getLv(a);
          const wB = getLv(b);
          if (wA !== wB) return wA - wB;
        }

        const hasSal = (s) => s && s.includes('$');
        const aHasSal = hasSal(a.salary);
        const bHasSal = hasSal(b.salary);
        if (aHasSal && !bHasSal) return -1;
        if (!aHasSal && bHasSal) return 1;

        if (a.isVerified && !b.isVerified) return -1;
        if (!a.isVerified && b.isVerified) return 1;

        const dateA = new Date(a.date_posted || 0).getTime();
        const dateB = new Date(b.date_posted || 0).getTime();
        return dateB - dateA;
      });

      let lcaCount = 0;
      // H1B filing fetch removed per user request (only allow in H1B Finder tab)
      
      const jobsWithFilings = unique.map(j => ({
        ...j,
        lca_filings: 0,
        isTeaser: paymentStatus === 'pending'
      }));

      const pagedUnique = jobsWithFilings.slice(from, to + 1);

      setCompanyJobs(pagedUnique);
      setJobsLoading(false);

      // (A) Calculate wage_level for paged verified-only jobs
      const jobsNeedingWage = pagedUnique.filter(j => !j.wage_level);
      if (jobsNeedingWage.length > 0) {
        await Promise.all(jobsNeedingWage.map(async (j) => {
          try {
            const occupation = j.title || '';
            const location = j.location || '';
            if (!occupation || occupation === 'null') return;
            const results = await getWageLevel(occupation, location, j.salary);
            if (results && results.length > 0) {
              j.wage_level = results[0]['Wage Level'] || 'Lv 2';
              j.wage_num = parseInt(j.wage_level.match(/\d/)?.[0] || '2');
            }
          } catch (err) {
            // Silently fail
          }
        }));
        setCompanyJobs([...pagedUnique]); // Update state once enriched
      }

      // Update cache
      window._companyJobsCache.set(cacheKey, { jobs: pagedUnique, total });
      setTotalCompanyJobs(total);
    } catch (err) {
      console.error("fetchCompanyJobs Error:", err);
    } finally {
      if (activeCompanyRef.current === selectedCompany) {
        setJobsLoading(false);
      }
    }
  }, [user, selectedCompany, debouncedJobSearch, debouncedCompanySearch, jobSearch, jobPage, jobLevelFilter]);



  useEffect(() => {
    if (user && activeView === 'all_companies') {
      fetchCompanies();
    }
  }, [fetchCompanies, activeView, user]);

  // Fetch company jobs when company changes (single trigger, cache prevents re-fetch)
  useEffect(() => {
    if (user && selectedCompany && activeView === 'all_companies') {
      fetchCompanyJobs();
      if (isMobile) setMobileActiveCol('right');
    }
  }, [fetchCompanyJobs, user, selectedCompany, activeView, isMobile]);
  useEffect(() => { if (user) { fetchSavedJobIds(); fetchAppliedJobIds(); } }, [user]);

  // ── Realtime: when new tl_confirmation='yes' rows are synced into audit_reviews_backup,
  //             clear company caches and re-fetch so verified badges update automatically
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('hp_audit_backup_insert')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'audit_reviews_backup' },
        (payload) => {
          if (payload?.new?.tl_confirmation === 'yes') {
            // Clear all company caches so next fetchCompanies gets fresh confirmed list
            window._allProcessedCompanies = null;
            window._confirmedCompaniesCache = null;
            window._companyJobsCache = null; // Clear jobs cache as well
            try { sessionStorage.removeItem('_companiesCache_v8'); } catch (_) { }
            setIsInitialLoadDone(false);
            setAllProcessedCompanies([]);
          }
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);


  const fetchSavedJobIds = async () => {
    if (!user) return;
    try {
      await new Promise(r => setTimeout(r, 100)); // Stagger load to prevent 525
      const { data, error } = await supabase.from('saved_jobs').select('job_id').eq('user_id', user.id);
      if (error) throw error;
      if (data) setSavedJobIds(new Set(data.map(i => String(i.job_id))));
    } catch (err) {
      if (!err.message?.includes('fetch') && window.navigator.onLine) {
        console.error("fetchSavedJobIds Error:", err);
      }
    }
  };
  const fetchAppliedJobIds = async () => {
    if (!user) return;
    try {
      await new Promise(r => setTimeout(r, 200)); // Stagger load to prevent 525
      const { data, error } = await supabase.from('applied_jobs').select('job_id').eq('user_id', user.id);
      if (error) throw error;
      if (data) setAppliedJobIds(new Set(data.map(i => String(i.job_id))));
    } catch (err) {
      if (!err.message?.includes('fetch') && window.navigator.onLine) {
        console.error("fetchAppliedJobIds Error:", err);
      }
    }
  };

  const handleSaveJob = async (job) => {
    if (!user) return;
    const jobId = job.job_id || job.id || job.audit_id;
    try {
      if (savedJobIds.has(String(jobId))) {
        await supabase.from('saved_jobs').delete().eq('user_id', user.id).eq('job_id', jobId);
        setSavedJobIds(prev => { const s = new Set(prev); s.delete(String(jobId)); return s; });
      } else {
        await supabase.from('saved_jobs').insert([{ user_id: user.id, job_id: jobId, job_data: job }]);
        setSavedJobIds(prev => { const s = new Set(prev); s.add(String(jobId)); return s; });
      }
    } catch (err) { console.error(err); }
  };

  const getInitials = (n) => n ? n.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase() : '??';
  const handleCompanySelect = (c) => {
    setCompanyJobs([]); // Clear immediately
    setSelectedCompany(c.company);
    setSelectedCompanyData(c);
    setJobPage(1);
    setJobSearch('');
    setJobLevelFilter([]); // Correctly reset as empty array
    if (isMobile) setMobileActiveCol('right');
  };

  if (authLoading || paymentLoading) return <div className="h-screen w-screen flex items-center justify-center bg-[#f5f5f7]"><Loader2 className="w-8 h-8 text-[#24385E] animate-spin" /></div>;
  if (!user && !authLoading) return <Navigate to="/" replace />;

  // Access gate removed — all logged-in users see the full dashboard

  const navItems = [
    { id: 'all_jobs', label: 'All Jobs', icon: Briefcase },
    { id: 'all_companies_list', label: 'All Companies', icon: Building2 },
    { id: 'domains', label: 'Domains', icon: Globe },
    { id: 'h1b_finder', label: 'H-1B Finder', icon: Shield },
    { id: 'admin_stats', label: 'Admin Stats', icon: Activity },
    // { id: 'all_companies', label: 'All companies that sponsor', icon: Building2 },
  ];

  /* ─────────────────────────────────────── */
  /*  INLINE STYLES MATCHING SCREENSHOT 1   */
  /* ─────────────────────────────────────── */
  const S = {
    page: { display: 'flex', height: '100vh', overflow: 'hidden', background: '#FFFFFF', fontFamily: "'Inter', sans-serif" },
    sidebar: {
      width: sidebarOpen ? '260px' : '0',
      minWidth: sidebarOpen ? '260px' : '0',
      background: 'rgba(255, 255, 255, 0.98)',
      backdropFilter: 'blur(10px)',
      borderRight: '1px solid rgba(0, 0, 0, 0.05)',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
      position: isMobile ? 'fixed' : 'relative',
      zIndex: 9999,
      height: '100vh',
      left: 0,
      top: 0,
      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
      overflow: 'hidden',
      boxShadow: sidebarOpen ? '20px 0 50px rgba(0,0,0,0.05)' : 'none'
    },
    sidebarLogo: { padding: '24px 24px 20px', minWidth: '260px' },
    sidebarNav: { flex: 1, padding: '0 12px', overflowY: 'auto', minWidth: '260px' },
    navItem: (active) => ({
      width: '100%', display: 'flex', alignItems: 'center', gap: '12px',
      padding: '12px 14px', borderRadius: '12px', fontSize: '14px', fontWeight: active ? 700 : 500,
      color: active ? '#FFFFFF' : '#555', background: active ? '#2C76FF' : 'transparent',
      border: 'none', cursor: 'pointer', transition: 'all 200ms ease', marginBottom: '6px',
      textAlign: 'left',
    }),
    sidebarBottom: { padding: '12px 12px 20px', borderTop: '1px solid #f0f0f0', minWidth: '260px' },
    userRow: { display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 12px 0' },
    main: { flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden', background: '#FFFFFF' },
    topBar: {
      background: '#FFFFFF',
      borderBottom: '1px solid #f0f0f0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: isMobile ? 'space-between' : 'center',
      gap: '12px',
      padding: isMobile ? '0 16px' : '12px 24px',
      height: isMobile ? '60px' : 'auto',
      flexShrink: 0
    },
    content: { flex: 1, display: 'flex', overflow: 'hidden', position: 'relative', background: '#FFFFFF' },
    leftCol: {
      width: isMobile ? '100%' : '460px',
      minWidth: isMobile ? '0' : '460px',
      background: '#FFFFFF',
      display: (isMobile && mobileActiveCol === 'right') ? 'none' : 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      flexShrink: 0,
      borderRight: '1px solid #f0f0f0'
    },
    searchWrap: { padding: isMobile ? '16px 12px' : '20px 20px 12px' },
    searchRow: { display: 'flex', alignItems: 'center', gap: '10px' },
    searchPill: { flex: 1, display: 'flex', alignItems: 'center', gap: '10px', background: '#fff', border: '1.5px solid #eee', borderRadius: '60px', padding: '0 16px', height: isMobile ? '46px' : '52px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)', transition: 'all 0.2s ease' },
    searchInput: { flex: 1, border: 'none', outline: 'none', fontSize: isMobile ? '14px' : '15px', color: '#1E1E1E', background: 'transparent', minWidth: 0, fontWeight: 500 },
    filterBtn: { display: 'flex', alignItems: 'center', gap: '8px', background: '#fff', border: '1.5px solid #eee', borderRadius: '60px', padding: isMobile ? '0 14px' : '0 18px', height: isMobile ? '46px' : '52px', fontSize: '14px', fontWeight: 600, color: '#1E1E1E', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.03)', whiteSpace: 'nowrap', flexShrink: 0, transition: 'all 0.2s ease' },
    countRow: { padding: '0 20px 8px', textAlign: 'center', fontSize: '13px', color: '#888', fontWeight: 500 },
    companyList: { flex: 1, overflowY: 'auto', padding: isMobile ? '0 10px 24px' : '0 16px 24px', scrollbarWidth: 'none' },
    rightCol: {
      flex: 1,
      background: '#FFFFFF',
      display: (isMobile && mobileActiveCol === 'left') ? 'none' : 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    },
    rightScroll: { flex: 1, overflowY: 'auto', padding: isMobile ? '20px' : '32px 40px', scrollbarWidth: 'none' },
    coLogo: { width: isMobile ? '48px' : '56px', height: isMobile ? '48px' : '56px', borderRadius: '16px', background: '#1E1E1E', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: isMobile ? '16px' : '18px', fontWeight: 900, color: '#fff', flexShrink: 0 },
    jobSearchPill: { flex: 1, display: 'flex', alignItems: 'center', gap: '10px', background: '#fcfcfc', border: '1.5px solid #f0f0f0', borderRadius: '60px', padding: '0 16px', height: isMobile ? '46px' : '50px' },
    jobSearchInput: { flex: 1, border: 'none', outline: 'none', fontSize: '14px', color: '#1E1E1E', background: 'transparent', minWidth: 0, fontWeight: 500 },
    searchBtn: { height: isMobile ? '46px' : '50px', padding: isMobile ? '0 20px' : '0 28px', background: '#2C76FF', color: '#fff', border: 'none', borderRadius: '60px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', flexShrink: 0, boxShadow: '0 4px 14px rgba(44,118,255,0.25)', transition: 'all 0.2s ease' }
  };

  return (
    <div style={S.page}>

      {/* Sidebar Overlay for Mobile */}
      {sidebarOpen && isMobile && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9998 }}
        />
      )}

      {/* ═══════════════ SIDEBAR ═══════════════ */}
      <aside style={S.sidebar}>
        {/* Logo */}
        <div style={S.sidebarLogo}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }} onClick={() => navigate('/')}>
              <div style={{ position: 'relative' }}>
                <img
                  src="https://res.cloudinary.com/dpuziwnvl/image/upload/v1751357541/apply_wizz_logo_hrvtmm.jpg"
                  alt="Career Partner"
                  style={{ width: '48px', height: '48px', borderRadius: '12px', objectFit: 'contain' }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
                <span style={{ fontSize: '20px', fontWeight: 900, color: '#1E1E1E', letterSpacing: '-0.03em' }}>Career</span>
                <span style={{ fontSize: '20px', fontWeight: 900, color: '#2C76FF', letterSpacing: '-0.03em' }}>Partner</span>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              style={{ 
                background: '#fef2f2', 
                border: 'none', 
                color: '#ef4444', 
                cursor: 'pointer', 
                padding: '8px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#fee2e2'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#fef2f2'; }}
            >
              <X size={20} strokeWidth={2.5} />
            </button>
          </div>
        </div>

        {/* Nav */}
        <nav style={S.sidebarNav}>
          {navItems.map(item => {
            const Icon = item.icon;
            const active = activeView === item.id;
            const isMultiLine = item.label.includes('\n');
            return (
              <button key={item.id} style={S.navItem(active || item.id === 'consultation')} onClick={() => {
                if (item.external) {
                  window.open(item.url, '_blank', 'noopener,noreferrer');
                } else {
                  if (item.id === 'h1b_finder') {
                    navigate('/h1b-finder');
                  } else {
                    navigate('/app');
                    setActiveView(item.id);
                  }
                }
                if (isMobile) setSidebarOpen(false);
              }}
                onMouseEnter={e => { if (!active && item.id !== 'consultation') { e.currentTarget.style.background = 'rgba(0,0,0,0.03)'; } }}
                onMouseLeave={e => { if (!active && item.id !== 'consultation') { e.currentTarget.style.background = 'transparent'; } }}
              >
                <Icon size={18} strokeWidth={active ? 2.5 : 2} color={active ? '#1E1E1E' : '#555'} />
                {isMultiLine
                  ? <span style={{ lineHeight: '1.2' }}>{item.label.split('\n').map((line, i) => i === 0 ? <React.Fragment key="l0">{line}</React.Fragment> : <React.Fragment key={i}><br />{line}</React.Fragment>)}</span>
                  : <span>{item.label}</span>
                }
              </button>
            );
          })}
        </nav>

        {/* Bottom */}
        <div style={S.sidebarBottom}>
          <button style={S.navItem(activeView === 'settings')} onClick={() => { setActiveView('settings'); if (isMobile) setsidebarOpen(false); }}
            onMouseEnter={e => { if (activeView !== 'settings') { e.currentTarget.style.background = '#f5f5f5'; } }}
            onMouseLeave={e => { if (activeView !== 'settings') { e.currentTarget.style.background = 'transparent'; } }}
          >
            <Settings size={18} strokeWidth={1.6} /><span>Settings</span>
          </button>

          {/* Admin Panel — only visible when role === 'admin' */}
          {isAdmin && (
            <button
              style={{
                ...S.navItem(false),
                color: '#24385E',
                background: 'rgba(36,56,94,0.08)',
                border: '1px solid rgba(36,56,94,0.15)',
                marginTop: '4px',
              }}
              onClick={() => { navigate('/admin'); if (isMobile) setSidebarOpen(false); }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(36,56,94,0.14)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(36,56,94,0.08)'}
            >
              <Shield size={18} strokeWidth={1.8} />
              <span style={{ fontWeight: 700 }}>Admin Panel</span>
              <span style={{
                marginLeft: 'auto', fontSize: '9px', fontWeight: 800,
                background: '#24385E', color: '#fff',
                padding: '2px 6px', borderRadius: '20px', letterSpacing: '0.05em',
                textTransform: 'uppercase'
              }}>Admin</span>
            </button>
          )}

          <button
            style={{ ...S.navItem(false), color: '#ef4444' }}
            onClick={handleLogout}
            onMouseEnter={e => e.currentTarget.style.background = '#fef2f2'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <LogOut size={18} strokeWidth={1.6} />
            <span>Logout</span>
          </button>

          <div style={S.userRow}>
            <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: '#2C76FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 800, color: '#fff', flexShrink: 0 }}>
              {(user?.email?.[0] || 'U').toUpperCase()}
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: '13px', fontWeight: 700, color: '#1E1E1E', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email?.split('@')[0] || 'User'}</p>
              <p style={{ fontSize: '11px', color: '#888', margin: 0, fontWeight: 500 }}>Software Engineer</p>
            </div>
          </div>
        </div>
      </aside>

      {/* ═══════════════ MAIN ═══════════════ */}
      <div style={S.main}>

        <div style={S.topBar}>
          {isMobile && !sidebarOpen && (
            <button onClick={() => setSidebarOpen(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px', marginLeft: '-8px' }}>
              <Menu size={24} color="#24385E" />
            </button>
          )}
          {!isMobile && !sidebarOpen && (
             <div style={{ width: '40px' }} /> // Placeholder to keep title centered if toggle is absolute
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {activeView === 'all_companies' ? <Building2 size={20} color="#2C76FF" /> : <Briefcase size={20} color="#2C76FF" />}
            <span style={{ fontSize: isMobile ? '14px' : '16px', fontWeight: 700, color: '#1E1E1E', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {activeView === 'all_companies' ? 'Search open roles by company' : 'Global Career Acceleration'}
            </span>
          </div>

          {!isMobile && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: '12px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#2C76FF' }} />
              <div style={{ width: '32px', height: '2px', background: '#2C76FF', opacity: 0.2, borderRadius: '3px' }} />
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#eee' }} />
              <div style={{ width: '32px', height: '2px', background: '#eee', borderRadius: '3px' }} />
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#eee' }} />
            </div>
          )}
          {isMobile && <div style={{ width: '32px' }} />}
        </div>

        <div style={{ ...S.content, flexDirection: 'column', padding: isMobile ? '16px' : '32px', overflowY: 'auto' }}>

          {/* Global Search Header - Always visible at top of content for main views */}
          {(activeView === 'all_jobs' || activeView === 'all_companies' || activeView === 'domains' || activeView === 'all_companies_list') && (
            <GlobalSearchHeader
              selectedCountry={countryFilter}
              onCountryChange={setCountryFilter}
              dateRange={dateFilter}
              onDateRangeChange={setDateFilter}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
            />
          )}

          {/* ━━━━━━ ALL JOBS VIEW ━━━━━━ */}
          {activeView === 'all_jobs' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <AllJobsTab
                activeFilter={activeJobFilter}
                searchTerm={Array.isArray(companySearch) ? '' : companySearch}
                fixedCompany={Array.isArray(companySearch) ? companySearch : null}
                countryFilter={countryFilter}
                dateFilter={dateFilter}
                viewMode={viewMode}
              />
            </div>
          )}

          {/* ━━━━━━ ALL COMPANIES LIST VIEW ━━━━━━ */}
          {activeView === 'all_companies_list' && (
            <AllCompaniesListTab
              selectedCountry={countryFilter}
              dateFilter={dateFilter}
              viewMode={viewMode}
              onSelectCompany={(companyName, originalNames) => {
                setCompanySearch(originalNames || companyName);
              }}
            />
          )}

          {/* ━━━━━━ DOMAINS VIEW ━━━━━━ */}
          {activeView === 'domains' && (
            <DomainsTab
              selectedCountry={countryFilter}
              dateFilter={dateFilter}
              viewMode={viewMode}
              onSelectDomain={(domainName) => {
                setCompanySearch(domainName);
              }}
            />
          )}

          {/* ━━━━━━ ALL COMPANIES CARD VIEW ━━━━━━ */}
          {activeView === 'all_companies' && (
            <CompaniesTab
              selectedCountry={countryFilter}
              dateFilter={dateFilter}
              viewMode={viewMode}
              onSelectCompany={(companyName, originalNames) => {
                setCompanySearch(originalNames || companyName);
              }}
            />
          )}

          {/* ━━━━━━ ADMIN STATS VIEW ━━━━━━ */}
          {activeView === 'admin_stats' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <AdminStatsTab />
            </div>
          )}
          {activeView === 'h1b_finder' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <H1BSponsorFinderTab />
            </div>
          )}

          {/* ━━━━━━ BILLING VIEW ━━━━━━ */}
          {activeView === 'billing' && (
            <PaymentDetailsTab />
          )}

          {/* Settings / Saved / Applied Views */}
          {activeView === 'saved' && <div style={{ flex: 1, height: '100%', overflowY: 'auto', background: '#fff', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}><div style={{ padding: isMobile ? '20px 16px' : '40px', maxWidth: '900px', margin: '0 auto' }}><SavedJobsTab /></div></div>}
          {activeView === 'applied' && <div style={{ flex: 1, height: '100%', overflowY: 'auto', background: '#fff', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}><div style={{ padding: isMobile ? '20px 16px' : '40px', maxWidth: '900px', margin: '0 auto' }}><AppliedJobsTab /></div></div>}
          {activeView === 'settings' && <div style={{ flex: 1, height: '100%', overflowY: 'auto', background: '#fff', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}><div style={{ padding: isMobile ? '20px 16px' : '40px', maxWidth: '800px', margin: '0 auto' }}><ProfileTab /></div></div>}

        </div>
      </div>

      {/* Floating Reopen Button (Desktop) - Premium Glassmorphism */}
      {!sidebarOpen && !isMobile && (
        <button
          onClick={() => setSidebarOpen(true)}
          style={{
            position: 'fixed',
            left: '24px',
            top: '20px',
            background: 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(44, 118, 255, 0.1)',
            borderRadius: '16px',
            padding: '10px',
            cursor: 'pointer',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#2C76FF',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            opacity: 0,
            animation: 'fadeIn 0.5s ease forwards'
          }}
          onMouseEnter={e => { 
            e.currentTarget.style.transform = 'scale(1.1) rotate(5deg)'; 
            e.currentTarget.style.background = '#fff';
            e.currentTarget.style.boxShadow = '0 12px 40px rgba(44, 118, 255, 0.2)';
          }}
          onMouseLeave={e => { 
            e.currentTarget.style.transform = 'scale(1) rotate(0deg)'; 
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.8)';
            e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.08)';
          }}
        >
          <Menu size={24} strokeWidth={2.5} />
          <style>{`
            @keyframes fadeIn {
              from { opacity: 0; transform: translateX(-20px); }
              to { opacity: 1; transform: translateX(0); }
            }
          `}</style>
        </button>
      )}

      {/* Guided Tour */}
      <AppTour activeView={activeView} />
    </div>
  );
};

export default Homepage;
