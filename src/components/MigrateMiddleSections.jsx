import React, { useState } from 'react';
import { Plus, X, CheckCircle, ArrowRight, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getCompanyLogo } from '../utils/logoHelper';
import H1BBlogSection from './H1BBlogSection';

const MigrateMiddleSections = () => {
    return (
        <div className="space-y-24 md:space-y-32">
            {/* 4) SECTION: Helping you land your dream job */}
            <section className="py-12 md:py-20 animate-in fade-in duration-1000">
                <div className="max-w-2xl mx-auto px-6 text-center">
                    <div className="w-12 h-1 bg-yellow-500 mx-auto mb-6 rounded-full"></div>
                    <h2 className="text-2xl md:text-3xl font-black text-[#24385E] leading-[1.1] mb-4 tracking-tight">
                        Helping you land your dream job, no matter where you're from.
                    </h2>
                    <p className="text-base text-[#666666] font-medium leading-relaxed">
                        We've simplified the US visa sponsorship process, connecting global talent with employers who actually value international perspectives and skills.
                    </p>
                </div>

                {/* Scrolling Company Logos */}
                <div className="mt-12 overflow-hidden relative">
                    {/* Fade edges */}
                    <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-white to-transparent z-10"></div>
                    <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-white to-transparent z-10"></div>

                    <style>{`
                        @keyframes marquee {
                            0% { transform: translateX(0); }
                            100% { transform: translateX(-50%); }
                        }
                    `}</style>

                    <div
                        className="flex items-center gap-16 whitespace-nowrap"
                        style={{ animation: 'marquee 30s linear infinite', width: 'max-content' }}
                    >
                        {/* First set of logos */}
                        {[
                            { name: 'Apple', domain: 'apple.com' },
                            { name: 'Google', domain: 'google.com' },
                            { name: 'Amazon', domain: 'amazon.com' },
                            { name: 'Microsoft', domain: 'microsoft.com' },
                            { name: 'Meta', domain: 'meta.com' },
                            { name: 'Deloitte', domain: 'deloitte.com' },
                            { name: 'Goldman Sachs', domain: 'goldmansachs.com' },
                            { name: 'TikTok', domain: 'tiktok.com' },
                            { name: 'Tesla', domain: 'tesla.com' },
                            { name: 'Netflix', domain: 'netflix.com' },
                            { name: 'Uber', domain: 'uber.com' },
                            { name: 'Salesforce', domain: 'salesforce.com' },
                        ].map((company) => (
                            <div key={`a-${company.name}`} className="flex items-center gap-3 shrink-0">
                                <img
                                    src={getCompanyLogo(company.name)}
                                    alt={company.name}
                                    className="w-8 h-8 object-contain grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all"
                                    onError={(e) => { e.target.style.display = 'none'; }}
                                />
                                <span className="text-[15px] font-bold text-gray-400">{company.name}</span>
                            </div>
                        ))}
                        {/* Duplicate set for seamless loop */}
                        {[
                            { name: 'Apple', domain: 'apple.com' },
                            { name: 'Google', domain: 'google.com' },
                            { name: 'Amazon', domain: 'amazon.com' },
                            { name: 'Microsoft', domain: 'microsoft.com' },
                            { name: 'Meta', domain: 'meta.com' },
                            { name: 'Deloitte', domain: 'deloitte.com' },
                            { name: 'Goldman Sachs', domain: 'goldmansachs.com' },
                            { name: 'TikTok', domain: 'tiktok.com' },
                            { name: 'Tesla', domain: 'tesla.com' },
                            { name: 'Netflix', domain: 'netflix.com' },
                            { name: 'Uber', domain: 'uber.com' },
                            { name: 'Salesforce', domain: 'salesforce.com' },
                        ].map((company) => (
                            <div key={`b-${company.name}`} className="flex items-center gap-3 shrink-0">
                                <img
                                    src={getCompanyLogo(company.name)}
                                    alt={company.name}
                                    className="w-8 h-8 object-contain grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all"
                                    onError={(e) => { e.target.style.display = 'none'; }}
                                />
                                <span className="text-[15px] font-bold text-gray-400">{company.name}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>


            {/* 5) TRUST SECTION & HOW IT WORKS GRID */}
            <section className="py-12 md:py-20">
                <div className="max-w-6xl mx-auto px-6">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        {/* Visual Trust Card */}
                        <div className="bg-white rounded-[28px] p-8 text-center shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-gray-50 transform hover:scale-[1.02] transition-all">
                            <div className="flex justify-center -space-x-4 mb-8">
                                {[1, 2, 3, 4, 5, 6].map(i => (
                                    <div key={i} className="w-14 h-14 rounded-full border-[3px] border-white bg-gray-100 overflow-hidden shadow-md">
                                        <img src={`https://i.pravatar.cc/150?img=${i + 20}`} alt="User" />
                                    </div>
                                ))}
                                {/* <div className="w-14 h-14 rounded-full border-[3px] border-white bg-[#24385E] flex items-center justify-center text-white text-[10px] font-black shadow-md uppercase">
                                    +45k
                                </div> */}
                            </div>
                            {/* <h3 className="text-xl font-black text-[#24385E] mb-2">Trusted by 45,000+ happy jobseekers</h3> */}
                            <p className="text-gray-400 font-bold mb-8 max-w-sm mx-auto text-sm">Join the fastest growing community of international talent and US sponsors.</p>
                            <Link to="/signup" className="group w-full py-4 bg-[#24385E] hover:bg-[#1a2a47] text-white font-black text-base rounded-full shadow-2xl transition-all flex items-center justify-center gap-3">
                                Get Access <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </div>

                        {/* How it works steps */}
                        <div className="space-y-6">
                            <div className="mb-6 text-left">
                                <span className="text-[10px] font-black text-yellow-600 uppercase tracking-[0.2em]">The Process</span>
                                <h2 className="text-2xl font-black text-[#24385E] mt-1">See how it works.</h2>
                            </div>

                            <div className="space-y-4">
                                <AccordionItem
                                    number="1"
                                    title="Find the visa for you"
                                    content="Understand your eligibility for H1B, E3, TN, or Green Card sponsorship based on your background and profile."
                                />
                                <AccordionItem
                                    number="2"
                                    title="Filter by Sponsor History"
                                    content="Access our massive database of roles from companies historically verified for sponsorship."
                                    isOpenDefault={true}
                                />
                                <AccordionItem
                                    number="3"
                                    title="Apply with strategy"
                                    content="Narrow down by salary level (L1-L4), location, and specific visa types tailored to your degree."
                                />
                                <AccordionItem
                                    number="4"
                                    title="Connect with recruiters"
                                    content="Skip the ATS black holes with direct contact information and AI-driven match-making."
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* H-1B Blog Resource Section */}
            <H1BBlogSection />

            {/* 7) SIGN UP SECTION (NAVY BLOCK) */}
            <section className="py-12 md:py-20">
                <div className="max-w-6xl mx-auto px-6">
                    <div className="relative rounded-[32px] bg-[#24385E] overflow-hidden p-8 md:p-14 text-white shadow-2xl">
                        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white opacity-[0.05] rounded-full blur-[100px] -mr-64 -mt-64 text-white"></div>
                        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-yellow-400 opacity-[0.05] rounded-full blur-[100px] -ml-64 -mb-64"></div>

                        <div className="flex flex-col md:flex-row items-center justify-between gap-10 relative z-10">
                            <div className="max-w-xl">
                                <h2 className="text-3xl md:text-4xl font-black mb-6 leading-tight">Ready to find your career partner?</h2>
                                <p className="text-lg text-white/80 font-medium mb-0">Join thousands of job seekers finding verified visa sponsorship today.</p>
                            </div>
                            <Link to="/signup" className="px-10 py-5 bg-[#FDB913] hover:bg-[#e5a811] text-[#24385E] font-black text-lg rounded-full transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1">
                                Get Started Now
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

const AccordionItem = ({ number, title, content, isOpenDefault = false }) => {
    const [isOpen, setIsOpen] = useState(isOpenDefault);

    return (
        <div
            className={`border-2 rounded-[28px] transition-all duration-300 overflow-hidden cursor-pointer ${isOpen ? 'border-yellow-400 bg-white shadow-[0_15px_30px_rgba(234,179,8,0.08)]' : 'border-gray-100 bg-gray-50/50 hover:border-yellow-400/30 hover:bg-white'}`}
            onClick={() => setIsOpen(!isOpen)}
        >
            <div className="px-8 py-6 flex items-center justify-between">
                <div className="flex items-center gap-5">
                    <span className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-black transition-all ${isOpen ? 'bg-[#24385E] text-white scale-110 shadow-lg' : 'bg-white text-gray-400 border border-gray-100'}`}>
                        {number}
                    </span>
                    <h3 className={`text-lg font-black transition-colors ${isOpen ? 'text-[#24385E]' : 'text-gray-500'}`}>
                        {title}
                    </h3>
                </div>
                <div className={`transition-transform duration-500 ${isOpen ? 'rotate-180' : 'rotate-0'}`}>
                    {isOpen ? <X size={24} className="text-[#24385E]" /> : <Plus size={24} className="text-gray-300" />}
                </div>
            </div>

            <div className={`px-8 transition-all duration-500 ease-in-out ${isOpen ? 'max-h-[300px] pb-8 opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                <div className="pl-14">
                    <p className="text-base text-gray-500 font-bold leading-relaxed">
                        {content}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default MigrateMiddleSections;
