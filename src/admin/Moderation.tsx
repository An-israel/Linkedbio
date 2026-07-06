import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Link, Report } from '../lib/types'
import { useToast } from './ui'

interface ReportRow extends Report {
  profiles: { username: string; status: string } | null
}

interface FlaggedLink extends Link {
  profiles: { username: string } | null
}

export function Moderation() {
  const toast = useToast()
  const [reports, setReports] = useState<ReportRow[]>([])
  const [flagged, setFlagged] = useState<FlaggedLink[]>([])
  const [loading, setLoading] = useState(true)

  async function load() {
    if (!supabase) return
    const [reportsRes, flaggedRes] = await Promise.all([
      supabase
        .from('reports')
        .select('*, profiles(username, status)')
        .order('resolved')
        .order('created_at', { ascending: false })
        .limit(100),
      supabase.from('links').select('*, profiles(username)').eq('flagged', true),
    ])
    setReports((reportsRes.data as ReportRow[]) ?? [])
    setFlagged((flaggedRes.data as FlaggedLink[]) ?? [])
    setLoading(false)
  }

  useEffect(() => {
    void load()
  }, [])

  async function resolveReport(id: string) {
    if (!supabase) return
    const { error } = await supabase.from('reports').update({ resolved: true }).eq('id', id)
    if (error) toast(error.message, 'danger')
    else void load()
  }

  async function suspendProfile(profileId: string, username: string) {
    if (!supabase) return
    const { error } = await supabase
      .from('profiles')
      .update({ status: 'suspended' })
      .eq('id', profileId)
    if (error) toast(error.message, 'danger')
    else {
      toast(`@${username} suspended`)
      void load()
    }
  }

  async function setLinkFlag(linkId: string, value: boolean) {
    if (!supabase) return
    const { error } = await supabase.from('links').update({ flagged: value }).eq('id', linkId)
    if (error) toast(error.message, 'danger')
    else {
      toast(value ? 'Link flagged — hidden from public' : 'Link unflagged')
      void load()
    }
  }

  async function deleteLink(linkId: string) {
    if (!supabase) return
    const { error } = await supabase.from('links').delete().eq('id', linkId)
    if (error) toast(error.message, 'danger')
    else {
      toast('Link deleted')
      void load()
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="skeleton h-16 rounded-[10px]" />
        ))}
      </div>
    )
  }

  const open = reports.filter((r) => !r.resolved)
  const closed = reports.filter((r) => r.resolved)

  return (
    <div>
      <p className="mono-label">Moderation</p>
      <h1 className="display text-platinum text-xl mt-1 mb-2">Keep the domain safe</h1>
      <p className="text-mist text-xs mb-7 max-w-lg leading-relaxed">
        Reports and flagged links land here. Acting fast is what keeps Lynkit off the
        Safe Browsing blocklists — that protects every user and every promo.
      </p>

      <section>
        <p className="mono-label mb-3">Open reports ({open.length})</p>
        {open.length === 0 ? (
          <p className="text-mist text-sm border border-steel border-dashed rounded-[10px] p-6 text-center">
            No open reports. 🎉
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {open.map((r) => (
              <li key={r.id} className="bg-graphite border border-warning/40 rounded-[10px] p-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <a
                    href={`/${r.profiles?.username}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-platinum text-sm hover:text-silver transition-colors"
                  >
                    @{r.profiles?.username ?? 'unknown'}
                  </a>
                  {r.profiles?.status === 'suspended' && (
                    <span className="mono-label text-[10px] text-danger">already suspended</span>
                  )}
                  <span className="mono-label text-mist ml-auto">
                    {new Date(r.created_at).toLocaleString()}
                  </span>
                </div>
                <p className="text-mist text-sm mt-2">"{r.reason}"</p>
                <div className="flex gap-4 mt-3">
                  {r.profiles?.status !== 'suspended' && (
                    <button
                      type="button"
                      onClick={() => void suspendProfile(r.profile_id, r.profiles?.username ?? '')}
                      className="mono-label text-danger hover:text-platinum cursor-pointer transition-colors"
                    >
                      Suspend user
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => void resolveReport(r.id)}
                    className="mono-label text-mist hover:text-success cursor-pointer transition-colors"
                  >
                    Resolve
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-8">
        <p className="mono-label mb-3">Flagged links ({flagged.length})</p>
        {flagged.length === 0 ? (
          <p className="text-mist text-sm border border-steel border-dashed rounded-[10px] p-6 text-center">
            No flagged links.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {flagged.map((l) => (
              <li key={l.id} className="bg-graphite border border-steel rounded-[10px] p-4 flex items-center gap-3 flex-wrap">
                <div className="flex-1 min-w-0">
                  <span className="text-platinum text-sm block truncate">
                    {l.title} <span className="text-mist">· @{l.profiles?.username}</span>
                  </span>
                  <span className="text-mist text-xs block truncate">{l.url}</span>
                </div>
                <button
                  type="button"
                  onClick={() => void setLinkFlag(l.id, false)}
                  className="mono-label text-mist hover:text-success cursor-pointer transition-colors"
                >
                  Unflag
                </button>
                <button
                  type="button"
                  onClick={() => void deleteLink(l.id)}
                  className="mono-label text-mist hover:text-danger cursor-pointer transition-colors"
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {closed.length > 0 && (
        <section className="mt-8">
          <p className="mono-label mb-3 text-mist">Resolved ({closed.length})</p>
          <ul className="flex flex-col gap-2">
            {closed.slice(0, 10).map((r) => (
              <li key={r.id} className="text-mist text-xs px-4 py-2 border border-steel/50 rounded-[8px]">
                @{r.profiles?.username} — "{r.reason}" ·{' '}
                {new Date(r.created_at).toLocaleDateString()}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
