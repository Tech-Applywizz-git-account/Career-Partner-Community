import React, { useState, useEffect } from 'react';
import {
    Briefcase,
    Heart,
    Flame,
    TrendingUp,
    ChevronRight,
    Lock,
    Star,
    X,
    CreditCard,
    CheckCircle,
} from 'lucide-react';
import { supabase } from '../supabaseClient';
import useAuth from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

// ─── Payment-gate modal ────────────────────────────────────────────────────────
const PaymentModal = ({ job, onClose }) => {
    const navigate = useNavigate();

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 relative animate-in fade-in zoom-in-95 duration-200">
                <button
                    onClick={onClose}
                    className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 transition-colors"
                >
                    <X size={20} />
                </button>

                {/* Lock icon */}
                <div className="flex justify-center mb-5">
                    <div className="w-16 h-16 bg-[#24385E]/10 rounded-full flex items-center justify-center">
                        <Lock size={28} className="text-[#24385E]" />
                    </div>
                </div>

                <h2 className="text-2xl font-black text-[#24385E] text-center mb-2">
                    Unlock Full Access
                </h2>
                <p className="text-gray-500 text-sm text-center font-medium mb-6">
                    Get access to <strong>verified H-1B sponsoring</strong> jobs including{' '}
                    <span className="text-[#24385E] font-bold">{job?.title}</span> at{' '}
                    <span className="text-[#24385E] font-bold">{job?.company}</span>.
                </p>

                <div className="bg-[#24385E]/5 rounded-2xl p-5 mb-6 space-y-2.5">
                    {[
                        'Verified open roles',
                        'H-1B, OPT/CPT, TN, E-3, J-1 & Green Cards',
                        'Salary & company info for every role',
                        'Verified contact emails',
                        'Cancel anytime',
                    ].map((f, i) => (
                        <div key={i} className="flex items-center gap-3">
                            <CheckCircle size={16} className="text-emerald-500 shrink-0" />
                            <span className="text-sm font-medium text-[#24385E]">{f}</span>
                        </div>
                    ))}
                </div>

                <div className="text-center mb-5">
                    <span className="text-3xl font-black text-[#24385E]">$30</span>
                    <span className="text-gray-400 font-medium text-sm">/month</span>
                    <p className="text-xs text-emerald-600 font-semibold mt-1">✨ 30-day free trial included</p>
                </div>

                <button
                    onClick={() => navigate('/pricing')}
                    className="w-full py-4 bg-[#FDB913] hover:bg-[#e5a811] text-[#24385E] font-black text-base rounded-2xl shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
                >
                    <CreditCard size={18} />
                    Complete Payment to Access All Jobs
                </button>

                <p className="text-center text-xs text-gray-400 mt-3 font-medium">
                    Secure payment · Cancel anytime
                </p>
            </div>
        </div>
    );
};

