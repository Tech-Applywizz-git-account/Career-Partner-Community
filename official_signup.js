import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

async function signUp() {
  const email = 'ganeshgummadidala8@gmail.com'
  const password = 'Applywizz@2026'
  
  console.log(`🚀 Attempting official signup for ${email}...`)

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: 'Ganesh' }
    }
  })

  if (error) {
    console.error('❌ Signup failed:', error.message)
    if (error.message.includes('already registered')) {
        console.log('💡 User already exists. Try logging in now!')
    }
  } else {
    console.log('✅ Signup successful!')
    console.log('🚀 You can now log in with your password.')
  }
}

signUp()
