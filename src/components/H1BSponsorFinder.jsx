// import React, { useState, useEffect, useCallback } from 'react';
// import { supabase } from '../supabaseClient';
// import {
//     Search, ChevronDown, ChevronRight, Globe, Users, Briefcase,
//     BarChart3, Loader2, Download, Building2
// } from 'lucide-react';

// /* ═══════════════════════════════════════════════════════════════
//    H1B SPONSOR FINDER — modeled after h1bsponsors.me
//    3-tier expandable tables for both Company Search & Job Title Search
//    ═══════════════════════════════════════════════════════════════ */

// const H1BSponsorFinder = ({ isMobile }) => {
//     // ─── STATE ───
//     const [tab, setTab] = useState('company');           // 'company' | 'role'
//     const [searchTerm, setSearchTerm] = useState('');
//     const [loading, setLoading] = useState(true);
//     const [stats, setStats] = useState({ companies: 0, filings: 0, positions: 0, sponsors: 0 });

//     // Company tab
//     const [companies, setCompanies] = useState([]);
//     const [expandedCompany, setExpandedCompany] = useState(null);
//     const [companyRoles, setCompanyRoles] = useState({});  // { companyName: [roles] }
//     const [expandedRole, setExpandedRole] = useState(null);
//     const [roleFilings, setRoleFilings] = useState({});    // { "company__role": [filings] }

//     // Role tab
//     const [roleCategories, setRoleCategories] = useState([]);
//     const [roleCatLoading, setRoleCatLoading] = useState(false);
//     const [selectedCategory, setSelectedCategory] = useState(null);
//     const [jobTitles, setJobTitles] = useState([]);
//     const [jobTitlesLoading, setJobTitlesLoading] = useState(false);
//     const [expandedJobTitle, setExpandedJobTitle] = useState(null);
//     const [titleCompanies, setTitleCompanies] = useState({});   // { title: [companies] }
//     const [expandedTitleCompany, setExpandedTitleCompany] = useState(null);
//     const [titleCompanyFilings, setTitleCompanyFilings] = useState({}); // { "title__company": [filings] }

//     const fmt = (v) => v ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v) : '$0';

//     // ─── FETCH STATS ───
//     useEffect(() => {
//         (async () => {
//             try {
//                 const { data, error } = await supabase.rpc('get_h1b_stats');
//                 if (!error && data) {
//                     setStats({
//                         companies: data.unique_companies || 0,
//                         filings: data.total_filings || 0,
//                         positions: data.worker_positions || 0,
//                         sponsors: data.h1b_sponsors || 0
//                     });
//                 }
//             } catch (e) { console.error(e); }
//         })();
//     }, []);

//     // ─── COMPANY SEARCH ───
//     useEffect(() => {
//         if (tab !== 'company') return;
//         const timer = setTimeout(() => fetchCompanies(), 250);
//         return () => clearTimeout(timer);
//     }, [searchTerm, tab]);

//     const fetchCompanies = async () => {
//         setLoading(true);
//         try {
//             let q = supabase
//                 .from('h1b_sponsor_finder')
//                 .select('id, "Company", "LCA Filings", "Worker Positions", "HQ State", "# States", "Common Job Titles", "Avg Salary", "Median Salary"')
//                 .order('LCA Filings', { ascending: false })
//                 .limit(100);

//             if (searchTerm) q = q.ilike('Company', `%${searchTerm}%`);

//             // De-duplicate by company — take row with highest LCA Filings
//             const { data, error } = await q;
//             if (error) throw error;
//             const seen = {};
//             const unique = [];
//             (data || []).forEach(r => {
//                 const key = r.Company?.toLowerCase();
//                 if (!key) return;
//                 if (!seen[key] || r['LCA Filings'] > seen[key]['LCA Filings']) {
//                     seen[key] = r;
//                 }
//             });
//             Object.values(seen)
//                 .sort((a, b) => (b['LCA Filings'] || 0) - (a['LCA Filings'] || 0))
//                 .forEach(r => unique.push(r));
//             setCompanies(unique);
//         } catch (e) { console.error(e); }
//         setLoading(false);
//     };

//     // ─── EXPAND COMPANY → fetch roles ───
//     const toggleCompany = async (companyName) => {
//         if (expandedCompany === companyName) { setExpandedCompany(null); setExpandedRole(null); return; }
//         setExpandedCompany(companyName);
//         setExpandedRole(null);
//         if (companyRoles[companyName]) return;

//         try {
//             const { data } = await supabase
//                 .from('h1b_sponsor_finder')
//                 .select('"Company Job Title", "LCA Filings", "Avg Salary", "State"')
//                 .eq('Company', companyName)
//                 .not('Company Job Title', 'is', null)
//                 .order('LCA Filings', { ascending: false });

//             // Group by Company Job Title
//             const grouped = {};
//             (data || []).forEach(r => {
//                 const title = r['Company Job Title'] || 'Other';
//                 if (!grouped[title]) grouped[title] = { title, filings: 0, avgSalary: 0, count: 0, states: new Set() };
//                 grouped[title].filings += (r['LCA Filings'] || 0);
//                 grouped[title].avgSalary += (r['Avg Salary'] || 0);
//                 grouped[title].count++;
//                 if (r.State) grouped[title].states.add(r.State);
//             });
//             Object.values(grouped).forEach(g => {
//                 g.avgSalary = g.count > 0 ? g.avgSalary / g.count : 0;
//                 g.stateList = [...g.states].join(', ');
//             });

//             setCompanyRoles(prev => ({ ...prev, [companyName]: Object.values(grouped).sort((a, b) => b.filings - a.filings) }));
//         } catch (e) { console.error(e); }
//     };

//     // ─── EXPAND ROLE → fetch individual filings ───
//     const toggleRole = async (companyName, roleTitle) => {
//         const key = `${companyName}__${roleTitle}`;
//         if (expandedRole === key) { setExpandedRole(null); return; }
//         setExpandedRole(key);
//         if (roleFilings[key]) return;

//         try {
//             const { data } = await supabase
//                 .from('h1b_sponsor_finder')
//                 .select('"City", "State", "Salary", "Visa Type", "Employment Type"')
//                 .eq('Company', companyName)
//                 .eq('Company Job Title', roleTitle)
//                 .order('Salary', { ascending: false })
//                 .limit(50);
//             setRoleFilings(prev => ({ ...prev, [key]: data || [] }));
//         } catch (e) { console.error(e); }
//     };

//     // ─── ROLE CATEGORIES ───
//     useEffect(() => {
//         if (tab === 'role' && roleCategories.length === 0) fetchRoleCategories();
//     }, [tab]);

//     const fetchRoleCategories = async () => {
//         setRoleCatLoading(true);
//         try {
//             const { data, error } = await supabase
//                 .from('h1b_sponsor_finder')
//                 .select('"Common Job Titles", "LCA Filings"')
//                 .not('Common Job Titles', 'is', null)
//                 .not('Common Job Titles', 'eq', '')
//                 .order('LCA Filings', { ascending: false })
//                 .limit(2000);
//             if (error) throw error;

