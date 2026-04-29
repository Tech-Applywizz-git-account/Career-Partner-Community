import React from 'react';
import { Star, Play, Instagram, Twitter, Linkedin, Facebook, LifeBuoy } from 'lucide-react';
import { Link } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

const MigrateFooterSections = () => {
    const { user } = useAuth();
    return (
        <div className="space-y-32">


            {/* 10) FOOTER */}
            <footer className="pt-24 border-t border-gray-100 pb-20 bg-white">
                <div className="max-w-6xl mx-auto px-6">
                    <div className="flex flex-col lg:flex-row justify-between items-start gap-12 mb-16">
                        <div className="flex-1">
                            <Link to="/" className="flex items-center gap-3 mb-8 group">
                                <div className="relative">
                                    <img 
                                        src="/cp-logo.png" 
                                        alt="Career Partner" 
                                        className="w-10 h-10 rounded-xl object-contain shadow-lg"
                                    />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-xl font-bold text-[#29FE29] tracking-tight leading-none">Career</span>
                                    <span className="text-xl font-bold text-[#29FE29] tracking-tight leading-none">Partner</span>
                                </div>
                            </Link>

                            <p className="text-gray-400 font-bold text-[18px] md:text-[19px] mb-10 leading-relaxed max-w-lg">
                                Find US jobs with verified visa sponsorship. The #1 platform for global talent discovery.
                            </p>

                            <div className="flex gap-4">
                                {[Instagram, Twitter, Linkedin, Facebook].map((Icon, i) => (
                                    <a key={i} href="#" className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-[#29FE29] hover:bg-white hover:border-gray-100 transition-all border border-transparent shadow-sm">
                                        <Icon size={20} strokeWidth={2.5} />
                                    </a>
                                ))}
                            </div>
                        </div>

                        <div className="shrink-0">
                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-4 text-center">Help & Support</h4>
                            <div className="bg-gray-50/30 border border-gray-100 rounded-[32px] p-2 shadow-sm max-w-[260px]">
                                <a 
                                    href="mailto:support@careerpartner.com" 
                                    style={{ background: '#29FE29', color: '#ffffff' }}
                                    className="flex items-center gap-3 px-6 py-4 rounded-full font-black text-sm hover:opacity-90 transition-all shadow-lg active:scale-95"
                                >
                                    <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center shrink-0">
                                        <span className="text-lg font-black text-white">?</span>
                                    </div>
                                    <span className="whitespace-nowrap" style={{ color: '#29FE29' }}>Contact Support</span>
                                </a>
                                <div className="py-4 text-center">
                                    <p className="text-[11px] font-black text-gray-500 mb-0.5">Need help?</p>
                                    <p className="text-[10px] font-bold text-gray-400">Our team is here for you.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-12 border-t border-gray-100">
                        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-[11px] font-black text-gray-300 uppercase tracking-[0.2em] text-center">
                            <span>© 2026 Career Partner. All rights reserved.</span>
                            <div className="w-1.5 h-1.5 bg-gray-200 rounded-full"></div>
                            <span className="hover:text-gray-400 transition-colors cursor-pointer">US Sponsorship Verified</span>
                            <div className="w-1.5 h-1.5 bg-gray-200 rounded-full"></div>
                            <span className="hover:text-gray-400 transition-colors cursor-pointer">SSL Secure Platform</span>
                        </div>
                    </div>
                </div>
            </footer>

        </div>
    );
};

const ReviewCard = ({ image, name, rating, text, date }) => (
    <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-50 text-left hover:shadow-2xl transition-all group">
        <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
                <img src={image} alt={name} className="w-14 h-14 rounded-full border-2 border-white shadow-md group-hover:scale-110 transition-transform" />
                <div>
                    <h4 className="font-black text-[#29FE29] text-base">{name}</h4>
                    <div className="flex gap-0.5">
                        {[...Array(rating)].map((_, i) => (
                            <Star key={i} size={14} className="fill-[#29FE29] text-[#29FE29]" />
                        ))}
                    </div>
                </div>
            </div>
            <span className="text-xs font-black text-gray-300 uppercase">{date}</span>
        </div>
        <p className="text-base text-gray-500 font-bold leading-relaxed italic">
            "{text}"
        </p>
    </div>
);

export default MigrateFooterSections;
