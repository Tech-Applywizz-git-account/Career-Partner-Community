/**
 * Sync Missing Duplicates Script
 * --------------------------------
 * The source DB has 21,176 records. Our DB has 17,849.
 * The difference (3,327) are records where the source has
 * MULTIPLE rows with the same (url + job_role_name) but
 * our DB only has 1 copy.
 *
 * This script:
 * 1. Groups source records by (url + job_role_name) with counts
 * 2. Groups our records by (url + job_role_name) with counts
 * 3. For each group where source has MORE, inserts the missing copies
 *
 * Usage:
 *   node scripts/sync-remaining-jobs.mjs
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '..', '.env') });

const mainDb = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
const extDb = createClient(process.env.VITE_EXTERNAL_SUPABASE_URL, process.env.VITE_EXTERNAL_SUPABASE_ANON_KEY);

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

async function syncRemaining() {
    console.log('🚀 Syncing remaining records to match source DB exactly...\n');

    // Step 1: Fetch ALL records from source
    console.log('📡 Step 1: Fetching ALL source records...');
    const sourceData = await fetchAllPaginated(extDb, 'job_jobrole_sponsored', 'date_posted');
    console.log(`\n   ✅ Source: ${sourceData.length} records\n`);

    // Step 2: Fetch existing (url + job_role_name) from our DB
    console.log('📡 Step 2: Fetching existing records from main DB...');
    const existingData = await fetchAllPaginated(mainDb, 'job_jobrole_sponsored_sync', 'id', 'url, job_role_name');
    console.log(`\n   ✅ Main DB: ${existingData.length} records\n`);

    // Step 3: Count per (url + job_role_name) in BOTH databases
    const sourceGroups = new Map();
    for (const r of sourceData) {
        const key = `${r.url}|||${r.job_role_name}`;
        if (!sourceGroups.has(key)) {
            sourceGroups.set(key, { count: 0, records: [] });
        }
        const group = sourceGroups.get(key);
        group.count++;
        group.records.push(r);
    }

    const existingCounts = new Map();
    for (const r of existingData) {
        const key = `${r.url}|||${r.job_role_name}`;
        existingCounts.set(key, (existingCounts.get(key) || 0) + 1);
    }

    // Step 4: Find groups where source has MORE records than we do
    const toInsert = [];
    for (const [key, group] of sourceGroups) {
        const ourCount = existingCounts.get(key) || 0;
        const deficit = group.count - ourCount;

        if (deficit > 0) {
            // Take the LAST N records from this group (most recent ones from source)
            const recordsToAdd = group.records.slice(-deficit);
            toInsert.push(...recordsToAdd);
        }
    }

    console.log(`🔍 Step 3: Comparison:`);
    console.log(`   Source total:     ${sourceData.length}`);
    console.log(`   Our DB total:     ${existingData.length}`);
    console.log(`   Records to add:   ${toInsert.length}`);
    console.log(`   Expected final:   ${existingData.length + toInsert.length}`);
    console.log('');

    if (toInsert.length === 0) {
        console.log('✅ Nothing to insert — counts already match!');
        return;
    }

    // Step 5: Insert in batches
    console.log(`📥 Step 4: Inserting ${toInsert.length} records...\n`);
    const batchSize = 200;
    let totalInserted = 0;
    let totalErrors = 0;

    for (let i = 0; i < toInsert.length; i += batchSize) {
        const batch = toInsert.slice(i, i + batchSize).map(record => {
            const cleaned = {
                ...record,
                date_posted: fixTimestamp(record.date_posted),
                upload_date: fixTimestamp(record.upload_date),
                wage_level: record.wage_level || 'Lv 2',
                wage_num: record.wage_num || 2,
                synced_at: new Date().toISOString()
            };
            // Remove source id — let our serial auto-generate
            delete cleaned.id;
            return cleaned;
        });

        const { error } = await mainDb
            .from('job_jobrole_sponsored_sync')
            .insert(batch);

        if (error) {
            console.error(`   ❌ Batch ${Math.floor(i / batchSize) + 1} error: ${error.message}`);
            totalErrors++;
        } else {
            totalInserted += batch.length;
        }

        const pct = Math.round(((i + batch.length) / toInsert.length) * 100);
        process.stdout.write(`\r   Progress: ${pct}% (${totalInserted} inserted, ${totalErrors} errors)`);
    }

    console.log('\n');
    console.log('═══════════════════════════════════════');
    console.log(`✅ Sync complete!`);
    console.log(`   Inserted:  ${totalInserted}`);
    console.log(`   Errors:    ${totalErrors}`);
    console.log(`   Total now: ${existingData.length + totalInserted}`);
    console.log(`   Target:    ${sourceData.length}`);
    console.log('═══════════════════════════════════════');
}

syncRemaining()
    .then(() => process.exit(0))
    .catch(err => {
        console.error('\n💥 Fatal error:', err);
        process.exit(1);
    });
