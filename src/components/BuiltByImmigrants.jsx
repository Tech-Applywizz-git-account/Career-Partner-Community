import React from 'react';
import { useNavigate } from 'react-router-dom';

const BuiltByImmigrants = () => {
    const navigate = useNavigate();

    return (
        <section className="py-8">
            <div className="max-w-7xl mx-auto px-4 md:px-8">
                <div className="bg-[#29FE29] rounded-[48px] py-16 md:py-24 px-6 md:px-12 relative overflow-hidden text-center shadow-2xl">
                    {/* Background Splice Effect */}
                    <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-10">
                        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-[#29FE29]/20 to-transparent"></div>
                        <div className="absolute bottom-[-100%] right-[-50%] w-[200%] h-[200%] border-[1px] border-white/5 rotate-45"></div>
                    </div>

                    <div className="relative z-10 max-w-4xl mx-auto px-6">
                        <div className="flex justify-center mb-12">
                            <div className="w-20 h-20 bg-[#29FE29] rounded-[24px] rotate-12 flex items-center justify-center shadow-[0_0_40px_rgba(253,185,19,0.4)]">
                                <div className="w-8 h-1 bg-white/40 rounded-full"></div>
                            </div>
                        </div>

                        <h2 className="text-3xl md:text-[48px] font-[900] text-white leading-[1.05] tracking-tight uppercase mb-6">
                            BUILT BY <span className="text-[#29FE29] font-[800]">IMMIGRANTS.</span><br className="hidden md:block" />
                            <span className="text-[#29FE29]">FOR THE WORLD.</span>
                        </h2>

                        <p className="text-gray-400 text-lg md:text-xl font-medium max-w-2xl mx-auto leading-relaxed mb-12">
                            We built Career Partner after experiencing the struggle ourselves. No more guessing. No more dead ends. Just verified paths to your future in the U.S.
                        </p>

                        <button
                            onClick={() => navigate('/signup')}
                            className="w-full sm:w-auto bg-[#29FE29] hover:bg-[#29FE29] text-[#29FE29] font-black px-8 md:px-12 py-4 md:py-5 rounded-2xl text-[16px] md:text-[18px] transition-all shadow-xl hover:-translate-y-1 active:scale-95"
                        >
                            Get Started Today
                        </button>

                        {/* <div className="mt-8">
                            <p className="text-gray-500 font-bold italic text-xs uppercase tracking-widest opacity-60">
                                Cancel anytime. No commitment. 100% Verified.
                            </p>
                        </div> */}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default BuiltByImmigrants;
