import React, { useState, useEffect } from 'react';
import {
  Search, Briefcase, ChevronRight, ChevronLeft, Loader2, ArrowLeft,
  Code, Database, Shield, Cloud, Settings, BarChart, Cpu, 
  Smartphone, Terminal, Activity, PenTool, Megaphone, Users,
  Zap, Stethoscope, Landmark, Truck, ShoppingCart, Microscope, Headphones,
  Layers, Layout, Code2, ShieldCheck, Target, ClipboardList, Crown, PencilRuler,
  BarChart3, Users2, Banknote, Scale, Box, GraduationCap, Lightbulb, HeartPulse,
  Brain, Sparkles, Network, Globe, Waypoints, Workflow
} from 'lucide-react';

import { FEATURED_DOMAINS } from '../data/featuredDomains';

const getDomainData = (roleName) => {
  const defaultData = { icon: Briefcase, color: '#64748b', bg: '#f1f5f9' };
  if (!roleName) return defaultData;
  const lower = roleName.toLowerCase();

  // Tech / Engineering
  if (lower.includes('ai/ml')) 
    return { icon: Waypoints, color: '#3b82f6', bg: '#f0f7ff' };
  if (lower.includes('mlops')) 
    return { icon: Workflow, color: '#8b5cf6', bg: '#f5f3ff' };
  if (lower.includes('generative ai'))
    return { icon: Zap, color: '#f59e0b', bg: '#fffbeb' };
  if (lower.match(/ai|machine learning/)) 
    return { icon: Brain, color: '#3b82f6', bg: '#f0f7ff' };
  if (lower.includes('scientist'))
    return { icon: BarChart, color: '#2563eb', bg: '#eff6ff' };

  if (lower.match(/full stack|systems engineer|infrastructure/))
    return { icon: Layers, color: '#8b5cf6', bg: '#f5f3ff' };
  if (lower.match(/frontend|react|angular|vue|javascript|typescript|web developer|ui developer/))
    return { icon: Layout, color: '#0ea5e9', bg: '#f0f9ff' };
  if (lower.match(/backend|node|java|python|c\+\+|\.net|golang|ruby/))
    return { icon: Code2, color: '#2563eb', bg: '#eff6ff' };
  if (lower.includes('software engineer')) 
    return { icon: Code, color: '#10b981', bg: '#ecfdf5' };
  if (lower.includes('software developer') || lower.match(/programmer/)) 
    return { icon: Cpu, color: '#3b82f6', bg: '#eff6ff' };
  
  if (lower.match(/data|sql|database|oracle|etl|bi|tableau|power bi|snowflake/)) 
    return { icon: Database, color: '#6366f1', bg: '#eef2ff' };
  if (lower.match(/cyber|security|sailpoint|iam|soc|firewall/)) 
    return { icon: ShieldCheck, color: '#ef4444', bg: '#fef2f2' };
  if (lower.match(/cloud|aws|azure|gcp|salesforce|servicenow|sap|cloud architect/)) 
    return { icon: Cloud, color: '#0ea5e9', bg: '#f0f9ff' };
  if (lower.match(/devops|sre|platform engineer/))
    return { icon: Network, color: '#f43f5e', bg: '#fff1f2' };
  if (lower.match(/network|system|active directory/)) 
    return { icon: Terminal, color: '#14b8a6', bg: '#f0fdfa' };
  if (lower.match(/qa|test|quality|automation|manual testing/)) 
    return { icon: Activity, color: '#f59e0b', bg: '#fffbeb' };
  if (lower.match(/mobile|ios|android|react native|flutter/)) 
    return { icon: Smartphone, color: '#2563eb', bg: '#eff6ff' };
  
  // Business / Management
  if (lower.match(/product manager|product owner/))
    return { icon: Target, color: '#6366f1', bg: '#eef2ff' };
  if (lower.match(/project manager|scrum master|agile coach/))
    return { icon: ClipboardList, color: '#6366f1', bg: '#eef2ff' };
  if (lower.match(/manager|director|vp|head|lead/))
    return { icon: Crown, color: '#f59e0b', bg: '#fffbeb' };
  
  // Design / UX
  if (lower.match(/design|ui|ux|graphic|creative|art|illustration/)) 
    return { icon: PencilRuler, color: '#ec4899', bg: '#fdf2f8' };

  // Marketing / Sales
  if (lower.match(/market|seo|content|social media|brand|copywriter/)) 
    return { icon: Megaphone, color: '#f97316', bg: '#fff7ed' };
  if (lower.match(/sales|account manager|business dev|sales representative/)) 
    return { icon: BarChart3, color: '#10b981', bg: '#ecfdf5' };
  if (lower.match(/buyer|purchasing|procurement/))
    return { icon: ShoppingCart, color: '#10b981', bg: '#ecfdf5' };

  // HR / People
  if (lower.match(/hr|recruit|talent|people|human resource|onboarding/)) 
    return { icon: Users2, color: '#f43f5e', bg: '#fff1f2' };

  // Finance / Legal
  if (lower.match(/finance|account|audit|tax|payroll|bank|treasury/)) 
    return { icon: Banknote, color: '#16a34a', bg: '#f0fdf4' };
  if (lower.match(/legal|law|attorney|paralegal|compliance/)) 
    return { icon: Scale, color: '#475569', bg: '#f8fafc' };

  // Operations / Specialized
  if (lower.match(/supply|logistic|chain|inventory|warehouse/)) 
    return { icon: Box, color: '#84cc16', bg: '#f7fee7' };
  if (lower.match(/truck|driver|transport/))
    return { icon: Truck, color: '#84cc16', bg: '#f7fee7' };
  if (lower.match(/health|medical|clinical|pharmac|nurse|doctor|patient/)) 
    return { icon: HeartPulse, color: '#e11d48', bg: '#fff1f2' };
  if (lower.match(/science|research|biology|chemist|laboratory/)) 
    return { icon: Microscope, color: '#06b6d4', bg: '#ecfeff' };
  if (lower.match(/education|teacher|instructor|professor|tutor|academic/))
    return { icon: GraduationCap, color: '#3b82f6', bg: '#eff6ff' };
  if (lower.match(/consultant|consulting|advisor/))
    return { icon: Lightbulb, color: '#f59e0b', bg: '#fffbeb' };
  if (lower.match(/customer|service|support|client success/))
    return { icon: Headphones, color: '#a855f7', bg: '#faf5ff' };

  return defaultData;
};
import { supabase } from '../supabaseClient';
import AllJobsTab from './AllJobsTab';
import { COUNTRY_MAP } from '../utils/countryHelper';
import { fetchAllDomains } from '../utils/rpcFetchers';

