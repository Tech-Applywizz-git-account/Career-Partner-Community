import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';
import { runFullSync } from './src/dataSyncService.js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

// Mock browser globals for dataSyncService
global.localStorage = {
    getItem: () => null,
    setItem: () => null
};

async function forceSync() {
    console.log('🚀 Triggering a forced full sync to populate wage levels in the database...');
    try {
        const result = await runFullSync(true);
        console.log('✅ Sync Completed:', result);
    } catch (err) {
        console.error('❌ Sync failed:', err);
    }
}

forceSync();
