// import React, { useState, useEffect } from 'react';
// import MigrateNavbar from '../components/MigrateNavbar';
// import { Link } from 'react-router-dom';
// import useAuth from '../hooks/useAuth';
// import RazorpayButton from '../components/RazorpayButton';
// import { Check, ChevronDown, ChevronUp, Sparkles, Shield, Zap, Star, Instagram, Twitter, Linkedin, Facebook } from 'lucide-react';

// const Pricing = () => {
//     const { user, paymentStatus } = useAuth();
//     const [openFaq, setOpenFaq] = useState(null);

//     // Scroll to top when page loads
//     useEffect(() => {
//         window.scrollTo({ top: 0, behavior: 'instant' });
//     }, []);

//     const faqs = [
//         {
//             question: 'How does the subscription work?',
//             answer: `Wage Trail costs $39.99 for 6 months (limited-time offer for the first 1,000 users). You get immediate access to all verified jobs, direct company contact emails, and all premium features.`
//         },
//         {
//             question: 'Do you offer refunds?',
//             answer: 'No. All payments are final and non-refundable once processed. We recommend exploring the platform thoroughly before subscribing to ensure it meets your needs.'
//         },
//         {
//             question: 'What payment methods do you accept?',
//             answer: 'We accept all major credit cards (Visa, Mastercard, American Express, Discover) and debit cards. All payments are securely processed through Stripe.'
//         },
//         {
//             question: 'Will the price increase later?',
//             answer: `Your price is locked in at $39.99 for 6 months as long as you sign up during our first 1,000 users launch offer. Future pricing may adjust for new members, but existing members keep their launch rate.`
//         }
//     ];

//     return (
//         <div>
//             <MigrateNavbar />

//             <div className="min-h-screen bg-gradient-to-b from-[#f8f9fc] to-white">
//                 {/* Hero Section */}
//                 <div className="bg-[#24385E] text-white py-16 md:py-24 relative overflow-hidden">
//                     {/* Decorative elements */}
//                     <div className="absolute top-0 right-0 w-96 h-96 bg-[#FDB913]/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
//                     <div className="absolute bottom-0 left-0 w-72 h-72 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2"></div>

//                     <div className="max-w-4xl mx-auto px-6 md:px-8 text-center relative z-10">
//                         <div className="flex justify-center mb-5">
//                             <div className="w-14 h-14 bg-[#FDB913] rounded-2xl flex items-center justify-center shadow-lg">
//                                 <Sparkles className="text-[#24385E] w-7 h-7" />
//                             </div>
//                         </div>
//                         <h1 className="text-3xl md:text-5xl font-black mb-5 tracking-tight leading-tight">
//                             Wage Trail
//                         </h1>
//                         <p className="text-lg md:text-xl text-white/70 max-w-2xl mx-auto font-medium">
//                             Unlimited access to visa-sponsored jobs for just $39.99 for 6 months.
//                         </p>
//                     </div>
//                 </div>

//                 {/* Pricing Cards Grid */}
//                 <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-14 relative z-20">
//                     <div className="grid md:grid-cols-2 gap-8">
//                         {/* Card 1: Main Platform Access */}
//                         <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col">
//                             {/* Ribbon */}
//                             <div className="bg-[#24385E] text-white text-center py-3.5 font-black text-[10px] uppercase tracking-[0.2em]">
//                                 Verified Database Access
//                             </div>

//                             <div className="p-8 flex-1 flex flex-col">
//                                 <div className="text-center mb-8">
//                                     <h3 className="text-xl font-black text-[#24385E] mb-2 uppercase tracking-tight">Standard Search</h3>
//                                     <div className="flex justify-center items-end gap-1 mb-2">
//                                         <span className="text-4xl md:text-5xl font-black text-[#24385E]">$39.99</span>
//                                         <span className="text-gray-400 font-bold text-sm mb-2">/ 6 months</span>
//                                     </div>
//                                     <div className="inline-block px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-wider">
//                                         Save 50% Today
//                                     </div>
//                                 </div>

