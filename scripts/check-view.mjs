import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkView() {
    const { data, error } = await supabase
        .rpc('get_view_definition', { view_name: 'confirmed_jobs_view' });
    // Note: get_view_definition is not a standard RPC, but maybe I can use information_schema

    const { data: viewData, error: viewError } = await supabase.from('confirmed_jobs_view').select('*').limit(1);
    console.log('View sample data:', viewData);
    if (viewError) console.error('View error:', viewError);
}

checkView();
