/**
 * Data Sync Service
 * -----------------
 * Fetches data from the external Supabase database (audit_reviews, job_jobrole_sponsored)
 * and caches it locally in the main Supabase database.
 * 
 * This service can be:
 * 1. Called on app load (with 24h cache check)
 * 2. Triggered manually by admin
 * 3. Run as a scheduled Supabase Edge Function (recommended for production)
 */

import { supabase } from './supabaseClient.js';
import { externalSupabase } from './externalSupabaseClient.js';

const SYNC_CACHE_KEY = 'lastSyncTimestamp';
const SYNC_INTERVAL_MS = 30 * 60 * 1000; // 30 minutes — pick up new source data faster
const IS_SYNC_ENABLED = false; // Disabled completely. Legacy sync was crashing the DB by paginating 229k rows into stubbed tables.

/**
 * Check if sync is needed (hasn't run in the last 24 hours)
 */
export const isSyncNeeded = () => {
    try {
        const lastSync = localStorage.getItem(SYNC_CACHE_KEY);
        if (!lastSync) return true;

        const elapsed = Date.now() - parseInt(lastSync, 10);
        return elapsed > SYNC_INTERVAL_MS;
    } catch {
        return true;
    }
};

/**
 * Update the last sync timestamp
 */
const markSyncComplete = () => {
    localStorage.setItem(SYNC_CACHE_KEY, Date.now().toString());
};

/**
 * Helper to fetch all records from a table in the MAIN database using pagination.
 * Necessary because regular .select() is limited to 1000 items.
 */
const fetchAllExistingFromMain = async (table, selectStr) => {
    let allData = [];
    let page = 0;
    const pageSize = 1000;
    let hasMore = true;

    while (hasMore) {
        const { data, error } = await supabase
            .from(table)
            .select(selectStr)
            .range(page * pageSize, (page + 1) * pageSize - 1);

        if (error) throw error;

        if (data && data.length > 0) {
            allData = [...allData, ...data];
            page++;
            hasMore = data.length === pageSize;
        } else {
            hasMore = false;
        }
    }
    return allData;
};

/**
 * Sync audit_reviews from external DB to local audit_reviews_sync table
 */
export const syncAuditReviews = async () => {
    console.log('⏭️ audit_reviews sync is deprecated and disabled.');
    return { success: true, recordsSynced: 0, message: 'Deprecated' };
    console.log('🔄 Starting audit_reviews sync...');

    try {
        // Fetch all audit reviews from external DB
        let allData = [];
        let page = 0;
        const pageSize = 1000;
        let hasMore = true;

        while (hasMore) {
            const { data, error } = await externalSupabase
                .from('audit_reviews')
                .select('id, job_id, company, role, domain, job_link, decision, remarks, observant_name, audit_date, created_at, tl_confirmation, tl_name, admin_confirmation, admin_name, audit_link_review, salary')
                .range(page * pageSize, (page + 1) * pageSize - 1)
                .order('created_at', { ascending: false });

            if (error) throw error;

            if (data && data.length > 0) {
                allData = [...allData, ...data];
                page++;
                hasMore = data.length === pageSize;
            } else {
                hasMore = false;
            }
        }

        if (allData.length === 0) {
            console.log('ℹ️ No audit reviews found in external DB');
            return { success: true, recordsSynced: 0 };
        }

        // Use UPSERT to update existing records and insert new ones
        const batchSize = 100; // Smaller batch size for upsert
        let totalSynced = 0;

        for (let i = 0; i < allData.length; i += batchSize) {
            const batch = allData.slice(i, i + batchSize).map(record => ({
                // Explicitly map only columns that exist in audit_reviews_sync
                // DO NOT use ...record spread — external DB has extra columns (e.g. 'edits')
                // that don't exist in the local table schema, causing PGRST204 errors.
                id: record.id,
                job_id: record.job_id,
                company: record.company,
                role: record.role,
                domain: record.domain,
                job_link: record.job_link,
                decision: record.decision,
                remarks: record.remarks,
                observant_name: record.observant_name,
                audit_date: record.audit_date,
                created_at: record.created_at || new Date().toISOString(),
                tl_confirmation: record.tl_confirmation || 'Pending',
                tl_name: record.tl_name || null,
                admin_confirmation: record.admin_confirmation || 'Pending',
                admin_name: record.admin_name || null,
                audit_link_review: record.audit_link_review || null,
                salary: record.salary || null,
                // NOTE: 'job_type' and 'edits' exist in the EXTERNAL source DB
                // but NOT in the local audit_reviews_sync table — DO NOT include them.
                synced_at: new Date().toISOString()
            }));

            const { error: upsertError } = await supabase
                .from('audit_reviews_sync')
                .upsert(batch, { onConflict: 'id' });

            if (upsertError) {
                console.error(`❌ Error upserting audit reviews batch ${i / batchSize + 1}:`, upsertError);
            } else {
                totalSynced += batch.length;
            }
        }

        return { success: true, recordsSynced: totalSynced };

        // Silence inserted log

        return { success: true, recordsSynced: totalInserted };

    } catch (error) {
        console.error('❌ Audit reviews sync failed:', error);
        return { success: false, error: error.message, recordsSynced: 0 };
    }
};

