/**
 * supabaseClient.js
 * -----------------
 * Re-exports the compatibility shim as `supabase`.
 *
 * The compat shim (supabaseCompat.js) transparently:
 *   - Remaps `job_jobrole_sponsored_sync` → `jobs_all_roles`
 *   - Stubs `saved_jobs`, `applied_jobs`, `site_visits`, etc. (don't exist in new DB)
 *   - Returns a fake paid profile so no subscription walls appear
 *
 * All existing imports of `{ supabase } from '../supabaseClient'` work unchanged.
 */

export { supabase } from './supabaseCompat.js';
