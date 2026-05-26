import React, { useState, useEffect } from 'react';
import {
  Search, Briefcase, ChevronRight, ChevronLeft, Loader2, ArrowLeft,
  Code, Database, Shield, Cloud, Settings, BarChart, Cpu,
  Smartphone, Terminal, Activity, PenTool, Megaphone, Users,
  Zap, Stethoscope, Landmark, Truck, ShoppingCart, Microscope, Headphones,
  Layers, Layout, Code2, ShieldCheck, Target, ClipboardList, Crown, PencilRuler,
  BarChart3, Users2, Banknote, Scale, Box, GraduationCap, Lightbulb, HeartPulse,
  Brain, Sparkles, Network, Globe, Waypoints, Workflow,
  FlaskConical, Dna, Leaf, Building2, Camera, Wrench, Bolt,
  HardDrive, Construction, Factory, Flame, Atom, TestTube2,
  LineChart, Puzzle, Radio, MousePointer2, Gamepad2, Lock,
  FileCog, CloudCog, ServerCog, ServerCrash, Sigma, MonitorCheck,
  CandlestickChart, BadgeDollarSign, TrendingUp, ScanLine, Telescope,
  Wifi, CircuitBoard, Layers3, BookOpen, FlaskRound
} from 'lucide-react';

import { FEATURED_DOMAINS } from '../data/featuredDomains';