/**
 * Sync audit_reviews_backup from external DB to local audit_reviews_backup table
 */
export const syncAuditReviewsBackup = async () => {
    if (!IS_SYNC_ENABLED) {
        console.log('⏭️ Sync is currently disabled.');
        return { success: true, recordsSynced: 0, message: 'Sync disabled' };
    }
    console.log('🔄 Starting audit_reviews_backup incremental sync...');

    try {
        // ── Step 1: Fetch all records from SOURCE (external DB) ──────────────
        let sourceData = [];
        let page = 0;
        const pageSize = 1000;
        let hasMore = true;

        while (hasMore) {
            const { data, error } = await externalSupabase
                .from('audit_reviews_backup')
                .select('id, job_id, company, role, domain, job_link, decision, remarks, observant_name, audit_date, created_at, tl_confirmation, tl_name, admin_confirmation, admin_name, audit_link_review, salary')
                .range(page * pageSize, (page + 1) * pageSize - 1)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('❌ Error reading from source audit_reviews_backup:', error.message);
                throw error;
            }

            if (data && data.length > 0) {
                sourceData = [...sourceData, ...data];
                page++;
                hasMore = data.length === pageSize;
            } else {
                hasMore = false;
            }
        }

        if (sourceData.length === 0) {
            console.log('ℹ️ No records found in source audit_reviews_backup');
            return { success: true, recordsSynced: 0 };
        }

        console.log(`📥 Found ${sourceData.length} records in source`);

        // ── Step 2: Fetch all existing job_ids from TARGET (main DB) ─────────
        // Use job_id as the natural deduplication key (not the UUID id which may differ)
        const existingRecords = await fetchAllExistingFromMain('audit_reviews_backup', 'job_id');
        const existingJobIds = new Set((existingRecords || []).map(r => r.job_id));

        console.log(`📋 Target already has ${existingJobIds.size} records`);

        // ── Step 3: Filter to only NEW records not in target ─────────────────
        const newRecords = sourceData.filter(r => !existingJobIds.has(r.job_id));

        if (newRecords.length === 0) {
            console.log('✅ audit_reviews_backup is already up to date — nothing to insert');
            return { success: true, recordsSynced: 0 };
        }

        console.log(`🆕 Inserting ${newRecords.length} new records into audit_reviews_backup`);

        // ── Step 4: INSERT only new records — NO DELETE, NO UPDATE of existing ─
        // Strip synced_at (not in schema) and keep only known columns
        const batchSize = 100;
        let totalInserted = 0;

        for (let i = 0; i < newRecords.length; i += batchSize) {
            const batch = newRecords.slice(i, i + batchSize).map(record => ({
                id: record.id,
                job_id: record.job_id,
                company: record.company,
                role: record.role,
                domain: record.domain,
                job_link: record.job_link,
                decision: record.decision,
                remarks: record.remarks,
                observant_name: record.observant_name,
                audit_date: record.audit_date,
                created_at: record.created_at || new Date().toISOString(),
                tl_confirmation: record.tl_confirmation || 'Pending',
                tl_name: record.tl_name || null,
                admin_confirmation: record.admin_confirmation || 'Pending',
                admin_name: record.admin_name || null,
                audit_link_review: record.audit_link_review || null,
                salary: record.salary || null,
            }));

            const { error: insertError } = await supabase
                .from('audit_reviews_backup')
                .insert(batch);  // INSERT only — never delete or overwrite

            if (insertError) {
                console.error(`❌ Error inserting backup batch ${Math.floor(i / batchSize) + 1}:`, insertError.message);
                // Continue with next batch even if one fails
            } else {
                totalInserted += batch.length;
                console.log(`✅ Batch ${Math.floor(i / batchSize) + 1}: inserted ${batch.length} records`);
            }
        }

        console.log(`✅ audit_reviews_backup sync complete — inserted ${totalInserted} new records`);
        return { success: true, recordsSynced: totalInserted };

    } catch (error) {
        console.error('❌ Audit reviews backup sync failed:', error);
        return { success: false, error: error.message, recordsSynced: 0 };
    }
};

