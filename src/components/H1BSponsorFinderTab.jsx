import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { 
  Search, Loader2, ChevronLeft, ChevronRight, X, AlertCircle,
  Play, ChevronDown
} from 'lucide-react';

const H1BSponsorFinderTab = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [showLcaInfo, setShowLcaInfo] = useState(false);
  const [stats, setStats] = useState({
    totalSponsors: 18192,
    totalFilings: 81330,
    totalPositions: 169465,
    verifiedSponsors: 17066
  });

  const PAGE_SIZE = 20;
  const searchTimeout = useRef(null);

  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(0);
    }, 400);
    return () => clearTimeout(searchTimeout.current);
  }, [searchTerm]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. TRY THE RPC FIRST (This provides the correct highest-to-lowest numeric sorting)
      const { data: rpcResults, error: rpcError } = await supabase.rpc('get_sorted_h1b_sponsors', {
        search_term: debouncedSearch,
        page_offset: page * PAGE_SIZE,
        page_limit: PAGE_SIZE
      });

      if (!rpcError && rpcResults && rpcResults.length > 0) {
        setData(rpcResults);
        setTotal(parseInt(rpcResults[0]?.total_count || 0));
        setLoading(false);
        return;
      }

      // 2. FALLBACK TO DIRECT QUERY (If the RPC is not yet deployed to your Supabase)
      // Note: Direct query on text columns results in alphabetical sorting (9 > 100).
      let query = supabase.from('h1b_sponsors').select('*', { count: 'exact' });
      
      if (debouncedSearch) {
        query = query.ilike('Company', `%${debouncedSearch}%`);
      }
      
      query = query.order('LCA Filings', { ascending: false });

      const from = page * PAGE_SIZE;
      const { data: results, error: tableError, count } = await query.range(from, from + PAGE_SIZE - 1);
      
      if (tableError) throw tableError;
      
      setData(results || []);
      setTotal(count || 0);
    } catch (err) {
      console.error('Error fetching H1B data:', err);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, page]);

  useEffect(() => { 
    fetchData(); 
  }, [fetchData]);

  const formatCurrency = (val) => {
    if (!val) return '—';
    const num = typeof val === 'string' ? parseFloat(val.replace(/[$,]/g, '')) : val;
    return isNaN(num) ? val : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(num);
  };

  const formatNumber = (val) => {
    if (!val) return '0';
    const num = typeof val === 'string' ? parseInt(val.replace(/,/g, '')) : val;
    return isNaN(num) ? val : num.toLocaleString();
  };

  return (
    <div className="flex flex-col h-full bg-white px-6 py-6 space-y-6 animate-in fade-in duration-500 font-sans">
      
      {/* ── Header Section ────────────────────────── */}
      <div className="flex flex-col space-y-2">
        <div className="flex items-center gap-3">
          <div className="text-[#2C76FF]">
            <Search size={26} strokeWidth={3} />
          </div>
          <h1 className="text-2xl font-bold text-[#0F172A] tracking-tight">
            H-1B Visa Sponsor Finder, by Career Partner
          </h1>
        </div>
        <p className="text-[14px] text-gray-500 leading-relaxed max-w-5xl">
          Find companies that have sponsored work visas — <span className="text-[#22C55E] font-semibold text-[14px]">most recent data available, updated as of March 2026</span> (FY2026 Q1 LCA disclosures from the U.S. Department of Labor). Use this to target employers open to H-1B, H-1B1, and E-3 sponsorship.
        </p>
        
        <div className="flex flex-col">
          <button 
            onClick={() => setShowLcaInfo(!showLcaInfo)}
            className="text-[13px] text-blue-500 hover:underline flex items-center gap-1 w-fit mt-1"
          >
            <Play size={8} className={`fill-blue-500 transition-transform ${showLcaInfo ? 'rotate-90' : 'rotate-0'}`} />
            What is LCA data?
          </button>
          
          {showLcaInfo && (
            <div className="mt-3 p-5 bg-gray-50 border border-gray-200 rounded-xl text-[14px] text-gray-600 animate-in slide-in-from-top-1 duration-200 shadow-sm max-w-4xl">
              <p className="leading-relaxed">
                Before hiring an H-1B worker, employers must file a <span className="font-bold">Labor Condition Application (LCA)</span> with the DOL and receive certification. This public dataset shows every certified LCA filing — meaning these companies have <span className="font-bold text-gray-800">actively sponsored work visas</span>. More filings = more experienced with sponsorship.
              </p>
              <p className="mt-3 leading-relaxed">
                <span className="font-bold">Certified</span> — Approved and active. <span className="font-bold text-gray-800">Certified - Withdrawn</span> — Was approved but employer later withdrew (company still sponsors).
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Stats Cards (Increased Size) ─────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Unique Companies', val: stats.totalSponsors },
          { label: 'Total LCA Filings', val: stats.totalFilings },
          { label: 'Worker Positions', val: stats.totalPositions },
          { label: 'H-1B Sponsors', val: stats.verifiedSponsors }
        ].map((s, i) => (
          <div key={i} className="bg-white border border-[#E2E8F0] rounded-xl px-6 py-5 shadow-sm hover:border-blue-200 transition-colors">
            <h3 className="text-2xl font-bold text-[#0F172A] leading-tight">{formatNumber(s.val)}</h3>
            <p className="text-[13px] font-medium text-gray-400 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* ── Search Bar (Middle Size) ────────────────────────────── */}
      <div className="w-full">
        <div className="relative border border-[#E2E8F0] rounded-xl flex items-center px-5 py-3 bg-white shadow-sm focus-within:border-blue-400 focus-within:ring-1 focus-within:ring-blue-100 transition-all group">
          <Search size={18} className="text-gray-400 mr-3" />
          <input
            type="text"
            placeholder="Search company name — e.g. Google, Amazon, Infosys, Cognizant..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-transparent border-none outline-none text-[15px] text-gray-700 placeholder:text-gray-400"
          />
        </div>
      </div>

      {/* ── Companies Found Bar ─────────────────────────────────────────── */}
      <div className="text-[15px] font-bold text-gray-800 px-1 -mb-2">
        {formatNumber(total)} companies found
      </div>

      {/* ── Table (Standard Size) ────────────────────────────────── */}
      <div className="border border-[#E2E8F0] rounded-xl overflow-hidden bg-white shadow-sm flex-1">
        <div className="overflow-x-auto h-full">
          <table className="w-full text-left border-collapse table-fixed min-w-[1100px]">
            <thead className="sticky top-0 z-10 bg-[#F8FAFC]">
              <tr className="border-b border-[#E2E8F0]">
                <th className="px-5 py-3.5 text-[13px] font-bold text-gray-500 w-[22%]">Company</th>
                <th className="px-4 py-3.5 text-[13px] font-bold text-gray-500 text-right w-[10%]">LCA Filings</th>
                <th className="px-4 py-3.5 text-[13px] font-bold text-gray-500 text-right w-[10%]">Workers</th>
                <th className="px-4 py-3.5 text-[13px] font-bold text-gray-500 text-center w-[7%]">HQ</th>
                <th className="px-4 py-3.5 text-[13px] font-bold text-gray-500 text-center w-[8%]"># States</th>
                <th className="px-5 py-3.5 text-[13px] font-bold text-gray-500">Common Job Titles</th>
                <th className="px-5 py-3.5 text-[13px] font-bold text-gray-500 text-right w-[12%]">Avg Salary</th>
                <th className="px-5 py-3.5 text-[13px] font-bold text-gray-500 text-right w-[12%]">Median Salary</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9]">
              {loading ? (
                <tr>
                  <td colSpan="8" className="px-10 py-32 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <Loader2 className="animate-spin text-blue-500" size={40} />
                      <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Loading database...</p>
                    </div>
                  </td>
                </tr>
              ) : (
                data.map((row) => (
                  <tr key={row.id} className="hover:bg-[#F8FAFC] transition-colors group">
                    <td className="px-5 py-4 whitespace-nowrap overflow-hidden text-ellipsis">
                      <div className="flex items-center gap-3">
                        <Play size={8} className="text-gray-400 rotate-0 fill-gray-300 flex-shrink-0" />
                        <span className="text-[15px] font-bold text-[#1E293B] group-hover:text-blue-600 transition-colors truncate">
                          {row.Company}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right text-[14px] text-gray-600 font-medium">
                      {formatNumber(row['LCA Filings'])}
                    </td>
                    <td className="px-4 py-4 text-right text-[14px] text-gray-600 font-medium">
                      {formatNumber(row['Worker Positions'])}
                    </td>
                    <td className="px-4 py-4 text-center text-[14px] text-gray-600 font-medium uppercase">
                      {row['HQ State'] || '—'}
                    </td>
                    <td className="px-4 py-4 text-center text-[14px] text-gray-600 font-medium">
                      {row['# States'] || '1'}
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-[13px] text-gray-500 line-clamp-1">
                        {row['Common Job Titles'] || '—'}
                      </p>
                    </td>
                    <td className="px-5 py-4 text-right text-[14px] text-[#0F172A] font-bold">
                      {formatCurrency(row['Avg Salary'])}
                    </td>
                    <td className="px-5 py-4 text-right text-[14px] text-[#0F172A] font-bold">
                      {formatCurrency(row['Median Salary'])}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ── Pagination ──────────────────────────────────────────────────── */}
        {!loading && total > PAGE_SIZE && (
          <div className="px-6 py-5 bg-[#F8FAFC] border-t border-[#E2E8F0] flex items-center justify-between">
            <div className="text-[13px] text-gray-500 font-medium">
              Showing page <span className="text-gray-800 font-bold">{page + 1}</span> of <span className="text-gray-800 font-bold">{Math.ceil(total / PAGE_SIZE)}</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                disabled={page === 0} onClick={() => setPage(p => p - 1)}
                className="px-4 py-2 rounded-lg bg-white border border-[#E2E8F0] text-gray-600 hover:text-blue-500 disabled:opacity-30 transition-all text-sm font-bold shadow-sm"
              >
                Previous
              </button>
              <button
                disabled={page >= Math.ceil(total / PAGE_SIZE) - 1} onClick={() => setPage(p => p + 1)}
                className="px-4 py-2 rounded-lg bg-white border border-[#E2E8F0] text-gray-600 hover:text-blue-500 disabled:opacity-30 transition-all text-sm font-bold shadow-sm"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default H1BSponsorFinderTab;
