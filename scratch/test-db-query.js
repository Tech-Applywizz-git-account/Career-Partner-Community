import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testQuery() {
    console.log('Querying jobs_all_roles...');
    const { data: jobs, error: jobsError, count: jobsCount } = await supabase
        .from('jobs_all_roles')
        .select('*', { count: 'exact' })
        .limit(3);

    if (jobsError) {
        console.error('Error fetching jobs_all_roles:', jobsError);
    } else {
        console.log(`Successfully fetched jobs_all_roles. Total count: ${jobsCount}`);
        console.log('Sample data:', JSON.stringify(jobs, null, 2));
    }

    console.log('\nQuerying profiles...');
    const { data: profiles, error: profilesError, count: profilesCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact' })
        .limit(3);

    if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
    } else {
        console.log(`Successfully fetched profiles. Total count: ${profilesCount}`);
        console.log('Sample profiles:', JSON.stringify(profiles, null, 2));
    }
}

testQuery();
