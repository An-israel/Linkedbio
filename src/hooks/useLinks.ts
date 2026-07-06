import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { FALLBACK_LINKS } from '../lib/fallback'
import type { Link } from '../lib/types'

interface State {
  links: Link[]
  loading: boolean
  error: boolean
}

/** Public hook: visible links ordered by sort_order, with graceful fallback. */
export function usePublicLinks(): State {
  const [state, setState] = useState<State>({ links: [], loading: true, error: false })

  useEffect(() => {
    let cancelled = false

    async function load() {
      if (!supabase) {
        setState({ links: FALLBACK_LINKS, loading: false, error: false })
        return
      }
      const { data, error } = await supabase
        .from('links')
        .select('*')
        .eq('visible', true)
        .order('sort_order', { ascending: true })
      if (cancelled) return
      if (error) {
        // Backend unreachable/misconfigured — never break the public page.
        setState({ links: FALLBACK_LINKS, loading: false, error: true })
      } else {
        setState({ links: (data as Link[]) ?? [], loading: false, error: false })
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [])

  return state
}
