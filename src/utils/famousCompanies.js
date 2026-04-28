// src/utils/famousCompanies.js
// A curated list of top/famous H1B sponsoring companies for prioritization.
// Based on volume and brand recognition.

export const FAMOUS_COMPANIES = [
    'Google', 'Microsoft', 'Amazon', 'Meta', 'Facebook', 'Apple', 'Netflix', 'Tesla', 'NVIDIA',
    'Adobe', 'Oracle', 'Salesforce', 'Intel', 'IBM', 'Cisco', 'Uber', 'Lyft', 'Airbnb', 'PayPal',
    'LinkedIn', 'Twitter', 'TikTok', 'Spotify', 'Shopify', 'Twilio', 'Zoom', 'Slack',
    'JPMorgan', 'Goldman Sachs', 'Morgan Stanley', 'Bank of America', 'Wells Fargo', 'Citigroup', 'Visa', 'Mastercard', 'American Express',
    'Deloitte', 'Ernst & Young', 'EY', 'PricewaterhouseCoopers', 'PwC', 'KPMG', 'Accenture',
    'Tata Consultancy', 'TCS', 'Infosys', 'Wipro', 'Cognizant', 'HCL', 'Capgemini',
    'Walmart', 'Target', 'The Walt Disney', 'Disney', 'Nike', 'Starbucks', 'Pepsi', 'Coca-Cola',
    'Boeing', 'SpaceX', 'Lockheed Martin', 'Ford', 'General Motors', 'Pfizer', 'Johnson & Johnson',
    'Intuit', 'Stripe', 'ServiceNow', 'Workday', 'Block', 'Square', 'Snap', 'Pinterest', 'Reddit',
    'Dropbox', 'Coinbase', 'Robinhood', 'Wayfair', 'Zillow', 'Expedia'
];

// Core brands that should ONLY match exactly to avoid sub-brand pollution (e.g. Amazon Filters)
export const STRICT_FAMOUS = [
    'Google', 'Microsoft', 'Amazon', 'Meta', 'Facebook', 'Apple', 'Netflix', 
    'Tesla', 'NVIDIA', 'Adobe', 'Oracle', 'Salesforce', 'Intel', 'IBM', 'Cisco', 'Uber',
    'Amazon Web Services', 'AWS', 'PwC', 'Deloitte', 'Accenture', 'Infosys'
];

