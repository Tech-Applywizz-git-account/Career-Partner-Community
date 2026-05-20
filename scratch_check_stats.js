import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    // 1. Call RPC
    const { data: rpcData, error: rpcError } = await supabase.rpc('get_h1b_stats');
    console.log('RPC output:', { rpcData, rpcError });

    // 2. Query h1b_sponsors table directly to see if we can calculate it
    const { data, error } = await supabase
        .from('h1b_sponsors')
        .select('*');
    
    if (error) {
        console.error('Error fetching h1b_sponsors:', error);
        return;
    }

    console.log('Total rows fetched:', data.length);
    if (data.length > 0) {
        console.log('Sample row:', data[0]);
    }
}

run();