//                                 <ul className="space-y-4 mb-10 flex-1">
//                                     {[
//                                         'H-1B Verified Company Database',
//                                         '6-Months Unlimited Search',
//                                         'Daily Job Postings (New)',
//                                         'Recruiter & Sponsor Emails',
//                                         'L1 - L4 Wage Level Data',
//                                         'Advanced Technical Filters'
//                                     ].map((f, i) => (
//                                         <li key={i} className="flex items-center gap-3">
//                                             <Check className="w-4 h-4 text-emerald-500" strokeWidth={4} />
//                                             <span className="text-[#24385E] font-semibold text-sm">{f}</span>
//                                         </li>
//                                     ))}
//                                 </ul>

//                                 {user ? (
//                                     paymentStatus === 'paid' ? (
//                                         <Link to="/app" className="block w-full text-center text-sm font-black py-4 bg-emerald-500 text-white rounded-xl shadow-lg transition-all hover:bg-emerald-600 underline">Go to Dashboard →</Link>
//                                     ) : (
//                                         <RazorpayButton amount={import.meta.env.VITE_PAYMENT_AMOUNT || '39.99'} />
//                                     )
//                                 ) : (
//                                     <Link to="/signup" className="block w-full text-center text-sm font-black py-4 bg-[#24385E] text-white rounded-xl shadow-lg transition-all hover:bg-[#1a2a47]">Get Access Now →</Link>
//                                 )}
//                             </div>
//                         </div>

//                         {/* Card 2: Expert Guidance (Highlighted) */}
//                         <div className="bg-[#24385E] rounded-3xl shadow-2xl border-4 border-[#FDB913] overflow-hidden flex flex-col transform md:scale-105 relative z-30">
//                             {/* Ribbon */}
//                             <div className="bg-[#FDB913] text-[#24385E] text-center py-3.5 font-black text-[10px] uppercase tracking-[0.2em] animate-pulse">
//                                 ★ Recommended for Job Seekers ★
//                             </div>

//                             <div className="p-8 flex-1 flex flex-col">
//                                 <div className="text-center mb-8">
//                                     <h3 className="text-xl font-black text-white mb-2 uppercase tracking-tight">Expert Guidance</h3>
//                                     <div className="flex justify-center items-end gap-1 mb-2">
//                                         <span className="text-4xl md:text-5xl font-black text-[#FDB913]">$34.99</span>
//                                         <span className="text-white/60 font-bold text-sm mb-2">/ session</span>
//                                     </div>
//                                     <div className="inline-block px-3 py-1 bg-[#FDB913]/20 text-[#FDB913] rounded-full text-[10px] font-black uppercase tracking-wider">
//                                         Personal Mentorship
//                                     </div>
//                                 </div>

//                                 <ul className="space-y-4 mb-10 flex-1">
//                                     {[
//                                         '1-on-1 Consultation Session',
//                                         'Resume & Profile Review',
//                                         'Mock H-1B Legal Interviews',
//                                         'Job Search Strategy Plan',
//                                         'Technical Skills Roadmap',
//                                         'Priority Response Support'
//                                     ].map((f, i) => (
//                                         <li key={i} className="flex items-center gap-3">
//                                             <Sparkles className="w-4 h-4 text-[#FDB913]" strokeWidth={3} />
//                                             <span className="text-white/90 font-semibold text-sm">{f}</span>
//                                         </li>
//                                     ))}
//                                 </ul>

//                                 <a 
//                                     href="https://consulting.wagetrail.com/"
//                                     target="_blank"
//                                     rel="noopener noreferrer"
//                                     className="block w-full text-center text-sm font-black py-4 bg-[#FDB913] text-[#24385E] rounded-xl shadow-[0_0_20px_rgba(253,185,19,0.3)] transition-all hover:bg-yellow-400 transform hover:scale-[1.02] active:scale-[0.98]"
//                                 >
//                                     Book Your Session →
//                                 </a>
//                                 <p className="text-center text-[10px] text-white/40 font-bold mt-4 uppercase">Limited Slots Available Weekly</p>
//                             </div>
//                         </div>
//                     </div>

