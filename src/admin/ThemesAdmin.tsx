import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { ThemeRow } from '../lib/types'
import { PRESETS, backgroundStyle } from '../lib/themes'
import { Toggle, useToast } from './ui'

/** Toggle presets on/off and reorder how they appear in the user picker. */
export function ThemesAdmin() {
  const toast = useToast()
  const [rows, setRows] = useState<ThemeRow[]>([])
  const [loading, setLoading] = useState(true)

  async function load() {
    if (!supabase) return
    const { data } = await supabase.from('themes').select('*').order('sort_order')
    setRows((data as ThemeRow[]) ?? [])
    setLoading(false)
  }

  useEffect(() => {
    void load()
  }, [])

  async function setActive(id: string, is_active: boolean) {
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, is_active } : r)))
    if (!supabase) return
    const { error } = await supabase.from('themes').update({ is_active }).eq('id', id)
    if (error) {
      toast(error.message, 'danger')
      void load()
    }
  }

  async function move(index: number, dir: -1 | 1) {
    const next = [...rows]
    const target = index + dir
    if (target < 0 || target >= next.length) return
    ;[next[index], next[target]] = [next[target], next[index]]
    const reordered = next.map((r, i) => ({ ...r, sort_order: i }))
    setRows(reordered)
    if (!supabase) return
    const results = await Promise.all(
      reordered.map((r) => supabase!.from('themes').update({ sort_order: r.sort_order }).eq('id', r.id))
    )
    if (results.some((r) => r.error)) {
      toast('Reorder failed', 'danger')
      void load()
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="skeleton h-32 rounded-[10px]" />
        ))}
      </div>
    )
  }

  return (
    <div>
      <p className="mono-label">Themes</p>
      <h1 className="display text-platinum text-xl mt-1 mb-2">Preset availability</h1>
      <p className="text-mist text-xs mb-6 max-w-lg">
        Inactive themes disappear from the user picker (existing pages keep working).
        Order here is the picker order — feature seasonal themes by moving them up.
      </p>

      <ul className="flex flex-col gap-3">
        {rows.map((row, i) => {
          const preset = PRESETS[row.id]
          return (
            <li key={row.id} className="flex items-center gap-4 bg-graphite border border-steel rounded-[10px] px-4 py-3">
              <div className="flex flex-col gap-1">
                <button
                  type="button"
                  aria-label={`Move ${row.name} up`}
                  onClick={() => void move(i, -1)}
                  disabled={i === 0}
                  className="text-mist hover:text-silver disabled:opacity-30 cursor-pointer text-xs leading-none p-0.5"
                >
                  ▲
                </button>
                <button
                  type="button"
                  aria-label={`Move ${row.name} down`}
                  onClick={() => void move(i, 1)}
                  disabled={i === rows.length - 1}
                  className="text-mist hover:text-silver disabled:opacity-30 cursor-pointer text-xs leading-none p-0.5"
                >
                  ▼
                </button>
              </div>
              {preset && (
                <div
                  className="h-10 w-16 rounded-[6px] border border-steel shrink-0"
                  style={backgroundStyle(preset.config.background)}
                  aria-hidden="true"
                />
              )}
              <span className="text-platinum text-sm flex-1">{row.name}</span>
              <span className="mono-label text-mist hidden sm:block">{row.id}</span>
              <Toggle
                checked={row.is_active}
                onChange={(v) => void setActive(row.id, v)}
                label={`${row.name} active`}
              />
            </li>
          )
        })}
      </ul>
    </div>
  )
}
