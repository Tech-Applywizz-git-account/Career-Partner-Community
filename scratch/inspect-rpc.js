import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  try {
    console.log('1. Calling get_companies_fast_json with empty params...');
    const { data, error } = await supabase.rpc('get_companies_fast_json', {
      p_countries: null,
      p_search: null,
      p_start_date: null,
      p_end_date: null
    });

    if (error) {
      console.error('RPC Error:', error);
    } else {
      console.log('Result type:', typeof data, Array.isArray(data) ? 'Array' : 'Not Array');
      console.log('Result count:', data?.length);
      if (data && data.length > 0) {
        console.log('First 3 elements:', JSON.stringify(data.slice(0, 3), null, 2));
      }
    }
  } catch (e) {
    console.error('Unexpected exception:', e);
  }
}

run();
