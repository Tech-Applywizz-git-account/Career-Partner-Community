/**
 * Standalone Sync Script
 * ----------------------
 * Syncs ONLY missing records from the external source DB into
 * job_jobrole_sponsored_sync in your main DB.
 *
 * Deduplicates by (url + job_role_name) — only inserts records
 * that don't already exist in your DB.
 *
 * Usage:
 *   node scripts/sync-missing-jobs.mjs
 *
 * Requires: @supabase/supabase-js (already in project deps)
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// Load .env from project root
const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '..', '.env') });

// --- Database Clients ---
const MAIN_URL = process.env.VITE_SUPABASE_URL;
const MAIN_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const EXT_URL = process.env.VITE_EXTERNAL_SUPABASE_URL;
const EXT_KEY = process.env.VITE_EXTERNAL_SUPABASE_ANON_KEY;

if (!MAIN_URL || !MAIN_KEY || !EXT_URL || !EXT_KEY) {
    console.error('❌ Missing environment variables. Check your .env file has:');
    console.error('   VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY');
    console.error('   VITE_EXTERNAL_SUPABASE_URL, VITE_EXTERNAL_SUPABASE_ANON_KEY');
    process.exit(1);
}

const mainDb = createClient(MAIN_URL, MAIN_KEY);
const extDb = createClient(EXT_URL, EXT_KEY);

// Import the wage level lookup logic
import { getWageLevel } from '../src/dataSyncService.js';

// --- Helpers ---
const fixTimestamp = (ts) => (ts === 'null' || !ts) ? null : ts;

async function fetchAllPaginated(client, table, orderCol, selectCols = '*') {
    let allData = [];
    let page = 0;
    const pageSize = 1000;

    while (true) {
        const { data, error } = await client
            .from(table)
            .select(selectCols)
            .range(page * pageSize, (page + 1) * pageSize - 1)
            .order(orderCol, { ascending: false });

        if (error) throw error;
        if (!data || data.length === 0) break;

        allData = [...allData, ...data];
        page++;

        if (data.length < pageSize) break;
        process.stdout.write(`\r  Fetched ${allData.length} records...`);
    }

    return allData;
}

// --- Main Sync ---
async function syncMissingJobs() {
    console.log('🚀 Starting sync of missing job records...\n');

    // Step 1: Fetch all records from EXTERNAL source DB
    console.log('📡 Step 1: Fetching from external source DB (job_jobrole_sponsored)...');
    const sourceData = await fetchAllPaginated(extDb, 'job_jobrole_sponsored', 'date_posted');
    console.log(`\n   ✅ External source: ${sourceData.length} total records\n`);

    // Step 2: Fetch existing (url + job_role_name) from MAIN DB
    console.log('📡 Step 2: Fetching existing records from main DB (job_jobrole_sponsored_sync)...');
    const existingRecords = await fetchAllPaginated(mainDb, 'job_jobrole_sponsored_sync', 'id', 'url, job_role_name');
    console.log(`\n   ✅ Main DB: ${existingRecords.length} existing records\n`);

    // Step 3: Build set of existing IDs for robust matching
    const existingIds = new Set(
        existingRecords.map(r => r.id)
    );

    // Step 4: Filter to find only missing records by ID
    const missingData = sourceData.filter(record =>
        !existingIds.has(record.id)
    );

    console.log(`🔍 Step 3: Comparison results:`);
    console.log(`   Source records:   ${sourceData.length}`);
    console.log(`   Already in DB:    ${existingRecords.length}`);
    console.log(`   Missing records:  ${missingData.length}`);
    console.log('');

    if (missingData.length === 0) {
        console.log('✅ Nothing to sync — your DB is already up to date!');
        return;
    }

    // Step 5: Insert missing records in batches
    console.log(`📥 Step 4: Inserting ${missingData.length} missing records...\n`);

    const batchSize = 200;
    let totalInserted = 0;
    let totalErrors = 0;

    for (let i = 0; i < missingData.length; i += 50) {
        const batchRaw = missingData.slice(i, i + 50);
        const batch = await Promise.all(batchRaw.map(async (record) => {
            try {
                const results = await getWageLevel(record.title || record.job_role_name, record.location);
                const wageLevelStr = (results && results.length > 0) ? results[0]['Wage Level'] : 'Lv 2';
                const wageNum = parseInt(wageLevelStr.match(/\d/)?.[0] || '2');
                return {
                    ...record,
                    date_posted: fixTimestamp(record.date_posted),
                    upload_date: fixTimestamp(record.upload_date),
                    wage_level: wageLevelStr,
                    wage_num: wageNum,
                    synced_at: new Date().toISOString()
                };
            } catch (err) {
                return {
                    ...record,
                    date_posted: fixTimestamp(record.date_posted),
                    upload_date: fixTimestamp(record.upload_date),
                    wage_level: 'Lv 2',
                    wage_num: 2,
                    synced_at: new Date().toISOString()
                };
            }
        }));

        // Rule: Preserve the source DB's 'id' field
        // batch.forEach(record => { delete record.id; });

        const { error } = await mainDb
            .from('job_jobrole_sponsored_sync')
            .insert(batch);

        if (error) {
            console.error(`   ❌ Batch ${Math.floor(i / batchSize) + 1} error: ${error.message}`);
            totalErrors++;
        } else {
            totalInserted += batch.length;
        }

        const pct = Math.round(((i + batch.length) / missingData.length) * 100);
        process.stdout.write(`\r   Progress: ${pct}% (${totalInserted} inserted, ${totalErrors} errors)`);
    }

    console.log('\n');
    console.log('═══════════════════════════════════════');
    console.log(`✅ Sync complete!`);
    console.log(`   Inserted:  ${totalInserted}`);
    console.log(`   Errors:    ${totalErrors}`);
    console.log(`   Total now: ${existingRecords.length + totalInserted}`);
    console.log('═══════════════════════════════════════');
}

// Run
syncMissingJobs()
    .then(() => process.exit(0))
    .catch(err => {
        console.error('\n💥 Fatal error:', err);
        process.exit(1);
    });
