import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function test() {
  const { error } = await supabase.from('contact_messages').select('*').limit(1)
  if (error) {
    console.error('Table contact_messages does not exist or is not accessible:', error.message)
  } else {
    console.log('Table contact_messages exists.')
  }
}

test()
