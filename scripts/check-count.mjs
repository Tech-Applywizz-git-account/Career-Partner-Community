import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCount() {
    const { count, error } = await supabase
        .from('job_jobrole_sponsored_sync')
        .select('*', { count: 'exact', head: true });

    if (error) {
        console.error('Error:', error);
    } else {
        console.log('Total records in job_jobrole_sponsored_sync:', count);
    }
}

checkCount();
