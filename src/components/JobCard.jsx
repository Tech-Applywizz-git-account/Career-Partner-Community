import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    MapPin,
    Clock,
    Briefcase,
    Bookmark,
    BookmarkCheck,
    CheckCircle,
    ArrowUpRight,
    Globe,
    Building2,
    Calendar,
    UserCheck,
    Sparkles,
    Ban,
    Heart,
    MoreHorizontal,
    MonitorSmartphone,
    TrendingUp,
    Linkedin,
    ExternalLink
} from 'lucide-react';
import RecruiterMessageModal from './RecruiterMessageModal';
import { supabase } from '../supabaseClient';
import useAuth from '../hooks/useAuth';
import { getWageLevel } from '../dataSyncService';
import LogoBox from './LogoBox';

// ── Per-card in-memory cache to eliminate redundant Supabase calls ───────────
const _jcCache = new Map(); // key -> { value, ts }
const _JC_TTL = 10 * 60 * 1000; // 10 minutes
function _jcGet(key) { const e = _jcCache.get(key); return (e && Date.now() - e.ts < _JC_TTL) ? e.value : null; }
function _jcSet(key, value) { _jcCache.set(key, { value, ts: Date.now() }); }

const JobCard = ({ job, isSaved = false, isApplied = false, onSaveToggle, onApplyToggle }) => {
    const { user, subscriptionExpired } = useAuth() || {};
    const [wageInfo, setWageInfo] = useState({ level: 'Lv 2', hourly: null, yearly: null, loading: true });
    const [filingCount, setFilingCount] = useState(job.lca_filings || null);
    const [saved, setSaved] = useState(isSaved);
    const [saving, setSaving] = useState(false);
    const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
    const [hrHovered, setHrHovered] = useState(false);

    useEffect(() => setSaved(isSaved), [isSaved]);

    useEffect(() => {
        // H1B and Wage Data fetching disabled per user request
        // to ensure requests only hit when in the H1B Finder tab.
        setWageInfo(prev => ({ ...prev, loading: false }));
        setFilingCount(null);
    }, [job.title, job.location, job.role, job.company, job.lca_filings, job.wage_level, job.salary]);

    const handleSaveToggle = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!user) return;

        const jobId = job.job_id || job.id || job.audit_id;
        setSaving(true);
        try {
            if (saved) {
                await supabase.from('saved_jobs').delete().eq('user_id', user.id).eq('job_id', jobId);
                setSaved(false);
            } else {
                await supabase.from('saved_jobs').insert([{ user_id: user.id, job_id: jobId, job_data: job }]);
                setSaved(true);
            }
            onSaveToggle?.(jobId, !saved);
        } catch (err) {
            console.error('Save error:', err);
        } finally {
            setSaving(false);
        }
    };

    const formatTimeAgo = (dateStr) => {
        if (!dateStr) return 'Recently';
        try {
            return new Date(dateStr).toLocaleDateString('en-US', { timeZone: 'UTC', month: 'short', day: 'numeric', year: 'numeric' });
        } catch { return 'Recently'; }
    };

    const getLevelValue = () => {
        const match = (wageInfo.level || '').match(/\d/);
        return match ? parseInt(match[0]) : 2;
    };

    const levelPercent = (getLevelValue() / 4) * 100;

    return (
        <div className="bg-white rounded-[20px] transition-all duration-300 flex flex-col md:flex-row shadow-sm hover:shadow-md border border-[#ebebeb] overflow-hidden lg:h-[280px] w-full relative group">
            {/* Top Badges Row */}
            <div className="flex flex-wrap gap-2 mb-4">
                <span className="bg-[#e8f5e9] text-[#2e7d32] px-3 py-1 rounded-full text-[12px] font-semibold">
                    {formatTimeAgo(job.date_posted || job.time)}
                </span>
                {filingCount !== null && (
                    <span className="bg-[#f5f3ff] text-[#7c3aed] px-3 py-1 rounded-full text-[12px] font-semibold">
                        📊 {filingCount.toLocaleString()} Filings
                    </span>
                )}
                {filingCount > 100 && (
                    <span className="bg-[#fdf2f8] text-[#be185d] px-3 py-1 rounded-full text-[12px] font-semibold">
                        🔥 High Volume
                    </span>
                )}
                <span className="bg-[#e3f2fd] text-[#1976d2] px-3 py-1 rounded-full text-[12px] font-semibold">
                    Be an early applicant
                </span>
            </div>

            <div className="flex gap-6">
                {/* Logo & Main Info */}
                <div className="flex-grow min-w-0">
                    <div className="flex items-start gap-4 mb-4">
                        <div className="shrink-0">
                            <LogoBox name={job.company} officialUrl={job.url} size={64} fontSize={20} />
                        </div>
                        <div className="min-w-0">
                            <h2 className="text-[20px] font-extrabold text-[#111] leading-[1.3] mb-1 h-[52px] line-clamp-2">
                                {job.title}
                            </h2>
                            <div className="flex items-center gap-1.5 text-[#666] text-[15px]">
                                <span className="font-bold">{job.company}</span>
                                <span className="text-[#ccc]">/</span>
                                <span className="truncate">{job.role || 'Full-time'} · Software Engineering · Technology</span>
                            </div>
                        </div>
                        <div className="ml-auto">
                            <button className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-50 flex items-center justify-center">
                                <MoreHorizontal size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Meta Grid */}
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-y-3 gap-x-6 mb-6">
                        <div className="flex items-center gap-3 text-[#333] font-medium">
                            <MapPin size={18} className="text-[#666]" />
                            <span className="text-[14px]">{job.location || 'United States'}</span>
                        </div>
                        <div className="flex items-center gap-3 text-[#333] font-medium">
                            <Clock size={18} className="text-[#666]" />
                            <span className="text-[14px]">{job.employment_type || job.type || 'Full-time'}</span>
                        </div>
                        <div className="flex items-center gap-3 text-[#333] font-medium">
                            <Building2 size={18} className="text-[#666]" />
                            <span className="text-[14px]">{job.work_model || job.jobFormat || 'Hybrid'}</span>
                        </div>
                        {filingCount !== null && (
                            <div className="flex items-center gap-3 text-[#333] font-medium">
                                <TrendingUp size={18} className="text-[#94a3b8]" />
                                <span className="text-[14px]">{filingCount.toLocaleString()} LCA Filings</span>
                            </div>
                        )}
                        {job.years_exp_required && (
                            <div className="flex items-center gap-3 text-[#333] font-medium">
                                <UserCheck size={18} className="text-[#666]" />
                                <span className="text-[14px]">{job.years_exp_required} exp</span>
                            </div>
                        )}
                        {job.salary && (
                            <div className="flex items-center gap-3 text-[#333] font-medium">
                                <TrendingUp size={18} className="text-[#666]" />
                                <span className="text-[14px]">{job.salary}</span>
                            </div>
                        )}
                    </div>

                    {/* Bottom Actions */}
                    <div className="flex flex-wrap md:flex-nowrap items-center gap-3 md:gap-3 mt-auto border-t border-[#f1f5f9] pt-4 shrink-0">
                        <div className="flex items-center gap-4 w-full md:w-auto md:mr-auto">
                            <p className="text-[#94a3b8] text-[13px] font-semibold">Less than 25 applicants</p>
                            {job.salary && (
                                <>
                                    <div className="w-1.5 h-1.5 rounded-full bg-gray-200"></div>
                                    <span className="text-[#1e293b] font-bold text-[14px]">{job.salary}</span>
                                </>
                            )}
                        </div>
                        
                        <div className="flex items-center gap-2 md:gap-3 w-full md:w-auto justify-between md:justify-end mt-2 md:mt-0">
                            {/* Premium HR Sticker Button - ONLY show if HR profile exists */}
                            {job.posted_by_profile && String(job.posted_by_profile).toLowerCase() !== 'null' && String(job.posted_by_profile).trim() !== '' && (
                            <div className="shrink-0 flex items-center gap-3">
                                {/* 3D Avatar Button */}
                                <div 
                                    className="relative cursor-pointer hover:scale-110 transition-transform duration-300 rounded-full shadow-sm"
                                    onMouseEnter={() => setHrHovered(true)}
                                    onMouseLeave={() => setHrHovered(false)}
                                    onClick={(e) => { e.preventDefault(); setIsMessageModalOpen(true); }}
                                >
                                    <div style={{ width: '48px', height: '48px' }} className="rounded-full overflow-hidden flex items-center justify-center border-2 border-blue-100 shadow-sm bg-white">
                                        <img src="/linkedin-recruiter.png" alt="HR Recruiter" style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scale(1.05)' }} className="rounded-full" />
                                    </div>
                                    

                                    
                                    {/* Custom Premium Tooltip */}
                                    <div 
                                        className="absolute z-50 pointer-events-none transition-all duration-300"
                                        style={{
                                            opacity: hrHovered ? 1 : 0,
                                            visibility: hrHovered ? 'visible' : 'hidden',
                                            bottom: '130%', left: '50%', transform: hrHovered ? 'translateX(-50%) translateY(0px)' : 'translateX(-50%) translateY(4px)',
                                            width: '220px', background: 'rgba(10, 10, 20, 0.98)', borderRadius: '12px',
                                            boxShadow: '0 15px 40px rgba(0,0,0,0.7)', border: '1px solid rgba(41,254,41,0.3)',
                                            padding: '14px'
                                        }}
                                    >
                                        <div style={{ color: '#29FE29', fontSize: '12px', fontWeight: 900, lineHeight: 1.4, textAlign: 'center' }}>
                                            AI Recruiter Message<br />
                                            <span style={{ color: '#fff', fontSize: '10px', opacity: 0.8, fontWeight: 500, display: 'block', marginTop: '4px' }}>
                                                Message the recruiter directly with a personalized, AI-crafted note!
                                            </span>
                                        </div>
                                        {/* Tooltip Arrow pointing down to the center of the avatar */}
                                        <div style={{
                                            position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)',
                                            borderWidth: '7px', borderStyle: 'solid', borderColor: 'rgba(10, 10, 20, 0.98) transparent transparent transparent'
                                        }} />
                                    </div>
                                </div>
                                
                                {/* HR Actions Column */}
                                <div className="flex flex-col gap-1.5 items-start">
                                    {/* View HR Link */}
                                    <a 
                                        href={job.posted_by_profile || '#'}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-center gap-1.5 md:gap-2 px-2 md:px-3 py-1 md:py-1.5 rounded-lg transition-colors shadow-sm whitespace-nowrap hover:opacity-90"
                                        style={{ backgroundColor: '#0A66C2' }}
                                        onClick={(e) => {
                                            if (!job.posted_by_profile) e.preventDefault();
                                        }}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" className="md:w-[18px] md:h-[18px]" viewBox="0 0 24 24" fill="#ffffff">
                                            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                                        </svg>
                                        <span className="text-[13px] md:text-[14px] font-bold" style={{ color: '#ffffff' }}>HR LinkedIn</span>
                                    </a>

                                    {/* Craft Message Button */}
                                    <button
                                        onClick={(e) => { e.preventDefault(); setIsMessageModalOpen(true); }}
                                        className="flex items-center justify-center gap-1.5 rounded-full font-bold shadow-sm transition-all hover:scale-105 active:scale-95 px-3 py-1 text-[11px] md:text-[12px]"
                                        style={{ backgroundColor: '#29FE29', color: '#111' }}
                                    >
                                        <Sparkles size={14} /> Craft Message
                                    </button>
                                </div>
                            </div>
                            )}
                            <button className="w-12 h-12 border border-[#e2e8f0] rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-all">
                                <Ban size={20} />
                            </button>
                            <button className="h-12 px-5 border border-[#e2e8f0] rounded-full flex items-center gap-2 text-[13px] font-bold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all uppercase tracking-tighter shadow-sm">
                                <Sparkles size={18} /> ASK ORION
                            </button>
                            <a
                                href={job.url || job.apply_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="h-12 px-8 rounded-full flex items-center justify-center gap-2.5 font-extrabold text-[15px] transition-all active:scale-95"
                                style={{ backgroundColor: '#29FE29', color: '#FFFFFF' }}
                            >
                                Apply Now <ExternalLink size={20} className="stroke-[2.5]" />
                            </a>
                        </div>
                    </div>
                </div>

                {/* Right Panel - Wage Level & Score */}
                <div className="hidden lg:flex w-[160px] bg-[#29FE29] rounded-[20px] p-5 flex-col items-center justify-center text-center text-[#1E1E1E] shrink-0 relative lg:h-[260px]">
                    {/* Visual Accent */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-3xl opacity-20"></div>

                    {/* Ring Container */}
                    <div className="relative z-10 flex flex-col items-center justify-center">
                        <div className="relative w-20 h-20 mb-3 flex items-center justify-center">
                            <svg className="w-full h-full transform -rotate-90">
                                <circle
                                    cx="40"
                                    cy="40"
                                    r="34"
                                    stroke="rgba(255,255,255,0.1)"
                                    strokeWidth="6"
                                    fill="transparent"
                                />
                                <circle
                                    cx="40"
                                    cy="40"
                                    r="34"
                                    stroke="#2C76FF"
                                    strokeWidth="6"
                                    fill="transparent"
                                    strokeDasharray={2 * Math.PI * 34}
                                    strokeDashoffset={2 * Math.PI * 34 * (1 - levelPercent / 100)}
                                    strokeLinecap="round"
                                />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-[20px] font-black leading-none">
                                    {wageInfo.loading ? '??' : (wageInfo.level || 'Lv 2')}
                                </span>
                            </div>
                        </div>

                        <div className="text-[11px] font-black uppercase tracking-[2px] mb-2 opacity-70">
                            WAGE LEVEL
                        </div>
                        <div className="w-8 h-[1px] bg-white/10"></div>
                    </div>

                    {/* Identity Badge - Perfectly centered at the bottom area */}
                    {job.isVerified && (
                        <div className="absolute bottom-5 left-0 right-0 flex items-center justify-center px-3">
                            <div className="flex items-center gap-1.5 bg-[#ecfdf5] border border-[#d1fae5] pl-2.5 pr-1 py-1 rounded-full shadow-sm whitespace-nowrap max-w-full">
                                <span className="text-[8px] font-black text-[#059669] uppercase tracking-wider leading-none translate-y-[0.5px]">HUMAN VERIFIED</span>
                                <div className="flex items-center justify-center p-0.5">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="#059669" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M12 2L14.43 3.63L17.29 2.89L18.47 5.56L21.31 6.36L21.14 9.3L23 11.5L21.14 13.7L21.31 16.64L18.47 17.44L17.29 20.11L14.43 19.37L12 21L9.57 19.37L6.71 20.11L5.53 17.44L2.69 16.64L2.86 13.7L1 11.5L2.86 9.3L2.69 6.36L5.53 5.56L6.71 2.89L9.57 3.63L12 2Z" />
                                        <path d="M10 14.5L7.5 12L6.5 13L10 16.5L17.5 9L16.5 8L10 14.5Z" fill="white" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <RecruiterMessageModal 
                isOpen={isMessageModalOpen} 
                job={job} 
                onClose={() => setIsMessageModalOpen(false)} 
            />
        </div>
    );
};

export default JobCard;

