import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { FALLBACK_SETTINGS } from '../lib/fallback'
import type { Settings } from '../lib/types'

/** Settings key/value rows collapsed into one object, merged over fallbacks. */
export function useSettings(): { settings: Settings; loading: boolean } {
  const [settings, setSettings] = useState<Settings>(FALLBACK_SETTINGS)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function load() {
      if (!supabase) {
        setLoading(false)
        return
      }
      const { data, error } = await supabase.from('settings').select('key, value')
      if (cancelled) return
      if (!error && data) {
        const merged = { ...FALLBACK_SETTINGS }
        for (const row of data as { key: string; value: unknown }[]) {
          if (row.key in merged && typeof row.value === 'string') {
            merged[row.key as keyof Settings] = row.value
          }
        }
        setSettings(merged)
      }
      setLoading(false)
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [])

  return { settings, loading }
}
