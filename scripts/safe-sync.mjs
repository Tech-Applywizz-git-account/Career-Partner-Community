import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, '..', '.env');

// --- Configuration ---
const MAIN_URL = process.env.VITE_SUPABASE_URL;
const MAIN_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY; // Use Service Role for safe upserts
const EXT_URL = process.env.VITE_EXTERNAL_SUPABASE_URL;
const EXT_KEY = process.env.VITE_EXTERNAL_SUPABASE_ANON_KEY;

if (!MAIN_URL || !MAIN_KEY || !EXT_URL || !EXT_KEY) {
    console.error('❌ Missing environment variables. Need VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, VITE_EXTERNAL_SUPABASE_URL, VITE_EXTERNAL_SUPABASE_ANON_KEY');
    process.exit(1);
}

const mainDb = createClient(MAIN_URL, MAIN_KEY);
const extDb = createClient(EXT_URL, EXT_KEY);

const TABLES = [
    { source: 'job_jobrole_sponsored', target: 'job_jobrole_sponsored_sync', key: 'id' },
    { source: 'audit_reviews', target: 'audit_reviews_sync', key: 'id' }
];

async function fetchWithRetry(client, table, page, pageSize) {
    let retries = 3;
    while (retries > 0) {
        try {
            const { data, error } = await client
                .from(table)
                .select('*')
                .range(page * pageSize, (page + 1) * pageSize - 1)
                .order('id', { ascending: true });

            if (error) throw error;
            return data;
        } catch (err) {
            console.warn(`⚠️ Fetch failed for ${table} (page ${page}), retrying... (${retries} left)`);
            retries--;
            await new Promise(r => setTimeout(r, 2000));
        }
    }
    throw new Error(`❌ Failed to fetch ${table} after multiple retries.`);
}

async function syncTable(tableInfo) {
    console.log(`\n🚀 Starting STRICT SYNC for ${tableInfo.target}...`);
    console.log(`🔒 Rule: No deletion, Match by ${tableInfo.key}, Use Upsert.`);

    let page = 0;
    const pageSize = 1000;
    let totalSynced = 0;
    let totalErrors = 0;

    while (true) {
        const data = await fetchWithRetry(extDb, tableInfo.source, page, pageSize);
        if (!data || data.length === 0) break;

        // Process batch
        const batch = data.map(r => ({
            ...r,
            synced_at: new Date().toISOString(),
            // Ensure defaults for job table
            ...(tableInfo.target === 'job_jobrole_sponsored_sync' ? {
                wage_level: r.wage_level || 'Lv 2',
                wage_num: r.wage_num || 2
            } : {})
        }));

        // Upsert to main DB
        const { error } = await mainDb
            .from(tableInfo.target)
            .upsert(batch, { onConflict: tableInfo.key });

        if (error) {
            console.error(`\n❌ Error upserting batch ${page}:`, error.message);
            totalErrors += batch.length;
        } else {
            totalSynced += batch.length;
            process.stdout.write(`\r   Progress: ${totalSynced} records synced...`);
        }

        if (data.length < pageSize) break;
        page++;
    }

    console.log(`\n✅ Sync complete for ${tableInfo.target}.`);
    console.log(`   Total records upserted/matched: ${totalSynced}`);
    console.log(`   Total errors: ${totalErrors}`);
}

async function run() {
    console.log('=========================================');
    console.log('🛡️  ROBUST STRICT SYNCHRONIZATION 🛡️');
    console.log('=========================================');

    try {
        for (const t of TABLES) {
            await syncTable(t);
        }
    } catch (err) {
        console.error('\n💥 Fatal Sync Error:', err.message);
    }

    console.log('\n=========================================');
    console.log('📊 Final Check:');
    const { count: jobCount } = await mainDb.from('job_jobrole_sponsored_sync').select('*', { count: 'exact', head: true });
    const { count: auditCount } = await mainDb.from('audit_reviews_sync').select('*', { count: 'exact', head: true });
    console.log(`   Total Sponsored Jobs: ${jobCount}`);
    console.log(`   Total Audit Reviews:  ${auditCount}`);
    console.log('=========================================');
}

run();
