import { Globe } from 'lucide-react';
import LogoBox from './LogoBox';

const CompanyCard = ({ company, jobCount, wageLevel, wageLevels, industries, isSelected, onClick, isMobile, isVerified, lca_filings, officialUrl, isLandingPage = false }) => {
    // Build a Set of actual levels this company has (e.g. {'Lv 1', 'Lv 3'})
    const actualLevels = (() => {
        if (wageLevels) {
            // Handle both Set (from live processing) and Array (from JSON parse)
            const arr = Array.isArray(wageLevels) ? wageLevels : (wageLevels instanceof Set ? Array.from(wageLevels) : []);
            return new Set(arr.map(l => {
                const m = String(l).match(/\d/);
                return m ? parseInt(m[0]) : null;
            }).filter(Boolean));
        }
        // Fallback: no wageLevels provided, just highlight the max level only
        const lvl = parseInt(wageLevel?.match(/\d/)?.[0] || '0');
        return lvl > 0 ? new Set([lvl]) : new Set();
    })();

    const cardStyle = {
        display: 'block',
        width: '100%',
        background: '#ffffff',
        borderRadius: '20px',
        padding: isLandingPage ? '12px 18px' : (isMobile ? '14px 16px' : '20px 22px'),
        marginBottom: isLandingPage ? '8px' : '10px',
        border: isSelected ? '1.5px solid rgba(36,56,94,0.25)' : '1.5px solid #ebebeb',
        boxShadow: isSelected
            ? '0 4px 24px rgba(36,56,94,0.12)'
            : '0 1px 4px rgba(0,0,0,0.05)',
        cursor: 'pointer',
        transition: 'all 200ms ease',
        position: 'relative',
        textAlign: 'left',
        fontFamily: 'inherit',
    };

    return (
        <button style={cardStyle} onClick={onClick}
            onMouseEnter={e => {
                if (!isSelected) {
                    e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.10)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                }
            }}
            onMouseLeave={e => {
                if (!isSelected) {
                    e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.05)';
                    e.currentTarget.style.transform = 'translateY(0)';
                }
            }}
        >
            {/* Row 1: Logo + Name + Content */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                    <LogoBox name={company} officialUrl={officialUrl} size={isLandingPage ? 40 : (isMobile ? 36 : 44)} fontSize={isLandingPage ? 13 : (isMobile ? 12 : 14)} className={isSelected ? 'bg-navy-select' : ''} />

                    <div style={{ minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px', flexWrap: 'wrap' }}>
                            <p style={{ fontSize: isLandingPage ? '16px' : (isMobile ? '15px' : '17px'), fontWeight: 700, color: '#111', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {company}
                            </p>
                            {lca_filings !== undefined && lca_filings !== null && lca_filings > 0 && (
                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 700, color: '#24385E', background: '#f1f5f9', padding: '2px 6px', borderRadius: '6px' }}>
                                    <Globe size={11} strokeWidth={2.5} />
                                    {lca_filings.toLocaleString()} Filings
                                </span>
                            )}
                            {isVerified && (
                                <svg width="14" height="14" viewBox="0 0 100 100" style={{ flexShrink: 0 }}>
                                    <path d="M50 4 L57 16 L70 10 L70 24 L84 24 L78 37 L91 44 L81 55 L88 68 L74 69 L70 83 L57 78 L50 90 L43 78 L30 83 L26 69 L12 68 L19 55 L9 44 L22 37 L16 24 L30 24 L30 10 L43 16 Z" fill="#22c55e" />
                                    <polyline points="33,52 44,63 68,38" fill="none" stroke="white" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            )}
                        </div>

                        {!isMobile && (
                            <p style={{ fontSize: '12px', color: '#aaa', margin: 0 }}>
                                Visa inquiries: <span style={{ color: '#24385E', fontWeight: 500 }}>{company?.toLowerCase().replace(/\s+/g, '')}@careers.com</span>
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Row 4: Wage badges - Temporarily Removed */}
        </button>
    );
};

export default CompanyCard;
