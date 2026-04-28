import { createClient } from '@supabase/supabase-js';

// External Database Configuration (audit_reviews + job_jobrole_sponsored)
// This connects to the database that contains:
// - audit_reviews table (audit/review data)
// - job_jobrole_sponsored table (sponsored job listings)
const isDev = import.meta.env.DEV;
const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173';
const EXTERNAL_SUPABASE_URL = import.meta.env?.VITE_EXTERNAL_SUPABASE_URL || '';
const EXTERNAL_SUPABASE_ANON_KEY = import.meta.env?.VITE_EXTERNAL_SUPABASE_ANON_KEY || '';

// Robust silent fetch with jittered backoff for network/proxy instability (525 errors)
const customFetch = async (url, options) => {
    let retries = 0;
    const maxRetries = 5;
    const delay = (ms) => new Promise(res => setTimeout(res, ms));

    while (retries <= maxRetries) {
        try {
            const response = await fetch(url, options);
            // 525 Handshake errors from Cloudflare — handle silently
            if (response.status === 525 && isDev) {
                throw new Error('525 SSL Handshake Failed');
            }
            return response;
        } catch (err) {
            const isRetryable = err.message.includes('525') ||
                err.message.includes('Failed to fetch') ||
                err.name === 'TypeError' || // Often network disconnected error
                err.name === 'AuthRetryableFetchError';

            if (isRetryable && retries < maxRetries && isDev) {
                retries++;
                // Wait with backoff + jitter before next attempt
                const backoff = Math.min(1000, 200 * Math.pow(2, retries));
                const jitter = Math.random() * 100;
                await delay(backoff + jitter);
                continue;
            }

            // Only log on the absolute final failure if NOT a standard network disconnect
            if (retries >= maxRetries) {
                const isNetworkDisconnect = err.message.includes('Failed to fetch') || err.message.includes('network') || !window.navigator.onLine;
                if (!isNetworkDisconnect) {
                    console.error('❌ External DB final failure:', err.message, url);
                }
            }
            throw err;
        }
    }
};

let _externalSupabase = null;

const getExternalSupabaseClient = () => {
    if (_externalSupabase) return _externalSupabase;
    if (!EXTERNAL_SUPABASE_URL || !EXTERNAL_SUPABASE_ANON_KEY) {
        // External DB not configured — this is expected when only the main DB is in use.
        return null;
    }
    _externalSupabase = createClient(EXTERNAL_SUPABASE_URL, EXTERNAL_SUPABASE_ANON_KEY, {
        auth: {
            persistSession: false, // External DB — no auth session needed
            storageKey: 'sb-external-auth-token', // unique key, won't clash with main
        },
        global: {
            fetch: isDev ? customFetch : undefined
        }
    });
    return _externalSupabase;
};

export const externalSupabase = getExternalSupabaseClient();
