/**
 * supabaseCompat.js
 * -----------------
 * Compatibility shim for the new Supabase project (tbfcxawbygftalalhvlf).
 *
 * The new DB only has `jobs_all_roles`.  Legacy code references:
 *   - job_jobrole_sponsored_sync  → remapped to jobs_all_roles (column aliases applied)
 *   - saved_jobs                  → stubbed (returns empty, writes are no-ops)
 *   - applied_jobs                → stubbed
 *   - site_visits                 → stubbed
 *   - audit_reviews_sync          → stubbed
 *   - audit_reviews_backup        → stubbed
 *   - sync_log                    → stubbed
 *   - profiles                    → stubbed (returns fake paid profile)
 *
 * Column mapping  (jobs_all_roles  →  job_jobrole_sponsored_sync alias):
 *   company_name   → company
 *   job_url_direct → url
 *   job_url        → apply_url
 *   role_name      → job_role_name
 *   (no wage_level / wage_num / salary / sponsored_job in new DB — return null)
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env?.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env?.VITE_SUPABASE_ANON_KEY || '';

// ── Tables that are stubbed out (don't exist in new DB) ──────────────────────
const STUB_TABLES = new Set([
  'saved_jobs',
  'applied_jobs',
  'site_visits',
  'audit_reviews_sync',
  'audit_reviews_backup',
  'sync_log',
]);

// ── Column map: jobs_all_roles name → legacy alias injected into result ───────
const COL_ALIAS = {
  company_name: 'company',
  job_url_direct: 'url',
  job_url: 'apply_url',
  role_name: 'job_role_name',
};

// Default values for columns that don't exist in jobs_all_roles
const COL_DEFAULTS = {
  wage_level: 'Lv 2',
  wage_num: 2,
  salary: null,
  sponsored_job: true,
  jobId: null,
  assigned_to: null,
  apply_type: null,
  years_exp_required: null,
  upload_date: null,
  synced_at: null,
};

/** Remap a row from jobs_all_roles shape to job_jobrole_sponsored_sync shape */
const remapRow = (row) => {
  if (!row) return row;
  const out = { ...COL_DEFAULTS, ...row };
  for (const [src, alias] of Object.entries(COL_ALIAS)) {
    if (src in out) {
      out[alias] = out[src];
    }
  }
  return out;
};

// ── Stub builder ─────────────────────────────────────────────────────────────
/** Returns a chainable object that resolves to empty data for stubbed tables */
const makeStub = (isInsert = false) => {
  const stub = {
    select: () => stub,
    insert: () => stub,
    upsert: () => stub,
    update: () => stub,
    delete: () => stub,
    eq: () => stub,
    neq: () => stub,
    gt: () => stub,
    gte: () => stub,
    lt: () => stub,
    lte: () => stub,
    like: () => stub,
    ilike: () => stub,
    is: () => stub,
    in: () => stub,
    not: () => stub,
    or: () => stub,
    filter: () => stub,
    match: () => stub,
    order: () => stub,
    limit: () => stub,
    range: () => stub,
    single: () => Promise.resolve({ data: null, error: null, count: 0 }),
    maybeSingle: () => Promise.resolve({ data: null, error: null, count: 0 }),
    head: false,
    then: (resolve) => resolve({ data: [], error: null, count: 0 }),
  };
  // Make it thenable so await works directly
  stub[Symbol.toStringTag] = 'Promise';
  return stub;
};

// ── Real Supabase client (for tables that DO exist) ──────────────────────────
const _realClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    detectSessionInUrl: true,
    autoRefreshToken: true,
    storageKey: 'sb-main-auth-token',
  },
});

// ── Proxy: intercepts .from() to remap/stub as needed ───────────────────────
const compatClient = new Proxy(_realClient, {
  get(target, prop) {
    if (prop !== 'from') return target[prop];

    return (tableName) => {
      // 1. Stubbed tables → silent no-op
      if (STUB_TABLES.has(tableName)) {
        return makeStub();
      }

      // 3. job_jobrole_sponsored_sync → jobs_all_roles with remapping
      if (tableName === 'job_jobrole_sponsored_sync') {
        const realQuery = target.from('jobs_all_roles');

        // Reverse map for remapping query column names
        const REVERSE_ALIAS = {};
        for (const [src, alias] of Object.entries(COL_ALIAS)) REVERSE_ALIAS[alias] = src;

        const remapArg = (arg) => {
          if (typeof arg !== 'string') return arg;
          // Remap simple column names
          if (REVERSE_ALIAS[arg]) return REVERSE_ALIAS[arg];
          // Remap complex strings like "company.ilike.%google%" or "and(title.ilike.%a%,company.ilike.%b%)"
          let out = arg;
          for (const [alias, src] of Object.entries(REVERSE_ALIAS)) {
            const regex = new RegExp(`\\b${alias}\\b`, 'g');
            out = out.replace(regex, src);
          }
          return out;
        };

        // Wrap the query builder so we can post-process results and pre-process queries
        return new Proxy(realQuery, {
          get(qTarget, qProp) {
            // Intercept .then() so we can remap rows in the resolved data
            if (qProp === 'then') {
              return (resolve, reject) => {
                Promise.resolve(qTarget).then((result) => {
                  if (result && result.data) {
                    result.data = Array.isArray(result.data)
                      ? result.data.map(remapRow)
                      : remapRow(result.data);
                  }
                  resolve(result);
                }, reject);
              };
            }

            // For chainable methods, return the proxied builder
            const val = qTarget[qProp];
            if (typeof val === 'function') {
              return (...args) => {
                // Remap column names in common PostgREST filter methods
                const filteredMethods = ['select', 'eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'like', 'ilike', 'is', 'in', 'contains', 'containedBy', 'rangeGt', 'rangeGte', 'rangeLt', 'rangeLte', 'rangeAdjacent', 'overlaps', 'textSearch', 'match', 'not', 'or', 'filter', 'order'];
                
                if (filteredMethods.includes(qProp)) {
                  // If the column being filtered/sorted doesn't exist in the new DB, skip this call
                  const colName = args[0];
                  const nonExistentCols = ['wage_level', 'wage_num', 'salary', 'sponsored_job', 'jobId', 'assigned_to', 'apply_type', 'years_exp_required', 'upload_date', 'synced_at'];
                  
                  if (typeof colName === 'string' && nonExistentCols.some(c => colName.includes(c))) {
                    console.warn(`supabaseCompat: Skipping filter/order on non-existent column "${colName}"`);
                    return new Proxy(qTarget, this); 
                  }
                  
                  const remappedArgs = args.map(remapArg);
                  const next = val.apply(qTarget, remappedArgs);
                  if (next && typeof next.then === 'function' && typeof next.select === 'function') {
                    return new Proxy(next, this);
                  }
                  return next;
                }

                const next = val.apply(qTarget, args);
                // If the result is a query builder (has .select), wrap it again
                if (next && typeof next.then === 'function' && typeof next.select === 'function') {
                  return new Proxy(next, this);
                }
                return next;
              };
            }
            return val;
          },
        });
      }

      // 4. All other tables → pass through to real client
      return target.from(tableName);
    };
  },
});

export { compatClient as supabase };
export default compatClient;