// ─── Teaser job card ───────────────────────────────────────────────────────────
const TeaserJobCard = ({ job }) => {
    const navigate = useNavigate();
    return (
        <div
            onClick={() => navigate('/pricing')}
            className="flex items-center gap-4 p-4 bg-[#fafafa] rounded-2xl border border-[#f0f0f0] hover:border-[#FDB913]/40 hover:bg-[#fffdf0] cursor-pointer transition-all group"
        >
            {/* Company avatar */}
            <div className="w-10 h-10 bg-gradient-to-br from-[#24385E] to-[#3a5a9c] rounded-xl flex items-center justify-center font-black text-white text-sm shrink-0">
                {job.company.charAt(0)}
            </div>

            <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-[#24385E] truncate">{job.title}</p>
                <p className="text-[12px] text-gray-400 font-medium truncate">{job.company} • {job.location}</p>
                <div className="flex items-center gap-2 mt-1">
                    <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">{job.visa}</span>
                    <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">{job.salary}</span>
                </div>
            </div>

            <div className="shrink-0 flex items-center gap-1 text-[#24385E]/40 group-hover:text-[#FDB913] transition-colors">
                <Lock size={14} />
            </div>
        </div>
    );
};

// ─── Main UserOverview ─────────────────────────────────────────────────────────
const UserOverview = () => {
    const { user, subscriptionEndDate, firstName } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState({ jobsApplied: 0, savedJobs: 0, daysLeft: 0 });
    const [loading, setLoading] = useState(true);
    const [selectedJob, setSelectedJob] = useState(null);

    // One teaser company with 2 locked jobs
    const TEASER_COMPANY = {
        name: 'Microsoft Corporation',
        industry: 'Technology',
        logo: 'M',
        color: '#00a4ef',
        sponsorsPerYear: '2,400+',
        rating: 4.8,
    };

    const TEASER_JOBS = [
        {
            id: 'j1',
            title: 'Software Engineer II',
            company: 'Microsoft Corporation',
            location: 'Redmond, WA',
            visa: 'H-1B',
            salary: '$145K–$180K',
            level: 'Level 2',
        },
        {
            id: 'j2',
            title: 'Senior Data Scientist',
            company: 'Microsoft Corporation',
            location: 'Seattle, WA',
            visa: 'H-1B / OPT',
            salary: '$160K–$200K',
            level: 'Level 3',
        },
    ];

    useEffect(() => {
        if (user) fetchStats();
    }, [user, subscriptionEndDate]);

    const fetchStats = async () => {
        try {
            await new Promise(r => setTimeout(r, 250)); // Stagger to avoid 525 
            const { count: appliedCount } = await supabase
                .from('applied_jobs').select('*', { count: 'exact', head: true }).eq('user_id', user.id);

            const { count: savedCount } = await supabase
                .from('saved_jobs').select('*', { count: 'exact', head: true }).eq('user_id', user.id);

            let days = 0;
            if (subscriptionEndDate) {
                const end = new Date(subscriptionEndDate);
                days = Math.max(0, Math.ceil((end - new Date()) / (1000 * 60 * 60 * 24)));
            }

            setStats({ jobsApplied: appliedCount || 0, savedJobs: savedCount || 0, daysLeft: days });
        } catch (err) {
            console.error('Stats error:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-10">
            {/* Header */}
            <div>
                <h2 className="text-[28px] font-black text-[#24385E] tracking-tight mb-1">
                    Dashboard {firstName ? `— Welcome, ${firstName}!` : ''}
                </h2>
                <p className="text-gray-400 font-medium">Here's a preview of what's available to you.</p>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-[#24385E] p-6 rounded-[32px] text-white shadow-xl shadow-blue-900/10 relative overflow-hidden group">
                    <div className="relative z-10 flex flex-col h-full justify-between">
                        <div className="flex justify-between items-start mb-8">
                            <div className="p-3 bg-white/10 rounded-2xl"><Briefcase size={24} className="text-white" /></div>
                            <span className="text-[12px] font-bold bg-white/10 px-2 py-0.5 rounded-lg border border-white/5">Realtime</span>
                        </div>
                        <div>
                            <p className="text-white/60 text-[13px] font-bold uppercase tracking-wider mb-1">Jobs Applied</p>
                            <h3 className="text-4xl font-black">{stats.jobsApplied}</h3>
                        </div>
                    </div>
                    <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-white/5 rounded-full group-hover:scale-150 transition-transform duration-700" />
                </div>

                <div className="bg-white p-6 rounded-[32px] border border-[#f0f0f0] shadow-sm hover:shadow-md transition-all duration-300">
                    <div className="flex justify-between items-start mb-8">
                        <div className="p-3 bg-red-50 rounded-2xl border border-red-100"><Heart size={24} className="text-red-500 fill-red-500" /></div>
                        <span className="text-[12px] font-bold text-gray-400">Personal</span>
                    </div>
                    <div>
                        <p className="text-gray-400 text-[13px] font-bold uppercase tracking-wider mb-1">Saved Jobs</p>
                        <h3 className="text-4xl font-black text-[#24385E]">{stats.savedJobs}</h3>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-[32px] border border-[#f0f0f0] shadow-sm hover:shadow-md transition-all duration-300">
                    <div className="flex justify-between items-start mb-8">
                        <div className="p-3 bg-[#fffbeb] rounded-2xl border border-[#fef3c7]"><Flame size={24} className="text-yellow-500 fill-yellow-500" /></div>
                        <span className="text-[12px] font-bold text-yellow-600">Premium</span>
                    </div>
                    <div>
                        <p className="text-gray-400 text-[13px] font-bold uppercase tracking-wider mb-1">Days Remaining</p>
                        <h3 className="text-4xl font-black text-[#24385E]">{stats.daysLeft}</h3>
                    </div>
                </div>
            </div>

            {/* Teaser: Featured Company */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* Company card */}
                <div className="bg-white p-8 rounded-[32px] border border-[#f0f0f0] shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-[18px] font-black text-[#24385E]">Featured Sponsor</h3>
                        <button
                            onClick={() => navigate('/pricing')}
                            className="text-[13px] font-bold text-[#FDB913] hover:underline flex items-center gap-1"
                        >
                            Unlock All <ChevronRight size={14} />
                        </button>
                    </div>

                    {/* Company banner */}
                    <div className="bg-gradient-to-br from-[#24385E] to-[#3a5a9c] rounded-2xl p-6 mb-5 text-white">
                        <div className="flex items-center gap-4 mb-4">
                            <div
                                className="w-14 h-14 rounded-2xl flex items-center justify-center font-black text-2xl text-white shadow-lg"
                                style={{ backgroundColor: TEASER_COMPANY.color }}
                            >
                                {TEASER_COMPANY.logo}
                            </div>
                            <div>
                                <h4 className="text-lg font-black">{TEASER_COMPANY.name}</h4>
                                <p className="text-white/70 text-sm font-medium">{TEASER_COMPANY.industry}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div>
                                <p className="text-white/60 text-[11px] font-bold uppercase tracking-wider">Sponsorships/yr</p>
                                <p className="text-white font-black text-lg">{TEASER_COMPANY.sponsorsPerYear}</p>
                            </div>
                            <div className="ml-auto flex items-center gap-1">
                                <Star size={14} className="text-[#FDB913] fill-[#FDB913]" />
                                <span className="text-white font-bold text-sm">{TEASER_COMPANY.rating}</span>
                            </div>
                        </div>
                    </div>

                    {/* 2 locked jobs */}
                    <div className="space-y-3">
                        <p className="text-[12px] font-bold uppercase tracking-wider text-gray-400 mb-3">
                            Open Positions · <span className="text-[#24385E]">Preview Only</span>
                        </p>
                        {TEASER_JOBS.map((job) => (
                            <TeaserJobCard key={job.id} job={job} onLock={setSelectedJob} />
                        ))}
                    </div>
                </div>

                {/* CTA panel */}
                <div className="bg-gradient-to-br from-[#FDB913]/10 to-[#FDB913]/5 p-8 rounded-[32px] border border-[#FDB913]/20 flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 bg-[#FDB913]/20 rounded-2xl flex items-center justify-center mb-6">
                        <Lock size={28} className="text-[#24385E]" />
                    </div>
                    <h3 className="text-[20px] font-black text-[#24385E] mb-3">Unlock More Jobs</h3>
                    <p className="text-gray-500 text-sm max-w-[240px] mb-8 font-medium">
                        Get full access to every H-1B sponsoring company and all open roles with salary & contact info.
                    </p>
                    <button
                        onClick={() => navigate('/pricing')}
                        className="px-8 py-3.5 bg-[#FDB913] hover:bg-[#e5a811] text-[#24385E] text-[14px] font-black rounded-2xl hover:shadow-lg transition-all active:scale-95"
                    >
                        Complete Payment →
                    </button>
                    <p className="text-xs text-gray-400 mt-3 font-medium">$30/month · Cancel anytime</p>
                </div>
            </div>

            {/* Payment gate modal */}
            {selectedJob && (
                <PaymentModal job={selectedJob} onClose={() => setSelectedJob(null)} />
            )}
        </div>
    );
};

export default UserOverview;
