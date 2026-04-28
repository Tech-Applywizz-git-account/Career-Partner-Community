import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const MAIN_URL = process.env.VITE_SUPABASE_URL;
const MAIN_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const EXT_URL = process.env.VITE_EXTERNAL_SUPABASE_URL;
const EXT_KEY = process.env.VITE_EXTERNAL_SUPABASE_ANON_KEY;

const mainDb = createClient(MAIN_URL, MAIN_KEY);
const extDb = createClient(EXT_URL, EXT_KEY);

async function deepCleanAndSync() {
    console.log('🗑️ Cleaning local tables...');

    // STRICT RULE: Do NOT delete existing data. 
    // Deletion disabled to prevent accidental data loss.
    // If you REALLY need to clear the table, use a SQL script or manual command.
    /*
    // Clear Audit Reviews Sync
    const { error: err1 } = await mainDb.from('audit_reviews_sync').delete().filter('id', 'not.is', null);
    if (err1) console.error('Error clearing audit_reviews_sync:', err1);
    else console.log('Cleared audit_reviews_sync');

    // Clear Sponsored Jobs Sync
    const { error: err2 } = await mainDb.from('job_jobrole_sponsored_sync').delete().filter('id', 'not.is', null);
    if (err2) console.error('Error clearing job_jobrole_sponsored_sync:', err2);
    else console.log('Cleared job_jobrole_sponsored_sync');
    */
    console.log('⚠️ Deletion bypassed. Running additive sync only.');

    console.log('🚀 Fetching fresh data from External Audit Reviews...');
    let allAudit = [];
    let page = 0;
    while (true) {
        const { data, error } = await extDb.from('audit_reviews').select('*').range(page * 1000, (page + 1) * 1000 - 1);
        if (error) break;
        if (!data || data.length === 0) break;
        allAudit.push(...data);
        page++;
    }

    console.log(`Inserting ${allAudit.length} audit records...`);
    for (let i = 0; i < allAudit.length; i += 200) {
        const b = allAudit.slice(i, i + 200).map(r => ({ ...r, synced_at: new Date().toISOString() }));
        await mainDb.from('audit_reviews_sync').insert(b);
        process.stdout.write('.');
    }
    console.log('\nAudit Sync Done.');

    console.log('🚀 Fetching fresh data from External Sponsored Jobs...');
    let allJobs = [];
    page = 0;
    while (true) {
        const { data, error } = await extDb.from('job_jobrole_sponsored').select('*').range(page * 1000, (page + 1) * 1000 - 1);
        if (error) break;
        if (!data || data.length === 0) break;
        allJobs.push(...data);
        page++;
    }

    console.log(`Inserting ${allJobs.length} job records...`);
    for (let i = 0; i < allJobs.length; i += 200) {
        const b = allJobs.slice(i, i + 200).map(r => {
            return {
                ...r,
                wage_level: r.wage_level || 'Lv 2',
                wage_num: r.wage_num || 2,
                synced_at: new Date().toISOString()
            };
        });
        await mainDb.from('job_jobrole_sponsored_sync').insert(b);
        process.stdout.write('.');
    }
    console.log('\nJob Sync Done.');
}

deepCleanAndSync();