//                     {/* Trust Badges */}
//                     <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 md:gap-8 mt-14 mb-20 md:mb-24">
//                         {[
//                             { icon: Star, value: 'All', label: 'Verified Jobs' },
//                             { icon: Shield, value: '30,000+', label: 'Active Users' },
//                             { icon: Zap, value: '8', label: 'Visa Types' }
//                         ].map((badge, i) => (
//                             <div key={i} className="text-center p-7 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow group">
//                                 <div className="w-10 h-10 bg-[#FDB913]/15 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:bg-[#FDB913]/25 transition-colors">
//                                     <badge.icon size={20} className="text-[#24385E]" />
//                                 </div>
//                                 <div className="text-3xl md:text-4xl font-black text-[#24385E] mb-1">{badge.value}</div>
//                                 <div className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">{badge.label}</div>
//                             </div>
//                         ))}
//                     </div>

//                     {/* FAQ Section */}
//                     <div className="mb-20">
//                         <h2 className="text-3xl font-black text-[#24385E] text-center mb-10 tracking-tight">
//                             Frequently Asked Questions
//                         </h2>
//                         <div className="space-y-4 max-w-3xl mx-auto">
//                             {faqs.map((faq, index) => (
//                                 <div key={index} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
//                                     <button
//                                         onClick={() => setOpenFaq(openFaq === index ? null : index)}
//                                         className="w-full flex justify-between items-center text-left p-6"
//                                     >
//                                         <h3 className="text-lg font-bold text-[#24385E] pr-8">
//                                             {faq.question}
//                                         </h3>
//                                         <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors ${openFaq === index ? 'bg-[#FDB913] text-[#24385E]' : 'bg-gray-100 text-gray-400'}`}>
//                                             {openFaq === index ? (
//                                                 <ChevronUp size={18} strokeWidth={3} />
//                                             ) : (
//                                                 <ChevronDown size={18} strokeWidth={3} />
//                                             )}
//                                         </div>
//                                     </button>
//                                     <div className={`overflow-hidden transition-all duration-300 ${openFaq === index ? 'max-h-96' : 'max-h-0'}`}>
//                                         <p className="px-6 pb-6 text-gray-500 font-medium leading-relaxed border-t border-gray-50 pt-4">
//                                             {faq.answer}
//                                         </p>
//                                     </div>
//                                 </div>
//                             ))}
//                         </div>
//                     </div>
//                 </div>
//             </div>

//             {/* Branded Footer — matches landing page */}
//             <footer className="pt-24 border-t border-gray-100 pb-20">
//                 <div className="max-w-6xl mx-auto px-6">
//                     <div className="grid lg:grid-cols-12 gap-10 mb-14">
//                         <div className="lg:col-span-5">
//                             <Link to="/" className="flex items-center gap-2 mb-6 group">
//                                 <div className="relative">
//                                     <div className="w-10 h-10 bg-[#24385E] rounded-xl flex items-center justify-center transform rotate-12 transition-transform group-hover:rotate-0 shadow-lg">
//                                         <span className="text-white font-black text-xs tracking-tighter">H1-B</span>
//                                     </div>
//                                     <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full border-2 border-white"></div>
//                                 </div>
//                                 <div className="flex flex-col">
//                                     <span className="text-xl font-bold text-[#24385E] tracking-tight leading-none">Wage</span>
//                                     <span className="text-xl font-bold text-yellow-500 tracking-tight leading-none">Trail</span>
//                                 </div>
//                             </Link>
//                             <p className="text-gray-400 font-bold text-lg mb-8 max-w-sm leading-relaxed">
//                                 Find US jobs with verified visa sponsorship. The #1 platform for global talent discovery.
//                             </p>
//                             <div className="flex gap-4">
//                                 {[Instagram, Twitter, Linkedin, Facebook].map((Icon, i) => (
//                                     <a key={i} href="#" className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center text-[#24385E] hover:bg-[#FDB913] hover:text-[#24385E] transition-all shadow-sm">
//                                         <Icon size={20} />
//                                     </a>
//                                 ))}
//                             </div>
//                         </div>