// USER PRIORITY LIST (Ranked)
export const RANKED_COMPANIES = [
    // --- PAGE 1 (Indices 0-11) ---
    'Google', 'Microsoft', 'Amazon', 'Amazon Web Services', 'Meta', 'Facebook', 'Apple', 'Netflix',
    'Deloitte', 'PwC', 'Accenture', 'Infosys',
    
    // --- PAGE 2 (Indices 12-23) ---
    'Tesla', 'NVIDIA', 'Adobe', 'Oracle', 'Salesforce', 'Intel', 'IBM', 'Cisco', 'Uber',
    'Airbnb', 'Twitter', 'LinkedIn',
    
    // --- REST ---
    'JPMorgan Chase', 'Goldman Sachs', 'Walmart', 'Ernst and Young (EY)', 'Capgemini', 'HCL America Inc.', 'Amazon Web Services (AWS)', 'JP Morgan Chase', 'Ernst and Young US', 'Deloitte UK', 'PwC UK', 'Google UK', 'Amazon UK', 'KPMG UK', 'Accenture UK', 'Capgemini UK', 'BAE Systems', 'Siemens', 'SAP', 'Bloomberg', 'PayPal', 'NetApp', 'Workday', 'VMware', 'Atlassian', 'Square', 'Stripe', 'Spotify', 'Wayfair', 'Ebay', 'Twilio', 'Snap Inc.', 'Pinterest', 'Dropbox', 'Box', 'Zendesk', 'Okta', 'ServiceNow', 'DocuSign', 'Autodesk', 'Intuit', 'Expedia', 'Booking Holdings', 'Fidelity Investments', 'Bank of America', 'Wells Fargo', 'Morgan Stanley', 'HSBC', 'Barclays', 'UBS', 'Credit Suisse', 'BlackRock', 'State Street', 'AIG', 'MetLife', 'Prudential', 'Cigna', 'Anthem', 'UnitedHealth Group', 'CVS Health', 'Express Scripts', 'McKesson', 'Cardinal Health', 'AmerisourceBergen', 'Johnson & Johnson', 'Pfizer', 'Merck', 'AbbVie', 'Abbott', 'Bristol Myers Squibb', 'Eli Lilly', 'Amgen', 'Gilead Sciences', 'Biogen', 'Regeneron', 'Moderna', 'Novartis', 'Roche', 'Genentech', 'Bayer', 'GlaxoSmithKline (GSK)', 'AstraZeneca', 'Sanofi', 'Takeda', 'Boston Consulting Group (BCG)', 'McKinsey & Company', 'Bain & Company', 'Booz Allen Hamilton', 'L.E.K. Consulting', 'Oliver Wyman', 'Roland Berger', 'A.T. Kearney', 'ZS Associates', 'Hurricane Capital', 'Two Sigma', 'Citadel', 'D.E. Shaw', 'Renaissance Technologies', 'Bridgewater Associates', 'Point72', 'Millennium Management', 'Hudson River Trading', 'Virtu Financial', 'Jump Trading', 'IMC Trading', 'Optiver', 'Akuna Capital', 'Belvedere Trading', 'DRW', 'Susquehanna International Group', 'SIG Susquehanna', 'Wolverine Trading', 'XTX Markets', 'Flow Traders', 'Mavenir', 'Ciena', 'Juniper Networks', 'Arista Networks', 'F5 Networks', 'Pure Storage', 'Nutanix', 'Cohesity', 'Rubrik', 'Veeam', 'Commvault', 'Dell Technologies', 'Hewlett Packard Enterprise', 'Cray Inc.', 'NEC Corporation', 'Fujitsu', 'Hitachi', 'Lenovo', 'Qualcomm', 'Broadcom', 'Texas Instruments', 'Micron Technology', 'Western Digital', 'Seagate Technology', 'Lam Research', 'Applied Materials', 'KLA Corporation', 'ASML', 'Tokyo Electron', 'Infineon Technologies', 'Analog Devices', 'Microchip Technology', 'ON Semiconductor', 'NXP Semiconductors', 'Renesas Electronics', 'Skyworks Solutions', 'Qorvo', 'Synopsys', 'Cadence Design Systems', 'Mentor Graphics', 'Arm Holdings', 'Imagination Technologies', 'Ceva Inc.', 'Rambus', 'Allegro MicroSystems', 'Melexis', 'Elmos Semiconductor', 'ams AG', 'STMicroelectronics', 'Marvell Technology', 'Maxim Integrated', 'Xilinx', 'Altera', 'Lattice Semiconductor', 'QuickLogic', 'eSilicon', 'Achronix', 'Flex Logix', 'Groq', 'Cerebras Systems', 'SambaNova Systems', 'Graphcore', 'Habana Labs', 'Mythic', 'Untether AI', 'Tenstorrent', 'Esperanto Technologies', 'SiFive', 'RISC-V International', 'Andes Technology', 'Codasip', 'Siemens EDA', 'Keysight Technologies', 'Rohde & Schwarz', 'Anritsu', 'Viavi Solutions', 'EXFO', 'Spirent Communications', 'Calnex Solutions', 'PacketLight Networks', 'Infinera', 'Huawei', 'Nokia', 'Ericsson', 'Samsung', 'ZTE', 'CommScope', 'Corning', 'Prysmian Group', 'Sterlite Technologies', 'Furukawa Electric', 'Sumitomo Electric', 'Fujikura', 'LS Cable & System', 'Nexans', 'Belden', 'Molex', 'Amphenol', 'TE Connectivity', 'Samtec', 'Hirose Electric', 'JAE', 'JST', 'Yazaki', 'Sumitomo Wiring Systems', 'Leoni AG', 'Berk-Tek', 'Leviton', 'Panduit', 'Siemon', 'Black & Veatch', 'Bechtel', 'Fluor', 'Jacobs Engineering', 'AECOM', 'CH2M Hill', 'MWH Global', 'Stantec', 'Tetra Tech', 'Arcadis', 'WSP Global', 'Ramboll', 'Arup', 'Atkins', 'SNC-Lavalin', 'Amec Foster Wheeler', 'Wood plc', 'KBR', 'TechnipFMC', 'McDermott International', 'Saipem', 'Subsea 7', 'Petrofac', 'WorleyParsons', 'John Wood Group', 'SBM Offshore', 'MODEC', 'Keppel Corporation', 'Sembcorp Marine', 'Hyundai Heavy Industries', 'Samsung Heavy Industries', 'Daewoo Shipbuilding', 'Mitsubishi Heavy Industries', 'Impex', 'Mitsui', 'Sumitomo Corporation', 'Marubeni Corporation', 'Itochu Corporation', 'Toyota Tsusho', 'Sojitz Corporation', 'Nissho Iwai', 'Nichimen Corporation', 'Tomen Corporation', 'Kanematsu Corporation', 'C. Itoh & Co.', 'Samsung C&T', 'Hyundai Engineering & Construction', 'Daewoo E&C', 'GS Engineering & Construction', 'POSCO E&C', 'Lotte Engineering & Construction', 'SK E&C', 'DL E&C', 'Taeyoung E&C', 'Halla Group', 'Kolon Global Corporation', 'Kumho Industrial', 'Hanwha Corporation', 'Doosan E&C', 'Daelim Industrial', 'Ssangyong Engineering & Construction', 'KCC Corporation', 'Hyosung Corporation', 'OCI Company', 'Kumho Petrochemical', 'Hanwha Chemical', 'Lotte Chemical', 'Samsung SDI', 'LG Chem', 'SK Innovation', 'S-Oil', 'GS Caltex', 'Hyundai Oilbank', 'Kukdo Chemical', 'Kumho P&B', 'KPX Chemical', 'Aekyung Chemical', 'BASF', 'Covestro', 'Evonik', 'Lanxess', 'Wacker Chemie', 'Merck KGaA', 'Symrise', 'Altana', 'Brenntag', 'Fresenius', 'Beiersdorf', 'Henkel', 'Boehringer Ingelheim', 'Carl Zeiss', 'Deutsche Bank', 'Allianz', 'Munich Re', 'Daimler', 'BMW', 'Volkswagen', 'Audi', 'Porsche', 'Bosch', 'Continental', 'Adidas', 'Puma', 'Lufthansa', 'Siemens Healthineers', 'Fresenius Medical Care', 'Deutsche Telekom', 'Deutsche Post DHL', 'RWE', 'E.ON', 'EnBW', 'Uniper', 'Thyssenkrupp', 'Linde', 'HeidelbergCement', 'Mercedes-Benz', 'Bayerische Motoren Werke', 'Volkswagen Group', 'National Health Service (NHS)', 'TPP', 'Monzo', 'Revolut', 'Nu Quantum', 'Cleveland Clinic', 'Mayo Clinic', 'Johns Hopkins Hospital', 'Mass General Brigham', 'UCSF Health', 'Stanford Health Care', 'UCLA Health', 'Cedars-Sinai Medical Center', 'NYU Langone Health', 'Mount Sinai Health System', 'Northwell Health', 'Houston Methodist', 'MD Anderson Cancer Center', 'Dana-Farber Cancer Institute', 'City of Hope', 'Memorial Sloan Kettering', 'Children‘s Hospital of Philadelphia', 'Boston Children’s Hospital', 'Cincinnati Children\'s Hospital', 'Texas Children‘s Hospital', 'Seattle Children‘s Hospital', 'Children’s Hospital Los Angeles', 'Ann & Robert H. Lurie Children\'s Hospital of Chicago', 'Nationwide Children\'s Hospital', 'Children\'s National Hospital', 'Children\'s Hospital Colorado', 'Children\'s Hospital of Pittsburgh of UPMC', 'St. Jude Children\'s Research Hospital', 'Fred Hutchinson Cancer Center', 'Moffitt Cancer Center', 'Roswell Park Comprehensive Cancer Center', 'Fox Chase Cancer Center', 'Ohio State University Comprehensive Cancer Center', 'University of Michigan Rogel Cancer Center', 'UW Carbone Cancer Center', 'Yale Cancer Center', 'Duke Cancer Institute', 'Vanderbilt-Ingram Cancer Center', 'UNC Lineberger Comprehensive Cancer Center', 'University of Virginia Cancer Center', 'UVA Health', 'VCU Massey Cancer Center', 'Massey Cancer Center', 'Huntsman Cancer Institute', 'University of Utah Health', 'Intermountain Healthcare', 'Banner Health'
];

