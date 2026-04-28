import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkView() {
    const { data, error } = await supabase
        .rpc('get_view_definition', { view_name: 'confirmed_jobs_view' });
    // If rpc fails, try raw query via postgREST doesn't work for DDLS.

    console.log('Definition:', data);
    if (error) console.error('Error:', error);
}

// Another way to check if data is there but hidden:
async function checkTableDirectly() {
    const { count, error } = await supabase.from('job_jobrole_sponsored_sync').select('*', { count: 'exact', head: true });
    console.log('Count inside table:', count);
}

checkTableDirectly();