//                         <div className="lg:col-span-7 grid grid-cols-2 md:grid-cols-3 gap-10">
//                             <div className="space-y-6">
//                                 <h4 className="text-xs font-black uppercase tracking-[0.2em] text-[#24385E]">Platform</h4>
//                                 <ul className="space-y-4">
//                                     {['Job Search', 'How it works', 'Pricing', 'Visa Guides'].map(link => (
//                                         <li key={link}><Link to="#" className="text-base font-bold text-gray-500 hover:text-[#FDB913] transition-colors">{link}</Link></li>
//                                     ))}
//                                 </ul>
//                             </div>
//                             <div className="space-y-6">
//                                 <h4 className="text-xs font-black uppercase tracking-[0.2em] text-[#24385E]">Company</h4>
//                                 <ul className="space-y-4">
//                                     {['About Us', 'Contact', 'Blog', 'Twitter'].map(link => (
//                                         <li key={link}><Link to="#" className="text-base font-bold text-gray-500 hover:text-[#FDB913] transition-colors">{link}</Link></li>
//                                     ))}
//                                 </ul>
//                             </div>
//                             <div className="space-y-6">
//                                 <h4 className="text-xs font-black uppercase tracking-[0.2em] text-[#24385E]">Support</h4>
//                                 <ul className="space-y-4">
//                                     {['Privacy Policy', 'Terms of Service', 'Cookie Policy'].map(link => (
//                                         <li key={link}><Link to="#" className="text-base font-bold text-gray-500 hover:text-[#FDB913] transition-colors">{link}</Link></li>
//                                     ))}
//                                 </ul>
//                             </div>
//                         </div>
//                     </div>

//                     <div className="pt-12 border-t border-gray-100 flex flex-col md:flex-row items-center justify-between gap-6">
//                         <p className="text-xs font-black text-gray-300 uppercase tracking-widest">
//                             © 2026 H1-B Wage Trail. All rights reserved.
//                         </p>
//                         <div className="flex gap-8">
//                             <span className="text-xs font-black text-gray-300 uppercase tracking-widest cursor-pointer hover:text-gray-400 transition-colors">US SPONSORSHIP VERIFIED</span>
//                             <span className="text-xs font-black text-gray-300 uppercase tracking-widest cursor-pointer hover:text-gray-400 transition-colors">SSL SECURE PLATFORM</span>
//                         </div>
//                     </div>
//                 </div>
//             </footer>
//         </div>
//     );
// };

// export default Pricing;



import React, { useState, useEffect } from 'react';
import MigrateNavbar from '../components/MigrateNavbar';
import { Link } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import RazorpayButton from '../components/RazorpayButton';
import { Check, ChevronDown, ChevronUp, Sparkles, Shield, Zap, Star, Instagram, Twitter, Linkedin, Facebook } from 'lucide-react';

