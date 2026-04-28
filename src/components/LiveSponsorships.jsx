import React from 'react';
import { ArrowRight, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import LogoBox from './LogoBox';

const sponsorshipData = [
    {
        companyInitial: 'H',
        companyColor: 'bg-blue-600',
        title: 'Data Engineer',
        companyName: 'hackajob',
        location: 'Philadelphia, PA',
        tags: ['GREEN CARD', 'TN', 'OPT'],
        level: 'Lv 3',
        salary: '$140k - $190k'
    },
    {
        companyInitial: 'T',
        companyColor: 'bg-red-600',
        title: 'Fullstack Engineer',
        companyName: 'Torch Dental',
        location: 'New York, NY',
        tags: ['H-1B', 'OPT'],
        level: 'Lv 2',
        salary: '$160k - $210k'
    },
    {
        companyInitial: 'V',
        companyColor: 'bg-black',
        title: 'Cloud Architect',
        companyName: 'Verisk',
        location: 'Jersey City, NJ',
        tags: ['H-1B', 'E-3'],
        level: 'Lv 4',
        salary: '$180k - $240k'
    }
];

const LiveSponsorships = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    return (
        <section className="py-8">
            <div className="max-w-7xl mx-auto px-4 md:px-8">
                <div className="bg-black rounded-[48px] py-16 md:py-24 px-6 md:px-12 text-center shadow-2xl">
                    <h2 className="text-2xl md:text-[32px] font-black text-white mb-3 tracking-tight uppercase">
                        LIVE <span className="text-[#FDB913]">SPONSORSHIPS.</span>
                    </h2>
                    <p className="text-gray-400 text-base md:text-lg font-medium max-w-2xl mx-auto mb-10 md:mb-16">
                        Access verified roles at companies actively hiring and sponsoring today.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-7 mb-12">
                        {sponsorshipData.map((job, idx) => (
                            <div key={idx} className="bg-[#111111] rounded-[24px] md:rounded-[32px] p-5 md:p-8 shadow-[0_10px_50px_rgba(0,0,0,0.5)] border border-white/5 flex flex-col text-left hover:scale-[1.02] transition-transform duration-300">
                                <div className="flex justify-between items-start mb-6">
                                    <LogoBox name={job.companyName} size={56} fontSize={22} className={job.companyColor} />
                                    <span className="bg-yellow-50 text-[#24385E] text-[10px] font-black px-4 py-1.5 rounded-full tracking-widest border border-yellow-200">
                                        FULL-TIME
                                    </span>
                                </div>

                                <h3 className="text-xl md:text-[26px] font-black text-white mb-1">{job.title}</h3>
                                <p className="text-gray-500 font-bold mb-8 text-[15px]">
                                    {job.companyName} • {job.location}
                                </p>

                                <div className="flex gap-2 mb-10">
                                    {job.tags.map(tag => (
                                        <span key={tag} className="bg-white/5 text-gray-400 text-[9px] font-black px-3 py-1.5 rounded-lg tracking-wider border border-white/10 uppercase">
                                            {tag}
                                        </span>
                                    ))}
                                </div>

                                <div className="mt-auto flex items-center justify-between border-t border-white/5 pt-8">
                                    <div className="flex items-center gap-6">
                                        <div className="bg-[#24385E] rounded-2xl p-3 md:p-4 flex flex-col items-center justify-center text-white w-[65px] md:w-[75px]">
                                            <div className="flex gap-0.5 mb-1">
                                                {[1, 2, 3, 4].map(s => (
                                                    <Star key={s} size={8} fill={s <= parseInt(job.level.split(' ')[1]) ? "#FDB913" : "transparent"} stroke={s <= parseInt(job.level.split(' ')[1]) ? "#FDB913" : "#4a5e7a"} />
                                                ))}
                                            </div>
                                            <div className="text-xl font-black italic leading-none">{job.level}</div>
                                            <div className="text-[8px] font-bold text-[#7a9bbf] uppercase tracking-tighter">WAGE LEVEL</div>
                                        </div>
                                        <div className="text-base md:text-[18px] font-black text-white">{job.salary}</div>
                                    </div>
                                    <button className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-white border border-white/10 hover:bg-white/10 transition-colors">
                                        <ArrowRight size={20} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={() => navigate(user ? '/app' : '/signup')}
                        className="inline-flex items-center gap-2 text-[13px] font-black text-[#FDB913] uppercase tracking-widest hover:translate-x-1 transition-transform"
                    >
                        {user ? 'GO TO YOUR DASHBOARD' : 'SEE MORE JOBS'} <ArrowRight size={16} />
                    </button>
                </div>
            </div>
        </section>
    );
};

export default LiveSponsorships;
