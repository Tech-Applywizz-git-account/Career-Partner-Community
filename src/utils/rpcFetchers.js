import { supabase } from '../supabaseClient';

// ── New Fast RPCs with Date Filter Support

/**
 * Fetch top companies from the fast RPC, supporting date ranges and multiple countries.
 */
export async function fetchAllCompanies(countries, startDate = null, endDate = null) {
  const activeCountries = Array.isArray(countries) ? countries : (countries ? [countries] : []);
  const { data, error } = await supabase.rpc('get_companies_fast_json', {
    p_countries: activeCountries.length > 0 ? activeCountries : null,
    p_search:  null,
    p_start_date: startDate || null,
    p_end_date:   endDate || null,
  });

  if (error) {
    console.warn('[fetchAllCompanies] get_companies_fast_json failed:', error.message);
    throw error;
  }

  // data is already a fully constructed JSON array directly from Postgres
  return data || [];
}

/**
 * Fetch top domains from the fast RPC, supporting date ranges and multiple countries.
 */
export async function fetchAllDomains(countries, startDate = null, endDate = null) {
  const activeCountries = Array.isArray(countries) ? countries : (countries ? [countries] : []);
  const { data, error } = await supabase.rpc('get_domains_fast_json', {
    p_countries: activeCountries.length > 0 ? activeCountries : null,
    p_search:  null,
    p_start_date: startDate || null,
    p_end_date:   endDate || null,
  });

  if (error) {
    console.warn('[fetchAllDomains] get_domains_fast_json failed:', error.message);
    throw error;
  }

  return data || [];
}

// The legacy fetchers and old fetchAllDomains have been removed since the fast RPCs handle everything.

