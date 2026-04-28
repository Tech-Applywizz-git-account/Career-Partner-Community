/**
 * queryCache.js
 * ─────────────────────────────────────────────────────────────
 * Lightweight in-memory TTL cache for Supabase query results.
 *
 * RULES:
 *  - Cache keys encode every query parameter (filter, search, levels, page).
 *  - Each unique combination gets its own isolated slot — no bleed between filters.
 *  - Every entry expires automatically after its TTL (default 5 min).
 *  - Use cacheInvalidatePrefix() to bust related entries on realtime events.
 *
 * WHERE IT LIVES: browser memory (module-level Map).
 *  → Automatically cleared on tab close.
 *  → Never shared across users (no server, no localStorage).
 */

// ── Internal store ──────────────────────────────────────────────────────────
const _memCache = new Map(); // { key → { data, timestamp, ttl } }

// ── Default TTLs (ms) ───────────────────────────────────────────────────────
export const TTL = {
  JOBS_BROWSE:   5 * 60 * 1000,   // 5 min  — All Jobs / Verified tab (no search)
  JOBS_SEARCH:   2 * 60 * 1000,   // 2 min  — any search query (users expect freshness)
  VERIFIED_SET: 10 * 60 * 1000,   // 10 min — confirmed company name set (changes rarely)
  LCA_FILINGS:  15 * 60 * 1000,   // 15 min — historical filing counts (nearly static)
};

// ── Cache Key Builder ────────────────────────────────────────────────────────
/**
 * Builds a deterministic cache key from query parameters.
 *
 * @param {Object} params
 * @param {string} [params.table='jobs']   - logical data namespace
 * @param {string} [params.filter='all']   - 'all' | 'verified'
 * @param {string} [params.search='']      - search term (normalized)
 * @param {string[]} [params.levels=[]]    - wage level filters e.g. ['Lv 1','Lv 3']
 * @param {number}  [params.page=1]        - page number
 * @returns {string} unique cache key
 */
export const buildCacheKey = ({ table = 'jobs', filter = 'all', search = '', levels = [], page = 1 }) => {
  // Normalize search: lowercase + trim so 'Engineer' === 'engineer'
  const searchStr = (search || '').trim().toLowerCase() || 'none';

  // Sort levels so ['Lv 2','Lv 1'] and ['Lv 1','Lv 2'] hit the same slot
  const levelStr = Array.isArray(levels) && levels.length > 0
    ? levels.slice().sort().join(',')
    : 'all';

  return `${table}:${filter}:${searchStr}:${levelStr}:${String(page)}`;
};

// ── Core Cache Operations ────────────────────────────────────────────────────

/**
 * Returns cached data if the key exists and has NOT expired.
 * Returns null on miss or expiry (expired entry is deleted).
 */
export const cacheGet = (key) => {
  if (!_memCache.has(key)) return null;

  const entry = _memCache.get(key);
  if (Date.now() - entry.timestamp < entry.ttl) {
    return entry.data; // ✅ HIT
  }

  _memCache.delete(key); // Expired — evict
  return null;           // MISS
};

/**
 * Stores data under key with a specific TTL.
 * Overwrites any existing entry for that key.
 */
export const cacheSet = (key, data, ttlMs = TTL.JOBS_BROWSE) => {
  _memCache.set(key, {
    data,
    timestamp: Date.now(),
    ttl: ttlMs,
  });
};

/**
 * Deletes all cache entries whose key starts with the given prefix.
 * Use this for targeted invalidation (e.g. bust only 'verifiedSet:' entries).
 *
 * @param {string} prefix - e.g. 'verifiedSet', 'jobs:verified'
 */
export const cacheInvalidatePrefix = (prefix) => {
  for (const key of _memCache.keys()) {
    if (key.startsWith(prefix)) {
      _memCache.delete(key);
    }
  }
};

/**
 * Wipes the entire cache.
 * Use on logout or when an admin action changes underlying data.
 */
export const cacheClear = () => _memCache.clear();