/**
 * Checks if a company name matches any in the famous list.
 * Case-insensitive "contains" matching.
 */
export const isFamous = (name) => {
    if (!name) return false;
    const n = name.toLowerCase().trim();
    
    // 1. Check strict list first (Exact match only)
    const isStrict = STRICT_FAMOUS.some(f => {
        const famousLower = f.toLowerCase();
        return n === famousLower || n === famousLower + '.com' || n === 'the ' + famousLower;
    });
    if (isStrict) return true;

    // 2. Check general list (Includes partial matches, but exclude strict prefixes to avoid pollution)
    const isCorePrefix = STRICT_FAMOUS.some(f => {
        const famousLower = f.toLowerCase();
        // Allow short names like PwC (3 chars) but avoid 2-char false positives
        return famousLower.length >= 3 && n.includes(famousLower) && n !== famousLower;
    });
    
    // If it's a sub-brand of a strict company (like "Amazon Pharmacy"), it's NOT "famous" 
    // unless it's explicitly in the list or has high volume naturally.
    if (isCorePrefix) return false;

    return FAMOUS_COMPANIES.some(f => {
        const famousLower = f.toLowerCase();
        if (famousLower.length <= 3) {
            const regex = new RegExp(`\\b${famousLower}\\b`, 'i');
            return regex.test(n);
        }
        return n.includes(famousLower);
    });
};

/**
 * Returns the rank of a company based on the priority list.
 * Lower absolute index = higher priority.
 * Returns Infinity if not found.
 */
export const getCompanyRank = (name) => {
    if (!name) return Infinity;
    const n = name.toLowerCase().trim();

    // Exact match or partial match priority
    let bestIndex = Infinity;
    RANKED_COMPANIES.forEach((f, idx) => {
        const famousLower = f.toLowerCase().trim();
        
        // If it's a strict brand, only allow exact match (or .com/the prefix)
        const isStrictBrand = STRICT_FAMOUS.some(s => s.toLowerCase() === famousLower);
        
        if (isStrictBrand) {
            if (n === famousLower || n === famousLower + '.com' || n === 'the ' + famousLower) {
                if (idx < bestIndex) bestIndex = idx;
            }
        } else {
            // For non-strict brands, partial matching is fine
            if (n === famousLower || n.includes(famousLower)) {
                if (idx < bestIndex) bestIndex = idx;
            }
        }
    });

    return bestIndex;
};
