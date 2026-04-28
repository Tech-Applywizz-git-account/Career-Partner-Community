import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkLogs() {
    const { data, error } = await supabase
        .from('sync_log')
        .select('*')
        .order('completed_at', { ascending: false })
        .limit(5);

    if (error) {
        console.error('Error:', error);
    } else {
        console.log('Last Sync Logs:', JSON.stringify(data, null, 2));
    }
}

checkLogs();
