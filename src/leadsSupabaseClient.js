import { createClient } from '@supabase/supabase-js';

// Leads Database Configuration
// TODO: Replace these with your actual Supabase credentials for the leads database
const LEADS_SUPABASE_URL = import.meta.env.VITE_LEADS_SUPABASE_URL || 'YOUR_LEADS_SUPABASE_URL';
const LEADS_SUPABASE_ANON_KEY = import.meta.env.VITE_LEADS_SUPABASE_ANON_KEY || 'YOUR_LEADS_SUPABASE_ANON_KEY';

export const leadsSupabase = createClient(LEADS_SUPABASE_URL, LEADS_SUPABASE_ANON_KEY);