/**
 * Sync job_jobrole_sponsored from external DB to local job_jobrole_sponsored_sync table
 */
export const syncSponsoredJobs = async () => {
    if (!IS_SYNC_ENABLED) {
        console.log('⏭️ Sync is currently disabled.');
        return { success: true, recordsSynced: 0, message: 'Sync disabled' };
    }
    console.log('🔄 Starting job_jobrole_sponsored sync...');

    try {
        // Fetch all sponsored jobs from external DB
        let allData = [];
        let page = 0;
        const pageSize = 1000;
        let hasMore = true;

        while (hasMore) {
            const { data, error } = await externalSupabase
                .from('job_jobrole_sponsored')
                .select('*')
                .range(page * pageSize, (page + 1) * pageSize - 1)
                .order('date_posted', { ascending: false });

            if (error) throw error;

            if (data && data.length > 0) {
                allData = [...allData, ...data];
                page++;
                hasMore = data.length === pageSize;
            } else {
                hasMore = false;
            }
        }

        if (allData.length === 0) {
            console.log('ℹ️ No sponsored jobs found in external DB');
            return { success: true, recordsSynced: 0 };
        }

        // --- INCREMENTAL SYNC LOGIC ---
        // Fetch ALL existing (url + job_role_name) combos using pagination
        const existingRecords = await fetchAllExistingFromMain('job_jobrole_sponsored_sync', 'url, job_role_name');
        const existingKeys = new Set(
            (existingRecords || []).map(r => `${r.url}|||${r.job_role_name}`)
        );

        // Filter out records where (url + job_role_name) already exists
        const newData = allData.filter(record =>
            !existingKeys.has(`${record.url}|||${record.job_role_name}`)
        );

        if (newData.length === 0) {
            console.log('ℹ️ No new sponsored jobs to sync');
            return { success: true, recordsSynced: 0 };
        }

        console.log(`🆕 Found ${newData.length} new sponsored jobs to insert`);

        // Helper to fix invalid "null" strings in timestamps
        const fixTimestamp = (ts) => (ts === 'null' || !ts) ? null : ts;

        // Insert in batches with explicit column mapping (never spread ...record)
        // The external table has extra columns not in local schema — the spread
        // was causing every batch to fail with HTTP 400 Bad Request.
        const batchSize = 20; // increased from 5 — 4x fewer round-trips per sync
        let totalInserted = 0;
        const delay = (ms) => new Promise(res => setTimeout(res, ms));

        for (let i = 0; i < newData.length; i += batchSize) {
            const batchRaw = newData.slice(i, i + batchSize);

            // PRE-CALCULATE wage level for global sorting
            const batch = await Promise.all(batchRaw.map(async (record) => {
                let wageLevelStr = 'Lv 2';
                let wageNum = 2;
                try {
                    const results = await getWageLevel(record.title || record.job_role_name, record.location);
                    if (results && results.length > 0) {
                        wageLevelStr = results[0]['Wage Level'];
                        wageNum = parseInt(wageLevelStr.match(/\d/)?.[0] || '2');
                    }
                } catch (_) { /* silent fail — default wage used */ }

                // Explicit column map — ONLY include columns that exist in the local
                // job_jobrole_sponsored_sync table. DO NOT use ...record spread.
                return {
                    id:               record.id,
                    title:            record.title            || null,
                    company:          record.company          || null,
                    location:         record.location         || null,
                    url:              record.url              || null,
                    description:      record.description      || null,
                    date_posted:      fixTimestamp(record.date_posted),
                    years_exp_required: record.years_exp_required || null,
                    upload_date:      fixTimestamp(record.upload_date),
                    job_role_name:    record.job_role_name    || null,
                    sponsored_job:    record.sponsored_job    || null,
                    country:          record.country          || null,
                    jobId:            record.jobId            || null,
                    assigned_to:      record.assigned_to      || null,
                    salary:           record.salary           || null,
                    apply_type:       record.apply_type       || null,
                    wage_level:       wageLevelStr,
                    wage_num:         wageNum,
                    synced_at:        new Date().toISOString()
                };
            }));

            const { error: insertError } = await supabase
                .from('job_jobrole_sponsored_sync')
                .insert(batch);

            if (insertError) {
                console.error(`❌ Error inserting sponsored jobs batch ${i / batchSize + 1}:`, insertError);
            } else {
                totalInserted += batch.length;
            }

            // Small cooldown to prevent rate limiting/525 errors
            if (i + batchSize < newData.length) {
                await delay(100);
            }
        }

        // Silence spawned sync log

        return { success: true, recordsSynced: totalInserted };

    } catch (error) {
        console.error('❌ Sponsored jobs sync failed:', error);
        return { success: false, error: error.message, recordsSynced: 0 };
    }
};