const Pricing = () => {
    const { user, paymentStatus } = useAuth();
    const [openFaq, setOpenFaq] = useState(null);

    // Scroll to top when page loads
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'instant' });
    }, []);

    const faqs = [
        {
            question: 'How does the subscription work?',
            answer: `Wage Trail costs $39.99 for 6 months (limited-time offer for the first 1,000 users). You get immediate access to all verified jobs, direct company contact emails, and all premium features.`
        },
        {
            question: 'Do you offer refunds?',
            answer: 'No. All payments are final and non-refundable once processed. We recommend exploring the platform thoroughly before subscribing to ensure it meets your needs.'
        },
        {
            question: 'What payment methods do you accept?',
            answer: 'We accept all major credit cards (Visa, Mastercard, American Express, Discover) and debit cards. All payments are securely processed through Stripe.'
        },
        {
            question: 'Will the price increase later?',
            answer: `Your price is locked in at $39.99 for 6 months as long as you sign up during our first 1,000 users launch offer. Future pricing may adjust for new members, but existing members keep their launch rate.`
        }
    ];

    return (
        <div className="pricing-page overflow-x-hidden">
            <style>{`
                .pricing-card {
                    background: #ffffff;
                    border-radius: 32px;
                    box-shadow: 0 20px 60px rgba(0,0,0,0.12);
                    border: 1px solid #f0f0f5;
                    max-width: 640px;
                    margin: 0 auto;
                    overflow: hidden;
                }
                .price-pill {
                    background: linear-gradient(#1e3060, #1e3060) padding-box, linear-gradient(135deg, #FDB913 0%, #f5c842 35%, #f7dfa0 60%, #ffffff 85%) border-box;
                    border-radius: 60px;
                    padding: 16px 40px;
                    border: 6px solid transparent;
                    box-shadow: 0 12px 30px rgba(30,48,96,0.3);
                    display: inline-block;
                }
                .price-text {
                    font-size: 44px;
                    font-weight: 900;
                    color: #ffffff;
                    letter-spacing: -1px;
                    font-family: 'Inter', system-ui, sans-serif;
                }
                .features-grid {
                    display: grid;
                    grid-template-columns: 1fr 1px 1fr;
                    gap: 0 32px;
                    text-align: left;
                    max-width: 600px;
                    margin: 0 auto 36px;
                    padding-top: 8px;
                }
                @media (max-width: 768px) {
                    .pricing-card { border-radius: 24px; margin: 0 12px; }
                    .price-pill { padding: 12px 20px; border-width: 4px; }
                    .price-text { font-size: 24px; }
                    .features-grid { grid-template-columns: 1fr; gap: 16px; }
                    .features-divider { display: none; }
                    .pricing-header-padding { padding: 24px 20px !important; }
                }
            `}</style>
            <MigrateNavbar />

            <div className="min-h-screen bg-gradient-to-b from-[#f8f9fc] to-white overflow-x-hidden">
                {/* Hero Section */}
                <div className="bg-[#24385E] text-white py-16 md:py-24 relative overflow-hidden">
                    {/* Decorative elements */}
                    <div className="absolute top-0 right-0 w-96 h-96 bg-[#FDB913]/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                    <div className="absolute bottom-0 left-0 w-72 h-72 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2"></div>

                    <div className="max-w-4xl mx-auto px-6 md:px-8 text-center relative z-10">
                        <div className="flex justify-center mb-5">
                            <div className="w-14 h-14 bg-[#FDB913] rounded-2xl flex items-center justify-center shadow-lg">
                                <Sparkles className="text-[#24385E] w-7 h-7" />
                            </div>
                        </div>
                        <h1 className="text-3xl md:text-5xl font-black mb-5 tracking-tight leading-tight">
                            Wage Trail
                        </h1>
                        <p className="text-lg md:text-xl text-white/70 max-w-2xl mx-auto font-medium">
                            Unlimited access to visa-sponsored jobs for just $39.99 for 6 months.
                        </p>
                    </div>
                </div>

                {/* Pricing Card */}
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20 pricing-card-container">
                    <style>{`
                        .pricing-card-container {
                            margin-top: -80px;
                        }
                        @media (max-width: 768px) {
                            .pricing-card-container {
                                margin-top: -40px;
                            }
                        }
                    `}</style>
                    <div className="pricing-card">
                        {/* Top Header Banner */}
                        <div style={{
                            background: '#FDB913',
                            color: '#1e3060',
                            textAlign: 'center',
                            padding: '14px 24px',
                            fontWeight: 900,
                            fontSize: '11px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.15em',
                        }}>
                            ★ MOST POPULAR PLAN · LIMITED TIME OFFER ★
                        </div>

                        <div className="pricing-header-padding" style={{ padding: '32px 36px', textAlign: 'center' }}>
                            {/* Strikethrough Price */}
                            <div style={{ marginBottom: '12px' }}>
                                <span style={{
                                    fontSize: '24px',
                                    fontWeight: 800,
                                    color: '#1e3060',
                                    textDecoration: 'line-through',
                                    textDecorationColor: '#1e3060',
                                    textDecorationThickness: '2px',
                                    opacity: 0.7,
                                    letterSpacing: '-0.5px'
                                }}>
                                    $80/6 months
                                </span>
                            </div>

                            {/* Main Price Pill */}
                            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
                                <div className="price-pill">
                                    <span className="price-text">
                                        $39.99 / 6 months
                                    </span>
                                </div>
                            </div>

                            {/* Discount Badge */}
                            <div style={{ marginBottom: '36px' }}>
                                <span style={{
                                    display: 'inline-block',
                                    background: '#FEF3C7',
                                    border: '1px solid #FDE68A',
                                    borderRadius: '50px',
                                    padding: '8px 24px',
                                    fontSize: '14px',
                                    fontWeight: 700,
                                    color: '#1e3060',
                                    letterSpacing: '-0.2px'
                                }}>
                                    50% Launch Discount – Limited to First 1,000 Users
                                </span>
                            </div>

                            {/* Features Section - 2 columns with divider */}
                            <div className="features-grid">
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                    {['Verified open roles', 'Daily job updates', 'Advanced search & filters', 'Email job alerts'].map((f, i) => (
                                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <Check style={{ width: '18px', height: '18px', color: '#1e3060', flexShrink: 0 }} strokeWidth={3} />
                                            <span style={{ fontSize: '15px', fontWeight: 600, color: '#1e3060' }}>{f}</span>
                                        </div>
                                    ))}
                                </div>
                                {/* Vertical divider */}
                                <div className="features-divider" style={{ background: '#e5e7eb', width: '1px' }}></div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                    {['All visa types (H-1B, TN, etc.)', 'Full salary information', 'Save unlimited jobs'].map((f, i) => (
                                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <Check style={{ width: '18px', height: '18px', color: '#1e3060', flexShrink: 0 }} strokeWidth={3} />
                                            <span style={{ fontSize: '15px', fontWeight: 600, color: '#1e3060' }}>{f}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* CTA Button */}
                            <div style={{ maxWidth: '480px', margin: '0 auto' }}>
                                {user ? (
                                    paymentStatus === 'paid' ? (
                                        <Link to="/app" style={{
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            width: '100%', height: '64px',
                                            background: '#10b981', color: '#fff',
                                            borderRadius: '16px', fontWeight: 900, fontSize: '20px',
                                            textDecoration: 'none', boxShadow: '0 8px 20px rgba(16,185,129,0.3)'
                                        }}>
                                            Go to Dashboard →
                                        </Link>
                                    ) : (
                                        <RazorpayButton amount={import.meta.env.VITE_PAYMENT_AMOUNT || '39.99'} />
                                    )
                                ) : (
                                    <Link to="/signup" style={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        width: '100%', height: '64px',
                                        background: '#FDB913',
                                        borderBottom: '5px solid #c8920e',
                                        borderRadius: '50px',
                                        color: '#1e3060',
                                        fontWeight: 900,
                                        fontSize: '22px',
                                        textDecoration: 'none',
                                        boxShadow: '0 8px 24px rgba(253,185,19,0.4)',
                                        letterSpacing: '-0.3px'
                                    }}>
                                        Get Access Now →
                                    </Link>
                                )}
                            </div>

                            {/* Footer Text */}
                            <p style={{ marginTop: '20px', fontSize: '14px', color: '#9ca3af', fontWeight: 500 }}>
                                Join 30,000+ members finding their dream jobs
                            </p>
                        </div>
                    </div>

                    {/* Trust Badges */}

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 md:gap-8 mt-14 mb-20 md:mb-24">
                        {[
                            { icon: Star, value: 'All', label: 'Verified Jobs' },
                            { icon: Shield, value: '30,000+', label: 'Active Users' },
                            { icon: Zap, value: '8', label: 'Visa Types' }
                        ].map((badge, i) => (
                            <div key={i} className="text-center p-7 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow group">
                                <div className="w-10 h-10 bg-[#FDB913]/15 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:bg-[#FDB913]/25 transition-colors">
                                    <badge.icon size={20} className="text-[#24385E]" />
                                </div>
                                <div className="text-3xl md:text-4xl font-black text-[#24385E] mb-1">{badge.value}</div>
                                <div className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">{badge.label}</div>
                            </div>
                        ))}
                    </div>

                    {/* FAQ Section */}
                    <div className="mb-20">
                        <h2 className="text-3xl font-black text-[#24385E] text-center mb-10 tracking-tight">
                            Frequently Asked Questions
                        </h2>
                        <div className="space-y-4 max-w-3xl mx-auto">
                            {faqs.map((faq, index) => (
                                <div key={index} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                                    <button
                                        onClick={() => setOpenFaq(openFaq === index ? null : index)}
                                        className="w-full flex justify-between items-center text-left p-6"
                                    >
                                        <h3 className="text-lg font-bold text-[#24385E] pr-8">
                                            {faq.question}
                                        </h3>
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors ${openFaq === index ? 'bg-[#FDB913] text-[#24385E]' : 'bg-gray-100 text-gray-400'}`}>
                                            {openFaq === index ? (
                                                <ChevronUp size={18} strokeWidth={3} />
                                            ) : (
                                                <ChevronDown size={18} strokeWidth={3} />
                                            )}
                                        </div>
                                    </button>
                                    <div className={`overflow-hidden transition-all duration-300 ${openFaq === index ? 'max-h-96' : 'max-h-0'}`}>
                                        <p className="px-6 pb-6 text-gray-500 font-medium leading-relaxed border-t border-gray-50 pt-4">
                                            {faq.answer}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer — matches MigrateFooterSections exactly */}
            <footer className="pt-24 border-t border-gray-100 pb-20 bg-white">
                <div className="max-w-6xl mx-auto px-6">
                    <div className="flex flex-col lg:flex-row justify-between items-start gap-12 mb-16">
                        <div className="flex-1">
                            <Link to="/" className="flex items-center gap-2 mb-8 group">
                                <div className="relative">
                                    <div className="w-10 h-10 bg-[#24385E] rounded-xl flex items-center justify-center transform rotate-12 transition-transform group-hover:rotate-0 shadow-lg">
                                        <span className="text-white font-black text-xs tracking-tighter">H1-B</span>
                                    </div>
                                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full border-2 border-white"></div>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-xl font-bold text-[#24385E] tracking-tight leading-none">Wage</span>
                                    <span className="text-xl font-bold text-yellow-500 tracking-tight leading-none">Trail</span>
                                </div>
                            </Link>

                            <p className="text-gray-400 font-bold text-[18px] md:text-[19px] mb-10 leading-relaxed max-w-lg">
                                Find US jobs with verified visa sponsorship. The #1 platform for global talent discovery.
                            </p>

                            <div className="flex gap-4">
                                {[Instagram, Twitter, Linkedin, Facebook].map((Icon, i) => (
                                    <a key={i} href="#" className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-[#24385E] hover:bg-white hover:border-gray-100 transition-all border border-transparent shadow-sm">
                                        <Icon size={20} strokeWidth={2.5} />
                                    </a>
                                ))}
                            </div>
                        </div>

                        <div className="shrink-0">
                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-4 text-center">Help & Support</h4>
                            <div className="bg-gray-50/30 border border-gray-100 rounded-[32px] p-2 shadow-sm max-w-[260px]">
                                <a
                                    href="mailto:manasa@wagetrail.com"
                                    style={{ background: '#24385E', color: '#ffffff' }}
                                    className="flex items-center gap-3 px-6 py-4 rounded-full font-black text-sm hover:opacity-90 transition-all shadow-lg active:scale-95"
                                >
                                    <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center shrink-0">
                                        <span className="text-lg font-black text-white">?</span>
                                    </div>
                                    <span className="whitespace-nowrap" style={{ color: '#FDB913' }}>Contact Support</span>
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
                            <span>© 2026 Wage Trail. All rights reserved.</span>
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

export default Pricing;