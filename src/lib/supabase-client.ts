import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const client = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // Handle auth errors globally - catch refresh token errors
  client.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
      // Session was cleared or refreshed - this is normal
      return
    }
    
    // If we get a SIGNED_IN event but no session, something went wrong
    if (event === 'SIGNED_IN' && !session) {
      console.warn('Signed in event but no session, clearing auth state')
      await client.auth.signOut()
    }
  })

  return client
}
