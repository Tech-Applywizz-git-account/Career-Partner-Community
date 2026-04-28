import React from 'react';

const SimpleHowItWorks = () => {
    return (
        <section id="how-it-works" className="py-24 bg-black">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12 md:mb-16">
                    <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4 uppercase tracking-tight">How it works</h2>
                    <div className="w-16 md:w-20 h-1 md:h-1.5 bg-[#FDB913] mx-auto rounded-full"></div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-12">
                    {/* Step 1 */}
                    <div className="text-center group">
                        <div className="w-20 h-20 bg-[#111] border border-white/5 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-sm group-hover:shadow-[0_0_30px_rgba(253,185,19,0.1)] transition-all duration-300 group-hover:-translate-y-2">
                            <svg className="w-10 h-10 text-[#FDB913]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-black text-white mb-4">Find open jobs that are perfect for you</h3>
                        <p className="text-gray-400 font-medium leading-relaxed">Search verified open roles filtered by your visa type, role, and location.</p>
                    </div>

                    {/* Step 2 */}
                    <div className="text-center group">
                        <div className="w-20 h-20 bg-[#111] border border-white/5 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-sm group-hover:shadow-[0_0_30px_rgba(253,185,19,0.1)] transition-all duration-300 group-hover:-translate-y-2">
                            <svg className="w-10 h-10 text-[#FDB913]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-black text-white mb-4">Contact the person at the company who deals with visas</h3>
                        <p className="text-gray-400 font-medium leading-relaxed">Get the verified email of the real person at each company who handles visa sponsorship.</p>
                    </div>

                    {/* Step 3 */}
                    <div className="text-center group">
                        <div className="w-20 h-20 bg-[#111] border border-white/5 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-sm group-hover:shadow-[0_0_30px_rgba(253,185,19,0.1)] transition-all duration-300 group-hover:-translate-y-2">
                            <svg className="w-10 h-10 text-[#FDB913]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-black text-white mb-4">Apply, interview, and land your dream job</h3>
                        <p className="text-gray-400 font-medium leading-relaxed">Apply directly, ace the interview, and secure your visa sponsorship offer.</p>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default SimpleHowItWorks;
