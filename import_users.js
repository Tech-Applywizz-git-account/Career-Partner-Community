import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config()

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

// ╔═══════════════════════════════════════════════════════════════╗
// ║  PASTE YOUR GOOGLE SHEET USERS HERE                         ║
// ║  Format: { email, fullName, role }                          ║
// ║  role: 'user' or 'admin'                                   ║
// ╚═══════════════════════════════════════════════════════════════╝
const usersToCreate = [
  { email: 'techapplywizz@gmail.com', fullName: 'Tech Applywizz', role: 'admin' },
]

const DEFAULT_PASSWORD = 'Applywizz@2026'

async function runImport() {
  console.log(`🚀 Importing ${usersToCreate.length} users...\n`)

  let success = 0, failed = 0

  for (const u of usersToCreate) {
    try {
      // 1. Create Auth user (email auto-confirmed, no email sent)
      const { data, error } = await supabase.auth.admin.createUser({
        email: u.email,
        password: DEFAULT_PASSWORD,
        email_confirm: true,  // <-- Auto-confirms, NO email sent
        user_metadata: { full_name: u.fullName }
      })

      if (error) throw error

      // 2. Update the profile role (trigger already created the profile row)
      await supabase
        .from('profiles')
        .update({ role: u.role, full_name: u.fullName })
        .eq('id', data.user.id)

      console.log(`✅ ${u.email} (${u.role})`)
      success++
    } catch (err) {
      console.error(`❌ ${u.email}: ${err.message}`)
      failed++
    }
  }

  console.log(`\n🏁 Done! ✅ ${success} created, ❌ ${failed} failed.`)
}

runImport()
