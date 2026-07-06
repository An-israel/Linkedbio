import { useCallback, useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { Profile } from '../lib/types'

interface AuthState {
  session: Session | null
  profile: Profile | null
  loading: boolean
}

/** Session + the signed-in user's own profile row. */
export function useAuth(): AuthState & { refreshProfile: () => Promise<void> } {
  const [state, setState] = useState<AuthState>({ session: null, profile: null, loading: true })

  const refreshProfile = useCallback(async () => {
    if (!supabase) return
    const { data: sessionData } = await supabase.auth.getSession()
    const session = sessionData.session
    if (!session) {
      setState({ session: null, profile: null, loading: false })
      return
    }
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .maybeSingle()
    setState({ session, profile: (data as Profile) ?? null, loading: false })
  }, [])

  useEffect(() => {
    if (!supabase) {
      setState({ session: null, profile: null, loading: false })
      return
    }
    const client = supabase
    let cancelled = false

    async function resolve(session: Session | null) {
      if (!session) {
        if (!cancelled) setState({ session: null, profile: null, loading: false })
        return
      }
      const { data } = await client
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle()
      if (!cancelled) setState({ session, profile: (data as Profile) ?? null, loading: false })
    }

    void client.auth.getSession().then(({ data }) => resolve(data.session))
    const { data: sub } = client.auth.onAuthStateChange((event, session) => {
      // Ignore token refreshes; they don't change the profile.
      if (event === 'TOKEN_REFRESHED') return
      void resolve(session)
    })
    return () => {
      cancelled = true
      sub.subscription.unsubscribe()
    }
  }, [])

  return { ...state, refreshProfile }
}

export async function signOut(): Promise<void> {
  if (supabase) await supabase.auth.signOut()
}
