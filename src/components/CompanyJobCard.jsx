import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, DollarSign, Clock, ExternalLink, Star, Globe, Bookmark, CheckCircle, TrendingUp, Building2 } from 'lucide-react';
import LogoBox from './LogoBox';
import useAuth from '../hooks/useAuth';
import { supabase } from '../supabaseClient';
import { getWageLevel } from '../dataSyncService';

// ── Module-level cache (shared across all CompanyJobCard instances) ────────────
const _cjcCache = new Map();
const _CJC_TTL = 10 * 60 * 1000; // 10 min
function _cjcGet(key) { const e = _cjcCache.get(key); return (e && Date.now() - e.ts < _CJC_TTL) ? e.value : null; }
function _cjcSet(key, value) { _cjcCache.set(key, { value, ts: Date.now() }); }

const CompanyJobCard = ({ job, onSave, isSaved = false, isLandingPage = false, isMobile }) => {
    const { user } = useAuth();
    const [filingCount, setFilingCount] = useState(job.lca_filings || 0);
    const [wageInfo, setWageInfo] = useState({
        level: job.wage_level || 'Level 2',
        loading: !job.wage_level
    });

    const formatTimeAgo = (dateStr) => {
        if (!dateStr) return 'Recently';
        try {
            const d = new Date(dateStr), now = new Date();
            const h = Math.floor((now - d) / 36e5);
            if (h < 1) return 'Just now';
            if (h < 24) return `${h}h ago`;
            const days = Math.floor(h / 24);
            if (days < 7) return `${days}d ago`;
            return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        } catch { return dateStr; }
    };

    const levelValue = wageInfo.level ? parseInt(wageInfo.level.match(/\d/)?.[0] || '2') : 2;
    const levelPercent = (levelValue / 4) * 100;

    useEffect(() => {
        const fetchData = async () => {
            // --- Filing Count (cached) ---
            if (job.lca_filings !== undefined) {
                setFilingCount(job.lca_filings || 0);
            } else if (job.company) {
                const fKey = `cjc_filing:${String(job.company).toLowerCase()}`;
                const hit = _cjcGet(fKey);
                if (hit !== null) {
                    setFilingCount(hit);
                } else {
                    const normalize = (name) => {
                        if (!name) return '';
                        return name.toLowerCase()
                            .replace(/[\.,:]/g, ' ')
                            .replace(/\b(inc|llc|corp|ltd|co|services|com|systems|technologies|group|holdings|usa|us|intl|international|solutions|aws|related|web|tech|software|management|financial|insurance|banking|health|healthcare|travel|company)\b/g, ' ')
                            .replace(/\s+/g, ' ').trim();
                    };
                    const coreTerm = normalize(job.company).split(' ')[0] || normalize(job.company);
                    try {
                        const { data } = await supabase.from('h1b_sponsor_finder').select('"LCA Filings"').ilike('Company', `%${coreTerm}%`).limit(1);
                        const count = (data && data[0]) ? (parseInt(data[0]["LCA Filings"]) || 0) : 0;
                        _cjcSet(fKey, count);
                        setFilingCount(count);
                    } catch (e) { }
                }
            }

            // --- Wage Level (cached) ---
            if (job.wage_level) {
                setWageInfo({ level: job.wage_level, loading: false });
            } else if (job.title) {
                const wKey = `cjc_wage:${String(job.title).toLowerCase().slice(0, 50)}:${String(job.location || '').toLowerCase().slice(0, 20)}`;
                const hitW = _cjcGet(wKey);
                if (hitW !== null) {
                    setWageInfo({ level: hitW, loading: false });
                } else {
                    try {
                        const res = await getWageLevel(job.title, job.location, job.salary);
                        const level = (res && res[0]) ? (res[0]['Wage Level'] || 'Level 2') : 'Level 2';
                        _cjcSet(wKey, level);
                        setWageInfo({ level, loading: false });
                    } catch (e) {
                        setWageInfo({ level: 'Level 2', loading: false });
                    }
                }
            }
        };
        fetchData();
    }, [job.company, job.title, job.lca_filings]);

    const baseButtonStyle = isLandingPage
        ? "h-9 px-5 bg-[#FDB913] text-[#1a1a1a] rounded-full flex items-center justify-center gap-2 font-extrabold text-[12px] hover:bg-[#f0af0e] transition-all shadow-[0_4px_12px rgba(253,185,19,0.2)] active:scale-95 shrink-0"
        : "h-12 px-8 bg-[#FDB913] text-[#1a1a1a] rounded-full flex items-center justify-center gap-2.5 font-extrabold text-[15px] hover:bg-[#f0af0e] transition-all shadow-[0_6px_20px_rgba(253,185,19,0.3)] active:scale-95 shrink-0";

    return (
        <div className={`bg-white rounded-2xl border border-[#ebebeb] ${isLandingPage ? 'p-3 mb-2' : 'p-5 mb-3'} shadow-sm hover:shadow-md transition-all duration-300 flex flex-col md:flex-row gap-3 relative overflow-hidden group`}>
            <div className="flex-1 min-w-0">
                <div className="flex items-start gap-4 mb-4">
                    <div className="shrink-0">
                        <LogoBox name={job.company} officialUrl={job.url || job.apply_url} size={isLandingPage ? 32 : 44} fontSize={isLandingPage ? 11 : 14} />
                    </div>
                    <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            {job.salary && (
                                <span className="text-[10px] font-bold text-[#24385E] bg-[#eef2f8] px-2 py-0.5 rounded-full font-black">
                                    {job.salary}
                                </span>
                            )}
                        </div>
                        <h3 className={`${isLandingPage ? 'text-[14px]' : 'text-[17px]'} font-extrabold text-[#111] leading-tight mb-0.5 truncate group-hover:text-[#EAB308] transition-colors`}>
                            {job.isTeaser ? (
                                <Link to="/pricing">{job.title}</Link>
                            ) : (
                                <a href={job.url || job.apply_url} target="_blank" rel="noopener noreferrer">{job.title}</a>
                            )}
                        </h3>
                        <div className={`${isLandingPage ? 'text-[11px]' : 'text-[13px]'} font-bold text-[#718096] flex items-center gap-1.5`}>
                            {job.company}
                        </div>
                    </div>
                </div>

                <div className={`flex flex-wrap items-center gap-x-4 gap-y-2 ${isLandingPage ? 'mb-2' : 'mb-4'}`}>
                    <div className={`flex items-center gap-2 text-[#64748b] ${isLandingPage ? 'text-[11px]' : 'text-[13px]'} font-semibold border-r border-gray-100 pr-3 last:border-0 last:pr-0`}>
                        <MapPin size={15} className="text-[#94a3b8]" /> {job.location || 'United States'}
                    </div>
                    <div className={`flex items-center gap-2 text-[#64748b] ${isLandingPage ? 'text-[11px]' : 'text-[13px]'} font-semibold border-r border-gray-100 pr-3 last:border-0 last:pr-0`}>
                        <Clock size={15} className="text-[#94a3b8]" /> {job.employment_type || job.type || 'Full-time'}
                    </div>
                    {job.isVerified && (
                        <div className="flex items-center bg-[#f0fdf4] border border-[#bbf7d0] px-3 py-1 rounded-full shadow-sm mt-1.5 md:mt-0">
                            <span className="text-[10px] font-black text-[#15803d] uppercase tracking-wider mr-2">HUMAN VERIFIED</span>
                            <div className="flex items-center justify-center p-0.5">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="#15803d" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M12 2L14.43 3.63L17.29 2.89L18.47 5.56L21.31 6.36L21.14 9.3L23 11.5L21.14 13.7L21.31 16.64L18.47 17.44L17.29 20.11L14.43 19.37L12 21L9.57 19.37L6.71 20.11L5.53 17.44L2.69 16.64L2.86 13.7L1 11.5L2.86 9.3L2.69 6.36L5.53 5.56L6.71 2.89L9.57 3.63L12 2Z" />
                                    <path d="M10 14.5L7.5 12L6.5 13L10 16.5L17.5 9L16.5 8L10 14.5Z" fill="white" />
                                </svg>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex items-center justify-between md:justify-start gap-4 mt-auto pt-4 border-t border-[#f1f5f9] shrink-0 w-full overflow-hidden">
                    {job.isTeaser ? (
                        <Link to="/pricing" className={`${baseButtonStyle} whitespace-nowrap flex-1 md:flex-none md:w-fit md:px-4`}>
                            Apply Now <ExternalLink size={isLandingPage ? 14 : 20} className="stroke-[2.5]" />
                        </Link>
                    ) : (
                        <a href={job.url || job.apply_url} target="_blank" rel="noopener noreferrer" className={`${baseButtonStyle} whitespace-nowrap flex-1 md:flex-none md:w-fit md:px-4`}>
                            Apply Now <ExternalLink size={20} className="stroke-[2.5]" />
                        </a>
                    )}

                    {/* Mobile Wage Level Badge - Match Apply button size */}
                    <div className="md:hidden flex flex-1 items-center justify-center bg-[#24385E] px-4 py-3.5 rounded-full border-b-4 border-[#1a2a47] shadow-lg shrink-0 h-full">
                        <div className="flex items-center justify-center mr-2">
                            <span className="text-[12px] font-black text-[#FDB913] leading-none whitespace-nowrap">
                                {wageInfo.level.replace(/Level\s+/i, 'Lv ')}
                            </span>
                        </div>
                        <span className="text-[11px] font-black text-white uppercase tracking-wider whitespace-nowrap">Wage Level</span>
                    </div>
                </div>
            </div>

            {/* Wage Level Panel (Desktop Only) */}
            <div className={`hidden md:flex ${isLandingPage ? 'w-[80px] p-2' : 'w-[120px] p-4'} bg-[#24385E] rounded-xl flex-col items-center justify-center text-center text-white shrink-0`}>
                <div className={`relative ${isLandingPage ? 'w-10 h-10 mb-1' : 'w-14 h-14 mb-2'} flex items-center justify-center`}>
                    <svg className="w-full h-full transform -rotate-90">
                        <circle
                            cx={isLandingPage ? "20" : "28"}
                            cy={isLandingPage ? "20" : "28"}
                            r={isLandingPage ? "18" : "24"}
                            stroke="rgba(255,255,255,0.1)" strokeWidth="3" fill="transparent"
                        />
                        <circle
                            cx={isLandingPage ? "20" : "28"}
                            cy={isLandingPage ? "20" : "28"}
                            r={isLandingPage ? "18" : "24"}
                            stroke="#EAB308" strokeWidth={isLandingPage ? "3" : "4"} fill="transparent"
                            strokeDasharray={isLandingPage ? 2 * Math.PI * 18 : 2 * Math.PI * 24}
                            strokeDashoffset={(isLandingPage ? 2 * Math.PI * 18 : 2 * Math.PI * 24) * (1 - levelPercent / 100)}
                            strokeLinecap="round"
                        />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className={`${isLandingPage ? 'text-[11px]' : 'text-[14px]'} font-black italic`}>{wageInfo.level.replace(/Level\s+/i, 'Lv ')}</span>
                    </div>
                </div>
                <div className="text-[8px] font-black uppercase tracking-[1px] opacity-70 mb-2">WAGE LEVEL</div>
                <div className="w-full h-[1px] bg-white/10 mb-2"></div>
                {job.isVerified && (
                    <div className="flex items-center gap-1 bg-[#ecfdf5] border border-[#d1fae5] pl-2 pr-1 py-1 rounded-lg mt-2 scale-90">
                        <span className="text-[8px] font-black text-[#059669] uppercase tracking-wider leading-none translate-y-[0.5px] whitespace-nowrap">HUMAN VERIFIED</span>
                        <div className="flex items-center justify-center">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="#059669" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 2L14.43 3.63L17.29 2.89L18.47 5.56L21.31 6.36L21.14 9.3L23 11.5L21.14 13.7L21.31 16.64L18.47 17.44L17.29 20.11L14.43 19.37L12 21L9.57 19.37L6.71 20.11L5.53 17.44L2.69 16.64L2.86 13.7L1 11.5L2.86 9.3L2.69 6.36L5.53 5.56L6.71 2.89L9.57 3.63L12 2Z" />
                                <path d="M10 14.5L7.5 12L6.5 13L10 16.5L17.5 9L16.5 8L10 14.5Z" fill="white" />
                            </svg>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CompanyJobCard;
