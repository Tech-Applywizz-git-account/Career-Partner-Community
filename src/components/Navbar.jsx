import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, LogOut, User, LayoutDashboard, ChevronDown, Search, Heart, Briefcase, CreditCard, Shield } from 'lucide-react';
import useAuth from '../hooks/useAuth';

const Navbar = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [showResourcesMenu, setShowResourcesMenu] = useState(false);
    const resourcesRef = useRef(null);

    const navigate = useNavigate();
    const location = useLocation();
    const { user, role, loggingOut, signOut } = useAuth();

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (resourcesRef.current && !resourcesRef.current.contains(e.target)) {
                setShowResourcesMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSectionClick = (sectionId) => {
        if (location.pathname !== '/') {
            navigate('/');
            setTimeout(() => {
                document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
            }, 100);
        } else {
            document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
        }
        setIsMenuOpen(false);
    };

    const handleLogout = async () => {
        setShowDropdown(false);
        setIsMenuOpen(false);
        await signOut();
        navigate("/", { replace: true });
    };

    const handleDashboardClick = () => {
        setShowDropdown(false);
        setIsMenuOpen(false);
        navigate("/dashboard");
    };

    return (
        <nav className="sticky top-0 z-50 bg-[#24385E] border-b border-white/5 shadow-2xl">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* -------- Desktop Layout -------- */}
                <div className="hidden md:flex justify-between items-center h-16 w-full">

                    {/* LEFT — Logo */}
                    <Link to={user ? "/app" : "/"} className="flex items-center gap-2 flex-shrink-0">
                        <div className="flex items-center gap-2">
                            <img src="/cp-logo.png" alt="Career Partner" className="h-8 w-auto" />
                            <span className="font-bold text-lg text-white tracking-tight">Career Partner</span>
                        </div>
                    </Link>

                    {/* CENTER Nav */}
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => {
                                if (!user) {
                                    navigate('/signup');
                                } else {
                                    navigate('/jobs');
                                }
                            }}
                            className={`text-sm font-medium transition-colors px-3 py-2 rounded-md hover:bg-white/5 ${location.pathname === '/jobs' ? 'text-[#FDB913] bg-white/5' : 'text-gray-300 hover:text-white'}`}
                        >
                            Find Jobs
                        </button>
                    </div>

                    {/* RIGHT — Login / Profile */}
                    <div className="relative flex items-center gap-3">
                        {!useAuth().loading && (
                            !user ? (
                                <div className="flex items-center gap-3">
                                    <Link
                                        to="/login"
                                        className="text-gray-300 text-sm font-medium hover:text-white transition-colors px-3 py-2"
                                    >
                                        Login
                                    </Link>
                                    <Link
                                        to="/signup"
                                        className="bg-[#FDB913] hover:bg-[#e5a811] text-black text-sm font-bold px-5 py-2 rounded-full transition-all shadow-[0_0_15px_rgba(253,185,19,0.3)]"
                                    >
                                        Get Access
                                    </Link>
                                </div>
                            ) : (
                                <>
                                    <button
                                        onClick={() => setShowDropdown(!showDropdown)}
                                        className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                                    >
                                        <User size={18} className="text-gray-700" />
                                    </button>

                                    {showDropdown && (
                                        <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-200 shadow-lg rounded-xl py-2">
                                            <button
                                                onClick={() => { setShowDropdown(false); navigate('/app'); }}
                                                className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 text-gray-700"
                                            >
                                                <LayoutDashboard size={16} className="text-gray-500" />
                                                <span className="text-sm font-medium">{role === "admin" ? "Admin Dashboard" : "My Dashboard"}</span>
                                            </button>
                                            <div className="mx-3 my-1 border-t border-gray-100"></div>
                                            <button
                                                onClick={handleLogout}
                                                disabled={loggingOut}
                                                className="w-full flex items-center gap-3 px-4 py-2 hover:bg-red-50 text-red-600 disabled:opacity-50"
                                            >
                                                {loggingOut ? (
                                                    <>
                                                        <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                                                        <span className="text-sm font-medium">Logging out...</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <LogOut size={16} />
                                                        <span className="text-sm font-medium">Logout</span>
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    )}
                                </>
                            )
                        )}
                    </div>
                </div>

                {/* -------- Mobile Layout -------- */}
                <div className="md:hidden flex justify-between items-center h-14">
                    <Link to={user ? "/app" : "/"} className="flex items-center gap-2">
                        <img src="/cp-logo.png" alt="Career Partner" className="h-6 w-auto" />
                        <span className="font-bold text-base text-white tracking-tight">Career Partner</span>
                    </Link>

                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="p-2 rounded-lg hover:bg-white/5 transition-colors"
                    >
                        {isMenuOpen ? <X size={22} className="text-white" /> : <Menu size={22} className="text-white" />}
                    </button>
                </div>
            </div>

            {/* -------- Mobile Dropdown -------- */}
            {isMenuOpen && (
                <div className="md:hidden bg-[#0A0A0A] border-t border-white/5 px-4 py-4 space-y-1">
                    <button
                        onClick={() => {
                            if (!user) {
                                navigate('/signup');
                            } else {
                                navigate('/jobs');
                            }
                            setIsMenuOpen(false);
                        }}
                        className="block w-full text-left text-sm text-gray-300 font-medium hover:text-white py-2.5 border-b border-white/5"
                    >
                        Find Jobs
                    </button>

                    <div className="pt-3 mt-2">
                        {user ? (
                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <p className="px-3 text-[10px] font-black uppercase tracking-widest text-[#FDB913]/60 mb-2">My Account</p>
                                    {[
                                        { id: "all-jobs", label: "Find Jobs", icon: Search, type: "link", path: "/jobs" },
                                        { id: "overview", label: "Overview", icon: LayoutDashboard },
                                        { id: "saved", label: "Saved Jobs", icon: Heart },
                                        { id: "applied", label: "Applied Jobs", icon: Briefcase },
                                        { id: "profile", label: "Profile", icon: User },
                                        ...(role === "admin" ? [{ id: "admin", label: "Admin Controls", icon: Shield }] : []),
                                    ].map((tab) => (
                                        <button
                                            key={tab.id}
                                            onClick={() => {
                                                if (tab.type === "link") {
                                                    navigate(tab.path);
                                                } else {
                                                    navigate("/app", { state: { initialTab: tab.id } });
                                                }
                                                setIsMenuOpen(false);
                                            }}
                                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-300 font-bold hover:bg-white/5 transition-colors"
                                        >
                                            <tab.icon size={18} className={tab.id === "all-jobs" ? "text-[#FDB913]" : "text-gray-400"} />
                                            <span className="text-sm">{tab.label}</span>
                                        </button>
                                    ))}
                                </div>

                                <div className="pt-2 border-t border-white/5">
                                    <button
                                        onClick={handleLogout}
                                        disabled={loggingOut}
                                        className="w-full flex items-center gap-3 px-3 py-2.5 text-red-500 font-bold hover:bg-red-500/10 rounded-xl transition-colors disabled:opacity-50"
                                    >
                                        <LogOut size={18} />
                                        <span className="text-sm">{loggingOut ? 'Logging out...' : 'Logout'}</span>
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-3">
                                <Link
                                    to="/login"
                                    className="block text-center py-2.5 text-sm text-gray-300 font-medium hover:text-white border border-white/10 rounded-lg"
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    Login
                                </Link>
                                <Link
                                    to="/signup"
                                    className="block text-center bg-[#FDB913] hover:bg-[#e5a811] text-black text-sm font-bold py-3 rounded-lg shadow-lg"
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    Get Access
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
};

export default Navbar;