//             const agg = {};
//             (data || []).forEach(r => {
//                 const raw = (r['Common Job Titles'] || '').trim();
//                 if (!raw) return;
//                 const filings = r['LCA Filings'] || 1;
//                 raw.split(/[|;]/).map(t => t.trim()).filter(t => t.length >= 3).forEach(title => {
//                     if (!agg[title]) agg[title] = 0;
//                     agg[title] += filings;
//                 });
//             });
//             setRoleCategories(
//                 Object.entries(agg)
//                     .map(([title, count]) => ({ title, count }))
//                     .sort((a, b) => b.count - a.count)
//             );
//         } catch (e) { console.error(e); }
//         setRoleCatLoading(false);
//     };

//     // ─── SELECT CATEGORY → fetch job titles ───
//     const selectCategory = async (categoryTitle) => {
//         setSelectedCategory(categoryTitle);
//         setSearchTerm(categoryTitle);
//         setExpandedJobTitle(null);
//         setExpandedTitleCompany(null);
//         fetchJobTitlesForCategory(categoryTitle);
//     };

//     const fetchJobTitlesForCategory = async (cat) => {
//         setJobTitlesLoading(true);
//         try {
//             const { data, error } = await supabase
//                 .from('h1b_sponsor_finder')
//                 .select('"Company Job Title", "Company", "LCA Filings", "Avg Salary"')
//                 .ilike('Common Job Titles', `%${cat}%`)
//                 .not('Company Job Title', 'is', null)
//                 .order('LCA Filings', { ascending: false })
//                 .limit(500);
//             if (error) throw error;

//             // Group by Company Job Title
//             const agg = {};
//             (data || []).forEach(r => {
//                 const title = r['Company Job Title'] || 'Other';
//                 if (!agg[title]) agg[title] = { title, filings: 0, companies: new Set(), totalSalary: 0, count: 0 };
//                 agg[title].filings += (r['LCA Filings'] || 0);
//                 agg[title].companies.add(r.Company);
//                 agg[title].totalSalary += (r['Avg Salary'] || 0);
//                 agg[title].count++;
//             });
//             const sorted = Object.values(agg)
//                 .map(g => ({ ...g, companyCount: g.companies.size, avgSalary: g.count > 0 ? g.totalSalary / g.count : 0 }))
//                 .sort((a, b) => b.filings - a.filings);

//             setJobTitles(sorted);
//         } catch (e) { console.error(e); }
//         setJobTitlesLoading(false);
//     };

//     // ─── ROLE SEARCH ───
//     useEffect(() => {
//         if (tab !== 'role') return;
//         if (!searchTerm) { setSelectedCategory(null); setJobTitles([]); return; }
//         const timer = setTimeout(() => {
//             setSelectedCategory(searchTerm);
//             fetchJobTitlesForCategory(searchTerm);
//         }, 400);
//         return () => clearTimeout(timer);
//     }, [searchTerm, tab]);

//     // ─── EXPAND JOB TITLE → show companies ───
//     const toggleJobTitle = async (title) => {
//         if (expandedJobTitle === title) { setExpandedJobTitle(null); setExpandedTitleCompany(null); return; }
//         setExpandedJobTitle(title);
//         setExpandedTitleCompany(null);
//         if (titleCompanies[title]) return;

//         try {
//             const { data } = await supabase
//                 .from('h1b_sponsor_finder')
//                 .select('"Company", "LCA Filings", "Avg Salary"')
//                 .eq('Company Job Title', title)
//                 .order('LCA Filings', { ascending: false })
//                 .limit(100);

//             // Group by Company
//             const agg = {};
//             (data || []).forEach(r => {
//                 const co = r.Company;
//                 if (!agg[co]) agg[co] = { company: co, filings: 0, totalSalary: 0, count: 0 };
//                 agg[co].filings += (r['LCA Filings'] || 0);
//                 agg[co].totalSalary += (r['Avg Salary'] || 0);
//                 agg[co].count++;
//             });
//             const sorted = Object.values(agg)
//                 .map(g => ({ ...g, avgSalary: g.count > 0 ? g.totalSalary / g.count : 0 }))
//                 .sort((a, b) => b.filings - a.filings);

//             setTitleCompanies(prev => ({ ...prev, [title]: sorted }));
//         } catch (e) { console.error(e); }
//     };

//     // ─── EXPAND COMPANY under JOB TITLE → show filings ───
//     const toggleTitleCompany = async (title, companyName) => {
//         const key = `${title}__${companyName}`;
//         if (expandedTitleCompany === key) { setExpandedTitleCompany(null); return; }
//         setExpandedTitleCompany(key);
//         if (titleCompanyFilings[key]) return;

//         try {
//             const { data } = await supabase
//                 .from('h1b_sponsor_finder')
//                 .select('"City", "State", "Salary", "Visa Type", "Employment Type"')
//                 .eq('Company', companyName)
//                 .eq('Company Job Title', title)
//                 .order('Salary', { ascending: false })
//                 .limit(50);
//             setTitleCompanyFilings(prev => ({ ...prev, [key]: data || [] }));
//         } catch (e) { console.error(e); }
//     };

//     // ─── CSV DOWNLOAD ───
//     const downloadCSV = () => {
//         const rows = tab === 'company' ? companies : jobTitles;
//         if (!rows.length) return;
//         let csv = '';
//         if (tab === 'company') {
//             csv = 'Company,LCA Filings,Workers,HQ,States,Common Job Titles,Avg Salary,Median Salary\n';
//             rows.forEach(r => {
//                 csv += `"${r.Company}",${r['LCA Filings']},${r['Worker Positions']},"${r['HQ State']}",${r['# States']},"${r['Common Job Titles']}",${r['Avg Salary']},${r['Median Salary']}\n`;
//             });
//         } else {
//             csv = 'Job Title,Filings,Companies,Avg Salary\n';
//             rows.forEach(r => {
//                 csv += `"${r.title}",${r.filings},${r.companyCount},${Math.round(r.avgSalary)}\n`;
//             });
//         }
//         const blob = new Blob([csv], { type: 'text/csv' });
//         const url = URL.createObjectURL(blob);
//         const a = document.createElement('a');
//         a.href = url;
//         a.download = tab === 'company' ? 'h1b_sponsors.csv' : 'h1b_job_titles.csv';
//         a.click();
//         URL.revokeObjectURL(url);
//     };

//     // ─── RESET on tab switch ───
//     const switchTab = (t) => {
//         setTab(t);
//         setSearchTerm('');
//         setExpandedCompany(null);
//         setExpandedRole(null);
//         setSelectedCategory(null);
//         setExpandedJobTitle(null);
//         setExpandedTitleCompany(null);
//         setJobTitles([]);
//     };

