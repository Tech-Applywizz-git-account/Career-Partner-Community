import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config()

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
)

async function setRole() {
  const { error } = await supabase
    .from('profiles')
    .update({ role: 'admin', full_name: 'Ganesh' })
    .eq('email', 'ganeshgummadidala8@gmail.com')

  if (error) console.error('❌', error.message)
  else console.log('✅ Profile role set to admin!')
}

setRole()
