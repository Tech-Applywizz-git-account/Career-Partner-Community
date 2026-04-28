import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, BookOpen, Clock, ArrowRight } from 'lucide-react';
import { blogArticles } from '../data/blogArticles';

const PREVIEW_COUNT = 3;

const categoryColors = {
    'H-1B Visa': { bg: 'bg-[#24385E]/8', text: 'text-[#24385E]' },
    'Visa Process': { bg: 'bg-[#FDB913]/15', text: 'text-[#b87f00]' },
    'Students & Early Career': { bg: 'bg-emerald-50', text: 'text-emerald-700' },
    'Employers': { bg: 'bg-purple-50', text: 'text-purple-700' },
};

const H1BBlogSection = () => {
    const [showAll, setShowAll] = useState(false);
    const visible = showAll ? blogArticles : blogArticles.slice(0, PREVIEW_COUNT);

    return (
        <section className="py-16 md:py-24">
            <div className="max-w-6xl mx-auto px-6">

                {/* Section Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
                    <div>
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#FDB913]/10 rounded-full mb-4">
                            <BookOpen size={13} className="text-[#FDB913]" />
                            <span className="text-[11px] font-black text-[#FDB913] uppercase tracking-[0.18em]">H-1B Resource Hub</span>
                        </div>
                        <h2 className="text-3xl md:text-4xl font-black text-[#24385E] tracking-tight leading-tight">
                            H-1B Visa Guides & News
                        </h2>
                        <p className="text-gray-400 font-medium text-base mt-2 max-w-lg">
                            Insights, timelines, and practical guidance on the H-1B visa.
                        </p>
                    </div>
                    <Link
                        to="/blog"
                        className="inline-flex items-center gap-1 text-[#24385E] font-black text-xs hover:text-[#FDB913] transition-colors group shrink-0"
                    >
                        View all {blogArticles.length} articles
                        <ArrowRight size={11} className="group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                </div>

                {/* Article Cards Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {visible.map((article, i) => {
                        const colors = categoryColors[article.category] || { bg: 'bg-gray-100', text: 'text-gray-600' };
                        return (
                            <Link
                                key={article.slug}
                                to={`/blog/${article.slug}`}
                                className="group bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 overflow-hidden flex flex-col"
                            >
                                {/* Top accent bar */}
                                <div className="h-1 bg-gradient-to-r from-[#FDB913] via-[#f5c842] to-transparent" />

                                <div className="p-6 flex flex-col flex-1">
                                    {/* Category row */}
                                    <div className="flex items-center mb-4">
                                        <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#FDB913]/15 text-[#FDB913]">
                                            {article.category}
                                        </span>
                                    </div>

                                    {/* Title */}
                                    <h3 className="text-[#24385E] font-black text-[15px] leading-snug flex-1 group-hover:text-[#1a2a47] transition-colors mb-5">
                                        {article.title}
                                    </h3>

                                    {/* Footer */}
                                    <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                                        <div className="flex items-center gap-1.5 text-gray-400">
                                            <span className="w-1.5 h-1.5 rounded-full bg-[#FDB913]"></span>
                                            <span className="text-[11px] font-bold">{article.readTime}</span>
                                        </div>
                                        <span className="flex items-center gap-1 text-[12px] font-black text-[#FDB913] opacity-0 group-hover:opacity-100 transition-opacity">
                                            Read <ChevronRight size={12} />
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>

                {/* See More / Less toggle */}
                <div className="mt-8 text-center">
                    <button
                        onClick={() => setShowAll(!showAll)}
                        className="inline-flex items-center gap-2 px-8 py-3.5 border-2 border-[#24385E]/10 text-[#24385E] font-black text-sm rounded-full hover:border-[#FDB913] hover:bg-[#FDB913]/5 transition-all group"
                    >
                        {showAll ? 'Show fewer articles' : `See all ${blogArticles.length} articles`}
                        <ChevronRight
                            size={15}
                            className={`transition-transform group-hover:translate-x-0.5 ${showAll ? 'rotate-90' : ''}`}
                        />
                    </button>
                </div>
            </div>
        </section>
    );
};

export default H1BBlogSection;
