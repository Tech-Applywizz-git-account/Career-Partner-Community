import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import LogoBox from './LogoBox';

const jobExamples = [
    { title: 'Financial Systems Manager', company: 'Coca-Cola', contact: 'jularevalo@cocacola.com', name: 'Jula' },
    { title: 'Software Engineer', company: 'Google', contact: 'hiring@google.com', name: 'Sarah' },
    { title: 'Data Scientist', company: 'Microsoft', contact: 'talent@microsoft.com', name: 'James' },
];

const HeroSection = () => {
    const navigate = useNavigate();
    const [currentJob, setCurrentJob] = useState(0);
    const [step, setStep] = useState(0); // 0: job card, 1: contact, 2: success
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        const stepTimers = [
            setTimeout(() => setStep(1), 2000),
            setTimeout(() => setStep(2), 4000),
            setTimeout(() => {
                setIsVisible(false);
                setTimeout(() => {
                    setCurrentJob(prev => (prev + 1) % jobExamples.length);
                    setStep(0);
                    setIsVisible(true);
                }, 400);
            }, 6500),
        ];
        return () => stepTimers.forEach(clearTimeout);
    }, [currentJob]);

    const job = jobExamples[currentJob];

    return (
        <div className="bg-[#24385E]">
            {/* Hero */}
            <section className="relative overflow-hidden min-h-[90vh] flex items-center" style={{ background: '#24385E' }}>
                {/* Subtle grid pattern */}
                <div className="absolute inset-0 opacity-5" style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                }}></div>

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-28 w-full overflow-hidden">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        {/* Left: Text */}
                        <div>
                            {/* Badge */}
                            <div className="flex lg:inline-flex items-center justify-center lg:justify-start gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 mb-8 mx-auto lg:mx-0 w-fit">
                                <span className="text-[10px] md:text-sm text-white font-bold uppercase tracking-widest">Open Job & Visa Platform 🇺🇸</span>
                            </div>

                            <h1 className="text-center lg:text-left text-[28px] sm:text-4xl md:text-5xl lg:text-6xl font-black text-white leading-[1.15] mb-6">
                                Sick of guessing which companies sponsor visas?
                                <span className="block text-[#FAFAFB]/60 mt-3 italic">So are we.</span>
                            </h1>

                            <p className="text-center lg:text-left text-sm md:text-lg text-gray-400 mb-10 leading-relaxed max-w-xl mx-auto lg:mx-0 font-medium px-2 sm:px-0">
                                That's why we built Career Partner. Now you can easily search & find currently open jobs at companies who sponsor visas. We've done the work so you can skip the painful hours of doom scrolling and rejection emails.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-4 px-2 sm:px-0 max-w-md mx-auto lg:mx-0">
                                <button
                                    onClick={() => navigate('/signup')}
                                    className="w-full sm:w-auto inline-flex items-center justify-center bg-[#FDB913] text-black font-black px-8 py-4 rounded-2xl hover:bg-[#e5a811] transition-all text-base shadow-[0_10px_30px_rgba(253,185,19,0.3)] active:scale-95 px-10"
                                >
                                    Get Access Now
                                </button>
                                <button
                                    onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
                                    className="w-full sm:w-auto inline-flex items-center justify-center border border-white/20 text-white font-bold px-8 py-4 rounded-2xl hover:bg-white/5 transition-all text-base"
                                >
                                    How it works
                                </button>
                            </div>

                            {/* Stats */}
                            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8 lg:gap-12 mt-12 pt-10 border-t border-white/10">
                                <div className="text-center lg:text-left">
                                    <div className="text-xl md:text-3xl font-black text-white">500K+</div>
                                    <div className="text-[9px] md:text-[11px] text-gray-500 uppercase tracking-widest font-bold mt-1">Verified roles</div>
                                </div>
                                <div className="hidden lg:block w-px h-12 bg-white/10"></div>
                                <div className="text-center lg:text-left border-l border-white/5 lg:border-0 pl-4 lg:pl-0">
                                    <div className="text-xl md:text-3xl font-black text-white">6</div>
                                    <div className="text-[9px] md:text-[11px] text-gray-500 uppercase tracking-widest font-bold mt-1">Visa types</div>
                                </div>
                                <div className="hidden lg:block w-px h-12 bg-white/10"></div>
                                <div className="col-span-2 lg:col-span-1 border-t lg:border-t-0 border-white/10 pt-6 lg:pt-0 text-center lg:text-left">
                                    <div className="text-xl md:text-3xl font-black text-[#FDB913]">DAILY UPDATES</div>
                                    <div className="text-[9px] md:text-[11px] text-gray-500 uppercase tracking-widest font-bold mt-1">New job postings</div>
                                </div>
                            </div>
                        </div>

                        {/* Right: Animated Demo */}
                        <div className="hidden lg:flex items-center justify-center">
                            <div
                                className="w-full max-w-sm transition-all duration-300"
                                style={{ opacity: isVisible ? 1 : 0, transform: isVisible ? 'translateY(0)' : 'translateY(10px)' }}
                            >
                                {/* Step 1: Job Card */}
                                <div className={`bg-white rounded-2xl shadow-2xl p-5 mb-3 transition-all duration-500 ${step >= 0 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                                    <div className="flex items-start justify-between mb-3">
                                        <div>
                                            <div className="text-xs text-gray-400 font-medium mb-1">OPEN ROLE</div>
                                            <h3 className="font-bold text-gray-900 text-base">{job.title}</h3>
                                            <p className="text-sm text-gray-500">{job.company}</p>
                                        </div>
                                        <LogoBox name={job.company} size={40} fontSize={14} />
                                    </div>
                                    <div className="flex gap-2 flex-wrap">
                                        <span className="text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full font-medium">H-1B</span>
                                        <span className="text-xs bg-green-50 text-green-700 px-2.5 py-1 rounded-full font-medium">Green Card</span>
                                        <span className="text-xs bg-purple-50 text-purple-700 px-2.5 py-1 rounded-full font-medium">OPT</span>
                                    </div>
                                </div>

                                {/* Step 2: Contact */}
                                <div className={`bg-white rounded-2xl shadow-2xl p-5 mb-3 transition-all duration-500 ${step >= 1 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                                    <div className="text-xs text-gray-400 font-medium mb-2">VISA CONTACT</div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                                            {job.name[0]}
                                        </div>
                                        <div>
                                            <div className="font-semibold text-gray-900 text-sm">{job.name}</div>
                                            <div className="text-xs text-gray-500">{job.contact}</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Step 3: Success */}
                                <div className={`bg-green-50 border border-green-200 rounded-2xl shadow-xl p-5 transition-all duration-500 ${step >= 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                                    <div className="flex items-start gap-3">
                                        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                        <div>
                                            <div className="font-bold text-green-800 text-sm">You got the job!!</div>
                                            <div className="text-xs text-green-600 mt-0.5">We're also committing to sponsoring your H-1B Visa...</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Company Marquee */}
                    <div className="mt-12 md:mt-20">
                        <p className="text-center text-[11px] md:text-[13px] font-medium text-[#c49b5d]/60 uppercase tracking-[0.2em] md:tracking-[0.3em] mb-6 md:mb-10">
                            Top Companies Where Our Clients Landed Interviews
                        </p>
                        <div className="relative overflow-hidden bg-[#0a0a0a]/80 backdrop-blur-xl py-8 md:py-12 rounded-[30px] md:rounded-[50px] border border-white/5 shadow-[0_20px_80px_rgba(0,0,0,0.5)] mx-2 md:mx-4">
                            <div className="flex flex-col gap-6 md:gap-8">
                                {/* Row 1: Scrolling Left */}
                                <div className="flex animate-marquee whitespace-nowrap">
                                    {[
                                        'Walmart', 'ORACLE', 'UNITED', 'Goldman Sachs', 'TikTok',
                                        'Walmart', 'ORACLE', 'UNITED', 'Goldman Sachs', 'TikTok'
                                    ].map((company, i) => (
                                        <div key={`r1-${i}`} className="flex items-center justify-center mx-8 md:mx-14">
                                            <span className="text-xl md:text-3xl font-black text-white/40 tracking-tighter hover:text-white transition-opacity cursor-default">
                                                {company === 'Walmart' ? (
                                                    <span className="flex items-center gap-1">Walmart<span className="text-[#FDB913]">✻</span></span>
                                                ) : company === 'Goldman Sachs' ? (
                                                    <span className="text-lg leading-tight text-center block">Goldman<br /><span className="text-xs -mt-1 block">Sachs</span></span>
                                                ) : company}
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                {/* Row 2: Scrolling Right (or different offset) */}
                                <div className="flex animate-marquee-reverse whitespace-nowrap">
                                    {[
                                        'Uber', 'American Airlines', 'hp', 'DELL', 'Google', 'Apple', 'Deloitte',
                                        'Uber', 'American Airlines', 'hp', 'DELL', 'Google', 'Apple', 'Deloitte'
                                    ].map((company, i) => (
                                        <div key={`r2-${i}`} className="flex items-center justify-center mx-8 md:mx-14">
                                            <span className="text-xl md:text-3xl font-black text-white/40 tracking-tighter hover:text-white transition-opacity cursor-default">
                                                {company === 'hp' ? (
                                                    <span className="italic lowercase border-2 border-white/20 rounded-full w-10 h-10 flex items-center justify-center text-xl">hp</span>
                                                ) : company === 'Apple' ? (
                                                    <span className="text-3xl"></span>
                                                ) : company === 'Deloitte' ? (
                                                    <span>Deloitte<span className="text-[#FDB913]">.</span></span>
                                                ) : company}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Fading Edges */}
                            <div className="absolute inset-y-0 left-0 w-20 md:w-40 bg-gradient-to-r from-[#0a0a0a] to-transparent z-10 pointer-events-none"></div>
                            <div className="absolute inset-y-0 right-0 w-20 md:w-40 bg-gradient-to-l from-[#0a0a0a] to-transparent z-10 pointer-events-none"></div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default HeroSection;
