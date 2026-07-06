import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Profile } from '../lib/types'
import { ConfirmDialog, inputClass, useToast } from './ui'

interface UserRow extends Profile {
  links_count: number
}

export function Users() {
  const toast = useToast()
  const [users, setUsers] = useState<UserRow[]>([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [confirming, setConfirming] = useState<UserRow | null>(null)

  async function load() {
    if (!supabase) return
    const [profilesRes, linksRes] = await Promise.all([
      supabase.from('profiles').select('*').order('created_at', { ascending: false }),
      supabase.from('links').select('user_id'),
    ])
    const counts = new Map<string, number>()
    for (const row of (linksRes.data as { user_id: string }[]) ?? []) {
      counts.set(row.user_id, (counts.get(row.user_id) ?? 0) + 1)
    }
    setUsers(
      (((profilesRes.data as Profile[]) ?? []).map((p) => ({
        ...p,
        links_count: counts.get(p.id) ?? 0,
      })) as UserRow[])
    )
    setLoading(false)
  }

  useEffect(() => {
    void load()
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return users
    return users.filter(
      (u) =>
        u.username?.toLowerCase().includes(q) ||
        u.display_name?.toLowerCase().includes(q)
    )
  }, [users, query])

  async function toggleStatus(user: UserRow) {
    if (!supabase) return
    const next = user.status === 'active' ? 'suspended' : 'active'
    const { error } = await supabase.from('profiles').update({ status: next }).eq('id', user.id)
    if (error) {
      toast('Update failed: ' + error.message, 'danger')
    } else {
      toast(next === 'suspended' ? `@${user.username} suspended` : `@${user.username} reactivated`)
      void load()
    }
    setConfirming(null)
  }

  return (
    <div>
      <p className="mono-label">Users</p>
      <h1 className="display text-platinum text-xl mt-1 mb-6">All profiles</h1>

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search username or display name…"
        aria-label="Search users"
        className={inputClass + ' max-w-sm mb-5'}
      />

      {loading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="skeleton h-14 rounded-[10px]" />
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto border border-steel rounded-[10px]">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="text-left border-b border-steel bg-graphite">
                <th className="mono-label font-normal px-4 py-3">User</th>
                <th className="mono-label font-normal px-4 py-3">Status</th>
                <th className="mono-label font-normal px-4 py-3 text-right">Links</th>
                <th className="mono-label font-normal px-4 py-3 text-right">Views</th>
                <th className="mono-label font-normal px-4 py-3">Joined</th>
                <th className="mono-label font-normal px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id} className="border-b border-steel/50 last:border-0">
                  <td className="px-4 py-3">
                    <a
                      href={`/${u.username}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-platinum hover:text-silver transition-colors"
                    >
                      @{u.username}
                    </a>
                    {u.is_owner && <span className="mono-label text-[10px] text-warning ml-2">owner</span>}
                    <span className="block text-mist text-xs">{u.display_name}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`mono-label text-[10px] px-1.5 py-0.5 rounded border ${
                        u.status === 'active'
                          ? 'text-success border-success/50'
                          : 'text-danger border-danger/50'
                      }`}
                    >
                      {u.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-platinum">{u.links_count}</td>
                  <td className="px-4 py-3 text-right text-platinum">{u.page_views.toLocaleString()}</td>
                  <td className="px-4 py-3 text-mist text-xs">
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {!u.is_owner && (
                      <button
                        type="button"
                        onClick={() =>
                          u.status === 'active' ? setConfirming(u) : void toggleStatus(u)
                        }
                        className={`mono-label cursor-pointer transition-colors ${
                          u.status === 'active'
                            ? 'text-mist hover:text-danger'
                            : 'text-success hover:text-platinum'
                        }`}
                      >
                        {u.status === 'active' ? 'Suspend' : 'Reactivate'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-mist text-sm">
                    No users match.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {confirming && (
        <ConfirmDialog
          title={`Suspend @${confirming.username}?`}
          body="Their public page immediately shows the unavailable state and they lose dashboard access. You can reactivate anytime."
          confirmLabel="Suspend"
          onConfirm={() => void toggleStatus(confirming)}
          onCancel={() => setConfirming(null)}
        />
      )}
    </div>
  )
}