//     // ─── FILING ROW (reused in both tabs) ───
//     const FilingRow = ({ f }) => (
//         <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '10px 24px 10px 80px', borderBottom: '1px solid #f1f5f9', fontSize: '13px' }}>
//             <span style={{ color: '#ef4444', fontSize: '14px' }}>📍</span>
//             <span style={{ color: '#2563eb', fontWeight: 600, minWidth: '100px' }}>{f.City || 'Unknown'}, {f.State || '??'}</span>
//             <span style={{ fontWeight: 800, color: '#1e293b', minWidth: '80px' }}>{fmt(f.Salary)}</span>
//             <span style={{ background: '#f1f5f9', color: '#64748b', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700 }}>{f['Visa Type'] || 'H-1B'}</span>
//             <span style={{ color: '#16a34a', fontWeight: 700, fontSize: '12px' }}>{f['Employment Type'] || 'Full-time'}</span>
//         </div>
//     );

//     // ─── STYLES ───
//     const thStyle = { padding: '12px 16px', textAlign: 'left', fontWeight: 700, color: '#64748b', fontSize: '12px', borderBottom: '2px solid #e2e8f0', background: '#f8fafc', whiteSpace: 'nowrap' };
//     const thRight = { ...thStyle, textAlign: 'right' };
//     const tdStyle = { padding: '14px 16px', fontSize: '13px', color: '#1e293b', fontWeight: 600, borderBottom: '1px solid #f1f5f9' };
//     const tdRight = { ...tdStyle, textAlign: 'right', fontWeight: 800 };

//     const totalFilingsForCategory = jobTitles.reduce((s, j) => s + j.filings, 0);

//     return (
//         <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#fff', height: '100%', overflow: 'hidden', fontFamily: "'Inter', -apple-system, sans-serif" }}>

//             {/* ═══ HEADER ═══ */}
//             <div style={{ padding: '20px 28px', borderBottom: '1.5px solid #e2e8f0', background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 50%, #f0f9ff 100%)' }}>
//                 <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
//                     <Search size={24} color="#2563eb" strokeWidth={2.5} />
//                     <h1 style={{ fontSize: '22px', fontWeight: 900, color: '#1e293b', margin: 0 }}>H-1B Visa Sponsor Finder</h1>
//                 </div>
//                 <p style={{ fontSize: '12px', color: '#16a34a', fontWeight: 700, margin: 0 }}>
//                     Updated March 2026 · FY2026 Q1 LCA data
//                 </p>
//             </div>

//             {/* ═══ STATS BAR ═══ */}
//             <div style={{ display: 'flex', gap: '0', borderBottom: '1.5px solid #e2e8f0' }}>
//                 {[
//                     { label: 'Companies', value: stats.companies },
//                     { label: 'LCA Filings', value: stats.filings },
//                     { label: 'Positions', value: stats.positions },
//                     { label: 'H-1B Sponsors', value: stats.sponsors }
//                 ].map((s, i) => (
//                     <div key={i} style={{
//                         flex: 1, padding: '14px 20px',
//                         borderRight: i < 3 ? '1.5px solid #e2e8f0' : 'none',
//                         background: '#fff'
//                     }}>
//                         <div style={{ fontSize: '22px', fontWeight: 900, color: '#1e293b' }}>{s.value.toLocaleString()}</div>
//                         <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', marginTop: '2px' }}>{s.label}</div>
//                     </div>
//                 ))}
//             </div>

//             {/* ═══ TABS ═══ */}
//             <div style={{ display: 'flex', gap: '0', borderBottom: '1.5px solid #e2e8f0', background: '#fafbfc' }}>
//                 <button
//                     onClick={() => switchTab('company')}
//                     style={{
//                         padding: '14px 24px', fontSize: '14px', fontWeight: 700, border: 'none', cursor: 'pointer',
//                         background: 'transparent',
//                         color: tab === 'company' ? '#2563eb' : '#64748b',
//                         borderBottom: tab === 'company' ? '3px solid #2563eb' : '3px solid transparent',
//                         display: 'flex', alignItems: 'center', gap: '6px'
//                     }}
//                 >
//                     <Building2 size={15} /> Company Search
//                 </button>
//                 <button
//                     onClick={() => switchTab('role')}
//                     style={{
//                         padding: '14px 24px', fontSize: '14px', fontWeight: 700, border: 'none', cursor: 'pointer',
//                         background: 'transparent',
//                         color: tab === 'role' ? '#dc2626' : '#64748b',
//                         borderBottom: tab === 'role' ? '3px solid #dc2626' : '3px solid transparent',
//                         display: 'flex', alignItems: 'center', gap: '6px'
//                     }}
//                 >
//                     <Briefcase size={15} /> Job Title Search
//                 </button>
//             </div>

//             {/* ═══ SEARCH BAR ═══ */}
//             <div style={{ padding: '16px 28px', borderBottom: '1px solid #e2e8f0' }}>
//                 <input
//                     type="text"
//                     placeholder={tab === 'company'
//                         ? 'Search company name — e.g. Google, Amazon, Infosys, Cognizant...'
//                         : 'Search job title — e.g. Software Engineer, Data Scientist, Nurse, Product Manager...'}
//                     value={searchTerm}
//                     onChange={e => setSearchTerm(e.target.value)}
//                     style={{
//                         width: '100%', padding: '14px 18px', borderRadius: '10px',
//                         border: '2px solid #e2e8f0', fontSize: '15px', outline: 'none',
//                         color: '#1e293b', fontWeight: 500,
//                         transition: 'border-color 0.2s'
//                     }}
//                     onFocus={e => e.target.style.borderColor = '#2563eb'}
//                     onBlur={e => e.target.style.borderColor = '#e2e8f0'}
//                 />
//             </div>

//             {/* ═══ CONTENT AREA ═══ */}
//             <div style={{ flex: 1, overflowY: 'auto', overflowX: 'auto' }}>

//                 {/* ──────── COMPANY TAB ──────── */}
//                 {tab === 'company' && (
//                     <>
//                         {/* Summary + CSV */}
//                         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 28px' }}>
//                             <span style={{ fontSize: '13px', color: '#1e293b' }}>
//                                 <strong style={{ color: '#2563eb' }}>{companies.length.toLocaleString()}</strong> companies found
//                             </span>
//                             {companies.length > 0 && (
//                                 <button onClick={downloadCSV} style={{
//                                     display: 'flex', alignItems: 'center', gap: '6px',
//                                     padding: '8px 16px', background: '#dc2626', color: '#fff',
//                                     border: 'none', borderRadius: '8px', fontSize: '12px',
//                                     fontWeight: 700, cursor: 'pointer'
//                                 }}>
//                                     <Download size={14} /> Download results as CSV
//                                 </button>
//                             )}
//                         </div>

