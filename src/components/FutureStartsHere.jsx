import React from 'react';
import { ArrowRight, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const features = [
    'Verified open roles',
    'H-1B, F-1 (OPT/CPT), TN, E-3, J-1 & Green Cards',
    'Constantly updated with new jobs',
    'Salary & company info for every role',
    'Verified email of a real company contact per role',
    'Cancel anytime'
];

const FutureStartsHere = () => {
    const navigate = useNavigate();

    return (
        <section className="py-16 md:py-24 bg-black">
            <div className="max-w-7xl mx-auto px-4">
                <div className="bg-[#0A0D14] rounded-[30px] md:rounded-[60px] p-8 md:p-24 relative overflow-hidden flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
                    {/* Subtle background glow */}
                    <div className="absolute top-0 right-0 w-[600px] h-full bg-blue-500/10 blur-[120px] -mr-64 pointer-events-none"></div>

                    {/* Left Content */}
                    <div className="lg:w-1/2 relative z-10 text-center lg:text-left">
                        <div className="inline-flex items-center gap-2 bg-[#1A1C23] border border-white/10 rounded-full px-5 py-2 mb-8">
                            <span className="text-[11px] font-black text-[#FDB913] uppercase tracking-widest italic">READY TO START? <span className="text-white/40 not-italic">us</span></span>
                        </div>

                        <h2 className="text-3xl md:text-7xl font-black text-white leading-[1] mb-8 uppercase">
                            YOUR FUTURE <span className="block text-[#FAFAFB]/60 italic">STARTS HERE.</span>
                        </h2>

                        <p className="text-gray-400 text-lg mb-12 max-w-md font-medium leading-relaxed">
                            Everything you need to secure a job and visa, all in one place.
                        </p>

                        <button
                            onClick={() => navigate('/signup')}
                            className="w-full sm:w-auto inline-flex items-center justify-center gap-3 bg-white text-gray-900 font-black px-8 md:px-10 py-4 md:py-5 rounded-2xl hover:bg-gray-100 transition-all text-base shadow-xl active:scale-95"
                        >
                            Get Instant Access <ArrowRight size={20} />
                        </button>
                    </div>

                    {/* Right Content: Features */}
                    <div className="lg:w-1/2 grid grid-cols-1 sm:grid-cols-2 gap-y-10 gap-x-12 relative z-10">
                        {features.map((feature, idx) => (
                            <div key={idx} className="flex gap-4 items-start group">
                                <div className="w-10 h-10 rounded-2xl bg-[#1A1C23] border border-white/10 flex items-center justify-center shrink-0 group-hover:bg-[#FDB913] transition-colors duration-300">
                                    <Check size={20} className="text-white" />
                                </div>
                                <p className="text-white font-bold text-[14px] leading-snug pt-1">
                                    {feature}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default FutureStartsHere;
