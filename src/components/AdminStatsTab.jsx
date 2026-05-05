import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { 
    Globe, 
    TrendingUp, 
    Calendar, 
    BarChart3, 
    Clock, 
    Search,
    Download,
    RefreshCw
} from 'lucide-react';

const AdminStatsTab = () => {
    const [stats, setStats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [lastUpdated, setLastUpdated] = useState(new Date());

    const countryNames = {
        'us': 'United States',
        'uk': 'United Kingdom',
        'ae': 'United Arab Emirates',
        'ca': 'Canada',
        'in': 'India',
        'ie': 'Ireland',
        'jp': 'Japan',
        'de': 'Germany',
        'fr': 'France',
        'au': 'Australia',
        'sg': 'Singapore',
        'nl': 'Netherlands',
        'es': 'Spain',
        'it': 'Italy',
        'pl': 'Poland',
        'br': 'Brazil',
        'mx': 'Mexico',
        'za': 'South Africa'
    };

    const fetchStats = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase.rpc('get_admin_job_stats');
            
            if (error) throw error;
            setStats(data || []);
            setLastUpdated(new Date());
        } catch (err) {
            console.error('Error fetching admin stats:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    const filteredStats = stats.filter(s => {
        const name = countryNames[s.country_code?.toLowerCase()] || s.country_code;
        return name.toLowerCase().includes(searchTerm.toLowerCase());
    });

    const totals = stats.reduce((acc, curr) => ({
        today: acc.today + Number(curr.today_count),
        seven: acc.seven + Number(curr.last_7_days_count),
        thirty: acc.thirty + Number(curr.last_month_count),
        total: acc.total + Number(curr.total_count)
    }), { today: 0, seven: 0, thirty: 0, total: 0 });

    if (loading && stats.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                <RefreshCw className="w-8 h-8 animate-spin mb-4 text-[#2C76FF]" />
                <p className="font-medium">Fetching real-time job metrics...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                <div>
                    <h2 className="text-2xl font-black text-[#1E1E1E] tracking-tight">Database Statistics</h2>
                    <p className="text-sm text-gray-500 font-medium flex items-center gap-2 mt-1">
                        <Clock size={14} />
                        Last synced: {lastUpdated.toLocaleTimeString()}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input 
                            type="text"
                            placeholder="Filter by country..."
                            className="pl-10 pr-4 py-2.5 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-[#2C76FF]/20 transition-all w-full md:w-64"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button 
                        onClick={fetchStats}
                        className="p-2.5 bg-gray-50 hover:bg-gray-100 rounded-xl text-gray-600 transition-colors"
                        title="Refresh data"
                    >
                        <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
                    </button>
                </div>
            </div>

            {/* Summary Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Total Links', value: totals.total, icon: Globe, color: 'blue' },
                    { label: 'Last 30 Days', value: totals.thirty, icon: BarChart3, color: 'indigo' },
                    { label: 'Last 7 Days', value: totals.seven, icon: TrendingUp, color: 'emerald' },
                    { label: 'Today', value: totals.today, icon: Calendar, color: 'amber' }
                ].map((card, i) => (
                    <div key={i} className="bg-white p-5 rounded-2xl border border-gray-50 shadow-sm hover:shadow-md transition-all">
                        <div className={`p-2 rounded-lg bg-${card.color}-50 w-fit mb-3`}>
                            <card.icon size={20} className={`text-${card.color}-600`} />
                        </div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{card.label}</p>
                        <h3 className="text-2xl font-black text-[#1E1E1E] mt-1">{card.value.toLocaleString()}</h3>
                    </div>
                ))}
            </div>

            {/* Data Table */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50">
                                <th className="px-6 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest">Country</th>
                                <th className="px-6 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest text-center">Today</th>
                                <th className="px-6 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest text-center">7 Days</th>
                                <th className="px-6 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest text-center">30 Days</th>
                                <th className="px-6 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest text-center">Total Links</th>
                                <th className="px-6 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest text-right">Coverage</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredStats.map((row, idx) => {
                                const name = countryNames[row.country_code?.toLowerCase()] || row.country_code;
                                const percentage = totals.total > 0 ? ((row.total_count / totals.total) * 100).toFixed(1) : 0;
                                
                                return (
                                    <tr key={idx} className="hover:bg-gray-50/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-500 uppercase">
                                                    {row.country_code}
                                                </div>
                                                <span className="font-bold text-[#1E1E1E]">{name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-bold ${Number(row.today_count) > 0 ? 'bg-amber-50 text-amber-600' : 'text-gray-300'}`}>
                                                {Number(row.today_count).toLocaleString()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="text-sm font-semibold text-gray-600">
                                                {Number(row.last_7_days_count).toLocaleString()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="text-sm font-semibold text-gray-600">
                                                {Number(row.last_month_count).toLocaleString()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="text-sm font-black text-[#2C76FF]">
                                                {Number(row.total_count).toLocaleString()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex flex-col items-end gap-1">
                                                <span className="text-[11px] font-bold text-gray-500">{percentage}%</span>
                                                <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                    <div 
                                                        className="h-full bg-[#2C76FF] rounded-full" 
                                                        style={{ width: `${percentage}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                
                {filteredStats.length === 0 && (
                    <div className="p-12 text-center text-gray-400 font-medium">
                        No country data found matching your search.
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminStatsTab;