//                         <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
//                             <thead>
//                                 <tr>
//                                     <th style={thStyle}>Company</th>
//                                     <th style={thRight}>LCA Filings</th>
//                                     <th style={thRight}>Workers</th>
//                                     <th style={thStyle}>HQ</th>
//                                     <th style={thRight}># States</th>
//                                     <th style={thStyle}>Common Job Titles</th>
//                                     <th style={thRight}>Avg Salary</th>
//                                     <th style={thRight}>Median Salary</th>
//                                 </tr>
//                             </thead>
//                             <tbody>
//                                 {loading ? (
//                                     <tr><td colSpan="8" style={{ padding: '60px', textAlign: 'center' }}>
//                                         <Loader2 size={28} style={{ animation: 'spin 1s linear infinite' }} color="#2563eb" />
//                                     </td></tr>
//                                 ) : companies.length > 0 ? companies.map(row => {
//                                     const isExpanded = expandedCompany === row.Company;
//                                     return (
//                                         <React.Fragment key={row.id}>
//                                             {/* Company row */}
//                                             <tr
//                                                 onClick={() => toggleCompany(row.Company)}
//                                                 style={{ cursor: 'pointer', background: isExpanded ? '#f0f9ff' : '#fff', transition: 'background 0.15s' }}
//                                                 onMouseEnter={e => { if (!isExpanded) e.currentTarget.style.background = '#fafbfc'; }}
//                                                 onMouseLeave={e => { if (!isExpanded) e.currentTarget.style.background = '#fff'; }}
//                                             >
//                                                 <td style={tdStyle}>
//                                                     <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
//                                                         {isExpanded ? <ChevronDown size={14} color="#2563eb" /> : <ChevronRight size={14} color="#94a3b8" />}
//                                                         <strong>{row.Company}</strong>
//                                                     </div>
//                                                 </td>
//                                                 <td style={tdRight}>{(row['LCA Filings'] || 0).toLocaleString()}</td>
//                                                 <td style={tdRight}>{(row['Worker Positions'] || 0).toLocaleString()}</td>
//                                                 <td style={tdStyle}>{row['HQ State'] || '—'}</td>
//                                                 <td style={tdRight}>{row['# States'] || 1}</td>
//                                                 <td style={{ ...tdStyle, fontSize: '12px', color: '#64748b' }}>{row['Common Job Titles'] || '—'}</td>
//                                                 <td style={tdRight}>{fmt(row['Avg Salary'])}</td>
//                                                 <td style={tdRight}>{fmt(row['Median Salary'])}</td>
//                                             </tr>

//                                             {/* Tier 2 — Roles under this company */}
//                                             {isExpanded && companyRoles[row.Company] && companyRoles[row.Company].map((role, rIdx) => {
//                                                 const roleKey = `${row.Company}__${role.title}`;
//                                                 const isRoleExpanded = expandedRole === roleKey;
//                                                 return (
//                                                     <React.Fragment key={rIdx}>
//                                                         <tr
//                                                             onClick={(e) => { e.stopPropagation(); toggleRole(row.Company, role.title); }}
//                                                             style={{ cursor: 'pointer', background: isRoleExpanded ? '#eff6ff' : '#f8fafc', borderBottom: '1px solid #e2e8f0' }}
//                                                             onMouseEnter={e => { if (!isRoleExpanded) e.currentTarget.style.background = '#f1f5f9'; }}
//                                                             onMouseLeave={e => { if (!isRoleExpanded) e.currentTarget.style.background = '#f8fafc'; }}
//                                                         >
//                                                             <td colSpan="3" style={{ padding: '12px 16px 12px 48px', fontWeight: 700, color: '#1e293b', fontSize: '13px' }}>
//                                                                 <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
//                                                                     {isRoleExpanded ? <ChevronDown size={13} color="#2563eb" /> : <ChevronRight size={13} color="#94a3b8" />}
//                                                                     {role.title}
//                                                                 </div>
//                                                             </td>
//                                                             <td colSpan="5" style={{ padding: '12px 16px', textAlign: 'right', fontSize: '12px', color: '#64748b' }}>
//                                                                 <span style={{ marginRight: '16px' }}><strong style={{ color: '#1e293b' }}>{role.filings.toLocaleString()}</strong> filings</span>
//                                                                 <span style={{ marginRight: '16px' }}><strong style={{ color: '#1e293b' }}>{fmt(role.avgSalary)}</strong></span>
//                                                                 <span style={{ fontSize: '11px' }}>{role.stateList || '—'}</span>
//                                                             </td>
//                                                         </tr>

//                                                         {/* Tier 3 — Individual filings */}
//                                                         {isRoleExpanded && roleFilings[roleKey] && roleFilings[roleKey].map((f, fIdx) => (
//                                                             <tr key={fIdx} style={{ background: '#fff', borderBottom: '1px solid #f1f5f9' }}>
//                                                                 <td colSpan="8" style={{ padding: 0 }}>
//                                                                     <FilingRow f={f} />
//                                                                 </td>
//                                                             </tr>
//                                                         ))}
//                                                         {isRoleExpanded && roleFilings[roleKey] && roleFilings[roleKey].length === 0 && (
//                                                             <tr><td colSpan="8" style={{ padding: '12px 80px', fontSize: '12px', color: '#94a3b8' }}>No individual filings found for this role.</td></tr>
//                                                         )}
//                                                     </React.Fragment>
//                                                 );
//                                             })}
//                                             {isExpanded && !companyRoles[row.Company] && (
//                                                 <tr><td colSpan="8" style={{ padding: '20px', textAlign: 'center' }}><Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} color="#2563eb" /></td></tr>
//                                             )}
//                                         </React.Fragment>
//                                     );
//                                 }) : (
//                                     <tr><td colSpan="8" style={{ padding: '60px', textAlign: 'center', color: '#94a3b8', fontWeight: 600 }}>
//                                         {searchTerm ? `No companies found matching "${searchTerm}".` : 'No data available.'}
//                                     </td></tr>
//                                 )}
//                             </tbody>
//                         </table>
//                     </>
//                 )}

//                 {/* ──────── JOB TITLE TAB ──────── */}
//                 {tab === 'role' && (
//                     <div style={{ padding: '20px 28px' }}>
//                         {/* No search — show categories */}
//                         {!selectedCategory && !searchTerm ? (
//                             <>
//                                 <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 16px' }}>
//                                     Enter a job title above to see which companies are sponsoring that role.
//                                 </p>
//                                 <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#1e293b', margin: '0 0 4px' }}>Top job categories in this dataset:</h3>
//                                 <p style={{ fontSize: '12px', color: '#94a3b8', margin: '0 0 16px' }}>Click any category to search it instantly</p>

