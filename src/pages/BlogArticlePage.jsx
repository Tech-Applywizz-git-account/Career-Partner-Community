import React, { useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import MigrateNavbar from '../components/MigrateNavbar';
import { blogArticles } from '../data/blogArticles';
import { ArrowLeft, Clock, Tag, ChevronRight } from 'lucide-react';

const BlogArticlePage = () => {
    const { slug } = useParams();
    const navigate = useNavigate();
    const article = blogArticles.find(a => a.slug === slug);

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'instant' });
    }, [slug]);

    if (!article) {
        return (
            <div>
                <MigrateNavbar />
                <div className="max-w-2xl mx-auto px-6 py-32 text-center">
                    <h1 className="text-2xl font-black text-[#24385E] mb-4">Article not found</h1>
                    <Link to="/blog" className="text-[#FDB913] font-black hover:underline">← Back to all articles</Link>
                </div>
            </div>
        );
    }

    // Parse markdown-ish content into React
    const renderContent = (content) => {
        const lines = content.trim().split('\n');
        const elements = [];
        let i = 0;

        while (i < lines.length) {
            const line = lines[i].trim();

            if (!line) { i++; continue; }

            if (line.startsWith('## ')) {
                elements.push(<h2 key={i} className="text-2xl md:text-3xl font-black text-[#24385E] mt-10 mb-4 tracking-tight">{line.slice(3)}</h2>);
            } else if (line.startsWith('### ')) {
                elements.push(<h3 key={i} className="text-lg font-black text-[#24385E] mt-7 mb-3">{line.slice(4)}</h3>);
            } else if (line.startsWith('**') && line.endsWith('**') && !line.includes('|')) {
                elements.push(<p key={i} className="font-black text-[#24385E] mt-4 mb-1">{line.slice(2, -2)}</p>);
            } else if (line.startsWith('| ')) {
                // Table
                const tableLines = [];
                while (i < lines.length && lines[i].trim().startsWith('|')) {
                    tableLines.push(lines[i].trim());
                    i++;
                }
                const [header, separator, ...rows] = tableLines;
                const headers = header.split('|').filter(Boolean).map(h => h.trim());
                elements.push(
                    <div key={`table-${i}`} className="overflow-x-auto my-6 rounded-2xl border border-gray-100 shadow-sm">
                        <table className="min-w-full">
                            <thead>
                                <tr className="bg-[#24385E] text-white">
                                    {headers.map((h, hi) => (
                                        <th key={hi} className="px-5 py-3 text-left text-[12px] font-black uppercase tracking-widest">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((row, ri) => {
                                    const cells = row.split('|').filter(Boolean).map(c => c.trim());
                                    return (
                                        <tr key={ri} className={ri % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                                            {cells.map((cell, ci) => (
                                                <td key={ci} className="px-5 py-3 text-sm text-gray-600 font-medium border-t border-gray-50">{cell}</td>
                                            ))}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                );
                continue;
            } else if (line.match(/^\d+\.\s\*\*/)) {
                // Numbered bold item
                const text = line.replace(/^\d+\.\s\*\*/, '').replace(/\*\*/, '');
                const [bold, rest] = text.split('**');
                elements.push(
                    <div key={i} className="flex gap-3 items-start my-2">
                        <span className="w-6 h-6 shrink-0 rounded-full bg-[#FDB913]/20 flex items-center justify-center text-[11px] font-black text-[#24385E] mt-0.5">{line.match(/^\d+/)[0]}</span>
                        <p className="text-gray-600 font-medium text-[15px] leading-relaxed"><strong className="text-[#24385E] font-black">{bold}</strong>{rest}</p>
                    </div>
                );
            } else if (line.startsWith('- **')) {
                const text = line.slice(2);
                const parts = text.replace(/\*\*/g, '|||').split('|||');
                elements.push(
                    <div key={i} className="flex gap-3 items-start my-2">
                        <span className="w-2 h-2 shrink-0 rounded-full bg-[#FDB913] mt-2" />
                        <p className="text-gray-600 font-medium text-[15px] leading-relaxed">
                            {parts.map((p, pi) => pi % 2 === 1 ? <strong key={pi} className="text-[#24385E] font-black">{p}</strong> : p)}
                        </p>
                    </div>
                );
            } else if (line.startsWith('- ')) {
                elements.push(
                    <div key={i} className="flex gap-3 items-start my-1.5">
                        <span className="w-1.5 h-1.5 shrink-0 rounded-full bg-[#FDB913] mt-2.5" />
                        <p className="text-gray-600 font-medium text-[15px] leading-relaxed">{line.slice(2)}</p>
                    </div>
                );
            } else if (line.startsWith('✅') || line.startsWith('❌')) {
                elements.push(<p key={i} className="text-gray-600 font-medium text-[15px] leading-relaxed my-1.5">{line}</p>);
            } else {
                // Regular paragraph — handle inline **bold**
                const parts = line.split(/\*\*(.*?)\*\*/g);
                elements.push(
                    <p key={i} className="text-gray-600 font-medium text-[15px] leading-relaxed my-3">
                        {parts.map((part, pi) => pi % 2 === 1 ? <strong key={pi} className="text-[#24385E] font-black">{part}</strong> : part)}
                    </p>
                );
            }
            i++;
        }
        return elements;
    };

    const relatedArticles = blogArticles
        .filter(a => a.slug !== slug && a.category === article.category)
        .slice(0, 3);

    return (
        <div>
            <MigrateNavbar />

            {/* Top nav breadcrumb */}
            <div className="bg-white border-b border-gray-100">
                <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-2 text-[12px] font-bold text-gray-400">
                    <Link to="/" className="hover:text-[#24385E] transition-colors">Home</Link>
                    <ChevronRight size={12} />
                    <Link to="/blog" className="hover:text-[#24385E] transition-colors">H-1B Guides</Link>
                    <ChevronRight size={12} />
                    <span className="text-[#24385E] truncate max-w-[200px]">{article.title}</span>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-6 py-12 md:py-16">
                <div className="grid lg:grid-cols-[1fr_280px] gap-12 items-start">

                    {/* Main Article */}
                    <article>
                        {/* Meta */}
                        <div className="flex flex-wrap items-center gap-3 mb-6">
                            <span className="px-3 py-1.5 bg-[#FDB913]/15 text-[#24385E] text-[11px] font-black uppercase tracking-widest rounded-full">
                                {article.category}
                            </span>
                            <div className="flex items-center gap-1.5 text-gray-400">
                                <Clock size={13} />
                                <span className="text-[12px] font-bold">{article.readTime}</span>
                            </div>
                            <span className="text-[12px] font-bold text-gray-400">{article.date}</span>
                        </div>

                        {/* Content */}
                        <div className="prose-custom">
                            {renderContent(article.content)}
                        </div>

                        {/* CTA */}
                        <div className="mt-12 p-8 bg-[#24385E] rounded-3xl text-white text-center">
                            <p className="text-sm font-bold text-white/70 mb-2">Ready to find H-1B sponsored jobs?</p>
                            <h3 className="text-xl font-black mb-5">Browse verified H-1B openings on WageTrail</h3>
                            <Link
                                to="/signup"
                                className="inline-flex items-center gap-2 px-8 py-3.5 bg-[#FDB913] text-[#24385E] font-black text-sm rounded-full hover:brightness-105 transition-all shadow-lg"
                            >
                                Get Started — $39.99 / 6 months
                            </Link>
                        </div>

                        {/* Back */}
                        <Link to="/blog" className="inline-flex items-center gap-2 mt-8 text-[#24385E] font-black text-sm hover:text-[#FDB913] transition-colors">
                            <ArrowLeft size={15} /> Back to all articles
                        </Link>
                    </article>

                    {/* Sidebar */}
                    <aside className="lg:sticky lg:top-24 space-y-6">
                        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
                            <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.18em] mb-4">Related Articles</h4>
                            <div className="space-y-4">
                                {(relatedArticles.length > 0 ? relatedArticles : blogArticles.filter(a => a.slug !== slug).slice(0, 3)).map((related) => (
                                    <Link
                                        key={related.slug}
                                        to={`/blog/${related.slug}`}
                                        className="flex items-start gap-3 group"
                                    >
                                        <span className="w-1.5 h-1.5 shrink-0 rounded-full bg-[#FDB913] mt-2" />
                                        <p className="text-[13px] font-bold text-[#24385E] leading-snug group-hover:text-[#FDB913] transition-colors">{related.title}</p>
                                    </Link>
                                ))}
                            </div>
                            <Link to="/blog" className="mt-5 flex items-center gap-1.5 text-[12px] font-black text-[#24385E] hover:text-[#FDB913] transition-colors">
                                View all {blogArticles.length} articles <ChevronRight size={13} />
                            </Link>
                        </div>

                        <div className="bg-gradient-to-br from-[#FDB913]/20 to-[#FDB913]/5 rounded-3xl border border-[#FDB913]/30 p-6 text-center">
                            <p className="text-[11px] font-black text-[#24385E] uppercase tracking-widest mb-2">Find Your Job</p>
                            <p className="text-[#24385E] font-bold text-sm mb-4">Verified H-1B openings from top US companies</p>
                            <Link
                                to="/signup"
                                className="block w-full py-3 bg-[#24385E] text-white font-black text-sm rounded-full hover:bg-[#1a2a47] transition-all"
                            >
                                Get Access
                            </Link>
                        </div>
                    </aside>
                </div>
            </div>
        </div>
    );
};

export default BlogArticlePage;
