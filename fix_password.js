import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

async function fixPassword() {
  const email = 'ganeshgummadidala8@gmail.com'
  const userId = '23115acd-62a4-47b5-88be-0fa705652c4f'
  console.log(`🔧 Hard-fixing account for ${email} (ID: ${userId})...`)

  // 1. Force update the password via Admin API (official hashing)
  const { data, error } = await supabase.auth.admin.updateUserById(
    userId,
    { 
      password: 'Applywizz@2026',
      email_confirm: true,
      app_metadata: { provider: 'email', providers: ['email'] }
    }
  )

  if (error) {
    console.error('❌ Error setting password:', error.message)
    return
  }

  // 2. Add the Identity link via SQL (using the service role client)
  // Since we can't do it via auth.admin easily, we'll use the profile-style insert
  // but targeting identities is restricted. Let's try to just use the API to list first.
  console.log('✅ Password set successfully!')
  console.log('🚀 Please try logging in now. If it still fails, I will add the identity link via SQL.')
}

fixPassword()