//                                 {roleCatLoading ? (
//                                     <div style={{ textAlign: 'center', padding: '40px' }}><Loader2 size={26} style={{ animation: 'spin 1s linear infinite' }} color="#2563eb" /></div>
//                                 ) : (
//                                     <table style={{ width: '100%', borderCollapse: 'collapse', maxWidth: '650px' }}>
//                                         <thead>
//                                             <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
//                                                 <th style={{ ...thStyle, width: '40px', background: 'transparent' }}>#</th>
//                                                 <th style={{ ...thStyle, background: 'transparent' }}>Job Category (SOC)</th>
//                                                 <th style={{ ...thRight, background: 'transparent' }}>LCA Count</th>
//                                             </tr>
//                                         </thead>
//                                         <tbody>
//                                             {roleCategories.slice(0, 30).map((cat, idx) => (
//                                                 <tr
//                                                     key={cat.title}
//                                                     onClick={() => selectCategory(cat.title)}
//                                                     style={{ cursor: 'pointer', borderBottom: '1px solid #f1f5f9' }}
//                                                     onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
//                                                     onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
//                                                 >
//                                                     <td style={{ padding: '14px 16px', fontSize: '13px', color: '#94a3b8', fontWeight: 700 }}>{idx + 1}</td>
//                                                     <td style={{ padding: '14px 16px', fontSize: '14px', color: '#2563eb', fontWeight: 700 }}>{cat.title}</td>
//                                                     <td style={{ padding: '14px 16px', fontSize: '14px', color: '#1e293b', fontWeight: 800, textAlign: 'right' }}>{cat.count.toLocaleString()}</td>
//                                                 </tr>
//                                             ))}
//                                         </tbody>
//                                     </table>
//                                 )}
//                             </>
//                         ) : (
//                             /* Search results — job titles */
//                             <>
//                                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
//                                     <span style={{ fontSize: '13px', color: '#1e293b' }}>
//                                         <strong style={{ color: '#2563eb' }}>{jobTitles.length.toLocaleString()}</strong> job titles · <strong style={{ color: '#2563eb' }}>{totalFilingsForCategory.toLocaleString()}</strong> total filings for "{selectedCategory || searchTerm}"
//                                     </span>
//                                     {jobTitles.length > 0 && (
//                                         <button onClick={downloadCSV} style={{
//                                             display: 'flex', alignItems: 'center', gap: '6px',
//                                             padding: '10px 20px', background: '#2563eb', color: '#fff',
//                                             border: 'none', borderRadius: '8px', fontSize: '13px',
//                                             fontWeight: 700, cursor: 'pointer'
//                                         }}>
//                                             <Download size={14} /> Download results as CSV
//                                         </button>
//                                     )}
//                                 </div>

//                                 {jobTitlesLoading ? (
//                                     <div style={{ textAlign: 'center', padding: '40px' }}><Loader2 size={26} style={{ animation: 'spin 1s linear infinite' }} color="#2563eb" /></div>
//                                 ) : jobTitles.length > 0 ? (
//                                     <table style={{ width: '100%', borderCollapse: 'collapse' }}>
//                                         <thead>
//                                             <tr>
//                                                 <th style={thStyle}>Job Title</th>
//                                                 <th style={thRight}>Filings</th>
//                                                 <th style={thRight}>Companies</th>
//                                                 <th style={thRight}>Avg Salary</th>
//                                             </tr>
//                                         </thead>
//                                         <tbody>
//                                             {jobTitles.map((jt, idx) => {
//                                                 const isExp = expandedJobTitle === jt.title;
//                                                 return (
//                                                     <React.Fragment key={idx}>
//                                                         <tr
//                                                             onClick={() => toggleJobTitle(jt.title)}
//                                                             style={{ cursor: 'pointer', background: isExp ? '#f0f9ff' : '#fff', borderBottom: '1px solid #f1f5f9' }}
//                                                             onMouseEnter={e => { if (!isExp) e.currentTarget.style.background = '#fafbfc'; }}
//                                                             onMouseLeave={e => { if (!isExp) e.currentTarget.style.background = '#fff'; }}
//                                                         >
//                                                             <td style={tdStyle}>
//                                                                 <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
//                                                                     {isExp ? <ChevronDown size={13} color="#2563eb" /> : <ChevronRight size={13} color="#94a3b8" />}
//                                                                     <span style={{ fontWeight: 700 }}>{jt.title}</span>
//                                                                 </div>
//                                                             </td>
//                                                             <td style={tdRight}>{jt.filings.toLocaleString()}</td>
//                                                             <td style={tdRight}>{jt.companyCount.toLocaleString()}</td>
//                                                             <td style={tdRight}>{fmt(jt.avgSalary)}</td>
//                                                         </tr>

//                                                         {/* Tier 2 — Companies under this title */}
//                                                         {isExp && titleCompanies[jt.title] && titleCompanies[jt.title].map((co, cIdx) => {
//                                                             const coKey = `${jt.title}__${co.company}`;
//                                                             const isCoExp = expandedTitleCompany === coKey;
//                                                             return (
//                                                                 <React.Fragment key={cIdx}>
//                                                                     <tr
//                                                                         onClick={e => { e.stopPropagation(); toggleTitleCompany(jt.title, co.company); }}
//                                                                         style={{ cursor: 'pointer', background: isCoExp ? '#eff6ff' : '#f8fafc', borderBottom: '1px solid #e2e8f0' }}
//                                                                         onMouseEnter={e => { if (!isCoExp) e.currentTarget.style.background = '#f1f5f9'; }}
//                                                                         onMouseLeave={e => { if (!isCoExp) e.currentTarget.style.background = '#f8fafc'; }}
//                                                                     >
//                                                                         <td style={{ padding: '12px 16px 12px 48px', fontWeight: 700, color: '#1e293b', fontSize: '13px', borderBottom: '1px solid #e2e8f0' }}>
//                                                                             <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
//                                                                                 {isCoExp ? <ChevronDown size={13} color="#2563eb" /> : <ChevronRight size={13} color="#94a3b8" />}
//                                                                                 {co.company}
//                                                                             </div>
//                                                                         </td>
//                                                                         <td style={{ ...tdRight, borderBottom: '1px solid #e2e8f0' }}>{co.filings.toLocaleString()}</td>
//                                                                         <td style={{ borderBottom: '1px solid #e2e8f0' }}></td>
//                                                                         <td style={{ ...tdRight, borderBottom: '1px solid #e2e8f0' }}>{fmt(co.avgSalary)}</td>
//                                                                     </tr>

//                                                                     {/* Tier 3 — Filings under company */}
//                                                                     {isCoExp && titleCompanyFilings[coKey] && titleCompanyFilings[coKey].map((f, fIdx) => (
//                                                                         <tr key={fIdx} style={{ background: '#fff', borderBottom: '1px solid #f1f5f9' }}>
//                                                                             <td colSpan="4" style={{ padding: 0 }}>
//                                                                                 <FilingRow f={f} />
//                                                                             </td>
//                                                                         </tr>
//                                                                     ))}
//                                                                     {isCoExp && titleCompanyFilings[coKey] && titleCompanyFilings[coKey].length === 0 && (
//                                                                         <tr><td colSpan="4" style={{ padding: '12px 80px', fontSize: '12px', color: '#94a3b8' }}>No individual filings found.</td></tr>
//                                                                     )}
//                                                                 </React.Fragment>
//                                                             );
//                                                         })}
//                                                         {isExp && !titleCompanies[jt.title] && (
//                                                             <tr><td colSpan="4" style={{ padding: '16px', textAlign: 'center' }}><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} color="#2563eb" /></td></tr>
//                                                         )}
//                                                     </React.Fragment>
//                                                 );
//                                             })}
//                                         </tbody>
//                                     </table>
//                                 ) : (
//                                     <p style={{ textAlign: 'center', color: '#94a3b8', fontWeight: 600, padding: '40px 0' }}>
//                                         No job titles found matching "{searchTerm}".
//                                     </p>
//                                 )}
//                             </>
//                         )}
//                     </div>
//                 )}
//             </div>

