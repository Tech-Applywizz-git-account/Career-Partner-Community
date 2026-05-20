import React, { useState, useEffect } from 'react';
import { getCompanyLogo } from '../utils/logoHelper';
import { Globe } from 'lucide-react';

/**
 * Super-Resilient LogoBox.
 * Optimized for a 100% clean console with zero network error logs.
 * Uses getCompanyLogo as the single source of truth for the best possible URL.
 * Falls back to initials silently if the primary logo fails to load.
 */
const LogoBox = ({ name, officialUrl = null, size = 40, fontSize = 12, className = "" }) => {
    const [error, setError] = useState(false);

    const cleanName = (name || '').trim().toLowerCase();
    
    // Hardcoded local image overrides for specific companies
    let logoUrl = null;
    if (cleanName === 'kpmg' || cleanName.startsWith('kpmg')) {
        // Will load public/assets/logos/kpmg.png
        logoUrl = '/assets/logos/kpmg.png';
    } else if (cleanName === 'ibm' || cleanName === 'ibm corporation') {
        // Will load public/assets/logos/ibm.png
        logoUrl = '/assets/logos/ibm.png';
    } else {
        logoUrl = getCompanyLogo(name, officialUrl);
    }
    
    const initials = name ? name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase() : '??';

    // Reset error state when company name changes
    useEffect(() => {
        setError(false);
    }, [name]);

    const containerStyle = {
        width: size,
        height: size,
        borderRadius: size > 40 ? '16px' : '10px',
        overflow: 'hidden',
        border: '1.5px solid #f3f4f6',
        // Dual-tone background: Blue at bottom, Yellow at top or vice versa
        background: (error || !logoUrl) 
            ? 'linear-gradient(135deg, #29FE29 50%, #29FE29 50%)' 
            : '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.02)',
        transition: 'all 0.3s ease-out',
        position: 'relative'
    };

    return (
        <div style={containerStyle} className={className}>
            {(logoUrl && !error) ? (
                <img
                    key={name}
                    src={logoUrl}
                    alt={name || ""}
                    style={{
                        maxWidth: '92%',
                        maxHeight: '92%',
                        objectFit: 'contain',
                        opacity: 1
                    }}
                    onLoad={(e) => {
                        // Detect silent 1x1 fallback pixel and show initials instead.
                        // We must ignore .svg files because they can legitimately report naturalWidth/Height of 0.
                        if (e.target.naturalWidth <= 1 && e.target.naturalHeight <= 1 && !logoUrl.toLowerCase().includes('.svg')) {
                            setError(true);
                        }
                    }}
                    onError={() => setError(true)}
                />
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2px' }}>
                    <Globe size={size * 0.45} color="#cbd5e1" strokeWidth={1.5} />
                </div>
            )}
        </div>
    );
};

export default LogoBox;
