import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const LOCAL_URL = process.env.VITE_SUPABASE_URL;
const LOCAL_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const EXT_URL = process.env.VITE_EXTERNAL_SUPABASE_URL;
const EXT_KEY = process.env.VITE_EXTERNAL_SUPABASE_ANON_KEY;

const localSupabase = createClient(LOCAL_URL, LOCAL_KEY);
const extSupabase = createClient(EXT_URL, EXT_KEY);

async function fastSyncConfirmed(tableName, localTableName) {
    console.log(`Syncing confirmed records from ${tableName} to ${localTableName}...`);
    const { data: extData, error: extErr } = await extSupabase
        .from(tableName)
        .select('*')
        .eq('tl_confirmation', 'yes');

    if (extErr) {
        console.error('Error fetching from external:', extErr);
        return;
    }

    console.log(`Found ${extData.length} records with 'yes' in ${tableName}`);

    const batchSize = 100;
    for (let i = 0; i < extData.length; i += batchSize) {
        const batch = extData.slice(i, i + batchSize);
        const { error: localErr } = await localSupabase
            .from(localTableName)
            .upsert(batch, { onConflict: 'id' });

        if (localErr) {
            console.error(`Error upserting batch ${i / batchSize} into ${localTableName}:`, localErr);
        }
    }
    console.log(`Finished syncing ${localTableName}`);
}

async function run() {
    await fastSyncConfirmed('audit_reviews', 'audit_reviews_sync');
    await fastSyncConfirmed('audit_reviews_backup', 'audit_reviews_backup');
}

run();