/**
 * Log sync operation
 */
const logSync = async (tableName, syncType, recordsSynced, status, errorMessage = null) => {
    try {
        await supabase.from('sync_log').insert([{
            table_name: tableName,
            sync_type: syncType,
            records_synced: recordsSynced,
            status: status,
            error_message: errorMessage,
            completed_at: new Date().toISOString()
        }]);
    } catch (err) {
        console.warn('Could not log sync operation:', err);
    }
};

/**
 * Run full sync (audit_reviews + sponsored_jobs)
 * Called on app load or manually by admin
 */
export const runFullSync = async (force = false) => {
    if (!IS_SYNC_ENABLED) {
        console.log('⏭️ Sync is currently disabled.');
        return { success: true, message: 'Sync disabled' };
    }

    // Guard: external DB not configured — skip sync silently
    if (!externalSupabase) {
        markSyncComplete(); // prevent repeated attempts
        return { success: true, message: 'External DB not configured — sync skipped' };
    }

    if (!force && !isSyncNeeded()) {
        console.log('⏭️ Sync not needed (last sync was < 24h ago)');
        return { skipped: true };
    }

    // Silence full sync log

    const results = {};



    // Sync sponsored jobs
    const sponsoredResult = await syncSponsoredJobs();
    results.sponsoredJobs = sponsoredResult;
    await logSync(
        'job_jobrole_sponsored_sync',
        'full',
        sponsoredResult.recordsSynced,
        sponsoredResult.success ? 'success' : 'error',
        sponsoredResult.error || null
    );

    // Sync audit reviews backup
    const backupResult = await syncAuditReviewsBackup();
    results.auditReviewsBackup = backupResult;
    await logSync(
        'audit_reviews_backup',
        'full',
        backupResult.recordsSynced,
        backupResult.success ? 'success' : 'error',
        backupResult.error || null
    );

    markSyncComplete();

    console.log('✅ Full sync completed:', results);
    return results;
};

