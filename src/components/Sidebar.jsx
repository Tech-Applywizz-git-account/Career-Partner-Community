import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    Briefcase,
    Settings,
    LayoutDashboard,
    Zap,
    Heart,
    User,
    CreditCard,
    Shield,
    PlayCircle,
    HelpCircle,
    LogOut,
    ListFilter
} from "lucide-react";
import useAuth from '../hooks/useAuth';

const Sidebar = ({ className = "", showHeader = true }) => {
    const { role, signOut } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const getActiveTab = () => {
        const path = location.pathname;
        if (path === '/' || path === '/jobs' || path === '/search' || path === '/app') return 'jobs';
        if (location.state?.initialTab) return location.state.initialTab;
        return 'overview';
    };

    const [activeTab, setActiveTab] = useState(() => getActiveTab());

    useEffect(() => {
        setActiveTab(getActiveTab());
    }, [location]);

    const isAdmin = role === "admin" || localStorage.getItem("userRole") === "admin";

    const tabs = [
        { id: "overview", label: "Overview", icon: LayoutDashboard },
        { id: "all_jobs", label: "All Jobs", icon: ListFilter },
        { id: "saved", label: "Saved Jobs", icon: Heart },
        { id: "applied", label: "Applied Jobs", icon: Briefcase },
        { id: "profile", label: "Profile", icon: User },
        { id: "billing", label: "Billing", icon: CreditCard },
    ];

    const handleTabClick = (tabId) => {
        setActiveTab(tabId);
        navigate('/dashboard', { state: { initialTab: tabId } });
    };

    const handleAdminClick = () => {
        navigate('/admin');
    };

    const handleLogout = async () => {
        await signOut();
        navigate('/');
    };

    if (!mounted) return null;

    return (
        <aside className={`flex h-full flex-col bg-white w-56 border-r border-[#f0f0f0] transition-all duration-300 ${className}`}>
            {/* Logo Section */}
            <div className="p-6 mb-2">
                <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
                    <div className="relative">
                        <div className="w-10 h-10 bg-[#24385E] rounded-xl flex items-center justify-center transform rotate-12 transition-transform hover:rotate-0">
                            <span className="text-white font-black text-xs tracking-tighter">H1-B</span>
                        </div>
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full border-2 border-white"></div>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-xl font-bold text-[#24385E] tracking-tight leading-none">Wage</span>
                        <span className="text-xl font-bold text-yellow-500 tracking-tight leading-none">Trail</span>
                    </div>
                </div>
            </div>

            {/* Navigation Section */}
            <nav className="flex-1 px-4 space-y-1">
                {/* Find Jobs Tab */}
                <button
                    onClick={() => navigate('/jobs')}
                    className={`group w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 
                        ${location.pathname === '/jobs' || location.pathname === '/app' || location.pathname === '/search'
                            ? "bg-[#fafafa] text-[#24385E] font-bold"
                            : "text-[#666666] hover:bg-[#fafafa] hover:text-[#24385E]"
                        }`}
                >
                    <div className={`p-1.5 rounded-lg transition-colors duration-200 ${location.pathname === '/jobs' || location.pathname === '/app' || location.pathname === '/search' ? "bg-white shadow-sm" : ""}`}>
                        <Briefcase
                            size={18}
                            className={`${location.pathname === '/jobs' || location.pathname === '/app' || location.pathname === '/search' ? "text-yellow-500" : "text-[#999999] group-hover:text-[#24385E]"} transition-colors`}
                        />
                    </div>
                    <span className="text-[14px]">Find Jobs</span>
                </button>

                {/* Restored Functional Tabs */}
                {tabs.map((tab) => {
                    const isActive = activeTab === tab.id && location.pathname === '/dashboard';
                    const Icon = tab.icon;

                    return (
                        <button
                            key={tab.id}
                            onClick={() => handleTabClick(tab.id)}
                            className={`group w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 
                                ${isActive
                                    ? "bg-[#fafafa] text-[#24385E] font-bold"
                                    : "text-[#666666] hover:bg-[#fafafa] hover:text-[#24385E]"
                                }`}
                        >
                            <div className={`p-1.5 rounded-lg transition-colors duration-200 ${isActive ? "bg-white shadow-sm" : ""}`}>
                                <Icon
                                    size={18}
                                    className={`${isActive ? "text-yellow-500" : "text-[#999999] group-hover:text-[#24385E]"} transition-colors`}
                                />
                            </div>
                            <span className="text-[14px]">{tab.label}</span>
                        </button>
                    );
                })}

                {/* Admin Panel Link — visible only for admins */}
                {isAdmin && (
                    <button
                        onClick={handleAdminClick}
                        className={`group w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 mt-2
                            ${location.pathname === '/admin'
                                ? "bg-purple-50 text-purple-700 font-bold"
                                : "text-[#666666] hover:bg-purple-50 hover:text-purple-700"
                            }`}
                    >
                        <div className={`p-1.5 rounded-lg transition-colors duration-200 ${location.pathname === '/admin' ? "bg-white shadow-sm" : ""}`}>
                            <Shield
                                size={18}
                                className={`${location.pathname === '/admin' ? "text-purple-600" : "text-[#999999] group-hover:text-purple-600"} transition-colors`}
                            />
                        </div>
                        <span className="text-[14px]">Admin Panel</span>
                        <span className="ml-auto text-[9px] font-black uppercase tracking-widest bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded-full">Admin</span>
                    </button>
                )}
            </nav>

            {/* Footer Section */}
            <div className="px-4 pb-6 space-y-4">
                <div className="bg-[#fffbeb] border border-[#fef3c7] rounded-xl p-4 cursor-pointer hover:shadow-sm transition-shadow group">
                    <div className="flex items-center gap-2 mb-1.5">
                        <div className="p-1.5 bg-yellow-400 rounded-lg">
                            <Zap size={14} className="text-[#24385E] fill-current" />
                        </div>
                        <span className="text-[13px] font-bold text-[#24385E]">Tired of applying?</span>
                    </div>
                    <div className="text-[11px] text-[#92400e] font-medium leading-relaxed">
                        Get automated applications and double your interview rate.
                    </div>
                </div>

                <div className="pt-2 space-y-1">
                    <button className="w-full flex items-center gap-3 px-3 py-2 text-[#666666] hover:text-[#24385E] transition-colors rounded-lg group">
                        <PlayCircle size={18} className="text-[#999999] group-hover:text-[#24385E]" />
                        <span className="text-[13px] font-medium">Start Tour</span>
                    </button>
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-3 py-2 text-[#666666] hover:text-red-600 transition-colors rounded-lg group"
                    >
                        <LogOut size={18} className="text-[#999999] group-hover:text-red-500" />
                        <span className="text-[13px] font-medium">Logout</span>
                    </button>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;