//             {/* ═══ FOOTER ═══ */}
//             <div style={{ padding: '12px 28px', borderTop: '1px solid #e2e8f0', textAlign: 'center', fontSize: '12px', color: '#94a3b8', flexShrink: 0 }}>
//                 Created with ❤️ by <strong style={{ color: '#2563eb' }}>WageTrail</strong> · Data: U.S. DOL OFLC FY2026 Q1
//             </div>

//             {/* Spin animation */}
//             <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
//         </div>
//     );
// };

// export default H1BSponsorFinder;






import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import {
    Search, ChevronDown, ChevronUp, Globe, Users, Briefcase,
    BarChart3, Loader2, MapPin, DollarSign, Award, ArrowUpRight
} from 'lucide-react';

const H1BSponsorFinder = ({ isMobile }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [searchType, setSearchType] = useState('company');
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState([]);
    const [stats, setStats] = useState({
        uniqueCompanies: 0,
        totalLcaFilings: 0,
        workerPositions: 0,
        h1bSponsors: 0
    });

    const [workState, setWorkState] = useState('All States');
    const [minSponsorships, setMinSponsorships] = useState(1);
    const [sortBy, setSortBy] = useState('filings');

    const [expandedRows, setExpandedRows] = useState(new Set());
    const [expandedRoles, setExpandedRoles] = useState(new Map());
    const [roleData, setRoleData] = useState({});

    // Refined Palette: Blue + Yellow (Wage Trail Theme)
    const COLORS = {
        primary: '#24385E',
        secondary: '#EAB308',
        background: '#f1f3f6',
        white: '#ffffff',
        textMain: '#1e293b',
        textMuted: '#64748b',
        border: '#e2e8f0'
    };

    useEffect(() => {
        fetchSponsorData();
    }, [searchTerm, searchType, workState, minSponsorships, sortBy]);

    const fetchSponsorData = async () => {
        setLoading(true);
        try {
            let query = supabase.from('h1b_sponsor_finder').select('*');

            if (searchTerm) {
                if (searchType === 'company') {
                    query = query.ilike('Company', `%${searchTerm}%`);
                } else {
                    query = query.ilike('Common Job Titles', `%${searchTerm}%`);
                }
            }

            if (workState !== 'All States') {
                query = query.eq('HQ State', workState);
            }

            if (minSponsorships > 1) {
                query = query.gte('LCA Filings', minSponsorships);
            }

            if (sortBy === 'filings') query = query.order('LCA Filings', { ascending: false });
            else if (sortBy === 'salary') query = query.order('Avg Salary', { ascending: false });
            else if (sortBy === 'workers') query = query.order('Worker Positions', { ascending: false });

            const { data: results, error } = await query.limit(100);
            if (error) throw error;
            setData(results || []);

            const { data: dbStats, error: statsError } = await supabase.rpc('get_h1b_stats');
            if (!statsError && dbStats) {
                setStats({
                    uniqueCompanies: dbStats.unique_companies || 0,
                    totalLcaFilings: dbStats.total_filings || 0,
                    workerPositions: dbStats.worker_positions || 0,
                    h1bSponsors: dbStats.h1b_sponsors || 0
                });
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const toggleCompany = async (row) => {
        const next = new Set(expandedRows);
        if (next.has(row.id)) {
            next.delete(row.id);
        } else {
            next.add(row.id);
            if (!roleData[row.Company]) {
                await fetchRolesForCompany(row.Company);
            }
        }
        setExpandedRows(next);
    };

    const fetchRolesForCompany = async (companyName) => {
        try {
            const { data: filings } = await supabase
                .from('h1b_sponsor_finder')
                .select('*')
                .eq('Company', companyName);

            const grouped = filings.reduce((acc, f) => {
                const title = f["Job Title"] || "Other";
                if (!acc[title]) acc[title] = { title, count: 0, avgPay: 0, items: [], states: new Set() };
                acc[title].count += f["LCA Filings"] || 1;
                acc[title].avgPay += (f.Salary || f["Avg Salary"] || 0);
                acc[title].items.push(f);
                if (f.State) acc[title].states.add(f.State);
                return acc;
            }, {});

            Object.values(grouped).forEach(g => g.avgPay = g.avgPay / (g.items.length || 1));
            setRoleData(prev => ({ ...prev, [companyName]: Object.values(grouped) }));
        } catch (err) {
            console.error("Error fetching role details:", err);
        }
    };

    const toggleRole = (company, roleTitle) => {
        setExpandedRoles(prev => {
            const next = new Map(prev);
            const roles = next.get(company) || new Set();
            if (roles.has(roleTitle)) roles.delete(roleTitle);
            else roles.add(roleTitle);
            next.set(company, roles);
            return next;
        });
    };

    const formatCurrency = (val) => {
        if (!val) return '$0';
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);
    };

    return (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: COLORS.background, height: '100%', overflow: 'hidden' }}>

            {/* ═══════════════ HEADER ═══════════════ */}
            <div style={{ padding: '20px 24px', background: COLORS.white, borderBottom: `1.5px solid ${COLORS.border}`, position: 'relative' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{
                        padding: '10px',
                        background: `linear-gradient(135deg, ${COLORS.primary} 0%, #3d5a8c 100%)`,
                        borderRadius: '12px',
                        boxShadow: '0 4px 12px rgba(36, 56, 94, 0.2)'
                    }}>
                        <Globe size={22} color="#fff" strokeWidth={2.5} />
                    </div>
                    <div>
                        <h1 style={{ fontSize: '22px', fontWeight: 900, color: COLORS.primary, margin: 0, letterSpacing: '-0.5px' }}>H-1B Visa Sponsor Finder</h1>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '3px' }}>
                            <span style={{ fontSize: '11px', fontWeight: 800, color: '#fff', background: COLORS.secondary, padding: '1px 8px', borderRadius: '4px', textTransform: 'uppercase' }}>OFFICIAL DATA</span>
                            <p style={{ fontSize: '12px', color: COLORS.textMuted, margin: 0, fontWeight: 600 }}>
                                Real-time Labor Condition Application (LCA) Database
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* ═══════════════ STATS CARDS (COMPACT) ═══════════════ */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)',
                gap: '16px',
                padding: '20px 24px'
            }}>
                {[
                    { label: 'Sponsors', value: stats.uniqueCompanies.toLocaleString(), icon: Globe, color: '#3b82f6' },
                    { label: 'Total Filings', value: stats.totalLcaFilings.toLocaleString(), icon: Briefcase, color: '#f59e0b' },
                    { label: 'Positions', value: stats.workerPositions.toLocaleString(), icon: Users, color: '#10b981' },
                    { label: 'H-1B Verified', value: stats.h1bSponsors.toLocaleString(), icon: BarChart3, color: '#6366f1' },
                ].map((s, i) => (
                    <div key={i} style={{
                        background: COLORS.white,
                        padding: '16px 20px',
                        borderRadius: '16px',
                        border: `1.5px solid ${COLORS.border}`,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                        transition: 'transform 0.2s ease'
                    }}
                        onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                        onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{
                                width: '36px', height: '36px',
                                background: `${s.color}15`,
                                borderRadius: '10px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                <s.icon size={18} color={s.color} strokeWidth={2.5} />
                            </div>
                            <div style={{ fontSize: '10px', fontWeight: 800, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>GLOBAL</div>
                        </div>
                        <div>
                            <p style={{ fontSize: '11px', color: COLORS.textMuted, fontWeight: 700, margin: '4px 0 0' }}>{s.label}</p>
                            <p style={{ fontSize: '18px', fontWeight: 900, color: COLORS.primary, margin: 0 }}>{s.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div style={{ flex: 1, display: 'flex', overflow: 'hidden', padding: '0 24px 24px' }}>

                {/* ═══════════════ SIDEBAR FILTERS (REDUCED SIZE) ═══════════════ */}
                {!isMobile && (
                    <div style={{ width: '230px', marginRight: '24px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div style={{ background: COLORS.white, padding: '24px', borderRadius: '20px', border: `1.5px solid ${COLORS.border}`, boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                            <div style={{ fontSize: '12px', fontWeight: 900, color: COLORS.primary, textTransform: 'uppercase', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{ width: '3px', height: '14px', background: COLORS.secondary, borderRadius: '2px' }} />
                                Filters
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                <div>
                                    <label style={{ fontSize: '13px', fontWeight: 800, color: COLORS.textMain, display: 'block', marginBottom: '10px' }}>HQ State</label>
                                    <div style={{ position: 'relative' }}>
                                        <select
                                            value={workState} onChange={e => setWorkState(e.target.value)}
                                            style={{ width: '100%', padding: '12px', borderRadius: '12px', border: `2px solid ${COLORS.border}`, fontSize: '13px', outline: 'none', cursor: 'pointer', fontWeight: 700, color: COLORS.primary, appearance: 'none', background: 'white' }}
                                        >
                                            <option>All States</option><option>CA</option><option>NY</option><option>TX</option><option>WA</option>
                                        </select>
                                        <ChevronDown size={14} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} color={COLORS.textMuted} />
                                    </div>
                                </div>

                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                        <label style={{ fontSize: '13px', fontWeight: 800, color: COLORS.textMain }}>Min Filings</label>
                                        <span style={{ fontSize: '11px', fontWeight: 900, color: COLORS.primary, background: '#fef3c7', padding: '2px 8px', borderRadius: '6px' }}>{minSponsorships}+</span>
                                    </div>
                                    <input type="range" min="1" max="500" value={minSponsorships} onChange={e => setMinSponsorships(parseInt(e.target.value))} style={{ width: '100%', accentColor: COLORS.secondary, cursor: 'pointer' }} />
                                </div>

                                <div>
                                    <label style={{ fontSize: '13px', fontWeight: 800, color: COLORS.textMain, display: 'block', marginBottom: '12px' }}>Sort Precision</label>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                        {[
                                            { id: 'filings', label: 'By Total Filings', icon: Briefcase },
                                            { id: 'salary', label: 'By Avg Salary', icon: DollarSign },
                                            { id: 'workers', label: 'By Positions', icon: Users }
                                        ].map(s => (
                                            <button
                                                key={s.id}
                                                onClick={() => setSortBy(s.id)}
                                                style={{
                                                    textAlign: 'left', padding: '12px 14px', borderRadius: '10px', fontSize: '12px', border: 'none', cursor: 'pointer',
                                                    background: sortBy === s.id ? COLORS.primary : '#f8fafc',
                                                    color: sortBy === s.id ? COLORS.white : COLORS.textMain,
                                                    fontWeight: 700, transition: '0.2s',
                                                    display: 'flex', alignItems: 'center', gap: '10px'
                                                }}
                                            >
                                                <s.icon size={14} />
                                                {s.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ═══════════════ MAIN TABLE CONTAINER ═══════════════ */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: COLORS.white, borderRadius: '24px', border: `1.5px solid ${COLORS.border}`, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>

                    {/* Compact Tabs */}
                    <div style={{ borderBottom: `1.5px solid ${COLORS.border}`, padding: '0 24px', background: '#fafbfc' }}>
                        <div style={{ display: 'flex', gap: '32px' }}>
                            {['company', 'role'].map(tab => (
                                <button key={tab} onClick={() => setSearchType(tab)} style={{ padding: '20px 4px', fontSize: '13px', fontWeight: 900, border: 'none', borderBottom: searchType === tab ? `3px solid ${COLORS.secondary}` : '3px solid transparent', color: searchType === tab ? COLORS.primary : COLORS.textMuted, background: 'none', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                                    {tab === 'company' ? 'Sponsor Directory' : 'Job Roles Analysis'}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Search Field */}
                    <div style={{ padding: '20px 24px', borderBottom: `1px solid ${COLORS.border}`, background: 'white' }}>
                        <div style={{ position: 'relative' }}>
                            <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} color={COLORS.textMuted} />
                            <input type="text" placeholder={`Global Search ${searchType === 'company' ? 'among 18,192 verified sponsors...' : 'across 5,000+ occupation roles...'}`} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ width: '100%', padding: '14px 20px 14px 48px', borderRadius: '14px', border: `2px solid ${COLORS.border}`, fontSize: '15px', outline: 'none', color: COLORS.primary, fontWeight: 600, transition: 'border-color 0.2s', background: '#fcfcfc' }} onFocus={e => e.target.style.borderColor = COLORS.primary} onBlur={e => e.target.style.borderColor = COLORS.border} />
                        </div>
                    </div>

                    <div style={{ flex: 1, overflowY: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead style={{ background: '#f8fafc', position: 'sticky', top: 0, zIndex: 10 }}>
                                <tr style={{ borderBottom: `1.5px solid ${COLORS.border}` }}>
                                    <th style={{ padding: '14px 24px', textAlign: 'left', fontWeight: 900, color: COLORS.textMuted, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Organization / Sponsor</th>
                                    <th style={{ padding: '14px 10px', textAlign: 'right', fontWeight: 900, color: COLORS.textMuted, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>LCAs</th>
                                    <th style={{ padding: '14px 10px', textAlign: 'right', fontWeight: 900, color: COLORS.textMuted, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Positions</th>
                                    <th style={{ padding: '14px 10px', textAlign: 'center', fontWeight: 900, color: COLORS.textMuted, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>HQ</th>
                                    <th style={{ padding: '14px 10px', textAlign: 'center', fontWeight: 900, color: COLORS.textMuted, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>States</th>
                                    <th style={{ padding: '14px 10px', textAlign: 'left', fontWeight: 900, color: COLORS.textMuted, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Primary Job Titles</th>
                                    <th style={{ padding: '14px 10px', textAlign: 'right', fontWeight: 900, color: COLORS.textMuted, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Avg Pay</th>
                                    <th style={{ padding: '14px 24px', textAlign: 'right', fontWeight: 900, color: COLORS.textMuted, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Median Pay</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan="8" style={{ padding: '60px', textAlign: 'center' }}><Loader2 size={32} className="animate-spin mx-auto" color={COLORS.secondary} /></td></tr>
                                ) : data.length > 0 ? data.map(row => (
                                    <React.Fragment key={row.id}>
                                        <tr onClick={() => toggleCompany(row)} style={{ borderBottom: `1.5px solid #f1f5f9`, cursor: 'pointer', background: expandedRows.has(row.id) ? 'rgba(234,179,8,0.04)' : COLORS.white, transition: 'background 0.2s' }}>
                                            <td style={{ padding: '16px 24px', fontWeight: 800, color: COLORS.primary, fontSize: '13px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    {expandedRows.has(row.id) ? <ChevronUp size={14} color={COLORS.secondary} strokeWidth={3} /> : <ChevronDown size={14} color="#cbd5e1" strokeWidth={3} />}
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                                        <span>{row.Company}</span>
                                                        <div style={{ display: 'flex', gap: '4px' }}>
                                                            {row["LCA Filings"] > 1000 && <span style={{ fontSize: '9px', background: '#ecfdf5', color: '#059669', padding: '1px 5px', borderRadius: '4px', fontWeight: 900 }}>TOP SPONSOR</span>}
                                                            {row["Avg Salary"] > 150000 && <span style={{ fontSize: '9px', background: '#fef2f2', color: '#dc2626', padding: '1px 5px', borderRadius: '4px', fontWeight: 900 }}>HIGH WAGE</span>}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={{ padding: '16px 10px', textAlign: 'right', color: COLORS.primary, fontWeight: 900, fontSize: '13px' }}>
                                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
                                                    {row["LCA Filings"]?.toLocaleString()}
                                                    <div style={{ fontSize: '9px', fontWeight: 800, color: COLORS.textMuted, textTransform: 'uppercase' }}>LCAs</div>
                                                </div>
                                            </td>
                                            <td style={{ padding: '16px 10px', textAlign: 'right', color: COLORS.textMain, fontWeight: 700, fontSize: '13px' }}>{row["Worker Positions"]?.toLocaleString() || 0}</td>
                                            <td style={{ padding: '16px 10px', textAlign: 'center' }}>
                                                <span style={{ border: `1.5px solid ${COLORS.primary}`, color: COLORS.primary, padding: '3px 7px', borderRadius: '8px', fontSize: '10px', fontWeight: 900, background: '#f8fafc' }}>{row["HQ State"] || 'US'}</span>
                                            </td>
                                            <td style={{ padding: '16px 10px', textAlign: 'center', color: COLORS.textMuted, fontWeight: 700, fontSize: '13px' }}>{row["# States"] || 1}</td>
                                            <td style={{ padding: '16px 10px', textAlign: 'left', color: COLORS.textMain, fontSize: '12.5px', fontWeight: 600, maxWidth: '280px', lineHeight: '1.4' }}>
                                                {row["Common Job Titles"]?.split('|').map((title, i) => (
                                                    <span key={i} style={{ display: i > 0 ? 'inline' : 'inline' }}>
                                                        {i > 0 && <span style={{ color: COLORS.secondary, margin: '0 4px', fontWeight: 900 }}>|</span>}
                                                        {title.trim()}
                                                    </span>
                                                ))}
                                            </td>
                                            <td style={{ padding: '16px 10px', textAlign: 'right', fontWeight: 800, color: COLORS.primary, fontSize: '13px' }}>{formatCurrency(row["Avg Salary"])}</td>
                                            <td style={{ padding: '16px 24px', textAlign: 'right', fontWeight: 800, color: COLORS.primary, fontSize: '13px' }}>{formatCurrency(row["Median Salary"])}</td>
                                        </tr>

                                        {expandedRows.has(row.id) && roleData[row.Company] && (
                                            roleData[row.Company].map((role, idx) => (
                                                <React.Fragment key={idx}>
                                                    <tr onClick={(e) => { e.stopPropagation(); toggleRole(row.Company, role.title); }} style={{ background: '#f8fafc', cursor: 'pointer', borderBottom: `1.5px solid ${COLORS.border}` }}>
                                                        <td colSpan="3" style={{ padding: '12px 24px 12px 58px', color: COLORS.primary, fontWeight: 800, fontSize: '14px' }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                {expandedRoles.get(row.Company)?.has(role.title) ? <ChevronUp size={14} color={COLORS.secondary} strokeWidth={3} /> : <ChevronDown size={14} color="#cbd5e1" strokeWidth={2.5} />}
                                                                {role.title}
                                                            </div>
                                                        </td>
                                                        <td style={{ padding: '12px 12px', textAlign: 'center' }}>
                                                            <span style={{ fontSize: '10px', fontWeight: 800, color: COLORS.textMuted, background: '#e2e8f0', padding: '2px 8px', borderRadius: '6px' }}>{role.count} FILINGS</span>
                                                        </td>
                                                        <td colSpan="4" style={{ padding: '12px 24px', textAlign: 'right', color: COLORS.primary, fontWeight: 900, fontSize: '14px' }}>
                                                            <span style={{ fontSize: '11px', color: COLORS.textMuted, fontWeight: 700, marginRight: '8px' }}>AVG PAY</span>
                                                            {formatCurrency(role.avgPay)}
                                                        </td>
                                                    </tr>

                                                    {expandedRoles.get(row.Company)?.has(role.title) && role.items.map((item, iIdx) => (
                                                        <tr key={iIdx} style={{ background: COLORS.white, borderBottom: `1px dotted ${COLORS.border}` }}>
                                                            <td colSpan="3" style={{ padding: '10px 24px 10px 92px', color: COLORS.textMuted, fontSize: '13px', fontWeight: 700 }}>
                                                                <span style={{ marginRight: '8px' }}>📍</span>
                                                                {item.City || 'Unknown'}, <strong style={{ color: COLORS.primary }}>{item.State || '??'}</strong>
                                                            </td>
                                                            <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                                                                <span style={{ fontSize: '10px', fontWeight: 800, color: '#4338ca', background: '#e0e7ff', padding: '2px 8px', borderRadius: '6px' }}>{item["Visa Type"] || 'H-1B'}</span>
                                                            </td>
                                                            <td colSpan="4" style={{ padding: '10px 24px', textAlign: 'right', color: '#059669', fontWeight: 900, fontSize: '13px' }}>
                                                                <span style={{ fontSize: '11px', color: COLORS.textMuted, fontWeight: 700, marginRight: '8px' }}>SPECIFIC SALARY</span>
                                                                {formatCurrency(item.Salary)}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </React.Fragment>
                                            ))
                                        )}
                                    </React.Fragment>
                                )) : (
                                    <tr><td colSpan="8" style={{ padding: '60px', textAlign: 'center', color: COLORS.textMuted, fontWeight: 700 }}>No sponsor records found for "{searchTerm}".</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default H1BSponsorFinder;