const STATE_MAPPING = {
    'AL': 'ALABAMA', 'AK': 'ALASKA', 'AZ': 'ARIZONA', 'AR': 'ARKANSAS', 'CA': 'CALIFORNIA',
    'CO': 'COLORADO', 'CT': 'CONNECTICUT', 'DE': 'DELAWARE', 'FL': 'FLORIDA', 'GA': 'GEORGIA',
    'HI': 'HAWAII', 'ID': 'IDAHO', 'IL': 'ILLINOIS', 'IN': 'INDIANA', 'IA': 'IOWA',
    'KS': 'KANSAS', 'KY': 'KENTUCKY', 'LA': 'LOUISIANA', 'ME': 'MAINE', 'MD': 'MARYLAND',
    'MA': 'MASSACHUSETTS', 'MI': 'MICHIGAN', 'MN': 'MINNESOTA', 'MS': 'MISSISSIPPI', 'MO': 'MISSOURI',
    'MT': 'MONTANA', 'NE': 'NEBRASKA', 'NV': 'NEVADA', 'NH': 'NEW HAMPSHIRE', 'NJ': 'NEW JERSEY',
    'NM': 'NEW MEXICO', 'NY': 'NEW YORK', 'NC': 'NORTH CAROLINA', 'ND': 'NORTH DAKOTA', 'OH': 'OHIO',
    'OK': 'OKLAHOMA', 'OR': 'OREGON', 'PA': 'PENNSYLVANIA', 'RI': 'RHODE ISLAND', 'SC': 'SOUTH CAROLINA',
    'SD': 'SOUTH DAKOTA', 'TN': 'TENNESSEE', 'TX': 'TEXAS', 'UT': 'UTAH', 'VT': 'VERMONT',
    'VA': 'VIRGINIA', 'WA': 'WASHINGTON', 'WV': 'WEST VIRGINIA', 'WI': 'WISCONSIN', 'WY': 'WYOMING'
};

// Simple memory cache for wage levels
const wageCache = new Map();

/**
 * Fetch H1B wage level for a given occupation and area
 * Used by JobCard to show wage level info
 */
