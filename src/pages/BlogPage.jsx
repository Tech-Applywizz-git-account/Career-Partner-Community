import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import MigrateNavbar from '../components/MigrateNavbar';
import { blogArticles } from '../data/blogArticles';
import { BookOpen, ChevronRight, Clock } from 'lucide-react';

const BlogPage = () => {
    const [activeCategory, setActiveCategory] = useState('All');

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'instant' });
    }, []);

    const categories = ['All', ...new Set(blogArticles.map(a => a.category))];

    const filtered = activeCategory === 'All'
        ? blogArticles
        : blogArticles.filter(a => a.category === activeCategory);

    return (
        <div>
            <MigrateNavbar />

            {/* Hero */}
            <div className="bg-[#24385E] text-white py-16 md:py-24 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-[#FDB913]/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-72 h-72 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
                <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#FDB913]/20 rounded-full mb-6">
                        <BookOpen size={14} className="text-[#FDB913]" />
                        <span className="text-[11px] font-black text-[#FDB913] uppercase tracking-[0.18em]">H-1B Resource Hub</span>
                    </div>
                    <h1 className="text-3xl md:text-5xl font-black mb-4 tracking-tight">H-1B Visa Guides</h1>
                    <p className="text-white/70 text-lg font-medium max-w-2xl mx-auto">
                        Insights, timelines, and practical guidance on the H-1B visa.
                    </p>
                </div>
            </div>

            {/* Category Filter Pills */}
            <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
                <div className="max-w-6xl mx-auto px-6 py-4 flex gap-3 overflow-x-auto scrollbar-hide">
                    {categories.map(cat => {
                        const count = cat === 'All' ? blogArticles.length : blogArticles.filter(a => a.category === cat).length;
                        const isActive = activeCategory === cat;
                        return (
                            <button
                                key={cat}
                                onClick={() => setActiveCategory(cat)}
                                className={`px-4 py-2 text-xs font-black rounded-full whitespace-nowrap transition-all ${isActive
                                        ? 'bg-[#24385E] text-white shadow-sm'
                                        : 'bg-gray-100 text-[#24385E] hover:bg-[#FDB913]/20 hover:text-[#24385E]'
                                    }`}
                            >
                                {cat} ({count})
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Articles Grid */}
            <div className="max-w-6xl mx-auto px-6 py-16">
                {/* Result count */}
                <p className="text-[12px] font-bold text-gray-400 mb-6 uppercase tracking-widest">
                    {filtered.length} article{filtered.length !== 1 ? 's' : ''}
                    {activeCategory !== 'All' && <span className="text-[#FDB913] ml-1">— {activeCategory}</span>}
                </p>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filtered.map((article) => (
                        <Link
                            key={article.slug}
                            to={`/blog/${article.slug}`}
                            className="group bg-white rounded-[24px] border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all overflow-hidden flex flex-col"
                        >
                            {/* Card top accent */}
                            <div className="h-1.5 bg-gradient-to-r from-[#FDB913] to-[#f5c842]" />

                            <div className="p-7 flex flex-col flex-1">
                                <div className="flex items-center gap-2 mb-4">
                                    <span className="px-2.5 py-1 bg-[#FDB913]/15 text-[#FDB913] text-[10px] font-black uppercase tracking-widest rounded-full">
                                        {article.category}
                                    </span>
                                    <span className="text-[10px] font-bold text-gray-300 ml-auto">{article.date}</span>
                                </div>

                                <h2 className="text-[#24385E] font-black text-[16px] leading-snug mb-3 group-hover:text-[#1a2a47] transition-colors flex-1">
                                    {article.title}
                                </h2>

                                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-50">
                                    <div className="flex items-center gap-1.5 text-gray-300">
                                        <Clock size={12} />
                                        <span className="text-[11px] font-bold">{article.readTime}</span>
                                    </div>
                                    <span className="flex items-center gap-1 text-[#FDB913] text-[12px] font-black group-hover:gap-2 transition-all">
                                        Read more <ChevronRight size={13} />
                                    </span>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default BlogPage;
