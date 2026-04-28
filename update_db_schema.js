import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateSchema() {
    console.log('Adding wage columns to job_jobrole_sponsored_sync...');

    // Using rpc or direct sql is better, but via client we can only do this if we have a function.
    // Since I don't know if there's an 'exec_sql' function, I'll try to use a script that just works with the table.
    // Actually, I can't run ALTER TABLE via the JS client unless there's a custom function.

    console.log('Please run the following SQL in your Supabase SQL Editor:');
    console.log(`
        ALTER TABLE public.job_jobrole_sponsored_sync ADD COLUMN IF NOT EXISTS wage_level text;
        ALTER TABLE public.job_jobrole_sponsored_sync ADD COLUMN IF NOT EXISTS wage_num integer DEFAULT 2;
        CREATE INDEX IF NOT EXISTS idx_sponsored_sync_wage_num ON public.job_jobrole_sponsored_sync (wage_num DESC);
    `);
}

updateSchema();
