import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

interface AuthState {
  session: Session | null
  isAdmin: boolean
  loading: boolean
}

/** Tracks the Supabase session and whether the user is flagged as admin. */
export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>({
    session: null,
    isAdmin: false,
    loading: true,
  })

  useEffect(() => {
    if (!supabase) {
      setState({ session: null, isAdmin: false, loading: false })
      return
    }
    const client = supabase

    let cancelled = false

    async function resolve(session: Session | null) {
      if (!session) {
        if (!cancelled) setState({ session: null, isAdmin: false, loading: false })
        return
      }
      const { data } = await client
        .from('profiles')
        .select('is_admin')
        .eq('id', session.user.id)
        .maybeSingle()
      if (!cancelled) {
        setState({ session, isAdmin: data?.is_admin === true, loading: false })
      }
    }

    void client.auth.getSession().then(({ data }) => resolve(data.session))

    const { data: sub } = client.auth.onAuthStateChange((_event, session) => {
      void resolve(session)
    })

    return () => {
      cancelled = true
      sub.subscription.unsubscribe()
    }
  }, [])

  return state
}

export async function signOut(): Promise<void> {
  if (supabase) await supabase.auth.signOut()
}
