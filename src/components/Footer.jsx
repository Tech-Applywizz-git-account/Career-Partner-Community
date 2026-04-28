import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Footer = () => {
    const navigate = useNavigate();

    return (
        <footer className="bg-[#24385E] border-t border-white/5">
            {/* CTA Banner */}
            <div className="bg-gray-900 py-16">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-4 leading-tight">
                        We built Career Partner for ourselves,<br className="hidden md:block" />
                        now we're sharing it with the world.
                    </h2>
                    <p className="text-gray-400 mb-8 text-lg">Get closer to landing your dream job today.</p>
                    <p className="text-gray-500 mb-8 text-sm">Find US jobs with visa sponsorship. Your path to working in America starts here.</p>
                    <button
                        onClick={() => navigate('/signup')}
                        className="w-full sm:w-auto inline-flex items-center justify-center bg-[#FDB913] text-black font-black px-8 py-4 rounded-xl hover:bg-[#e5a811] transition-all text-base shadow-lg"
                    >
                        Get Access →
                    </button>
                </div>
            </div>

            {/* Footer Links */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-10 md:gap-8">
                    {/* Brand */}
                    <div className="col-span-2 lg:col-span-2">
                        <div className="flex items-center gap-2 mb-6">
                            <img src="/cp-logo.png" alt="Career Partner" className="h-8 w-auto" />
                            <span className="font-bold text-xl text-white tracking-tight">Career Partner</span>
                        </div>
                        <p className="text-gray-400 text-sm leading-relaxed max-w-sm">
                            Access verified U.S. jobs with visa sponsorship. Find H-1B, Green Card, E-3, TN, CPT/OPT, H-1B1, and J-1 friendly roles.
                        </p>
                    </div>

                    {/* About Us */}
                    <div>
                        <h3 className="font-semibold text-white mb-4 text-sm">About Us</h3>
                        <ul className="space-y-2.5 text-sm">
                            <li><a href="#" className="text-gray-500 hover:text-white transition-colors">About Us</a></li>
                            <li><a href="#" className="text-gray-500 hover:text-white transition-colors">Is Career Partner Legit?</a></li>
                            <li><a href="#" className="text-gray-500 hover:text-white transition-colors">How to Use Career Partner</a></li>
                        </ul>
                    </div>

                    {/* Application & Career */}
                    <div>
                        <h3 className="font-semibold text-white mb-4 text-sm">Application & Career Strategy</h3>
                        <ul className="space-y-2.5 text-sm">
                            <li><a href="#" className="text-gray-500 hover:text-white transition-colors">Visa Jobs in New York City</a></li>
                            <li><a href="#" className="text-gray-500 hover:text-white transition-colors">H-1B Sponsorship Jobs 2026</a></li>
                            <li><a href="#" className="text-gray-500 hover:text-white transition-colors">E-3 Visa: Complete Guide</a></li>
                        </ul>
                    </div>

                    {/* Policy Updates */}
                    <div>
                        <h3 className="font-semibold text-white mb-4 text-sm">Policy Updates</h3>
                        <ul className="space-y-2.5 text-sm">
                            <li><a href="#" className="text-gray-500 hover:text-white transition-colors">Trump's $100K H-1B fee</a></li>
                            <li><a href="#" className="text-gray-500 hover:text-white transition-colors">H-1B Lottery 2026</a></li>
                            <li><a href="#" className="text-gray-500 hover:text-white transition-colors">Work Auth for Int'l Students</a></li>
                        </ul>
                    </div>
                </div>

                {/* Bottom */}
                <div className="border-t border-white/5 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex flex-wrap justify-center md:justify-start gap-6 text-[13px] font-medium">
                        <a href="#" className="text-gray-400 hover:text-white transition-colors">Contact Support</a>
                        <a href="#" className="text-gray-400 hover:text-white transition-colors">Privacy Policy</a>
                        <a href="#" className="text-gray-400 hover:text-white transition-colors">Careers</a>
                        <a href="#" className="text-gray-400 hover:text-white transition-colors">Blog</a>
                    </div>
                    <p className="text-gray-500 text-[13px]">© 2026 Career Partner. All Rights Reserved.</p>
                </div>

                {/* Legal Disclaimer */}
                <div className="mt-8 p-6 bg-white/5 rounded-2xl border border-white/5">
                    <p className="text-[11px] text-gray-500 leading-relaxed text-center md:text-left">
                        <strong className="text-gray-400">Legal Disclaimer:</strong> Career Partner is a technology platform that provides general immigration information and tools and is not a law firm. Nothing on this website constitutes legal advice or creates an attorney-client relationship. Any legal services are provided independently by licensed immigration attorneys, who are solely responsible for the advice they provide. Immigration outcomes depend on individual circumstances and government decisions and are not guaranteed. For advice specific to your situation, consult a qualified immigration attorney.
                    </p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
