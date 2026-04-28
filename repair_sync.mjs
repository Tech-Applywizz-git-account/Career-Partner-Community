import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const MAIN_URL = process.env.VITE_SUPABASE_URL;
const MAIN_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const EXT_URL = process.env.VITE_EXTERNAL_SUPABASE_URL;
const EXT_KEY = process.env.VITE_EXTERNAL_SUPABASE_ANON_KEY;

const mainDb = createClient(MAIN_URL, MAIN_KEY);
const extDb = createClient(EXT_URL, EXT_KEY);

// Import the wage level lookup logic
import { getWageLevel } from './src/dataSyncService.js';

async function syncAllAuditReviews() {
    console.log('🚀 Syncing Audit Reviews...');

    // 1. Fetch ALL from external
    let allExt = [];
    let page = 0;
    while (true) {
        const { data, error } = await extDb.from('audit_reviews').select('*').range(page * 1000, (page + 1) * 1000 - 1);
        if (error) throw error;
        if (!data || data.length === 0) break;
        allExt.push(...data);
        page++;
    }
    console.log(`Fetched ${allExt.length} from external.`);

    // 2. Fetch existing IDs from main
    let existingIds = new Set();
    page = 0;
    while (true) {
        const { data, error } = await mainDb.from('audit_reviews_sync').select('id').range(page * 1000, (page + 1) * 1000 - 1);
        if (error) throw error;
        if (!data || data.length === 0) break;
        data.forEach(r => existingIds.add(r.id));
        page++;
    }
    console.log(`Found ${existingIds.size} existing in main.`);

    // 4. Upsert in batches (to handle updates like tl_confirmation)
    console.log(`Upserting ${allExt.length} records to ensure latest status...`);
    for (let i = 0; i < allExt.length; i += 200) {
        const batch = allExt.slice(i, i + 200).map(r => ({ ...r, synced_at: new Date().toISOString() }));
        const { error } = await mainDb.from('audit_reviews_sync').upsert(batch, { onConflict: 'id' });
        if (error) console.error('Upsert error:', error);
        else process.stdout.write('.');
    }
    console.log('\nAudit Reviews Sync (Upsert) Done.');
}

async function syncAllSponsoredJobs() {
    console.log('🚀 Syncing Sponsored Jobs...');

    // 1. Fetch ALL from external
    let allExt = [];
    let page = 0;
    while (true) {
        const { data, error } = await extDb.from('job_jobrole_sponsored').select('*').range(page * 1000, (page + 1) * 1000 - 1);
        if (error) throw error;
        if (!data || data.length === 0) break;
        allExt.push(...data);
        page++;
    }
    console.log(`Fetched ${allExt.length} from external.`);

    // 2. Fetch existing IDs from main to avoid duplicates
    let existingIds = new Set();
    page = 0;
    while (true) {
        const { data, error } = await mainDb.from('job_jobrole_sponsored_sync').select('id').range(page * 1000, (page + 1) * 1000 - 1);
        if (error) throw error;
        if (!data || data.length === 0) break;
        data.forEach(r => existingIds.add(r.id));
        page++;
    }
    console.log(`Found ${existingIds.size} existing in main.`);

    // 3. Filter by ID
    const toInsert = allExt.filter(r => !existingIds.has(r.id));
    console.log(`Inserting ${toInsert.length} new records...`);

    // 4. Insert in batches
    for (let i = 0; i < toInsert.length; i += 50) { // Smaller batches for parallel lookups
        const batchRaw = toInsert.slice(i, i + 50);
        const batch = await Promise.all(batchRaw.map(async (r) => {
            try {
                const results = await getWageLevel(r.title || r.job_role_name, r.location);
                const wageLevelStr = (results && results.length > 0) ? results[0]['Wage Level'] : 'Lv 2';
                const wageNum = parseInt(wageLevelStr.match(/\d/)?.[0] || '2');
                return {
                    ...r,
                    synced_at: new Date().toISOString(),
                    wage_level: wageLevelStr,
                    wage_num: wageNum
                };
            } catch (err) {
                return {
                    ...r,
                    synced_at: new Date().toISOString(),
                    wage_level: 'Lv 2',
                    wage_num: 2
                };
            }
        }));
        const { error } = await mainDb.from('job_jobrole_sponsored_sync').insert(batch);
        if (error) console.error('Insert error:', error);
        else process.stdout.write('.');
    }
    console.log('\nSponsored Jobs Sync Done.');
}

async function run() {
    await syncAllAuditReviews();
    await syncAllSponsoredJobs();
}

run();
