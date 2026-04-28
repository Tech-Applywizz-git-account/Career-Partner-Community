import React, { useState, useRef, useEffect } from 'react';
import { User, Home, LogOut, ChevronDown, Menu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

const AppHeader = ({ title = "Job Board", onMenuClick }) => {
    const { user, signOut } = useAuth();
    const navigate = useNavigate();
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = async () => {
        await signOut();
        navigate('/');
    };

    return (
        <header className="h-[70px] bg-white border-b border-[#f0f0f0] flex items-center justify-between px-4 md:px-8 sticky top-0 z-40">
            <div className="flex items-center gap-4 md:gap-6">
                <button
                    onClick={onMenuClick}
                    className="p-2 -ml-2 hover:bg-gray-100 rounded-lg md:hidden text-[#24385E]"
                >
                    <Menu size={24} />
                </button>
                <h1 className="text-[14px] md:text-[15px] font-black text-[#24385E] tracking-tight truncate max-w-[150px] md:max-w-none">{title}</h1>
                <a
                    href="https://consulting.wagetrail.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hidden lg:flex flex-col items-center gap-0.5 bg-[#FDB913] text-black px-4 py-1.5 rounded-xl text-[10px] font-black border border-[#FDB913]/30 hover:bg-[#e5a811] transition-all ml-4 group shadow-lg shadow-[#FDB913]/10"
                >
                    <span className="leading-none">Get Expert Guidance</span>
                    <span className="opacity-60 text-[9px] group-hover:opacity-100">$34.99/hr</span>
                </a>
            </div>

            <div className="flex items-center gap-4 relative" ref={dropdownRef}>
                <button
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="flex items-center gap-2 p-1.5 pr-3 hover:bg-[#fafafa] rounded-xl transition-all border border-transparent hover:border-[#f0f0f0] group"
                >
                    <div className="w-9 h-9 bg-[#24385E] rounded-lg flex items-center justify-center text-white shadow-lg overflow-hidden">
                        <User size={20} />
                    </div>
                    <div className="hidden md:block text-left">
                        <p className="text-[12px] font-black text-[#24385E] leading-none mb-0.5">{user?.email?.split('@')[0] || 'User'}</p>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider leading-none">Premium Account</p>
                    </div>
                    <ChevronDown size={14} className={`text-gray-400 transition-transform duration-300 ${showDropdown ? 'rotate-180' : ''}`} />
                </button>

                {/* Profile Dropdown */}
                {showDropdown && (
                    <div className="absolute top-[calc(100%+8px)] right-0 w-48 bg-white border border-[#f0f0f0] rounded-2xl shadow-xl py-2 animate-in fade-in slide-in-from-top-2 duration-200 z-50">
                        <button
                            onClick={() => navigate('/')}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] font-bold text-gray-700 hover:bg-[#fafafa] hover:text-[#24385E] transition-all"
                        >
                            <Home size={16} />
                            Home
                        </button>
                        <div className="mx-2 my-1 border-t border-[#f0f0f0]"></div>
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] font-bold text-red-500 hover:bg-red-50 transition-all"
                        >
                            <LogOut size={16} />
                            Logout
                        </button>
                    </div>
                )}
            </div>
        </header>
    );
};

export default AppHeader;
