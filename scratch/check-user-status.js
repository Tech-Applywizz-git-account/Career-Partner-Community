import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Emails that came through Zapier but may not be in profiles
const emailsToCheck = [
  'yeshwanthsaimudhasani@gmail.com',
  'audii.25here@gmail.com',
  'ganeshgummadidala8@gmail.com'
];

async function checkUserStatus() {
  console.log('🔍 Checking user status in Supabase...\n');

  for (const email of emailsToCheck) {
    console.log(`━━━ ${email} ━━━`)

    // 1. Check Auth Users table (admin API)
    const { data: authData, error: authError } = await supabase.auth.admin.listUsers()
    const authUser = authData?.users?.find(u => u.email === email)

    if (authError) {
      console.log(`  ❌ Auth check error: ${authError.message}`)
    } else if (authUser) {
      console.log(`  ✅ Auth Users table: EXISTS (id: ${authUser.id}, created: ${authUser.created_at})`)
    } else {
      console.log(`  ❌ Auth Users table: NOT FOUND`)
    }

    // 2. Check Profiles table
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, full_name, created_at')
      .eq('email', email)
      .maybeSingle()

    if (profileError) {
      console.log(`  ❌ Profiles table error: ${profileError.message}`)
    } else if (profileData) {
      console.log(`  ✅ Profiles table: EXISTS (id: ${profileData.id}, name: ${profileData.full_name})`)
    } else {
      console.log(`  ❌ Profiles table: NOT FOUND`)
    }

    console.log()
  }

  // 3. Show total profile count
  const { count } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
  console.log(`📊 Total profiles in DB: ${count}`)
}

checkUserStatus()
