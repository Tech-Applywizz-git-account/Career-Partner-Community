// src/pages/AdminDashboard.jsx — inline styles only (no Tailwind dependency)
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import useAuth from '../hooks/useAuth';
import {
    LayoutDashboard, Users, DollarSign, Briefcase, Activity,
    CreditCard, Shield, Search, RefreshCw, Trash2, CheckCircle,
    XCircle, ChevronLeft, ChevronRight, LogOut, BarChart3,
    Edit3, X, Save, ArrowRight, Clock, PieChart, ArrowUpRight
} from 'lucide-react';

// ── helpers ──────────────────────────────────────────────────────────────────
const fmt$ = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n || 0);
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
const fmtDT = (d) => d ? new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

const initials = (name) => (name || '??').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
const avatarColor = (name) => {
    const colors = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];
    return colors[(initials(name).charCodeAt(0) || 0) % colors.length];
};

const S = {
    page: { display: 'flex', height: '100vh', overflow: 'hidden', background: '#f7f8fc', fontFamily: "'Inter', sans-serif" },
    sidebar: { width: '220px', minWidth: '220px', background: '#fff', borderRight: '1px solid #e8e8e8', display: 'flex', flexDirection: 'column', height: '100vh' },
    logo: { padding: '20px 20px 16px', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', gap: '10px' },
    nav: { flex: 1, padding: '12px 10px', overflowY: 'auto' },
    navBtn: (active) => ({
        width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
        padding: '9px 12px', borderRadius: '10px', fontSize: '13px', fontWeight: active ? 700 : 500,
        color: active ? '#fff' : '#555', background: active ? '#24385E' : 'transparent',
        border: 'none', cursor: 'pointer', marginBottom: '4px', textAlign: 'left', transition: 'all 150ms',
    }),
    sidebarBottom: { padding: '12px 10px 20px', borderTop: '1px solid #f0f0f0' },
    main: { flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, height: '100vh', overflow: 'hidden' },
    topbar: { background: '#fff', borderBottom: '1px solid #e8e8e8', padding: '14px 24px', display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 },
    content: { flex: 1, overflowY: 'auto', padding: '24px', background: '#f7f8fc' },
    card: { background: '#fff', borderRadius: '14px', border: '1px solid #eee', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' },
    grid4: { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '16px', marginBottom: '20px' },
    grid2: { display: 'grid', gridTemplateColumns: '1fr 300px', gap: '16px' },
    statCard: { background: '#fff', borderRadius: '14px', border: '1px solid #eee', padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' },
    input: { width: '100%', border: '1.5px solid #e0e0e0', borderRadius: '10px', padding: '9px 12px', fontSize: '13px', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' },
    select: { width: '100%', border: '1.5px solid #e0e0e0', borderRadius: '10px', padding: '9px 12px', fontSize: '13px', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', background: '#fff' },
    btn: (color) => ({ padding: '9px 18px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '13px', background: color || '#24385E', color: color ? '#333' : '#fff', fontFamily: 'inherit' }),
    badge: (type) => {
        const map = { completed: '#d1fae5:#065f46', paid: '#d1fae5:#065f46', pending: '#fef3c7:#92400e', failed: '#fee2e2:#991b1b', cancelled: '#f3f4f6:#666', admin: '#ede9fe:#5b21b6', user: '#dbeafe:#1e40af', active: '#d1fae5:#065f46', anonymous: '#f1f5f9:#475569', india: '#eff6ff:#1d4ed8', international: '#f0fdf4:#166534' };
        const [bg, col] = (map[type] || map.pending).split(':');
        return { display: 'inline-block', padding: '2px 9px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, background: bg, color: col, textTransform: 'capitalize' };
    },
    th: { padding: '10px 14px', fontSize: '11px', fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: 'left', background: '#fafafa', borderBottom: '1px solid #eee' },
    td: { padding: '11px 14px', fontSize: '13px', borderBottom: '1px solid #f5f5f5', verticalAlign: 'middle' },
};

// ── Toast ─────────────────────────────────────────────────────────────────────
const Toast = ({ msg, type }) => msg ? (
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, display: 'flex', alignItems: 'center', gap: 10, padding: '12px 20px', borderRadius: 12, background: type === 'success' ? '#059669' : '#dc2626', color: '#fff', fontWeight: 600, fontSize: 13, boxShadow: '0 8px 24px rgba(0,0,0,0.18)' }}>
        {type === 'success' ? <CheckCircle size={16} /> : <XCircle size={16} />} {msg}
    </div>
) : null;

// ── Avatar ────────────────────────────────────────────────────────────────────
const Avatar = ({ name, size = 32 }) => (
    <div style={{ width: size, height: size, borderRadius: '50%', background: avatarColor(name), display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: size * 0.35, flexShrink: 0 }}>
        {initials(name)}
    </div>
);

// ── StatCard ──────────────────────────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, sub, iconBg, iconColor, onClick }) => (
    <div style={{ ...S.statCard, cursor: onClick ? 'pointer' : 'default' }} onClick={onClick}>
        <div style={{ flex: 1 }}>
            <p style={{ fontSize: 10, fontWeight: 800, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>{label}</p>
            <p style={{ fontSize: 28, fontWeight: 900, color: '#1e2d4a', margin: 0 }}>{value}</p>
            {sub && <p style={{ fontSize: 11, fontWeight: 700, color: '#666', marginTop: 6, background: '#f3f4f6', padding: '2px 8px', borderRadius: 20, display: 'inline-block' }}>{sub}</p>}
        </div>
        <div style={{ width: 48, height: 48, borderRadius: 14, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icon size={22} color={iconColor} />
        </div>
    </div>
);

// ── Overview Tab ──────────────────────────────────────────────────────────────
const OverviewTab = ({ setActiveTab }) => {
    const [stats, setStats] = useState({ totalUsers: 0, paidUsers: 0, pendingUsers: 0, failedUsers: 0, activeJobs: 0, totalVisits: 0, uniqueVisitors: 0 });
    const [activity, setActivity] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [usersRes, jobsRes, recentRes, visitsRes] = await Promise.all([
                supabase.from('profiles').select('id, email, first_name, last_name, created_at, payment_status, role'),
                supabase.from('job_jobrole_sponsored_sync').select('id', { count: 'exact', head: true }),
                supabase.from('profiles').select('email, first_name, last_name, created_at, payment_status').order('created_at', { ascending: false }).limit(6),
                supabase.rpc('get_site_stats')
            ]);

            const users = usersRes.data || [];
            const paid = users.filter(u => u.role !== 'admin' && (u.payment_status === 'completed' || u.payment_status === 'paid' || u.payment_status === 'active')).length;
            const pending = users.filter(u => u.role !== 'admin' && u.payment_status === 'pending').length;
            const failed = users.filter(u => u.role !== 'admin' && u.payment_status === 'failed').length;
            
            const vData = (visitsRes.data && visitsRes.data[0]) || { today_unique: 0, total_unique: 0 };

            // Calculate TODAY's unique specifically (matching local time logic)
            const { data: vLogs } = await supabase.from('site_visits').select('session_id, user_email, created_at');
            const { data: admins } = await supabase.from('profiles').select('email').eq('role', 'admin');
            const adminEmails = new Set(admins?.map(a => a.email) || []);
            
            const startOfToday = new Date();
            startOfToday.setHours(0,0,0,0);
            
            const todayUniqueSet = new Set();
            (vLogs || []).forEach(v => {
                const vDate = new Date(v.created_at);
                if (vDate >= startOfToday && !adminEmails.has(v.user_email)) {
                    todayUniqueSet.add(v.session_id);
                }
            });

            setStats({ 
                totalUsers: users.length, 
                paidUsers: paid, 
                pendingUsers: pending, 
                failedUsers: failed,
                todayUnique: todayUniqueSet.size || vData.today_unique, // Fallback to RPC if local calc empty
                totalUnique: vData.total_unique
            });
            setActivity(recentRes.data || []);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 240, gap: 12, color: '#888' }}><RefreshCw size={22} style={{ animation: 'spin 1s linear infinite' }} /> Loading…</div>;

    return (
        <div>
            {/* Row 1: Users & Payments */}
            <div style={{ ...S.grid4, marginBottom: 16 }}>
                <StatCard icon={Users} label="Total Users" value={stats.totalUsers} sub="Registered" iconBg="#dbeafe" iconColor="#1d4ed8" />
                <StatCard icon={CheckCircle} label="Paid Users" value={stats.paidUsers} sub="Active subs" iconBg="#d1fae5" iconColor="#059669" />
                <StatCard icon={Clock} label="Pending" value={stats.pendingUsers} sub="Checkout open" iconBg="#fef3c7" iconColor="#d97706" />
                <StatCard icon={XCircle} label="Failed" value={stats.failedUsers} sub="Payment errors" iconBg="#fee2e2" iconColor="#dc2626" />
            </div>

            {/* Row 2: Pure Unique Traffic Stats */}
            <div style={{ ...S.grid4, gridTemplateColumns: 'repeat(2, 1fr)', marginBottom: 20 }}>
                <StatCard 
                   icon={Activity} 
                   label="Today's Unq Visitors" 
                   value={stats.todayUnique} 
                   sub="Unique people today" 
                   iconBg="#f0fdf4" 
                   iconColor="#15803d" 
                />
                <StatCard 
                    icon={PieChart} 
                    label="Total Unq Visitors" 
                    value={stats.totalUnique} 
                    sub="Total unique base" 
                    iconBg="#f5f3ff" 
                    iconColor="#6d28d9" 
                    onClick={() => setActiveTab('visitors')}
                />
            </div>

            {/* Bottom Row */}
            <div style={S.grid2}>
                {/* Recent sign-ups */}
                <div style={{ ...S.card, padding: 0, overflow: 'hidden' }}>
                    <div style={{ padding: '16px 20px', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontWeight: 800, color: '#1e2d4a', fontSize: 14 }}>Recent Sign-ups</span>
                        <button onClick={() => setActiveTab('users')} style={{ background: 'none', border: 'none', color: '#6366f1', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>View all <ArrowRight size={12} /></button>
                    </div>
                    {activity.length === 0 ? (
                        <p style={{ textAlign: 'center', color: '#aaa', padding: '40px 0', fontSize: 13 }}>No recent activity</p>
                    ) : activity.map((u, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', borderBottom: i < activity.length - 1 ? '1px solid #f5f5f5' : 'none' }}>
                            <Avatar name={`${u.first_name || 'U'} ${u.last_name || 'N'}`} size={34} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{ margin: 0, fontWeight: 600, fontSize: 13, color: '#1a1a1a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.first_name} {u.last_name}</p>
                                <p style={{ margin: 0, fontSize: 11, color: '#999', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</p>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                                <span style={S.badge(u.payment_status)}>{u.payment_status || 'pending'}</span>
                                <span style={{ fontSize: 10, color: '#ccc' }}>{fmtDT(u.created_at)}</span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Quick Actions */}
                <div style={{ ...S.card, padding: 20, background: 'linear-gradient(135deg, #1e2d4a 0%, #24385E 100%)', color: '#fff', border: 'none' }}>
                    <p style={{ fontWeight: 800, fontSize: 15, marginBottom: 16, margin: '0 0 16px' }}>Quick Actions</p>
                    {[
                        { label: 'Manage Users', sub: 'Edit & view accounts', tab: 'users', icon: Users },
                        { label: 'View Payments', sub: 'Revenue details', tab: 'payments', icon: CreditCard },
                        { label: 'Analytics', sub: 'Growth trends', tab: 'analytics', icon: BarChart3 },
                    ].map(({ label, sub, tab, icon: Icon }) => (
                        <button key={tab} onClick={() => setActiveTab(tab)}
                            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', cursor: 'pointer', marginBottom: 10, textAlign: 'left', transition: 'background 150ms' }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.18)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                        >
                            <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <Icon size={16} color="rgba(255,255,255,0.85)" />
                            </div>
                            <div style={{ flex: 1 }}>
                                <p style={{ margin: 0, fontWeight: 700, fontSize: 13 }}>{label}</p>
                                <p style={{ margin: 0, fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>{sub}</p>
                            </div>
                            <ArrowRight size={14} color="rgba(255,255,255,0.3)" />
                        </button>
                    ))}
                </div>
            </div>
            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
    );
};

// ── Users Tab ─────────────────────────────────────────────────────────────────
const UsersTab = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('all');
    const [page, setPage] = useState(1);
    const [toast, setToast] = useState(null);
    const [editUser, setEditUser] = useState(null);
    const [editForm, setEditForm] = useState({});
    const [delUser, setDelUser] = useState(null);
    const PER = 12;

    const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3500); };

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
        if (!error) setUsers(data || []);
        else showToast('Could not load users — check RLS policy', 'error');
        setLoading(false);
    }, []);

    useEffect(() => { fetchUsers(); }, [fetchUsers]);

    const filtered = users.filter(u => {
        const q = search.toLowerCase();
        const matchQ = !q || u.email?.toLowerCase().includes(q) || u.first_name?.toLowerCase().includes(q) || u.last_name?.toLowerCase().includes(q);
        const matchF = filter === 'all' || u.payment_status === filter || (filter === 'admin' && u.role === 'admin');
        return matchQ && matchF;
    });

    const totalPages = Math.max(1, Math.ceil(filtered.length / PER));
    const paged = filtered.slice((page - 1) * PER, page * PER);

    const saveEdit = async () => {
        const { error } = await supabase.from('profiles').update({
            first_name: editForm.first_name, last_name: editForm.last_name,
            payment_status: editForm.payment_status, role: editForm.role,
            subscription_end_date: editForm.subscription_end_date || null,
        }).eq('id', editUser.id);
        if (error) { showToast('Update failed', 'error'); return; }
        setUsers(p => p.map(u => u.id === editUser.id ? { ...u, ...editForm } : u));
        setEditUser(null);
        showToast('User updated');
    };

    const doDelete = async () => {
        const { error } = await supabase.from('profiles').delete().eq('id', delUser.id);
        if (error) { showToast('Delete failed', 'error'); return; }
        setUsers(p => p.filter(u => u.id !== delUser.id));
        setDelUser(null);
        showToast('User deleted');
    };

    const paidCount = users.filter(u => u.role !== 'admin' && ['completed', 'paid', 'active'].includes(u.payment_status)).length;
    const adminCount = users.filter(u => u.role === 'admin').length;

    return (
        <div>
            {toast && <Toast {...toast} />}

            {/* Summary */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 20 }}>
                {[
                    { label: 'Total Users', val: users.length, bg: '#dbeafe', col: '#1d4ed8' },
                    { label: 'Paid', val: paidCount, bg: '#d1fae5', col: '#059669' },
                    { label: 'Pending', val: users.filter(u => u.role !== 'admin' && u.payment_status === 'pending').length, bg: '#fef3c7', col: '#d97706' },
                    { label: 'Admins', val: adminCount, bg: '#ede9fe', col: '#7c3aed' },
                ].map(({ label, val, bg, col }) => (
                    <div key={label} style={{ background: bg, borderRadius: 12, padding: '14px 18px' }}>
                        <p style={{ margin: 0, fontSize: 22, fontWeight: 900, color: col }}>{val}</p>
                        <p style={{ margin: '3px 0 0', fontSize: 11, fontWeight: 700, color: col, opacity: 0.7 }}>{label}</p>
                    </div>
                ))}
            </div>

            {/* Table card */}
            <div style={{ ...S.card, overflow: 'hidden' }}>
                {/* Toolbar */}
                <div style={{ padding: '14px 18px', borderBottom: '1px solid #f0f0f0', display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ position: 'relative', flex: '1 1 200px', maxWidth: 280 }}>
                        <Search size={14} color="#aaa" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
                        <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search by name or email…" style={{ ...S.input, paddingLeft: 32 }} />
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                        {['all', 'completed', 'pending', 'admin'].map(f => (
                            <button key={f} onClick={() => { setFilter(f); setPage(1); }}
                                style={{ padding: '7px 13px', borderRadius: 8, border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer', background: filter === f ? '#24385E' : '#f0f0f0', color: filter === f ? '#fff' : '#555', textTransform: 'capitalize' }}>
                                {f === 'all' ? 'All' : f}
                            </button>
                        ))}
                    </div>
                    <button onClick={fetchUsers} style={{ marginLeft: 'auto', padding: 8, borderRadius: 8, border: '1px solid #e0e0e0', background: '#fff', cursor: 'pointer', display: 'flex' }}>
                        <RefreshCw size={15} color="#666" style={loading ? { animation: 'spin 1s linear infinite' } : {}} />
                    </button>
                </div>

                {/* Table */}
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr>
                                {['User', 'Mobile', 'Payment', 'Role', 'Joined', 'Sub End', 'Actions'].map(h => (
                                    <th key={h} style={S.th}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={7} style={{ ...S.td, textAlign: 'center', padding: '50px 0', color: '#aaa' }}>
                                    <RefreshCw size={20} style={{ animation: 'spin 1s linear infinite', display: 'block', margin: '0 auto 8px' }} />Loading users…
                                </td></tr>
                            ) : paged.length === 0 ? (
                                <tr><td colSpan={7} style={{ ...S.td, textAlign: 'center', padding: '50px 0', color: '#aaa' }}>No users found</td></tr>
                            ) : paged.map(u => (
                                <tr key={u.id} onMouseEnter={e => e.currentTarget.style.background = '#fafafa'} onMouseLeave={e => e.currentTarget.style.background = ''}>
                                    <td style={S.td}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                            <Avatar name={`${u.first_name} ${u.last_name}`} size={30} />
                                            <div>
                                                <p style={{ margin: 0, fontWeight: 600, fontSize: 13, color: '#1a1a1a' }}>{u.first_name} {u.last_name}</p>
                                                <p style={{ margin: 0, fontSize: 11, color: '#999', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ ...S.td, fontSize: 12, color: '#777' }}>{u.country_code} {u.mobile_number}</td>
                                    <td style={S.td}><span style={S.badge(u.payment_status)}>{u.payment_status || 'pending'}</span></td>
                                    <td style={S.td}><span style={S.badge(u.role || 'user')}>{u.role || 'user'}</span></td>
                                    <td style={{ ...S.td, fontSize: 12, color: '#888', whiteSpace: 'nowrap' }}>{fmtDate(u.created_at)}</td>
                                    <td style={{ ...S.td, fontSize: 12, color: '#888', whiteSpace: 'nowrap' }}>{fmtDate(u.subscription_end_date)}</td>
                                    <td style={{ ...S.td, textAlign: 'center' }}>
                                        <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                                            <button onClick={() => { setEditUser(u); setEditForm({ ...u }); }} style={{ padding: 6, borderRadius: 7, border: 'none', background: '#f0f0f0', cursor: 'pointer' }} title="Edit"><Edit3 size={13} color="#555" /></button>
                                            <button onClick={() => setDelUser(u)} style={{ padding: 6, borderRadius: 7, border: 'none', background: '#fee2e2', cursor: 'pointer' }} title="Delete"><Trash2 size={13} color="#dc2626" /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div style={{ padding: '12px 18px', borderTop: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 12, color: '#888' }}>Showing {(page - 1) * PER + 1}–{Math.min(page * PER, filtered.length)} of {filtered.length}</span>
                        <div style={{ display: 'flex', gap: 6 }}>
                            <button disabled={page === 1} onClick={() => setPage(p => p - 1)} style={{ padding: '5px 8px', borderRadius: 7, border: '1px solid #e0e0e0', background: '#fff', cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.4 : 1 }}><ChevronLeft size={14} /></button>
                            <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} style={{ padding: '5px 8px', borderRadius: 7, border: '1px solid #e0e0e0', background: '#fff', cursor: page === totalPages ? 'not-allowed' : 'pointer', opacity: page === totalPages ? 0.4 : 1 }}><ChevronRight size={14} /></button>
                        </div>
                    </div>
                )}
            </div>

            {/* Edit Modal */}
            {editUser && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
                    <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 460, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
                        <div style={{ padding: '18px 20px', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <Avatar name={`${editUser.first_name} ${editUser.last_name}`} size={38} />
                                <div><p style={{ margin: 0, fontWeight: 800, color: '#1a1a1a', fontSize: 14 }}>Edit User</p><p style={{ margin: 0, fontSize: 12, color: '#999' }}>{editUser.email}</p></div>
                            </div>
                            <button onClick={() => setEditUser(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} color="#aaa" /></button>
                        </div>
                        <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                {[['First Name', 'first_name'], ['Last Name', 'last_name']].map(([label, key]) => (
                                    <div key={key}><label style={{ fontSize: 11, fontWeight: 700, color: '#888', display: 'block', marginBottom: 4 }}>{label}</label>
                                        <input value={editForm[key] || ''} onChange={e => setEditForm(f => ({ ...f, [key]: e.target.value }))} style={S.input} /></div>
                                ))}
                            </div>
                            <div><label style={{ fontSize: 11, fontWeight: 700, color: '#888', display: 'block', marginBottom: 4 }}>Payment Status</label>
                                <select value={editForm.payment_status || 'pending'} onChange={e => setEditForm(f => ({ ...f, payment_status: e.target.value }))} style={S.select}>
                                    <option value="pending">Pending</option><option value="completed">Completed</option><option value="failed">Failed</option>
                                </select>
                            </div>
                            <div><label style={{ fontSize: 11, fontWeight: 700, color: '#888', display: 'block', marginBottom: 4 }}>Role</label>
                                <select value={editForm.role || 'user'} onChange={e => setEditForm(f => ({ ...f, role: e.target.value }))} style={S.select}>
                                    <option value="user">User</option><option value="admin">Admin</option>
                                </select>
                            </div>
                            <div><label style={{ fontSize: 11, fontWeight: 700, color: '#888', display: 'block', marginBottom: 4 }}>Subscription End Date</label>
                                <input type="date" value={editForm.subscription_end_date ? editForm.subscription_end_date.split('T')[0] : ''} onChange={e => setEditForm(f => ({ ...f, subscription_end_date: e.target.value }))} style={S.input} />
                            </div>
                        </div>
                        <div style={{ padding: '0 20px 18px', display: 'flex', gap: 10 }}>
                            <button onClick={() => setEditUser(null)} style={{ flex: 1, padding: '10px', borderRadius: 10, border: '1.5px solid #e0e0e0', background: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>Cancel</button>
                            <button onClick={saveEdit} style={{ flex: 1, padding: '10px', borderRadius: 10, border: 'none', background: '#24385E', color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}><Save size={14} /> Save</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Modal */}
            {delUser && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
                    <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 360, padding: 24, textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
                        <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}><Trash2 size={22} color="#dc2626" /></div>
                        <p style={{ fontWeight: 900, fontSize: 16, margin: '0 0 6px', color: '#1a1a1a' }}>Delete User?</p>
                        <p style={{ fontSize: 13, color: '#666', margin: '0 0 20px' }}><strong>{delUser.first_name} {delUser.last_name}</strong> ({delUser.email}) will be permanently removed.</p>
                        <div style={{ display: 'flex', gap: 10 }}>
                            <button onClick={() => setDelUser(null)} style={{ flex: 1, padding: '10px', borderRadius: 10, border: '1.5px solid #e0e0e0', background: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>Cancel</button>
                            <button onClick={doDelete} style={{ flex: 1, padding: '10px', borderRadius: 10, border: 'none', background: '#dc2626', color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>Delete</button>
                        </div>
                    </div>
                </div>
            )}
            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
    );
};

// ── Payments Tab ──────────────────────────────────────────────────────────────
const PaymentsTab = () => {
    const [profiles, setProfiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        (async () => {
            setLoading(true);
            const { data } = await supabase.from('profiles').select('id,email,first_name,last_name,payment_status,created_at,subscription_end_date,transaction_id,order_id,promo_code').order('created_at', { ascending: false });
            setProfiles(data || []);
            setLoading(false);
        })();
    }, []);

    const paid = profiles.filter(p => p.role !== 'admin' && ['completed', 'paid', 'active'].includes(p.payment_status));
    const filtered = profiles.filter(p => {
        const q = search.toLowerCase();
        return !q || p.email?.toLowerCase().includes(q) || p.first_name?.toLowerCase().includes(q) || p.last_name?.toLowerCase().includes(q);
    });

    return (
        <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 20 }}>
                <StatCard icon={DollarSign} label="Est. Revenue" value={fmt$(paid.length * 39.99)} sub={`${paid.length} paid users`} iconBg="#d1fae5" iconColor="#059669" />
                <StatCard icon={CheckCircle} label="Completed Payments" value={paid.length} sub="Active" iconBg="#dbeafe" iconColor="#1d4ed8" />
                <StatCard icon={Clock} label="Pending Payments" value={profiles.filter(p => p.payment_status === 'pending').length} sub="Awaiting" iconBg="#fef3c7" iconColor="#d97706" />
            </div>

            <div style={{ ...S.card, overflow: 'hidden' }}>
                <div style={{ padding: '14px 18px', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ position: 'relative', flex: '1 1 200px', maxWidth: 280 }}>
                        <Search size={14} color="#aaa" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
                        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search user…" style={{ ...S.input, paddingLeft: 32 }} />
                    </div>
                    <span style={{ marginLeft: 'auto', fontSize: 12, color: '#aaa' }}>{filtered.length} records</span>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr>{['User', 'Status', 'Transaction ID', 'Order ID', 'Promo', 'Joined', 'Sub End'].map(h => <th key={h} style={S.th}>{h}</th>)}</tr>
                        </thead>
                        <tbody>
                            {loading ? <tr><td colSpan={7} style={{ ...S.td, textAlign: 'center', padding: '50px 0', color: '#aaa' }}>Loading…</td></tr>
                                : filtered.map(p => (
                                    <tr key={p.id} onMouseEnter={e => e.currentTarget.style.background = '#fafafa'} onMouseLeave={e => e.currentTarget.style.background = ''}>
                                        <td style={S.td}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                                                <Avatar name={`${p.first_name || 'U'} ${p.last_name || 'N'}`} size={28} />
                                                <div>
                                                    <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: p.payment_status === 'failed' ? '#dc2626' : '#1a1a1a' }}>
                                                        {p.first_name} {p.last_name}
                                                    </p>
                                                    <p style={{ margin: 0, fontSize: 11, color: '#999' }}>{p.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={S.td}>
                                            <span style={S.badge(p.payment_status || 'pending')}>
                                                {p.payment_status || 'pending'}
                                            </span>
                                        </td>
                                        <td style={{ ...S.td, fontSize: 11, fontFamily: 'monospace', color: '#777' }}>{p.transaction_id || '—'}</td>
                                        <td style={{ ...S.td, fontSize: 11, fontFamily: 'monospace', color: '#777' }}>{p.order_id || '—'}</td>
                                        <td style={{ ...S.td, fontSize: 12, color: '#777' }}>{p.promo_code || '—'}</td>
                                        <td style={{ ...S.td, fontSize: 12, color: '#888', whiteSpace: 'nowrap' }}>{fmtDate(p.created_at)}</td>
                                        <td style={{ ...S.td, fontSize: 12, color: '#888', whiteSpace: 'nowrap' }}>{fmtDate(p.subscription_end_date)}</td>
                                    </tr>
                                ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

// ── Analytics Tab ─────────────────────────────────────────────────────────────
const AnalyticsTab = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            setLoading(true);
            const { data: rows } = await supabase.from('profiles').select('created_at,payment_status,role').order('created_at', { ascending: true });
            setData(rows || []);
            setLoading(false);
        })();
    }, []);

    if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, color: '#aaa', gap: 10 }}><RefreshCw size={20} style={{ animation: 'spin 1s linear infinite' }} />Loading…</div>;

    const now = new Date();
    const months = Array.from({ length: 6 }, (_, i) => {
        const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
        return { label: d.toLocaleString('default', { month: 'short' }), month: d.getMonth(), year: d.getFullYear() };
    }).map(m => ({ ...m, count: data.filter(u => { const d = new Date(u.created_at); return d.getMonth() === m.month && d.getFullYear() === m.year; }).length }));

    const maxC = Math.max(...months.map(m => m.count), 1);
    const total = data.length;
    const paidC = data.filter(d => d.role !== 'admin' && ['completed', 'paid', 'active'].includes(d.payment_status)).length;
    const pendC = data.filter(d => d.role !== 'admin' && d.payment_status === 'pending').length;
    const adminC = data.filter(d => d.role === 'admin').length;

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {/* Bar chart */}
            <div style={{ ...S.card, padding: 20 }}>
                <p style={{ fontWeight: 800, color: '#1e2d4a', margin: '0 0 4px', fontSize: 14 }}>Monthly Sign-ups</p>
                <p style={{ fontSize: 11, color: '#aaa', margin: '0 0 20px' }}>Last 6 months</p>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height: 120 }}>
                    {months.map((m, i) => (
                        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontSize: 11, fontWeight: 700, color: '#555' }}>{m.count}</span>
                            <div style={{ width: '100%', background: '#f0f0f0', borderRadius: 6, height: 80, display: 'flex', alignItems: 'flex-end', overflow: 'hidden' }}>
                                <div style={{ width: '100%', background: 'linear-gradient(to top, #24385E, #6366f1)', borderRadius: 6, height: `${(m.count / maxC) * 100}%`, minHeight: m.count > 0 ? 4 : 0, transition: 'height 0.6s' }} />
                            </div>
                            <span style={{ fontSize: 10, color: '#aaa', fontWeight: 600 }}>{m.label}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Pie chart */}
            <div style={{ ...S.card, padding: 20 }}>
                <p style={{ fontWeight: 800, color: '#1e2d4a', margin: '0 0 4px', fontSize: 14 }}>Payment Distribution</p>
                <p style={{ fontSize: 11, color: '#aaa', margin: '0 0 20px' }}>All-time breakdown</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                    <svg width={100} height={100} viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
                        <circle cx={50} cy={50} r={38} fill="none" stroke="#f0f0f0" strokeWidth={10} />
                        {total > 0 && <circle cx={50} cy={50} r={38} fill="none" stroke="#10b981" strokeWidth={10} strokeDasharray={`${(paidC / total) * 238.76} 238.76`} />}
                        {total > 0 && <circle cx={50} cy={50} r={38} fill="none" stroke="#f59e0b" strokeWidth={10} strokeDasharray={`${(pendC / total) * 238.76} 238.76`} strokeDashoffset={`-${(paidC / total) * 238.76}`} />}
                    </svg>
                    <div>
                        <p style={{ margin: 0, fontSize: 22, fontWeight: 900, color: '#1e2d4a' }}>{total}</p>
                        <p style={{ margin: '2px 0 12px', fontSize: 11, color: '#aaa' }}>Total users</p>
                        {[['Paid', paidC, '#10b981'], ['Pending', pendC, '#f59e0b'], ['Admins', adminC, '#8b5cf6']].map(([label, count, col]) => (
                            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                                <div style={{ width: 10, height: 10, borderRadius: '50%', background: col, flexShrink: 0 }} />
                                <span style={{ fontSize: 12, color: '#555', width: 52 }}>{label}</span>
                                <span style={{ fontWeight: 800, fontSize: 13, color: '#1a1a1a' }}>{count}</span>
                                <span style={{ fontSize: 11, color: '#aaa' }}>({total > 0 ? ((count / total) * 100).toFixed(1) : 0}%)</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
    );
};

// ── Visitors Tab ─────────────────────────────────────────────────────────────
const VisitorsTab = () => {
    const [visitors, setVisitors] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            setLoading(true);
            try {
                // Fetch site visits
                const { data } = await supabase
                    .from('site_visits')
                    .select('*')
                    .order('created_at', { ascending: false });
                
                // Fetch admin emails to filter them out
                const { data: admins } = await supabase.from('profiles').select('email').eq('role', 'admin');
                const adminEmails = new Set(admins?.map(a => a.email) || []);

                const uniqueBySession = [];
                const seen = new Set();
                (data || []).forEach(v => {
                    // Filter out ADMINS, admin pages, and ensure uniqueness
                    if (!seen.has(v.session_id) && !adminEmails.has(v.user_email) && !v.path.startsWith('/admin')) {
                        seen.add(v.session_id);
                        uniqueBySession.push(v);
                    }
                });
                setVisitors(uniqueBySession);
            } catch (e) { console.error(e); }
            setLoading(false);
        })();
    }, []);

    return (
        <div>
            <div style={{ ...S.card, overflow: 'hidden' }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid #f0f0f0' }}>
                    <span style={{ fontWeight: 800, color: '#1e2d4a', fontSize: 14 }}>Unique Visitor Logs</span>
                    <p style={{ margin: '4px 0 0', fontSize: 11, color: '#999' }}>Real-time list of people browsing your site</p>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr>{['Visitor', 'Status', 'Location', 'Last Path', 'Last Seen'].map(h => <th key={h} style={S.th}>{h}</th>)}</tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={5} style={{ ...S.td, textAlign: 'center', padding: '50px 0', color: '#aaa' }}>Loading visitors…</td></tr>
                            ) : visitors.length === 0 ? (
                                <tr><td colSpan={5} style={{ ...S.td, textAlign: 'center', padding: '50px 0', color: '#aaa' }}>No visitors tracked yet</td></tr>
                            ) : visitors.map((v, i) => (
                                <tr key={i} onMouseEnter={e => e.currentTarget.style.background = '#fafafa'} onMouseLeave={e => e.currentTarget.style.background = ''}>
                                    <td style={S.td}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                            <Avatar name={v.user_email || 'A'} size={28} />
                                            <div>
                                                <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: v.user_email ? '#24385E' : '#666' }}>
                                                    {v.user_email || 'Anonymous Guest'}
                                                </p>
                                                <p style={{ margin: 0, fontSize: 10, color: '#aaa', fontFamily: 'monospace' }}>ID: {v.session_id.slice(0, 8)}...</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td style={S.td}>
                                        <span style={S.badge(v.user_email ? 'user' : 'anonymous')}>
                                            {v.user_email ? 'Logged In' : 'Anonymous'}
                                        </span>
                                    </td>
                                    <td style={S.td}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                            <span style={S.badge(v.country === 'India' ? 'india' : 'international')}>
                                                {v.country || 'Unknown'}
                                            </span>
                                            {v.country && v.country !== 'India' && <span style={{ fontSize: 13 }}>✈️</span>}
                                        </div>
                                    </td>
                                    <td style={{ ...S.td, fontSize: 12, color: '#6366f1', fontWeight: 600 }}>{v.path}</td>
                                    <td style={{ ...S.td, fontSize: 12, color: '#888', whiteSpace: 'nowrap' }}>{fmtDT(v.created_at)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

// ── Shell ─────────────────────────────────────────────────────────────────────
const AdminDashboard = () => {
    const { user, loading, isAdmin, signOut, role } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('overview');
    const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 768);
    const isMobile = () => window.innerWidth < 768;

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 768) setSidebarOpen(true);
            else setSidebarOpen(false);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        if (!loading && !user) navigate('/login');
        if (!loading && user && !isAdmin && role !== null) navigate('/app');
    }, [loading, user, isAdmin, role, navigate]);

    if (loading || (user && role === null)) {
        return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f7f8fc' }}><RefreshCw size={28} color="#24385E" style={{ animation: 'spin 1s linear infinite' }} /><style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style></div>;
    }
    if (!isAdmin) return null;

    const tabs = [
        { id: 'overview', label: 'Overview', icon: LayoutDashboard },
        { id: 'users', label: 'User Management', icon: Users },
        { id: 'visitors', label: 'Visitor Logs', icon: Activity },
        { id: 'payments', label: 'Payments', icon: CreditCard },
        { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    ];

    const titles = { overview: 'Dashboard Overview', users: 'User Management', visitors: 'Visitor Logs', payments: 'Payments', analytics: 'Analytics' };

    const handleNavClick = (id) => {
        setActiveTab(id);
        if (isMobile()) setSidebarOpen(false);
    };

    return (
        <div style={S.page}>
            {/* Mobile overlay */}
            {sidebarOpen && isMobile() && (
                <div
                    onClick={() => setSidebarOpen(false)}
                    style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 998 }}
                />
            )}

            {/* Sidebar */}
            <aside style={{
                ...S.sidebar,
                position: isMobile() ? 'fixed' : 'relative',
                left: 0, top: 0, zIndex: 999,
                transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
                transition: 'transform 280ms cubic-bezier(0.4,0,0.2,1)',
                boxShadow: isMobile() && sidebarOpen ? '4px 0 24px rgba(0,0,0,0.12)' : 'none',
            }}>
                {/* Logo */}
                <div style={S.logo}>
                    <div style={{ width: 36, height: 36, background: '#24385E', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Shield size={16} color="#EAB308" />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: 0, fontWeight: 900, color: '#1e2d4a', fontSize: 13, lineHeight: 1.2 }}>Admin</p>
                        <p style={{ margin: 0, fontSize: 10, color: '#aaa' }}>WageTrail Console</p>
                    </div>
                    {/* Close button on mobile */}
                    {isMobile() && (
                        <button onClick={() => setSidebarOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: '#aaa', display: 'flex', alignItems: 'center' }}>
                            <X size={18} />
                        </button>
                    )}
                </div>

                {/* Nav */}
                <nav style={S.nav}>
                    {tabs.map(({ id, label, icon: Icon }) => {
                        const active = activeTab === id;
                        return (
                            <button key={id} onClick={() => handleNavClick(id)} style={S.navBtn(active)}
                                onMouseEnter={e => { if (!active) e.currentTarget.style.background = '#f5f5f5'; }}
                                onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}>
                                <Icon size={16} color={active ? '#EAB308' : '#888'} />
                                {label}
                            </button>
                        );
                    })}
                </nav>

                {/* Bottom */}
                <div style={S.sidebarBottom}>
                    <button onClick={() => navigate('/app')} style={S.navBtn(false)}
                        onMouseEnter={e => e.currentTarget.style.background = '#f5f5f5'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        <ArrowRight size={15} color="#888" style={{ transform: 'rotate(180deg)' }} /> Back to App
                    </button>
                    <button onClick={async () => { await signOut(); navigate('/'); }} style={{ ...S.navBtn(false), color: '#ef4444' }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#fee2e2'; e.currentTarget.style.color = '#dc2626'; }} onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#ef4444'; }}>
                        <LogOut size={15} color="#ef4444" /> Sign Out
                    </button>
                </div>
            </aside>

            {/* Main */}
            <div style={S.main}>
                {/* Topbar */}
                <div style={S.topbar}>
                    {/* Hamburger — always visible on mobile */}
                    <button
                        onClick={() => setSidebarOpen(o => !o)}
                        className="admin-hamburger"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1e2d4a', marginRight: 8 }}
                        aria-label="Toggle sidebar"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                            <line x1="3" y1="6" x2="21" y2="6" />
                            <line x1="3" y1="12" x2="21" y2="12" />
                            <line x1="3" y1="18" x2="21" y2="18" />
                        </svg>
                    </button>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: 0, fontWeight: 900, color: '#1e2d4a', fontSize: 16, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{titles[activeTab]}</p>
                        <p style={{ margin: 0, fontSize: 11, color: '#aaa' }}>WageTrail Admin Dashboard</p>
                    </div>
                    <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#ede9fe', borderRadius: 20, padding: '4px 10px' }}>
                            <Shield size={12} color="#7c3aed" /><span style={{ fontSize: 11, fontWeight: 700, color: '#7c3aed' }}>Admin</span>
                        </div>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#24385E', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 12 }}>
                            {(user?.email?.[0] || 'A').toUpperCase()}
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div style={S.content}>
                    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
                        {activeTab === 'overview' && <OverviewTab setActiveTab={setActiveTab} />}
                        {activeTab === 'users' && <UsersTab />}
                        {activeTab === 'visitors' && <VisitorsTab />}
                        {activeTab === 'payments' && <PaymentsTab />}
                        {activeTab === 'analytics' && <AnalyticsTab />}
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
                .admin-hamburger { display: none !important; }
                @media (max-width: 768px) {
                    .admin-hamburger { display: flex !important; }
                }
                @media (max-width: 900px) {
                    .admin-grid4 { grid-template-columns: repeat(2, 1fr) !important; }
                    .admin-grid2 { grid-template-columns: 1fr !important; }
                }
                @media (max-width: 520px) {
                    .admin-grid4 { grid-template-columns: 1fr !important; }
                    .admin-content { padding: 14px !important; }
                    .admin-topbar { padding: 10px 14px !important; }
                }
                ::-webkit-scrollbar { width: 4px; height: 4px; }
                ::-webkit-scrollbar-track { background: transparent; }
                ::-webkit-scrollbar-thumb { background: #ddd; border-radius: 4px; }
            `}</style>
        </div>
    );
};

export default AdminDashboard;
