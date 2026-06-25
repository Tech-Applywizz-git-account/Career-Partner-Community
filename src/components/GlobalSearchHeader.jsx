import React, { useState, useEffect } from 'react';
import { Calendar, Clock, X, ChevronRight, Globe, LayoutGrid, List } from 'lucide-react';
import { getAvailableCountries } from '../utils/countryHelper';

const DEFAULT_COUNTRIES = [
  { id: 'USA', name: 'United States', flagCode: 'us' },
  { id: 'UK', name: 'United Kingdom', flagCode: 'gb' },
  { id: 'UNITEDARABEMIRATES', name: 'United Arab Emirates', flagCode: 'ae' },
  { id: 'CANADA', name: 'Canada', flagCode: 'ca' },
  { id: 'INDIA', name: 'India', flagCode: 'in' },
  { id: 'IRELAND', name: 'Ireland', flagCode: 'ie' },
];

const GlobalSearchHeader = ({ selectedCountry, onCountryChange, dateRange, onDateRangeChange, viewMode, onViewModeChange, showHRFinder, isHRFinderActive, onHRFinderToggle }) => {
  const activeCountries = Array.isArray(selectedCountry) ? selectedCountry : (selectedCountry ? [selectedCountry] : []);
  const [countries, setCountries] = useState(DEFAULT_COUNTRIES);
  const [showAllCountries, setShowAllCountries] = useState(false);
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  // Derive active quick date from prop
  const quickDate = dateRange?.quickDate || 'all';

  // Compute { from, to } ISO date strings for a quick filter id
  const computeRange = (id) => {
    const today = new Date();
    const fmt = (d) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };

    if (id === 'today') return { quickDate: 'today', from: fmt(today), to: fmt(today) };
    if (id === '7days') { const s = new Date(today); s.setDate(s.getDate() - 6); return { quickDate: '7days', from: fmt(s), to: fmt(today) }; }
    if (id === 'lastmonth') { const s = new Date(today); s.setMonth(s.getMonth() - 1); return { quickDate: 'lastmonth', from: fmt(s), to: fmt(today) }; }
    return { quickDate: 'all', from: null, to: null };
  };

  const handleQuickDate = (id) => {
    const range = computeRange(id);
    onDateRangeChange?.(range);
    // Clear custom inputs when a quick filter is selected
    if (id !== 'custom') { setCustomFrom(''); setCustomTo(''); }
  };

  const handleCustomFrom = (e) => {
    const val = e.target.value;
    setCustomFrom(val);
    if (val) onDateRangeChange?.({ quickDate: 'custom', from: val, to: customTo || null });
  };

  const handleCustomTo = (e) => {
    const val = e.target.value;
    setCustomTo(val);
    if (customFrom) onDateRangeChange?.({ quickDate: 'custom', from: customFrom, to: val || null });
  };

  useEffect(() => {
    const loadCountries = async () => {
      const available = await getAvailableCountries();
      if (available && available.length > 0) {
        setCountries(available);
      }
    };
    loadCountries();
  }, []);

  const handleCountryClick = (id) => {
    const isSelected = activeCountries.includes(id);
    let newVal;
    if (isSelected) {
      newVal = activeCountries.filter(c => c !== id);
    } else {
      newVal = [...activeCountries, id];
    }
    onCountryChange?.(newVal);
  };

  const handleClearAll = () => {
    onCountryChange?.([]);
    onDateRangeChange?.(computeRange('all'));
    setCustomFrom('');
    setCustomTo('');
  };

  const selectedCountryObjects = countries.filter(c => activeCountries.includes(c.id));

  // Logic to show limited countries
  const INITIAL_COUNT = 7;
  const displayedCountries = Array.isArray(countries)
    ? (showAllCountries ? countries : countries.slice(0, INITIAL_COUNT))
    : [];

  // If active countries are NOT in the displayed list, we should probably inject them
  const hiddenSelected = countries.filter(c => activeCountries.includes(c.id) && !displayedCountries.some(dc => dc.id === c.id));

  const finalDisplay = [...displayedCountries, ...hiddenSelected];

  // Final safety filter to remove any undefined/null entries and duplicates
  const safeDisplay = Array.from(new Set(finalDisplay.filter(Boolean).map(c => c.id)))
    .map(id => finalDisplay.find(c => c.id === id));

  const remainingCount = Math.max(0, countries.length - displayedCountries.length);

  return (
    <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm p-6 mb-8">
      {/* Country Selection */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-400">
          Showing: <span className="text-[#1E1E1E] font-bold">
            {selectedCountryObjects.length > 0
              ? (selectedCountryObjects.length === 1
                ? selectedCountryObjects[0].name
                : `${selectedCountryObjects.length} Countries Selected`)
              : 'All Countries'}
          </span>
        </div>
        <button
          onClick={handleClearAll}
          className="text-[#2C76FF] text-xs font-bold hover:underline"
        >
          Clear All
        </button>
      </div>

      <div className="flex flex-wrap gap-3 mb-8">
        {safeDisplay.map((c) => (
          <button
            key={c.id}
            onClick={() => handleCountryClick(c.id)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-bold transition-all border"
            style={activeCountries.includes(c.id) ? {
              backgroundColor: '#2C76FF',
              color: '#FFFFFF',
              borderColor: '#2C76FF',
              boxShadow: '0 4px 6px rgba(44, 118, 255, 0.2)'
            } : {
              backgroundColor: '#FFFFFF',
              color: '#1E1E1E',
              borderColor: '#E2E8F0'
            }}
          >
            <img
              src={`https://flagcdn.com/w40/${c.flagCode}.png`}
              alt={c.name}
              className="w-5 h-3.5 object-cover rounded-sm shadow-sm"
            />
            {c.name}
            {activeCountries.includes(c.id) && <X size={14} className="ml-1 opacity-60" />}
          </button>
        ))}

        {countries.length > INITIAL_COUNT && (
          <button
            onClick={() => setShowAllCountries(!showAllCountries)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-bold bg-gray-50 text-gray-500 border border-gray-200 hover:bg-gray-100 transition-all"
          >
            {showAllCountries ? 'Show Less' : `+${remainingCount} more`}
          </button>
        )}
      </div>

      <div className="h-px bg-gray-100 mb-6" />

      {/* Date Range Section */}
      <div className="flex flex-wrap items-center justify-between gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 w-full sm:w-auto">
          <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest shrink-0">
            <Calendar size={14} className="text-[#2C76FF]" /> DATE RANGE
          </div>

          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-tight">From</span>
              <input
                type="date"
                value={customFrom}
                onChange={handleCustomFrom}
                className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-[13px] font-bold text-[#1E1E1E] outline-none focus:border-[#2C76FF] focus:ring-1 focus:ring-[#2C76FF] transition-all w-full sm:w-auto"
              />
            </div>

            <ChevronRight size={14} className="text-gray-300 hidden sm:block" />

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-tight">To</span>
              <input
                type="date"
                value={customTo}
                onChange={handleCustomTo}
                className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-[13px] font-bold text-[#1E1E1E] outline-none focus:border-[#2C76FF] focus:ring-1 focus:ring-[#2C76FF] transition-all w-full sm:w-auto"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center bg-gray-50 p-1 rounded-xl border border-gray-200">
          {[
            { id: 'all', label: 'All', icon: <Globe size={14} /> },
            { id: 'today', label: 'Today' },
            { id: '7days', label: 'Last 7 Days' },
            { id: 'lastmonth', label: 'Last Month' },
          ].map((d) => (
            <button
              key={d.id}
              onClick={() => handleQuickDate(d.id)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black transition-all"
              style={quickDate === d.id ? {
                backgroundColor: '#2C76FF',
                color: '#FFFFFF',
                border: '1px solid #2C76FF',
                boxShadow: '0 2px 4px rgba(44, 118, 255, 0.2)'
              } : {
                backgroundColor: 'transparent',
                color: '#6B7280', // text-gray-500
              }}
            >
              {d.icon && <span style={{ color: quickDate === d.id ? '#FFFFFF' : 'inherit' }}>{d.icon}</span>}
              {d.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-gray-50 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Current Selection:</div>
          <div className="flex flex-wrap gap-2">
            {selectedCountryObjects.length > 0 ? (
              selectedCountryObjects.map(c => (
                <div key={c.id} className="bg-[#2C76FF]/10 px-3 py-1 rounded-full text-[11px] font-black text-[#2C76FF] flex items-center gap-2 border border-[#2C76FF]/20">
                  <img
                    src={`https://flagcdn.com/w20/${c.flagCode}.png`}
                    alt="flag"
                    className="w-3.5 h-2.5 object-cover rounded-[1px]"
                  />
                  {c.name}
                </div>
              ))
            ) : (
              <div className="bg-[#2C76FF]/10 px-3 py-1 rounded-full text-[11px] font-black text-[#2C76FF] flex items-center gap-2 border border-[#2C76FF]/20">
                <Globe size={12} className="text-[#2C76FF]" />
                All Countries
              </div>
            )}
          </div>
          <div className="text-[11px] font-black text-[#1E1E1E]">
            {(() => {
              const range = dateRange;
              if (!range || range.quickDate === 'all' || (!range.from && !range.to)) {
                return "All Time";
              }
              if (range.quickDate === 'today') return "Today";
              if (range.quickDate === '7days') return "Last 7 Days";
              if (range.quickDate === 'lastmonth') return "Last Month";

              const formatDate = (dateStr) => {
                if (!dateStr) return '';
                const d = new Date(dateStr);
                return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
              };

              const fromStr = formatDate(range.from);
              const toStr = formatDate(range.to);

              if (fromStr && toStr) {
                return (
                  <span className="flex items-center">
                    {fromStr} <span className="mx-2 text-[#2C76FF]">→</span> {toStr}
                  </span>
                );
              }
              if (fromStr) return `From ${fromStr}`;
              if (toStr) return `Until ${toStr}`;
              return "All Time";
            })()}
          </div>
        </div>

        {/* Right side controls: HR Finder & View Mode Toggle */}
        <div className="flex items-center gap-3">
          {showHRFinder && (
            <button
              onClick={onHRFinderToggle}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '7px',
                height: '36px',
                padding: '0 14px',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                // ── INACTIVE: white bg, LinkedIn-blue border + text ─────────────
                // ── ACTIVE:   solid LinkedIn-blue fill, white text + glow ────────
                backgroundColor: isHRFinderActive ? '#0A66C2' : '#ffffff',
                color: isHRFinderActive ? '#ffffff' : '#0A66C2',
                border: isHRFinderActive ? '1.5px solid #0A66C2' : '1.5px solid #0A66C2',
                boxShadow: isHRFinderActive
                  ? '0 4px 14px rgba(10,102,194,0.35)'
                  : 'none',
              }}
            >
              {/* LinkedIn icon — color adapts to state */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill={isHRFinderActive ? '#ffffff' : '#0A66C2'}
              >
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
              </svg>
              <span>RecruitReach</span>
            </button>
          )}

          <div className="flex items-center bg-gray-50 p-1 rounded-xl border border-gray-200">
            {[
              { id: 'grid', icon: <LayoutGrid size={16} /> },
              { id: 'list', icon: <List size={16} /> },
            ].map((v) => (
              <button
                key={v.id}
                onClick={() => onViewModeChange?.(v.id)}
                className="flex items-center justify-center w-10 h-10 rounded-lg transition-all"
                style={viewMode === v.id ? {
                  backgroundColor: '#2C76FF',
                  color: '#FFFFFF',
                  border: '1px solid #2C76FF',
                  boxShadow: '0 2px 4px rgba(44, 118, 255, 0.2)'
                } : {
                  backgroundColor: 'transparent',
                  color: '#6B7280',
                }}
              >
                {v.icon}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GlobalSearchHeader;
