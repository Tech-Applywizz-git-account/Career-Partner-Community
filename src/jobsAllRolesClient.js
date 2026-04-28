import { createClient } from '@supabase/supabase-js';

// ─── Jobs All Roles Database Client ──────────────────────────────────────────
// Connects to the Supabase project that holds the `jobs_all_roles` table.
// Table schema:
//   id, role_id, role_name, indeed_search_country, country, location,
//   title, company_name, job_url, job_url_direct, date_posted, is_remote,
//   description, created_at
// ─────────────────────────────────────────────────────────────────────────────

const isDev = import.meta.env.DEV;
const JOBS_SUPABASE_URL = import.meta.env?.VITE_JOBS_SUPABASE_URL || '';
const JOBS_SUPABASE_ANON_KEY = import.meta.env?.VITE_JOBS_SUPABASE_ANON_KEY || '';

// Robust silent fetch with jittered backoff for network/proxy instability
const customFetch = async (url, options) => {
  let retries = 0;
  const maxRetries = 5;
  const delay = (ms) => new Promise(res => setTimeout(res, ms));

  while (retries <= maxRetries) {
    try {
      const response = await fetch(url, options);
      if (response.status === 525 && isDev) {
        throw new Error('525 SSL Handshake Failed');
      }
      return response;
    } catch (err) {
      const isRetryable =
        err.message.includes('525') ||
        err.message.includes('Failed to fetch') ||
        err.name === 'TypeError' ||
        err.name === 'AuthRetryableFetchError';

      if (isRetryable && retries < maxRetries && isDev) {
        retries++;
        const backoff = Math.min(1000, 200 * Math.pow(2, retries));
        const jitter = Math.random() * 100;
        await delay(backoff + jitter);
        continue;
      }

      if (retries >= maxRetries) {
        const isNetworkDisconnect =
          err.message.includes('Failed to fetch') ||
          err.message.includes('network') ||
          !window.navigator.onLine;
        if (!isNetworkDisconnect) {
          console.error('❌ Jobs DB final failure:', err.message, url);
        }
      }
      throw err;
    }
  }
};

let _jobsClient = null;

const getJobsClient = () => {
  if (_jobsClient) return _jobsClient;
  if (!JOBS_SUPABASE_URL || !JOBS_SUPABASE_ANON_KEY) {
    console.warn('⚠️ Jobs Supabase credentials not configured. Check VITE_JOBS_SUPABASE_URL / VITE_JOBS_SUPABASE_ANON_KEY in your .env file.');
    return null;
  }
  _jobsClient = createClient(JOBS_SUPABASE_URL, JOBS_SUPABASE_ANON_KEY, {
    auth: {
      persistSession: false,
      storageKey: 'sb-jobs-auth-token',
    },
    global: {
      fetch: isDev ? customFetch : undefined,
    },
  });
  return _jobsClient;
};

export const jobsClient = getJobsClient();