// ── Exact-match lookup: every known domain gets its own unique icon ────────────
const DOMAIN_ICON_MAP = {
  // ── AI / ML ──────────────────────────────────────────────────────────────────
  'ai/ml engineer':                     { icon: Waypoints,         color: '#3b82f6', bg: '#eff6ff' },
  'generative ai':                      { icon: Sparkles,          color: '#a855f7', bg: '#faf5ff' },
  'mlops engineer':                     { icon: Workflow,          color: '#8b5cf6', bg: '#f5f3ff' },
  'data scientist':                     { icon: Sigma,             color: '#2563eb', bg: '#eff6ff' },
  'data science internships':           { icon: Telescope,         color: '#6366f1', bg: '#eef2ff' },
  // ── Software Engineering ──────────────────────────────────────────────────────
  'software engineer':                  { icon: Code,              color: '#10b981', bg: '#ecfdf5' },
  'software developer':                 { icon: Cpu,               color: '#3b82f6', bg: '#eff6ff' },
  'computer science':                   { icon: GraduationCap,     color: '#6366f1', bg: '#eef2ff' },
  'computer science internship':        { icon: BookOpen,          color: '#6366f1', bg: '#eef2ff' },
  'full stack':                         { icon: Layers,            color: '#8b5cf6', bg: '#f5f3ff' },
  'full stack cloud engineer':          { icon: Layers3,           color: '#0ea5e9', bg: '#f0f9ff' },
  'java developer':                     { icon: Code2,             color: '#f97316', bg: '#fff7ed' },
  'frontend engineering':               { icon: Layout,            color: '#0ea5e9', bg: '#f0f9ff' },
  'python developer':                   { icon: Terminal,          color: '#eab308', bg: '#fefce8' },
  '.net':                               { icon: CircuitBoard,      color: '#7c3aed', bg: '#f5f3ff' },
  '.net for ireland':                   { icon: CircuitBoard,      color: '#7c3aed', bg: '#f5f3ff' },
  'embedded software engineer':         { icon: Cpu,               color: '#0f766e', bg: '#f0fdfa' },
  'controls software engineer':         { icon: FileCog,           color: '#0891b2', bg: '#ecfeff' },
  'design verification engineer':       { icon: MonitorCheck,      color: '#7c3aed', bg: '#f5f3ff' },
  'rtl design engineer':                { icon: CircuitBoard,      color: '#dc2626', bg: '#fef2f2' },
  'game ui / interactive ui designer':  { icon: Gamepad2,          color: '#7c3aed', bg: '#f5f3ff' },
  // ── DevOps / Cloud / Infrastructure ──────────────────────────────────────────
  'devops':                             { icon: Network,           color: '#f43f5e', bg: '#fff1f2' },
  'cloud engineer':                     { icon: Cloud,             color: '#0ea5e9', bg: '#f0f9ff' },
  'system infrastructure engineer':     { icon: ServerCog,         color: '#64748b', bg: '#f1f5f9' },
  'network engineer':                   { icon: Wifi,              color: '#14b8a6', bg: '#f0fdfa' },
  'data centre network engineer':       { icon: ServerCrash,       color: '#ef4444', bg: '#fef2f2' },
  'data center technician':             { icon: HardDrive,         color: '#64748b', bg: '#f1f5f9' },
  'active directory':                   { icon: Lock,              color: '#0369a1', bg: '#f0f9ff' },
  'atlassian engineer / jira':          { icon: Puzzle,            color: '#0052cc', bg: '#eff6ff' },
  'power apps':                         { icon: CloudCog,          color: '#742774', bg: '#fdf4ff' },
  'itsm/itil':                          { icon: Settings,          color: '#64748b', bg: '#f8fafc' },
  // ── Cybersecurity ─────────────────────────────────────────────────────────────
  'cyber security':                     { icon: ShieldCheck,       color: '#ef4444', bg: '#fef2f2' },
  'security engineer':                  { icon: Shield,            color: '#dc2626', bg: '#fff1f2' },
  'network security engineer':          { icon: Radio,             color: '#b91c1c', bg: '#fef2f2' },
  'grc analyst':                        { icon: Scale,             color: '#475569', bg: '#f8fafc' },
  'anti money laundering (aml)':        { icon: Landmark,          color: '#16a34a', bg: '#f0fdf4' },
  // ── Data ─────────────────────────────────────────────────────────────────────
  'data engineer':                      { icon: Database,          color: '#6366f1', bg: '#eef2ff' },
  'big data engineer':                  { icon: Layers,            color: '#4f46e5', bg: '#eef2ff' },
  'data analyst':                       { icon: BarChart3,         color: '#2563eb', bg: '#eff6ff' },
  'data analyst for uk':                { icon: BarChart3,         color: '#1d4ed8', bg: '#eff6ff' },
  'data analyst for canada':            { icon: LineChart,         color: '#2563eb', bg: '#eff6ff' },
  'data engineer for uk':               { icon: Database,          color: '#4338ca', bg: '#eef2ff' },
  'data engineer for canada':           { icon: Database,          color: '#3730a3', bg: '#eef2ff' },
  'business intelligence engineer':     { icon: CandlestickChart,  color: '#7c3aed', bg: '#f5f3ff' },
  'business intelligence engineer internships': { icon: TrendingUp, color: '#8b5cf6', bg: '#f5f3ff' },
  // ── QA / Testing ─────────────────────────────────────────────────────────────
  'qa automation engineer':             { icon: ScanLine,          color: '#f59e0b', bg: '#fffbeb' },
  'quality assurance engineer':         { icon: Activity,          color: '#f59e0b', bg: '#fffbeb' },
  'quality engineer':                   { icon: ShieldCheck,       color: '#d97706', bg: '#fffbeb' },
  'quality analyst':                    { icon: Target,            color: '#b45309', bg: '#fef9c3' },
  'quality analyst for uk':             { icon: Target,            color: '#92400e', bg: '#fef9c3' },
  'tosca test automation engineer':     { icon: MonitorCheck,      color: '#f97316', bg: '#fff7ed' },
  // ── Project / Product Management ─────────────────────────────────────────────
  'project manager':                    { icon: ClipboardList,     color: '#6366f1', bg: '#eef2ff' },
  'product manager':                    { icon: Target,            color: '#8b5cf6', bg: '#f5f3ff' },
  'business analyst':                   { icon: BarChart,          color: '#0891b2', bg: '#ecfeff' },
  'technical program management...':    { icon: Crown,             color: '#f59e0b', bg: '#fffbeb' },
  // ── ERP / CRM / Enterprise Apps ──────────────────────────────────────────────
  'salesforce developer':               { icon: Cloud,             color: '#00a1e0', bg: '#e6f7ff' },
  'servicenow developer':               { icon: Settings,          color: '#62d84e', bg: '#f0fdf4' },
  'workday analyst':                    { icon: Briefcase,         color: '#f59e0b', bg: '#fffbeb' },
  'dynamics 365':                       { icon: CloudCog,          color: '#0078d4', bg: '#eff6ff' },
  'sap mm':                             { icon: Box,               color: '#0066b3', bg: '#eff6ff' },
  'sap fico':                           { icon: Banknote,          color: '#0066b3', bg: '#f0fdf4' },
  'sap sd':                             { icon: ShoppingCart,      color: '#0066b3', bg: '#f0f9ff' },
  'sap':                                { icon: ServerCog,         color: '#0066b3', bg: '#eff6ff' },
  'sap basis and security':             { icon: ShieldCheck,       color: '#0052cc', bg: '#eff6ff' },
  'sap btp / cpi consultant':           { icon: Layers,            color: '#0066b3', bg: '#eff6ff' },
  'erp':                                { icon: Building2,         color: '#64748b', bg: '#f1f5f9' },
  'netsuite':                           { icon: Globe,             color: '#4f46e5', bg: '#eef2ff' },
  'crm sales':                          { icon: TrendingUp,        color: '#10b981', bg: '#ecfdf5' },
  'crm specialist':                     { icon: MousePointer2,     color: '#10b981', bg: '#ecfdf5' },
  // ── Design / UX ──────────────────────────────────────────────────────────────
  'ux designer':                        { icon: PencilRuler,       color: '#ec4899', bg: '#fdf2f8' },
  // ── Marketing ────────────────────────────────────────────────────────────────
  'marketing automation specialist':    { icon: Zap,               color: '#f97316', bg: '#fff7ed' },
  'market research analyst':            { icon: Megaphone,         color: '#f59e0b', bg: '#fffbeb' },
  // ── Healthcare / Clinical ─────────────────────────────────────────────────────
  'healthcare data analyst':            { icon: HeartPulse,        color: '#e11d48', bg: '#fff1f2' },
  'clinical data analyst':              { icon: Activity,          color: '#e11d48', bg: '#fff1f2' },
  'medical coding':                     { icon: ClipboardList,     color: '#dc2626', bg: '#fef2f2' },
  'clinical research coordinator':      { icon: Microscope,        color: '#06b6d4', bg: '#ecfeff' },
  'medical affairs':                    { icon: Stethoscope,       color: '#e11d48', bg: '#fff1f2' },
  'regulatory affairs':                 { icon: Scale,             color: '#7c3aed', bg: '#f5f3ff' },
  'biotechnology':                      { icon: FlaskConical,      color: '#06b6d4', bg: '#ecfeff' },
  'bioinformatics':                     { icon: Dna,               color: '#10b981', bg: '#ecfdf5' },
  // ── Finance ──────────────────────────────────────────────────────────────────
  'financial analyst':                  { icon: CandlestickChart,  color: '#16a34a', bg: '#f0fdf4' },
  'credit risk analyst':                { icon: BadgeDollarSign,   color: '#15803d', bg: '#f0fdf4' },
  // ── Supply Chain / Ops ───────────────────────────────────────────────────────
  'supply chain':                       { icon: Truck,             color: '#84cc16', bg: '#f7fee7' },
  'supply chain (citizen/h4ead)':       { icon: Box,               color: '#65a30d', bg: '#f7fee7' },
  // ── HR ───────────────────────────────────────────────────────────────────────
  'hr recruiter':                       { icon: Users2,            color: '#f43f5e', bg: '#fff1f2' },
  // ── Engineering (Hardware / Mech / Elec) ─────────────────────────────────────
  'mechanical engineer':                { icon: Wrench,            color: '#6b7280', bg: '#f9fafb' },
  'manufacturing engineer (mechanical)':{ icon: Factory,           color: '#78716c', bg: '#fafaf9' },
  'electrical engineer':                { icon: Bolt,              color: '#eab308', bg: '#fefce8' },
  'electrical project':                 { icon: Zap,               color: '#ca8a04', bg: '#fefce8' },
  'chemical engineer':                  { icon: FlaskRound,        color: '#0891b2', bg: '#ecfeff' },
  // ── Environment / Sustainability ─────────────────────────────────────────────
  'sustainability analyst for ireland': { icon: Leaf,              color: '#16a34a', bg: '#f0fdf4' },
  // ── Construction / Physical ───────────────────────────────────────────────────
  'construction management':            { icon: Construction,      color: '#f59e0b', bg: '#fffbeb' },
  // ── Niche / Other ─────────────────────────────────────────────────────────────
  'photography':                        { icon: Camera,            color: '#7c3aed', bg: '#f5f3ff' },
};

