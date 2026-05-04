import { supabase } from '../supabaseClient';

const RPC_PAGE_SIZE = 1000; // Match Supabase max_rows setting
const BATCH = 10;            // Parallel requests per round (Increased for performance)

/**
 * Fetches ALL rows from get_companies_by_country RPC, bypassing
 * PostgREST max_rows by using p_limit/p_offset pagination.
 * @param {string|null} country - Uppercase DB key (e.g. "INDIA", "USA") or null for all
 * @param {string|null} startDate - ISO date string (YYYY-MM-DD)
 * @param {string|null} endDate - ISO date string (YYYY-MM-DD)
 * @returns {Promise<Array>} Array of { company_name, job_count }
 */
export async function fetchAllCompanies(country, startDate = null, endDate = null) {
  // Step 1: get total count (returns a single scalar, not subject to max_rows)
  const { data: countData, error: countErr } = await supabase
    .rpc('count_companies_by_country', { 
      p_country: country || null,
      p_start_date: startDate || null,
      p_end_date: endDate || null
    });
  if (countErr) throw countErr;

  const total = Number(countData) || 0;
  const numPages = Math.ceil(total / RPC_PAGE_SIZE) || 1;
  console.log(`[fetchAllCompanies] country=${country || 'ALL'} range=${startDate || '...'}/${endDate || '...'} total=${total} pages=${numPages}`);

  // Step 2: fetch all pages in parallel batches
  const all = [];
  for (let b = 0; b < numPages; b += BATCH) {
    const requests = Array.from({ length: Math.min(BATCH, numPages - b) }, (_, i) =>
      supabase.rpc('get_companies_by_country', {
        p_country: country || null,
        p_start_date: startDate || null,
        p_end_date: endDate || null,
        p_limit:   RPC_PAGE_SIZE,
        p_offset:  (b + i) * RPC_PAGE_SIZE,
      })
    );
    const results = await Promise.all(requests);
    for (const r of results) {
      if (r.error) throw r.error;
      all.push(...(r.data || []));
    }
  }

  console.log(`[fetchAllCompanies] fetched ${all.length} unique companies`);
  return all;
}

/**
 * Fetches ALL rows from get_domains_by_country RPC, bypassing max_rows.
 * @param {string|null} country
 * @param {string|null} startDate
 * @param {string|null} endDate
 * @returns {Promise<Array>} Array of { role_name, job_count }
 */
export async function fetchAllDomains(country, startDate = null, endDate = null) {
  const { data: countData, error: countErr } = await supabase
    .rpc('count_domains_by_country', { 
      p_country: country || null,
      p_start_date: startDate || null,
      p_end_date: endDate || null
    });
  if (countErr) throw countErr;

  const total = Number(countData) || 0;
  const numPages = Math.ceil(total / RPC_PAGE_SIZE) || 1;
  console.log(`[fetchAllDomains] country=${country || 'ALL'} range=${startDate || '...'}/${endDate || '...'} total=${total} pages=${numPages}`);

  const all = [];
  for (let b = 0; b < numPages; b += BATCH) {
    const requests = Array.from({ length: Math.min(BATCH, numPages - b) }, (_, i) =>
      supabase.rpc('get_domains_by_country', {
        p_country: country || null,
        p_start_date: startDate || null,
        p_end_date: endDate || null,
        p_limit:   RPC_PAGE_SIZE,
        p_offset:  (b + i) * RPC_PAGE_SIZE,
      })
    );
    const results = await Promise.all(requests);
    for (const r of results) {
      if (r.error) throw r.error;
      all.push(...(r.data || []));
    }
  }

  console.log(`[fetchAllDomains] fetched ${all.length} unique domains`);
  return all;
}
