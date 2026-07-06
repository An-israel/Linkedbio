import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { BarChart, DAYS, StatCard, bucket } from '../components/BarChart'

interface Stats {
  users: number
  active: number
  suspended: number
  links: number
  views30: string[]
  clicks30: number
  signups: string[]
  promoClicks: number
}

export function Overview() {
  const [stats, setStats] = useState<Stats | null>(null)

  useEffect(() => {
    async function load() {
      if (!supabase) return
      const since = new Date()
      since.setDate(since.getDate() - DAYS)
      const sinceIso = since.toISOString()

      const [profiles, links, views, clicks, promoClicks] = await Promise.all([
        supabase.from('profiles').select('status, created_at'),
        supabase.from('links').select('id', { count: 'exact', head: true }),
        supabase.from('page_views').select('created_at').gte('created_at', sinceIso),
        supabase
          .from('link_clicks')
          .select('id', { count: 'exact', head: true })
          .gte('clicked_at', sinceIso),
        supabase.from('promo_clicks').select('id', { count: 'exact', head: true }),
      ])

      const rows = (profiles.data as { status: string; created_at: string }[]) ?? []
      setStats({
        users: rows.length,
        active: rows.filter((r) => r.status === 'active').length,
        suspended: rows.filter((r) => r.status === 'suspended').length,
        links: links.count ?? 0,
        views30: ((views.data as { created_at: string }[]) ?? []).map((r) => r.created_at),
        clicks30: clicks.count ?? 0,
        signups: rows.map((r) => r.created_at),
        promoClicks: promoClicks.count ?? 0,
      })
    }
    void load()
  }, [])

  const signupDays = useMemo(() => bucket(stats?.signups ?? []), [stats])
  const viewDays = useMemo(() => bucket(stats?.views30 ?? []), [stats])

  if (!stats) {
    return (
      <div className="grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="skeleton h-28 rounded-[10px]" />
        ))}
      </div>
    )
  }

  return (
    <div>
      <p className="mono-label">Overview</p>
      <h1 className="display text-platinum text-xl mt-1 mb-7">Platform</h1>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Users" value={stats.users.toLocaleString()} hint={`${stats.active} active · ${stats.suspended} suspended`} />
        <StatCard label="Links" value={stats.links.toLocaleString()} />
        <StatCard label="Promo clicks" value={stats.promoClicks.toLocaleString()} hint="all time" />
        <StatCard label={`Page views (${DAYS}d)`} value={stats.views30.length.toLocaleString()} />
        <StatCard label={`Link clicks (${DAYS}d)`} value={stats.clicks30.toLocaleString()} />
        <StatCard
          label="CTR"
          value={
            stats.views30.length === 0
              ? '—'
              : `${((stats.clicks30 / stats.views30.length) * 100).toFixed(1)}%`
          }
          hint="clicks ÷ views"
        />
      </div>

      <section className="bg-graphite border border-steel rounded-[10px] p-5 mt-6">
        <p className="mono-label mb-4">Signups per day</p>
        <BarChart days={signupDays} title="Signups per day" />
      </section>

      <section className="bg-graphite border border-steel rounded-[10px] p-5 mt-6">
        <p className="mono-label mb-4">Page views per day (all pages)</p>
        <BarChart days={viewDays} title="Page views per day" />
      </section>
    </div>
  )
}
