import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import { Loader2 } from "lucide-react";

// Components
import Sidebar from "../components/Sidebar";
import AppHeader from "../components/AppHeader";
import AdminOverview from "../components/AdminOverview";
import UserOverview from "../components/UserOverview";
import AllJobsTab from "../components/AllJobsTab";
import SavedJobsTab from "../components/SavedJobsTab";
import AppliedJobsTab from "../components/AppliedJobsTab";
import BillingTab from "../components/BillingTab";
import ProfileTab from "../components/ProfileTab";

const Dashboard = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, loading, isAdmin, checkingSub } = useAuth();

    const [activeTab, setActiveTab] = useState(location.state?.initialTab || "overview");
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

    useEffect(() => {
        if (location.state?.initialTab && location.state.initialTab !== activeTab) {
            setActiveTab(location.state.initialTab);
        }
    }, [location.state, activeTab]);

    useEffect(() => {
        if (!loading && !user) {
            navigate("/login");
        }
    }, [loading, user, navigate]);

    // Close sidebar on tab change (mobile)
    useEffect(() => {
        setMobileSidebarOpen(false);
    }, [activeTab]);

    if (loading || checkingSub) {
        return (
            <div className="h-screen w-screen flex items-center justify-center bg-[#fafafa]">
                <Loader2 className="w-10 h-10 text-yellow-500 animate-spin" />
            </div>
        );
    }

    const renderContent = () => {
        switch (activeTab) {
            case "overview":
            case "dashboard":
                return isAdmin ? <AdminOverview /> : <UserOverview />;
            case "all_jobs":
                return <AllJobsTab />;
            case "saved":
                return <SavedJobsTab />;
            case "applied":
                return <AppliedJobsTab />;
            case "profile":
            case "settings":
                return <ProfileTab />;
            case "billing":
                return <BillingTab />;
            case "admin":
                return <AdminOverview />;
            default:
                return isAdmin ? <AdminOverview /> : <UserOverview />;
        }
    };

    const getTitle = () => {
        const labels = {
            overview: 'Dashboard Overview',
            dashboard: 'Dashboard Overview',
            all_jobs: 'All Sponsored Jobs',
            saved: 'Saved Jobs',
            applied: 'Applied Jobs',
            profile: 'Profile Settings',
            billing: 'Billing & Subscription',
            settings: 'Account Settings',
            admin: 'Admin Controls'
        };
        return labels[activeTab] || 'Dashboard';
    };

    return (
        <div className="flex h-screen bg-[#fafafa] overflow-hidden relative">
            {/* Sidebar with mobile support */}
            <div className={`
                fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out bg-white 
                md:relative md:translate-x-0
                ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
            </div>

            {/* Mobile Sidebar Overlay */}
            {mobileSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/20 z-40 md:hidden backdrop-blur-sm"
                    onClick={() => setMobileSidebarOpen(false)}
                />
            )}

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
                <AppHeader
                    title={getTitle()}
                    onMenuClick={() => setMobileSidebarOpen(true)}
                />

                {/* Scrollable Container */}
                <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#fcfcfc]">
                    <div className="p-4 md:p-8 max-w-7xl mx-auto w-full">
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {renderContent()}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
