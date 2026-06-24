require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function test() {
    const activeSearch = 'Full Stack Python Developer w AI';
    const words = activeSearch.trim().toLowerCase().split(/\s+/).filter(x => x.length >= 2);
    
    const tC = `and(${words.map(x => `title.ilike.%${x}%`).join(',')})`;
    const cC = `and(${words.map(x => `company_name.ilike.%${x}%`).join(',')})`;
    const rC = `and(${words.map(x => `role_name.ilike.%${x}%`).join(',')})`;
    const coC = `and(${words.map(x => `indeed_search_country.ilike.%${x}%`).join(',')})`;
    const lC = `and(${words.map(x => `location.ilike.%${x}%`).join(',')})`;

    let query = supabase.from('jobs_all_roles').select('id, title, company_name').order('date_posted', { ascending: false, nullsFirst: false }).limit(5);
    query = query.or(`${tC},${cC},${rC},${coC},${lC}`);

    const { data, error } = await query;
    console.log('Error:', error ? JSON.stringify(error) : null);
    console.log('Data:', data);
}
test();
