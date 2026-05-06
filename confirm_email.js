import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config()

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

async function confirmAndTest() {
  const email = 'ganeshgummadidala8@gmail.com'

  // 1. Find user
  const { data: { users }, error: listErr } = await supabase.auth.admin.listUsers()
  if (listErr) { console.error('❌', listErr.message); return }
  
  const user = users.find(u => u.email === email)
  if (!user) { console.error('❌ User not found'); return }

  // 2. Confirm email via Admin API
  const { error } = await supabase.auth.admin.updateUserById(user.id, {
    email_confirm: true
  })

  if (error) {
    console.error('❌ Confirm failed:', error.message)
  } else {
    console.log('✅ Email confirmed! You can log in now.')
  }
}

confirmAndTest()
