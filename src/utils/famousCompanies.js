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

export const STRICT_FAMOUS = [
    ...FAMOUS_COMPANIES,
    'Amazon Web Services', 'AWS', 'PwC', 'Deloitte', 'Accenture', 'Infosys',
    'EY', 'TCS', 'Ernst & Young', 'Tata Consultancy Services', 'PricewaterhouseCoopers', 'KPMG US'
];

export const RANKED_COMPANIES = FAMOUS_COMPANIES;

// ─────────────────────────────────────────────────────────────────────────────
// PRECOMPUTED LOOKUP STRUCTURES — built ONCE when module loads, never again.
// Replaces the O(n²) loop + new RegExp() pattern that ran 116K times.
// ─────────────────────────────────────────────────────────────────────────────

// Reusable regexes for cleanName — compiled once
const _SUFFIX_RE = /\b(llc|inc|corp|corporation|co|company|ltd|limited|tech|technologies|systems|services|platforms|solutions|group|us|usa|uk)\b/gi;
const _PUNCT_RE  = /[.,/#!$%^&*;:{}=\-_`~()]/g;
const _SPACE_RE  = /\s+/g;

const _cleanName = (str) =>
    str.toLowerCase()
        .replace(_SUFFIX_RE, '')
        .replace(_PUNCT_RE, ' ')
        .replace(_SPACE_RE, ' ')
        .trim();

const _STRICT_SET = new Set(STRICT_FAMOUS.map(sf => sf.toLowerCase().trim()));

// Map: exact lowercase name → rank index  (O(1) lookup)
const _EXACT_RANK_MAP = new Map();
RANKED_COMPANIES.forEach((f, idx) => {
    const key = f.toLowerCase().trim();
    if (!_EXACT_RANK_MAP.has(key)) _EXACT_RANK_MAP.set(key, idx);
});

// Map: cleaned lowercase name → rank index  (O(1) lookup)
const _CLEAN_RANK_MAP = new Map();
RANKED_COMPANIES.forEach((f, idx) => {
    const key = _cleanName(f);
    if (key && !_CLEAN_RANK_MAP.has(key)) _CLEAN_RANK_MAP.set(key, idx);
});

// Prebuilt regex entries for non-strict famous (word-boundary "contains" check)
// These RegExps are compiled ONCE at module load — never inside a loop.
const _REGEX_ENTRIES = [];
RANKED_COMPANIES.forEach((f, idx) => {
    const lf = f.toLowerCase().trim();
    if (!_STRICT_SET.has(lf)) {
        const cf = _cleanName(f);
        if (cf) {
            const escaped = cf.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
            _REGEX_ENTRIES.push({ re: new RegExp(`\\b${escaped}\\b`, 'i'), rank: idx });
        }
    }
});

// Map: lowercase famous name → original-case name  (for normalizeDisplayName)
export const FAMOUS_LOWER_MAP = new Map(
    FAMOUS_COMPANIES.map(f => [f.toLowerCase(), f])
);

// Memoization caches to achieve maximum performance and instant speed
const _rankCache = new Map();
const _famousCache = new Map();

// ─────────────────────────────────────────────────────────────────────────────
// Public API — now O(1) memoized for instant speed
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns the rank (lower = more famous) of a company name.
 * Uses memoization and precomputed Maps.
 */
export const getCompanyRank = (name) => {
    if (!name) return Infinity;
    const n = name.toLowerCase().trim();
    if (_rankCache.has(n)) return _rankCache.get(n);

    let res = Infinity;
    if (_EXACT_RANK_MAP.has(n)) {
        res = _EXACT_RANK_MAP.get(n);
    } else {
        const cn = _cleanName(n);
        if (cn) {
            if (_CLEAN_RANK_MAP.has(cn)) {
                res = _CLEAN_RANK_MAP.get(cn);
            } else {
                for (const { re, rank } of _REGEX_ENTRIES) {
                    if (rank >= res) continue; // can't improve
                    if (re.test(cn)) {
                        res = rank;
                    }
                }
            }
        }
    }

    _rankCache.set(name, res); // cache original input name
    _rankCache.set(n, res);    // also cache normalized input
    return res;
};

/**
 * Returns true if company is famous. O(1) memoized.
 */
export const isFamous = (name) => {
    if (!name) return false;
    const n = name.toLowerCase().trim();
    if (_famousCache.has(n)) return _famousCache.get(n);

    const res = getCompanyRank(n) !== Infinity;
    _famousCache.set(name, res); // cache original input name
    _famousCache.set(n, res);    // also cache normalized input
    return res;
};
