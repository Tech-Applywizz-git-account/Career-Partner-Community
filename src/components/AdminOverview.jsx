import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import {
    Users,
    DollarSign,
    Briefcase,
    TrendingUp,
    Activity,
    CreditCard,
    UserPlus,
    ArrowRight
} from 'lucide-react';

const AdminOverview = () => {
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalRevenue: 0,
        activeJobs: 0,
        newUsersToday: 0
    });
    const [recentActivity, setRecentActivity] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);

            // 1. Fetch Users Count
            const { count: userCount } = await supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true });

            // 2. Fetch Active Jobs Count
            const { count: jobCount } = await supabase
                .from('job_jobrole_sponsored_sync')
                .select('*', { count: 'exact', head: true });

            // 3. Fetch Revenue
            const { data: payments } = await supabase
                .from('payment_details')
                .select('amount, status')
                .eq('status', 'COMPLETED'); // Assuming 'COMPLETED' is the success status

            const totalRevenue = payments?.reduce((sum, p) => sum + Number(p.amount || 0), 0) || 0;

            // 4. Fetch Recent Activity (New Users)
            const { data: newUsers } = await supabase
                .from('profiles')
                .select('email, created_at, first_name')
                .order('created_at', { ascending: false })
                .limit(5);

            // 5. Fetch Recent Activity (Payments)
            const { data: recentPayments } = await supabase
                .from('payment_details')
                .select('email, amount, created_at')
                .eq('status', 'COMPLETED')
                .order('created_at', { ascending: false })
                .limit(5);

            // Combine and sort activity
            const activity = [
                ...(newUsers || []).map(u => ({
                    type: 'signup',
                    title: 'New User Registered',
                    desc: u.email,
                    time: u.created_at,
                    icon: UserPlus,
                    color: 'blue'
                })),
                ...(recentPayments || []).map(p => ({
                    type: 'payment',
                    title: 'Payment Received',
                    desc: `+${formatCurrency(p.amount)} from ${p.email}`,
                    time: p.created_at,
                    icon: DollarSign,
                    color: 'green'
                }))
            ].sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 5);

            setStats({
                totalUsers: userCount || 0,
                totalRevenue: totalRevenue,
                activeJobs: jobCount || 0,
                newUsersToday: 0 // Placeholder or calculate if needed
            });
            setRecentActivity(activity);

        } catch (error) {
            console.error('Error fetching dashboard overview:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    };

    if (loading) {
        return <div className="p-10 text-center text-gray-500">Loading dashboard overview...</div>;
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Metric Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Revenue */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-50 flex items-center justify-between hover:shadow-md transition-all duration-300">
                    <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-2">Total Revenue</p>
                        <h3 className="text-3xl font-black text-[#24385E] tracking-tight">{formatCurrency(stats.totalRevenue)}</h3>
                        <p className="text-[11px] text-emerald-600 font-bold flex items-center mt-2 bg-emerald-50 w-fit px-2 py-0.5 rounded">
                            <TrendingUp className="w-3 h-3 mr-1" /> Lifetime
                        </p>
                    </div>
                    <div className="p-4 bg-emerald-50 rounded-2xl">
                        <DollarSign className="w-8 h-8 text-emerald-600" />
                    </div>
                </div>

                {/* Users */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-50 flex items-center justify-between hover:shadow-md transition-all duration-300">
                    <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-2">Total Users</p>
                        <h3 className="text-3xl font-black text-[#24385E] tracking-tight">{stats.totalUsers}</h3>
                        <p className="text-[11px] text-blue-600 font-bold flex items-center mt-2 bg-blue-50 w-fit px-2 py-0.5 rounded">
                            <Users className="w-3 h-3 mr-1" /> Registered
                        </p>
                    </div>
                    <div className="p-4 bg-blue-50 rounded-2xl">
                        <Users className="w-8 h-8 text-blue-600" />
                    </div>
                </div>

                {/* Jobs */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-50 flex items-center justify-between hover:shadow-md transition-all duration-300">
                    <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-2">Active Jobs</p>
                        <h3 className="text-3xl font-black text-[#24385E] tracking-tight">{stats.activeJobs}</h3>
                        <p className="text-[11px] text-purple-600 font-bold flex items-center mt-2 bg-purple-50 w-fit px-2 py-0.5 rounded">
                            <Briefcase className="w-3 h-3 mr-1" /> Listed
                        </p>
                    </div>
                    <div className="p-4 bg-purple-50 rounded-2xl">
                        <Briefcase className="w-8 h-8 text-purple-600" />
                    </div>
                </div>

                {/* Growth */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-50 flex items-center justify-between hover:shadow-md transition-all duration-300">
                    <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-2">Conversion</p>
                        <h3 className="text-3xl font-black text-[#24385E] tracking-tight">
                            {stats.totalUsers > 0
                                ? ((stats.totalRevenue / 30) / stats.totalUsers * 100).toFixed(0)
                                : 0}%
                        </h3>
                        <p className="text-[11px] text-yellow-600 font-bold flex items-center mt-2 bg-yellow-50 w-fit px-2 py-0.5 rounded">
                            <Activity className="w-3 h-3 mr-1" /> Paid Users
                        </p>
                    </div>
                    <div className="p-4 bg-yellow-50 rounded-2xl">
                        <TrendingUp className="w-8 h-8 text-yellow-600" />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Recent Activity Feed */}
                <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
                    <h3 className="text-xl font-black text-[#24385E] mb-8 flex items-center gap-2">
                        <Activity className="w-5 h-5 text-gray-400" />
                        Platform Activity
                    </h3>
                    <div className="flow-root">
                        <ul role="list" className="-mb-8">
                            {recentActivity.map((activity, activityIdx) => (
                                <li key={activityIdx}>
                                    <div className="relative pb-8">
                                        {activityIdx !== recentActivity.length - 1 ? (
                                            <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-50" aria-hidden="true" />
                                        ) : null}
                                        <div className="relative flex space-x-4">
                                            <div>
                                                <span className={`h-10 w-10 rounded-xl flex items-center justify-center ring-4 ring-white shadow-sm bg-${activity.color}-50`}>
                                                    <activity.icon className={`h-5 w-5 text-${activity.color}-600`} aria-hidden="true" />
                                                </span>
                                            </div>
                                            <div className="min-w-0 flex-1 pt-1 flex justify-between space-x-4">
                                                <div>
                                                    <p className="text-sm text-gray-500 font-medium">
                                                        <span className="font-bold text-[#24385E]">{activity.title}</span>: {activity.desc}
                                                    </p>
                                                    <div className="text-[10px] uppercase font-bold text-gray-300 mt-1 tracking-wider">
                                                        {formatDate(activity.time)}
                                                    </div>
                                                </div>
                                                <div className="text-right text-xs bg-gray-50 h-fit px-2.5 py-1 rounded-full text-gray-400 font-bold">
                                                    {new Date(activity.time).toLocaleDateString()}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="mt-10 pt-6 border-t border-gray-50 text-right">
                        <button className="text-xs font-black uppercase tracking-widest text-indigo-600 hover:text-indigo-700 flex items-center justify-end gap-1.5 transition-colors">
                            View All Activity <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-[#24385E] rounded-3xl shadow-xl p-8 text-white relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-150 duration-700"></div>
                    <h3 className="text-xl font-black mb-8 relative z-10">Quick Actions</h3>
                    <div className="space-y-4 relative z-10">
                        <button className="w-full text-left px-5 py-4 rounded-2xl bg-white/10 hover:bg-white/20 transition-all flex items-center gap-4 group/btn border border-white/5">
                            <div className="p-2.5 bg-white/10 rounded-xl group-hover/btn:bg-white/20 transition-colors">
                                <Users className="w-5 h-5 text-blue-200" />
                            </div>
                            <div>
                                <p className="font-bold text-sm tracking-tight">Manage Users</p>
                                <p className="text-[10px] text-blue-200/60 font-medium mt-0.5">Edit registration details</p>
                            </div>
                        </button>

                        <button className="w-full text-left px-5 py-4 rounded-2xl bg-white/10 hover:bg-white/20 transition-all flex items-center gap-4 group/btn border border-white/5">
                            <div className="p-2.5 bg-white/10 rounded-xl group-hover/btn:bg-white/20 transition-colors">
                                <CreditCard className="w-5 h-5 text-emerald-200" />
                            </div>
                            <div>
                                <p className="font-bold text-sm tracking-tight">Financial Reports</p>
                                <p className="text-[10px] text-emerald-200/60 font-medium mt-0.5">Check revenue streams</p>
                            </div>
                        </button>

                        <button className="w-full text-left px-5 py-4 rounded-2xl bg-yellow-400 hover:bg-yellow-500 transition-all flex items-center gap-4 shadow-lg group/btn active:scale-95">
                            <div className="p-2.5 bg-black/10 rounded-xl">
                                <Briefcase className="w-5 h-5 text-[#24385E]" />
                            </div>
                            <div>
                                <p className="font-bold text-sm tracking-tight text-[#24385E]">Post Global Job</p>
                                <p className="text-[10px] text-[#24385E]/60 font-bold mt-0.5">Sync to all users</p>
                            </div>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminOverview;
