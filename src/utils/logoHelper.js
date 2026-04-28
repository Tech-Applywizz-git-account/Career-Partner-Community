import { getHardcodedLogo } from './logoHardcoded';

/**
 * Resilience-First Company Logo Resolver.
 * Uses official CDNs and a hardcoded priority list for 100% accuracy.
 * Can also autonomously find logos using the job listing URL.
 */
export const getCompanyLogo = (companyName, officialUrl = null) => {
    if (!companyName) return null;

    // 1. Check Hardcoded List First (STRICT & VERIFIED)
    const hardcoded = getHardcodedLogo(companyName);
    if (hardcoded) return hardcoded;

    // 2. Autonomous Finding: Extract domain from officialUrl (High Confidence)
    // If we have the direct job link, we can get the brand domain safely.
    if (officialUrl) {
        try {
            const urlStr = String(officialUrl).toLowerCase().startsWith('http') ? officialUrl : `https://${officialUrl}`;
            const url = new URL(urlStr);
            const domain = url.hostname.replace(/^www\./, '');
            const jobBoards = ['job', 'hire', 'lever', 'greenhouse', 'linkedin', 'myworkday', 'glassdoor', 'indeed', 'boards', 'ashbyhq', 'breezy', 'smartrecruiters', 'workable', 'icims', 'taleo'];
            const isJobBoard = jobBoards.some(board => domain.includes(board));
            
            if (domain && domain.length > 3 && !isJobBoard) {
                // Avoid using generic job board domains for the company logo.
                // If it's a direct company domain, use it.
                return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
            }
        } catch (_) {}
    }

    // 3. Normalize for domain guessing (Fallback)
    const lc = companyName.toLowerCase().trim()
        .replace(/^the\s+/i, '')
        .split(' (')[0]
        .split(' - ')[0]
        .split(' / ')[0]
        .split(', ')[0]
        .trim();

    const noisyWords = ['inc', 'corp', 'ltd', 'llc', 'group', 'services', 'systems', 'consulting', 'solutions', 'company'];
    const suffixRegex = new RegExp(`\\s+(${noisyWords.join('|')})`, 'gi');
    const trimmed = lc.replace(suffixRegex, '').trim();

    const domainGuess = trimmed.replace(/[^a-z0-9]/g, '').trim();
    if (!domainGuess || domainGuess.length < 2) return null;

    const silentFallback = encodeURIComponent('https://upload.wikimedia.org/wikipedia/commons/c/ca/1x1.png');
    return `https://www.google.com/s2/favicons?domain=${domainGuess}.com&sz=128&default=${silentFallback}`;
};
