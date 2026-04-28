// rolesSuggestions.js
// Fetches unique job_role_name values from Supabase once per session and caches them globally.
// All search bars across the app share the same cache — no redundant DB calls.

import { supabase } from '../supabaseClient';

const CACHE_KEY = '_jobRolesCache_v1';

// Fallback list — always available instantly, even before Supabase responds
const FALLBACK_ROLES = [
    "Accountant", "AI Engineer", "Backend Developer", "Business Analyst",
    "Business Intelligence Engineer", "Cloud Architect", "Cloud Engineer",
    "Compliance Analyst", "Cyber Security Analyst", "Data Analyst",
    "Data Engineer", "Data Scientist", "Database Administrator",
    "DevOps Engineer", "Embedded Software Engineer", "Financial Analyst",
    "Frontend Developer", "Full Stack Engineer", "Hardware Engineer",
    "Java Developer", "Machine Learning Engineer", "Network Engineer",
    "Product Manager", "Project Manager", "Python Developer",
    "QA Engineer", "Research Scientist", "SAP Consultant",
    "Site Reliability Engineer", "Software Engineer", "Solutions Architect",
    "Staff Engineer", "Systems Analyst", "Systems Engineer",
    "UI/UX Designer", "Validation Engineer"
];

/**
 * Returns an array of unique, sorted job role names.
 * Uses fallback immediately if Supabase is empty or fails.
 */
export async function fetchJobRoles() {
    // 1. In-memory cache (fastest — survives component re-renders)
    if (window[CACHE_KEY] && window[CACHE_KEY].length > 0) {
        return window[CACHE_KEY];
    }

    // 2. sessionStorage cache (survives page navigation within session)
    try {
        const cached = sessionStorage.getItem(CACHE_KEY);
        if (cached) {
            const parsed = JSON.parse(cached);
            if (Array.isArray(parsed) && parsed.length > 0) {
                window[CACHE_KEY] = parsed;
                return parsed;
            }
        }
    } catch (_) { /* ignore parse errors */ }

    // 3. Fetch from Supabase — limit to first 1000 rows for speed
    try {
        const { data, error } = await supabase
            .from('jobs_all_roles')
            .select('role_name')
            .not('role_name', 'is', null)
            .neq('role_name', '')
            .limit(1000);

        if (!error && data && data.length > 0) {
            // Merge Supabase results with fallback for complete coverage
            const roleSet = new Set(FALLBACK_ROLES);
            data.forEach(row => {
                if (row.role_name && row.role_name.trim()) {
                    roleSet.add(row.role_name.trim());
                }
            });
            const sorted = Array.from(roleSet).sort((a, b) => a.localeCompare(b));
            window[CACHE_KEY] = sorted;
            try { sessionStorage.setItem(CACHE_KEY, JSON.stringify(sorted)); } catch (_) { }
            return sorted;
        }
    } catch (err) {
        console.warn('fetchJobRoles: Supabase fetch failed, using fallback list.', err.message);
    }

    // 4. Always fall back to static list if Supabase fails
    window[CACHE_KEY] = FALLBACK_ROLES;
    return FALLBACK_ROLES;
}

/**
 * Given the full roles list and a search query, returns up to `limit` matching roles.
 * Sorts by: starts-with matches first, then contains matches.
 */
export function filterRoles(roles, query, limit = 8) {
    if (!roles || !query || !query.trim()) return [];
    const q = query.toLowerCase().trim();

    const startsWith = [];
    const contains = [];

    for (const role of roles) {
        const lower = role.toLowerCase();
        if (lower.startsWith(q)) startsWith.push(role);
        else if (lower.includes(q)) contains.push(role);
        if (startsWith.length + contains.length >= limit * 3) break;
    }

    return [...startsWith, ...contains].slice(0, limit);
}