const getDomainData = (roleName) => {
  const defaultData = { icon: Briefcase, color: '#64748b', bg: '#f1f5f9' };
  if (!roleName) return defaultData;

  // 1. Exact match (case-insensitive)
  const key = roleName.trim().toLowerCase();
  if (DOMAIN_ICON_MAP[key]) return DOMAIN_ICON_MAP[key];

  // 2. Prefix/contains match for long or variant names
  for (const [mapKey, val] of Object.entries(DOMAIN_ICON_MAP)) {
    if (key.startsWith(mapKey) || mapKey.startsWith(key)) return val;
  }

  // 3. Fallback pattern matching for unknown future domains
  const lower = key;
  if (lower.match(/ai|machine learning/))          return { icon: Brain,        color: '#3b82f6', bg: '#eff6ff' };
  if (lower.match(/full stack|infrastructure/))    return { icon: Layers,       color: '#8b5cf6', bg: '#f5f3ff' };
  if (lower.match(/frontend|react|angular|vue/))  return { icon: Layout,       color: '#0ea5e9', bg: '#f0f9ff' };
  if (lower.match(/backend|java|python|\.net/))   return { icon: Code2,        color: '#2563eb', bg: '#eff6ff' };
  if (lower.match(/data|sql|database|etl/))        return { icon: Database,     color: '#6366f1', bg: '#eef2ff' };
  if (lower.match(/cyber|security|firewall/))      return { icon: ShieldCheck,  color: '#ef4444', bg: '#fef2f2' };
  if (lower.match(/cloud|aws|azure|gcp/))          return { icon: Cloud,        color: '#0ea5e9', bg: '#f0f9ff' };
  if (lower.match(/devops|sre|platform/))          return { icon: Network,      color: '#f43f5e', bg: '#fff1f2' };
  if (lower.match(/network|system/))               return { icon: Terminal,     color: '#14b8a6', bg: '#f0fdfa' };
  if (lower.match(/qa|test|quality/))              return { icon: Activity,     color: '#f59e0b', bg: '#fffbeb' };
  if (lower.match(/mobile|ios|android/))           return { icon: Smartphone,   color: '#2563eb', bg: '#eff6ff' };
  if (lower.match(/product manager|product owner/))return { icon: Target,       color: '#6366f1', bg: '#eef2ff' };
  if (lower.match(/project manager|scrum/))        return { icon: ClipboardList,color: '#6366f1', bg: '#eef2ff' };
  if (lower.match(/design|ui|ux/))                 return { icon: PencilRuler,  color: '#ec4899', bg: '#fdf2f8' };
  if (lower.match(/market|seo|brand/))             return { icon: Megaphone,    color: '#f97316', bg: '#fff7ed' };
  if (lower.match(/finance|account|bank/))         return { icon: Banknote,     color: '#16a34a', bg: '#f0fdf4' };
  if (lower.match(/health|medical|clinical/))      return { icon: HeartPulse,   color: '#e11d48', bg: '#fff1f2' };
  if (lower.match(/supply|logistic|chain/))        return { icon: Truck,        color: '#84cc16', bg: '#f7fee7' };
  if (lower.match(/hr|recruit|talent/))            return { icon: Users2,       color: '#f43f5e', bg: '#fff1f2' };
  if (lower.match(/science|research|bio/))         return { icon: Microscope,   color: '#06b6d4', bg: '#ecfeff' };
  if (lower.match(/sap|erp|dynamics/))             return { icon: ServerCog,    color: '#0066b3', bg: '#eff6ff' };

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

      const aggregated = {};
      rows.forEach(row => {
        let name = row.role_name;
        if (name) {
          const lower = name.trim().toLowerCase();
          if (lower === 'java full stack' || lower === 'java developer' || lower === 'java full stack developer') {
            name = 'Java Developer';
          }
        }
        
        if (!name) return;

        if (!aggregated[name]) {
          aggregated[name] = {
            name,
            count: 0,
            type: isTechRole(name) ? 'TECH' : 'NON-TECH',
          };
        }
        aggregated[name].count += Number(row.job_count);
      });

      const domainList = Object.values(aggregated);

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