const ITEMS_PER_PAGE = 12;

const DomainsTab = ({ onSelectDomain, selectedCountry, dateFilter, viewMode = 'grid' }) => {
  const [searchTerm, setSearchTerm]           = useState('');
  const [localSearchTerm, setLocalSearchTerm] = useState('');
  const [filter, setFilter]                   = useState('All');
  const [loading, setLoading]                 = useState(true);
  const [domains, setDomains]                 = useState([]);
  const [selectedDomain, setSelectedDomain]   = useState(null);
  const [page, setPage]                       = useState(0);

  // Reset detail + refetch when country or date changes
  useEffect(() => {
    setSelectedDomain(null);
    fetchDomains();
  }, [selectedCountry, dateFilter?.quickDate, dateFilter?.from, dateFilter?.to]);

  // Debounce search + reset page
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchTerm(localSearchTerm);
      setPage(0);
    }, 300);
    return () => clearTimeout(timer);
  }, [localSearchTerm]);

  // Reset page when filter changes
  useEffect(() => { setPage(0); }, [filter]);

  const fetchDomains = async () => {
    setLoading(true);
    try {
      // Fetches ALL domains using paginated RPC calls, bypassing max_rows=1000 cap
      const rows = await fetchAllDomains(
        selectedCountry || null,
        dateFilter?.from || null,
        dateFilter?.to || null
      );

      const domainList = rows.map(row => ({
        name:  row.role_name,
        count: Number(row.job_count),
        type:  isTechRole(row.role_name) ? 'TECH' : 'NON-TECH',
      }));

      // Sort: prioritize FEATURED_DOMAINS first, then by count
      const sorted = domainList.sort((a, b) => {
        const aIndex = FEATURED_DOMAINS.findIndex(f => f.toLowerCase() === a.name.toLowerCase());
        const bIndex = FEATURED_DOMAINS.findIndex(f => f.toLowerCase() === b.name.toLowerCase());
        
        if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
        if (aIndex !== -1) return -1;
        if (bIndex !== -1) return 1;
        
        return b.count - a.count;
      });

      setDomains(sorted);
      setPage(0);
    } catch (err) {
      console.error('[DomainsTab] Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const isTechRole = (roleName) => {
    if (!roleName) return false;
    const lower = roleName.toLowerCase();
    const kw = [
      'developer','software','engineer','devops','data','cyber',
      'security','network','cloud','qa','python','java','scientist',
      'servicenow','sap','embedded','full stack','game','ai',
      'machine learning','active directory','.net','computer science',
      'database','sailpoint','mlops','frontend','backend','rtl',
    ];
    return kw.some(k => lower.includes(k));
  };

  const countryLabel = (Array.isArray(selectedCountry) && selectedCountry.length > 0)
    ? (selectedCountry.length === 1 ? (COUNTRY_MAP[selectedCountry[0]]?.label || selectedCountry[0]) : `${selectedCountry.length} Countries`)
    : 'All Countries';

  const filteredDomains = domains.filter(d => {
    const matchesSearch = d.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === 'All' || d.type === filter.toUpperCase();
    return matchesSearch && matchesFilter;
  });

  const totalPages   = Math.ceil(filteredDomains.length / ITEMS_PER_PAGE);
  const pagedDomains = filteredDomains.slice(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE);

  // ── Detail view ───────────────────────────────────────────────────────────────
  if (selectedDomain) {
    return (
      <div className="animate-in fade-in slide-in-from-left-4 duration-500">
        <button
          onClick={() => setSelectedDomain(null)}
          className="flex items-center gap-2 mb-6 px-4 py-2 bg-white border border-gray-200 rounded-xl text-[#2C76FF] font-bold hover:bg-gray-50 transition-all shadow-sm group"
        >
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          Back to all domains
        </button>

        <div className="bg-white rounded-2xl p-2 border border-gray-100 shadow-sm mb-8">
          <div className="flex items-center gap-4 p-4">
            {(() => {
              const { icon: Icon, color, bg } = getDomainData(selectedDomain);
              return (
                <div 
                  className="w-16 h-16 flex items-center justify-center rounded-xl border shadow-sm"
                  style={{ backgroundColor: bg, color: color, borderColor: color + '33' }}
                >
                  <Icon size={36} strokeWidth={1.5} />
                </div>
              );
            })()}
            <div>
              <h2 className="text-2xl font-[900] text-[#1E1E1E]">{selectedDomain}</h2>
              <p className="text-gray-500 font-bold">Showing all active jobs in this domain for {countryLabel}</p>
            </div>
          </div>
        </div>

        <AllJobsTab fixedDomain={selectedDomain} activeFilter="all" countryFilter={selectedCountry} dateFilter={dateFilter} />
      </div>
    );
  }

  // ── Loading ───────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-10 h-10 text-[#2C76FF] animate-spin mb-4" />
        <p className="text-gray-500 font-bold">Aggregating Domains...</p>
      </div>
    );
  }

  // ── List view ─────────────────────────────────────────────────────────────────
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <h2 className="text-3xl font-[900] text-[#1E1E1E] mb-1">All Domains</h2>
          <p className="text-sm font-bold text-gray-400">
            {filteredDomains.length.toLocaleString()} {filteredDomains.length === 1 ? 'domain' : 'domains'} in {countryLabel}
            {filteredDomains.length !== domains.length && ` (filtered from ${domains.length.toLocaleString()} total)`}
          </p>
        </div>

        <div className="flex items-center gap-4 flex-1 max-w-xl">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search domains..."
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

      {/* Content */}
      {pagedDomains.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <Briefcase size={40} className="mb-3 opacity-40" />
          <p className="font-bold">No domains found</p>
        </div>
      ) : viewMode === 'list' ? (
        <div className="flex flex-col gap-3">
          {pagedDomains.map((domain, idx) => {
            const { icon: Icon, color, bg } = getDomainData(domain.name);
            return (
              <div
                key={idx}
                onClick={() => setSelectedDomain(domain.name)}
                className="group bg-white rounded-xl p-4 border border-gray-100 shadow-sm hover:shadow-md hover:border-[#2C76FF]/20 transition-all cursor-pointer flex items-center gap-4"
              >
                <div 
                  className="w-10 h-10 flex items-center justify-center rounded-lg shrink-0"
                  style={{ backgroundColor: bg, color: color }}
                >
                  <Icon size={20} strokeWidth={1.5} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-[15px] font-black text-[#1E1E1E] group-hover:text-[#2C76FF] transition-colors truncate">
                      {domain.name}
                    </h3>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] font-bold text-gray-400">
                     <span>{domain.type}</span>
                     <span className="w-1 h-1 rounded-full bg-gray-200" />
                     <span className="text-[#2C76FF]">{domain.count.toLocaleString()} jobs</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-[#2C76FF]/50 font-bold text-[11px] group-hover:text-[#2C76FF] transition-colors">
                  View <ChevronRight size={12} />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {pagedDomains.map((domain, idx) => (
            <div
              key={idx}
              onClick={() => setSelectedDomain(domain.name)}
              className="group relative bg-white rounded-xl p-5 border border-gray-100 shadow-sm hover:shadow-md hover:border-[#2C76FF]/20 transition-all duration-300 cursor-pointer overflow-hidden flex flex-col"
            >
              <div className="flex justify-between items-start mb-4">
                {(() => {
                  const { icon: Icon, color, bg } = getDomainData(domain.name);
                  return (
                    <div 
                      className="w-12 h-12 flex items-center justify-center rounded-xl"
                      style={{ backgroundColor: bg, color: color }}
                    >
                      <Icon size={28} strokeWidth={1.5} />
                    </div>
                  );
                })()}
                <div className="flex flex-col items-end gap-1.5">
                  <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                    domain.type === 'TECH' ? 'bg-blue-50 text-[#2C76FF]' : 'bg-gray-50 text-gray-500'
                  }`}>
                    {domain.type}
                  </span>
                  <span className="text-[9px] font-black px-2 py-0.5 bg-[#2C76FF]/10 text-[#1E1E1E] border border-[#2C76FF]/20 rounded-full">
                    {domain.count.toLocaleString()} jobs
                  </span>
                </div>
              </div>

              <div className="mt-auto">
                <h3 className="text-lg font-bold text-[#1E1E1E] mb-4 group-hover:text-[#2C76FF] transition-colors leading-tight">
                  {domain.name}
                </h3>
                <div className="flex items-center gap-1.5 text-[#2C76FF]/50 font-bold text-xs group-hover:text-[#2C76FF] transition-colors">
                  View jobs <ChevronRight size={14} />
                </div>
              </div>
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
            Page {page + 1} of {totalPages} &nbsp;·&nbsp; {filteredDomains.length.toLocaleString()} domains
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

export default DomainsTab;
