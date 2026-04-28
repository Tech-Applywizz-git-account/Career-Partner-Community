import React, { useState, useEffect } from 'react';
import { MapPin, Briefcase, FileText, Search, X, ChevronDown } from 'lucide-react';
import { supabase } from '../supabaseClient';

const defaultOptions = {
    role: ['Software Engineer', 'Software Developer', 'Data Engineer', 'Data Analyst', 'Data Scientist', 'GenAI', 'AI Engineer', 'DevOps', 'Supply Chain', 'Healthcare'],
    location: ['Seattle, WA', 'San Francisco, CA', 'Austin, TX', 'New York, NY', 'Chicago, IL', 'Cincinnati, OH'],
    company: ['Microsoft', 'Amazon', 'Apple', 'Nvidia', 'JP Morgan', 'US Bank', 'Oracle', 'Meta'],
    experience: ['0-4 years', '5-7 years', '8-11 years'],
};

const tabs = [
    { id: 'role', label: 'Role', icon: Briefcase },
    { id: 'location', label: 'Location', icon: MapPin },
    { id: 'company', label: 'Company', icon: FileText },
    { id: 'experience', label: 'Experience', icon: Briefcase },
];

const SearchFilters = ({ onFilterChange }) => {
    const [activeTab, setActiveTab] = useState('role');
    const [showFilters, setShowFilters] = useState(false);

    const [activeFilters, setActiveFilters] = useState({
        role: [],
        location: [],
        company: [],
        experience: [],
    });

    const [filterOptions, setFilterOptions] = useState(defaultOptions);

    // No need to fetch filter options if they are hardcoded
    useEffect(() => {
        // Experience options are already set in defaultOptions
        // If we needed to fetch dynamic options, we would do it here with appropriate limits or distinct queries
    }, []);

    const [showLocationInput, setShowLocationInput] = useState(false);
    const [customLocation, setCustomLocation] = useState('');

    const [showRoleInput, setShowRoleInput] = useState(false);
    const [customRole, setCustomRole] = useState('');

    const [showCompanyInput, setShowCompanyInput] = useState(false);
    const [customCompany, setCustomCompany] = useState('');

    const [showExperienceInput, setShowExperienceInput] = useState(false);
    const [customExperience, setCustomExperience] = useState('');

    // Suggestion State
    const [suggestions, setSuggestions] = useState([]);
    const [searchTimeout, setSearchTimeout] = useState(null);

    const handleSearchInput = (value, category) => {
        if (searchTimeout) clearTimeout(searchTimeout);

        const timeoutId = setTimeout(async () => {
            if (!value || value.length < 2) {
                setSuggestions([]);
                return;
            }

            const columnMap = {
                role: 'role', // Use the shorter 'role' column from the view
                location: 'location',
                company: 'company',
                experience: 'years_exp_required'
            };
            const column = columnMap[category];

            try {
                const { data, error } = await supabase
                    .from('confirmed_jobs_view')
                    .select(column)
                    .ilike(column, `%${value}%`)
                    .limit(50);

                if (data) {
                    const values = data.map(item => item[column]).filter(Boolean);
                    const uniqueValues = [...new Set(values.map(v => v.trim()))];
                    setSuggestions(uniqueValues.slice(0, 10));
                }
            } catch (err) {
                console.error("Error fetching suggestions:", err);
            }
        }, 300);

        setSearchTimeout(timeoutId);
    };

    const handleCustomLocationSubmit = (e) => {
        if (e.key === 'Enter' && customLocation.trim()) {
            toggleFilter('location', customLocation.trim());
            setCustomLocation('');
            setShowLocationInput(false);
        }
    };

    const handleCustomRoleSubmit = (e) => {
        if (e.key === 'Enter' && customRole.trim()) {
            toggleFilter('role', customRole.trim());
            setCustomRole('');
            setShowRoleInput(false);
        }
    };

    const handleCustomCompanySubmit = (e) => {
        if (e.key === 'Enter' && customCompany.trim()) {
            toggleFilter('company', customCompany.trim());
            setCustomCompany('');
            setShowCompanyInput(false);
        }
    };

    const handleCustomExperienceSubmit = (e) => {
        if (e.key === 'Enter' && customExperience.trim()) {
            toggleFilter('experience', customExperience.trim());
            setCustomExperience('');
            setShowExperienceInput(false);
        }
    };

    const toggleFilter = (category, value) => {
        setActiveFilters(prev => {
            const newState = {
                ...prev,
                [category]: prev[category].includes(value)
                    ? prev[category].filter(v => v !== value)
                    : [...prev[category], value],
            };
            if (onFilterChange) onFilterChange(newState);
            return newState;
        });
    };

    const removeFilter = (category, value) => {
        setActiveFilters(prev => {
            const newState = {
                ...prev,
                [category]: prev[category].filter(v => v !== value),
            };
            if (onFilterChange) onFilterChange(newState);
            return newState;
        });
    };

    const isFilterActive = (category, value) => activeFilters[category].includes(value);

    const allActiveFilters = Object.entries(activeFilters).flatMap(([category, values]) =>
        values.map(value => ({ category, value })),
    );

    return (
        <div className="bg-white border-b border-gray-50 mb-6 font-display">
            <div className="w-full py-2">
                {/* Tabs */}
                <div className="flex justify-center items-center space-x-1 md:space-x-2 max-w-[1400px] mx-auto px-4 overflow-x-auto no-scrollbar">
                    {tabs.map(tab => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`inline-flex items-center gap-2 px-4 md:px-6 py-3 md:py-4 border-b-[3px] font-black text-[11px] md:text-xs uppercase tracking-wider whitespace-nowrap transition-all ${isActive
                                    ? 'text-[#24385E] border-[#24385E]'
                                    : 'text-gray-300 hover:text-gray-500 border-transparent hover:border-gray-100'
                                    }`}
                            >
                                <Icon size={16} />
                                <span>{tab.label}</span>
                            </button>
                        );
                    })}

                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="ml-2 p-2 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        <ChevronDown
                            size={18}
                            className={`text-gray-400 transition-transform ${showFilters ? 'rotate-180' : ''}`}
                        />
                    </button>
                </div>

                {/* Pills */}
                {showFilters && (
                    <div className="py-5 bg-gray-50/50 animate-in fade-in slide-in-from-top-2 duration-300">
                        {/* 1️⃣ TOP OPTIONS (Pills) */}
                        <div className="flex flex-wrap gap-2 justify-center max-w-[1400px] mx-auto px-4 mb-4">
                            {(activeTab === 'location' ? filterOptions.location.slice(0, 5)
                                : activeTab === 'role' ? filterOptions.role
                                    : activeTab === 'company' ? filterOptions.company.slice(0, 8)
                                        : filterOptions.experience
                            ).map(option => (
                                <button
                                    key={option}
                                    onClick={() => toggleFilter(activeTab, option)}
                                    className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold border transition-all 
                                    ${isFilterActive(activeTab, option)
                                            ? 'bg-[#24385E] border-[#24385E] text-white shadow-md'
                                            : 'bg-white hover:bg-gray-100 text-gray-600 border-gray-200'
                                        }`}
                                >
                                    {option}
                                </button>
                            ))}
                        </div>

                        {/* 2️⃣ SEARCH INPUT (Separate Line, Last) */}
                        <div className="flex justify-center max-w-[1400px] mx-auto px-4 w-full relative z-10">
                            {/* Suggestion Dropdown Helper */}
                            {suggestions.length > 0 && (
                                <div className="absolute bottom-full mb-2 w-64 bg-white border border-gray-100 rounded-xl shadow-xl overflow-hidden z-20">
                                    {suggestions.map((suggestion, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => {
                                                toggleFilter(activeTab, suggestion);
                                                setSuggestions([]);
                                                // Clear local inputs
                                                if (activeTab === 'location') { setCustomLocation(''); setShowLocationInput(false); }
                                                if (activeTab === 'role') { setCustomRole(''); setShowRoleInput(false); }
                                                if (activeTab === 'company') { setCustomCompany(''); setShowCompanyInput(false); }
                                                if (activeTab === 'experience') { setCustomExperience(''); setShowExperienceInput(false); }
                                            }}
                                            className="w-full text-left px-4 py-2.5 text-xs text-gray-700 hover:bg-gray-50 hover:text-[#24385E] font-medium transition-colors"
                                        >
                                            {suggestion}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {activeTab === 'location' && (
                                showLocationInput ? (
                                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-[#24385E] rounded-lg shadow-sm w-64">
                                        <input
                                            type="text"
                                            autoFocus
                                            value={customLocation}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                setCustomLocation(val);
                                                handleSearchInput(val, 'location');
                                            }}
                                            onKeyDown={handleCustomLocationSubmit}
                                            onBlur={() => setTimeout(() => setShowLocationInput(false), 200)} // Delay for click
                                            placeholder="Type location..."
                                            className="outline-none text-xs text-gray-700 w-full font-medium"
                                        />
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => setShowLocationInput(true)}
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 text-gray-500 rounded-lg text-xs font-bold border border-gray-200 transition-all"
                                    >
                                        <Search size={14} className="text-gray-400" />
                                        <span>Other locations</span>
                                    </button>
                                )
                            )}

                            {activeTab === 'role' && (
                                showRoleInput ? (
                                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-[#24385E] rounded-lg shadow-sm w-64">
                                        <input
                                            type="text"
                                            autoFocus
                                            value={customRole}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                setCustomRole(val);
                                                handleSearchInput(val, 'role');
                                            }}
                                            onKeyDown={handleCustomRoleSubmit}
                                            onBlur={() => setTimeout(() => setShowRoleInput(false), 200)}
                                            placeholder="Type role..."
                                            className="outline-none text-xs text-gray-700 w-full font-medium"
                                        />
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => setShowRoleInput(true)}
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 text-gray-500 rounded-lg text-xs font-bold border border-gray-200 transition-all"
                                    >
                                        <Search size={14} className="text-gray-400" />
                                        <span>Other roles</span>
                                    </button>
                                )
                            )}

                            {activeTab === 'company' && (
                                showCompanyInput ? (
                                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-[#24385E] rounded-lg shadow-sm w-64">
                                        <input
                                            type="text"
                                            autoFocus
                                            value={customCompany}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                setCustomCompany(val);
                                                handleSearchInput(val, 'company');
                                            }}
                                            onKeyDown={handleCustomCompanySubmit}
                                            onBlur={() => setTimeout(() => setShowCompanyInput(false), 200)}
                                            placeholder="Type company..."
                                            className="outline-none text-xs text-gray-700 w-full font-medium"
                                        />
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => setShowCompanyInput(true)}
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 text-gray-500 rounded-lg text-xs font-bold border border-gray-200 transition-all"
                                    >
                                        <Search size={14} className="text-gray-400" />
                                        <span>Other companies</span>
                                    </button>
                                )
                            )}

                            {activeTab === 'experience' && (
                                showExperienceInput ? (
                                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-[#24385E] rounded-lg shadow-sm w-64">
                                        <input
                                            type="text"
                                            autoFocus
                                            value={customExperience}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                setCustomExperience(val);
                                                handleSearchInput(val, 'experience');
                                            }}
                                            onKeyDown={handleCustomExperienceSubmit}
                                            onBlur={() => setTimeout(() => setShowExperienceInput(false), 200)}
                                            placeholder="Type experience..."
                                            className="outline-none text-xs text-gray-700 w-full font-medium"
                                        />
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => setShowExperienceInput(true)}
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 text-gray-500 rounded-lg text-xs font-bold border border-gray-200 transition-all"
                                    >
                                        <Search size={14} className="text-gray-400" />
                                        <span>Other experience</span>
                                    </button>
                                )
                            )}
                        </div>
                    </div>
                )}

                {/* Active Filters */}
                {allActiveFilters.length > 0 && (
                    <div className="py-4 border-t border-gray-50 bg-white">
                        <div className="flex items-center gap-3 flex-wrap justify-center max-w-[1400px] mx-auto px-4">
                            <span className="text-[10px] font-black uppercase tracking-widest text-[#24385E]">Active Filters:</span>

                            {allActiveFilters.map(({ category, value }) => (
                                <span
                                    key={`${category}-${value}`}
                                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 border border-indigo-100 rounded-lg text-xs font-bold text-indigo-700 shadow-sm"
                                >
                                    {category === 'role' && <Briefcase size={12} />}
                                    {category === 'location' && <MapPin size={12} />}
                                    {category === 'company' && <FileText size={12} />}
                                    {category === 'experience' && <Briefcase size={12} />}

                                    <span>{value}</span>

                                    <button
                                        onClick={() => removeFilter(category, value)}
                                        className="hover:text-red-500 transition-colors cursor-pointer ml-1"
                                    >
                                        <X size={14} />
                                    </button>
                                </span>
                            ))}
                            <button
                                onClick={() => {
                                    setActiveFilters({ role: [], location: [], company: [], experience: [] });
                                    if (onFilterChange) onFilterChange({ role: [], location: [], company: [], experience: [] });
                                }}
                                className="text-[10px] font-black uppercase tracking-widest text-red-500 hover:text-red-700 ml-2"
                            >
                                Clear All
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SearchFilters;