export const getWageLevel = async (occupation, locationStr = null, salary = null) => {
    return []; // H1B table disabled by user request
    const cacheKey = `${occupation}|${locationStr}|${salary}`;
    if (wageCache.has(cacheKey)) return wageCache.get(cacheKey);

    try {
        if (!occupation) return [];

        // ── 1. Parse location ────────────────────────────────────────────────
        let city = null;
        let stateFull = null;
        if (locationStr) {
            const parts = locationStr.split(',').map(p => p.trim());
            if (parts.length >= 2) {
                const stateAbbr = parts[parts.length - 1].toUpperCase().trim().slice(0, 2);
                stateFull = STATE_MAPPING[stateAbbr] || null;
                city = parts[0].toUpperCase();
            } else {
                city = parts[0]?.toUpperCase();
            }
        }

        // ── 2. Map job title → SOC occupation keyword ────────────────────────
        const titleLower = occupation.toLowerCase();

        // Order matters — more specific patterns first
        let socKeyword = null;
        if (titleLower.match(/data\s*scien/)) socKeyword = 'Data Scientists';
        else if (titleLower.match(/machine\s*learn|deep\s*learn|artificial\s*intel|nlp|llm|ml\s*engin/)) socKeyword = 'Software Developers';
        else if (titleLower.match(/software|frontend|back.?end|full.?stack|web\s*dev|mobile\s*dev|ios|android|react|angular|vue|java|python|node|dotnet|\.net|c#|golang|scala|ruby|php/)) socKeyword = 'Software Developers';
        else if (titleLower.match(/cloud|devops|sre|platform\s*engin|infrastructure|kubernetes|docker|terraform|aws|gcp|azure/)) socKeyword = 'Software Developers';
        else if (titleLower.match(/data\s*engin|etl|pipeline|spark|kafka|hadoop|databricks|airflow/)) socKeyword = 'Software Developers';
        else if (titleLower.match(/data\s*analy|business\s*intel|bi\s*dev|tableau|power\s*bi|looker/)) socKeyword = 'Computer Occupations';
        else if (titleLower.match(/network\s*engin|network\s*admin|cisco|firewall|vpn/)) socKeyword = 'Network';
        else if (titleLower.match(/security|cyber|infosec|soc\s*analy|penetration/)) socKeyword = 'Security';
        else if (titleLower.match(/database|dba|sql\s*dev|oracle\s*dev/)) socKeyword = 'Database';
        else if (titleLower.match(/product\s*manager|project\s*manager|program\s*manager|scrum\s*master/)) socKeyword = 'Computer Occupations';
        else if (titleLower.match(/system\s*analy|business\s*analy|functional\s*analy/)) socKeyword = 'Systems Analysts';
        else if (titleLower.match(/qa|quality\s*assur|test\s*engin|sdet|automation\s*test/)) socKeyword = 'Software Developers';
        else if (titleLower.match(/mechanical\s*engin/)) socKeyword = 'Mechanical Engineers';
        else if (titleLower.match(/electrical\s*engin/)) socKeyword = 'Electrical Engineers';
        else if (titleLower.match(/civil\s*engin/)) socKeyword = 'Civil Engineers';
        else if (titleLower.match(/chemical\s*engin/)) socKeyword = 'Chemical Engineers';
        else if (titleLower.match(/accountant|accounting|cpa/)) socKeyword = 'Accountants';
        else if (titleLower.match(/financial\s*analy|finance|investment|fp&a/)) socKeyword = 'Financial';
        else if (titleLower.match(/nurse|nursing|rn\b/)) socKeyword = 'Registered Nurses';
        else if (titleLower.match(/physician|doctor|md\b/)) socKeyword = 'Physicians';
        else if (titleLower.match(/pharmacist/)) socKeyword = 'Pharmacists';
        else if (titleLower.match(/supply\s*chain/)) socKeyword = 'Supply Chain';
        else if (titleLower.match(/marketing|growth\s*market/)) socKeyword = 'Marketing';
        else if (titleLower.match(/researcher|research\s*scien|postdoc/)) socKeyword = 'Research';
        else if (titleLower.match(/engin/)) socKeyword = 'Software Developers'; // generic engineer fallback

        if (!socKeyword) {
            wageCache.set(cacheKey, []);
            return []; // Cannot map to SOC — return empty
        }

        // ── 3. Determine preferred level from title seniority ────────────────
        let preferredLevel = 2;
        if (titleLower.match(/\blead\b|\bstaff\b|\bprincipal\b|\bdirector\b|\bvp\b|\bhead\b|\bchief\b/)) preferredLevel = 4;
        else if (titleLower.match(/\bsenior\b|\bsr[\s.]\b/)) preferredLevel = 3;
        else if (titleLower.match(/\bjunior\b|\bjr[\s.]\b|\bentry\b|\bintern\b|\bgraduate\b|\bgrad\b/)) preferredLevel = 1;
        else if (titleLower.match(/\b(ii|2)\b/)) preferredLevel = 2;
        else if (titleLower.match(/\b(iii|3)\b/)) preferredLevel = 3;
        else if (titleLower.match(/\b(iv|4)\b/)) preferredLevel = 4;

        // ── 4. Query h1b_wage_data for all wage tiers ────────────────────────
        const runQuery = async (state = null, areaCity = null) => {
            let q = supabase
                .from('h1b_wage_data')
                .select('"Wage Level", "Hourly", "Yearly", "Area", "State"')
                .ilike('Occupation', `%${socKeyword}%`)
                .not('Wage Level', 'ilike', '%MEAN%'); // Exclude MEAN rows

            if (state) q = q.ilike('State', `%${state}%`);
            if (areaCity) q = q.ilike('Area', `%${areaCity}%`);

            const { data, error } = await q.limit(20);
            return error ? [] : (data || []);
        };

        let results = [];
        if (stateFull && city) results = await runQuery(stateFull, city);
        if (results.length === 0 && stateFull) results = await runQuery(stateFull, null);
        if (results.length === 0) results = await runQuery(null, null);

        if (results.length === 0) {
            wageCache.set(cacheKey, []);
            return [];
        }

        // ── 5. Map wage levels to numbers ────────────────────────────────────
        const mapLevel = (l) => {
            if (!l) return null;
            const val = l.toString().trim().toUpperCase();
            if (val.includes('MEAN')) return null;
            if (val.includes('IV') || val === '4') return 4;
            if (val.includes('III') || val === '3') return 3;
            if (val === 'II' || val === '2') return 2;
            if (val === 'I' || val === '1') return 1;
            return null;
        };

        const cleanSalaryNum = (s) => {
            if (!s) return null;
            const n = parseFloat(s.replace(/[^0-9.]/g, ''));
            return isNaN(n) ? null : n;
        };

        // ── 6. Build tier map ────────────────────────────────────────────────
        // Group by level, pick the state-level data preferring city match
        const tierMap = new Map(); // level -> { yearly, hourly }
        for (const r of results) {
            const lvl = mapLevel(r['Wage Level']);
            if (lvl === null) continue;
            if (!tierMap.has(lvl)) {
                tierMap.set(lvl, {
                    level: lvl,
                    yearly: cleanSalaryNum(r['Yearly']),
                    hourly: cleanSalaryNum(r['Hourly']),
                    area: r['Area'] || ''
                });
            }
        }

        const tiers = Array.from(tierMap.values()).sort((a, b) => a.level - b.level);
        if (tiers.length === 0) {
            wageCache.set(cacheKey, []);
            return [];
        }

        // ── 7. Pick level ────────────────────────────────────────────────────
        let chosenLevel;

        // If salary is provided, compare against thresholds
        const parsedSalary = (() => {
            if (!salary) return null;
            const nums = salary.replace(/[^0-9.,\-]/g, ' ').split(/[-–]/)
                .map(s => parseFloat(s.replace(/,/g, '').trim()))
                .filter(n => !isNaN(n) && n > 1000);
            return nums.length > 0 ? nums.reduce((a, b) => a + b, 0) / nums.length : null;
        })();

        if (parsedSalary) {
            // Find tier whose yearly is closest to the job salary
            let best = tiers[0];
            let bestDiff = Math.abs(parsedSalary - (tiers[0].yearly || 0));
            for (const t of tiers) {
                const diff = Math.abs(parsedSalary - (t.yearly || 0));
                if (diff < bestDiff) { bestDiff = diff; best = t; }
            }
            chosenLevel = best.level;
        } else {
            // Use seniority-based preferred level
            let best = tiers[0];
            let bestDist = Math.abs(tiers[0].level - preferredLevel);
            for (const t of tiers) {
                const dist = Math.abs(t.level - preferredLevel);
                if (dist < bestDist || (dist === bestDist && t.level > best.level)) {
                    bestDist = dist;
                    best = t;
                }
            }
            chosenLevel = best.level;
        }

        const chosen = tierMap.get(chosenLevel);
        const finalResults = [{
            'Wage Level': `Lv ${chosenLevel}`,
            'Yearly': chosen?.yearly?.toString(),
            'Hourly': chosen?.hourly?.toString(),
        }];

        wageCache.set(cacheKey, finalResults);
        return finalResults;
    } catch (error) {
        console.error('Error fetching wage level:', error);
        return [];
    }
};

/**
 * Fetch wage level data with pagination (for admin/dashboard views)
 */
export const fetchWageData = async (page = 1, pageSize = 50, filters = {}) => {
    return { data: [], total: 0, page, pageSize }; // H1B table disabled by user request
    try {
        let query = supabase
            .from('h1b_wage_data')
            .select('*', { count: 'exact' });

        if (filters.occupation) {
            query = query.ilike('Occupation', `%${filters.occupation}%`);
        }
        if (filters.state) {
            query = query.ilike('State', `%${filters.state}%`);
        }
        if (filters.area) {
            query = query.ilike('Area', `%${filters.area}%`);
        }
        if (filters.wageLevel) {
            query = query.eq('Wage Level', filters.wageLevel);
        }

        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;
        query = query.range(from, to).order('Occupation', { ascending: true });

        const { data, error, count } = await query;

        if (error) throw error;
        return { data: data || [], total: count || 0, page, pageSize };
    } catch (error) {
        console.error('Error fetching wage data:', error);
        return { data: [], total: 0, page, pageSize };
    }
};

/**
 * Fetch synced audit reviews (from local cache)
 */
export const fetchAuditReviews = async (page = 1, pageSize = 50, filters = {}) => {
    try {
        let query = supabase
            .from('audit_reviews_sync')
            .select('*', { count: 'exact' });

        if (filters.company) {
            query = query.ilike('company', `%${filters.company}%`);
        }
        if (filters.decision) {
            query = query.eq('decision', filters.decision);
        }
        if (filters.jobId) {
            query = query.eq('job_id', filters.jobId);
        }

        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;
        query = query.range(from, to).order('audit_date', { ascending: false });

        const { data, error, count } = await query;

        if (error) throw error;
        return { data: data || [], total: count || 0, page, pageSize };
    } catch (error) {
        console.error('Error fetching audit reviews:', error);
        return { data: [], total: 0, page, pageSize };
    }
};

/**
 * Fetch synced audit reviews backup (from local cache)
 */
export const fetchAuditReviewsBackup = async (page = 1, pageSize = 50, filters = {}) => {
    try {
        let query = supabase
            .from('audit_reviews_backup')
            .select('*', { count: 'exact' });

        if (filters.company) {
            query = query.ilike('company', `%${filters.company}%`);
        }
        if (filters.decision) {
            query = query.eq('decision', filters.decision);
        }
        if (filters.jobId) {
            query = query.eq('job_id', filters.jobId);
        }

        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;
        query = query.range(from, to).order('audit_date', { ascending: false });

        const { data, error, count } = await query;

        if (error) throw error;
        return { data: data || [], total: count || 0, page, pageSize };
    } catch (error) {
        console.error('Error fetching audit reviews backup:', error);
        return { data: [], total: 0, page, pageSize };
    }
};

/**
 * Fetch synced sponsored jobs (from local cache)
 */
export const fetchSponsoredJobs = async (page = 1, pageSize = 50, filters = {}) => {
    try {
        let query = supabase
            .from('job_jobrole_sponsored_sync')
            .select('*', { count: 'exact' });

        if (filters.company) {
            query = query.ilike('company', `%${filters.company}%`);
        }
        if (filters.jobRole) {
            query = query.ilike('job_role_name', `%${filters.jobRole}%`);
        }
        if (filters.location) {
            query = query.ilike('location', `%${filters.location}%`);
        }
        if (filters.sponsored) {
            query = query.eq('sponsored_job', filters.sponsored);
        }

        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;
        query = query.range(from, to).order('date_posted', { ascending: false });

        const { data, error, count } = await query;

        if (error) throw error;
        return { data: data || [], total: count || 0, page, pageSize };
    } catch (error) {
        console.error('Error fetching sponsored jobs:', error);
        return { data: [], total: 0, page, pageSize };
    }
};

/**
 * Get the last sync status for all tables
 */
export const getLastSyncStatus = async () => {
    try {
        const { data, error } = await supabase
            .from('sync_log')
            .select('*')
            .order('started_at', { ascending: false })
            .limit(10);

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error fetching sync status:', error);
        return [];
    }
};
