import { useEffect, useMemo, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { Link, Profile } from '../lib/types'
import { BarChart, DAYS, StatCard, bucket } from '../components/BarChart'

/** The user's own stats only — RLS scopes every query to their rows. */
export function MyAnalytics() {
  const { profile } = useOutletContext<{ profile: Profile }>()
  const [views, setViews] = useState<string[]>([])
  const [clicks, setClicks] = useState<string[]>([])
  const [links, setLinks] = useState<Link[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      if (!supabase) {
        setLoading(false)
        return
      }
      const since = new Date()
      since.setDate(since.getDate() - DAYS)
      const sinceIso = since.toISOString()

      const linksRes = await supabase
        .from('links')
        .select('*')
        .eq('user_id', profile.id)
        .order('click_count', { ascending: false })
      const myLinks = (linksRes.data as Link[]) ?? []
      setLinks(myLinks)

      const [viewsRes, clicksRes] = await Promise.all([
        supabase
          .from('page_views')
          .select('created_at')
          .eq('profile_id', profile.id)
          .gte('created_at', sinceIso),
        myLinks.length
          ? supabase
              .from('link_clicks')
              .select('clicked_at')
              .in('link_id', myLinks.map((l) => l.id))
              .gte('clicked_at', sinceIso)
          : Promise.resolve({ data: [] as { clicked_at: string }[] }),
      ])
      setViews(((viewsRes.data as { created_at: string }[]) ?? []).map((r) => r.created_at))
      setClicks(((clicksRes.data as { clicked_at: string }[]) ?? []).map((r) => r.clicked_at))
      setLoading(false)
    }
    void load()
  }, [profile.id])

  const viewDays = useMemo(() => bucket(views), [views])
  const totalViews = views.length
  const totalClicks = clicks.length
  const ctr = totalViews === 0 ? 0 : (totalClicks / totalViews) * 100
  const totalAllTime = links.reduce((s, l) => s + l.click_count, 0)

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="skeleton h-28 rounded-[10px]" />
        ))}
      </div>
    )
  }

  return (
    <div>
      <p className="mono-label">Analytics</p>
      <h1 className="display text-platinum text-xl mt-1 mb-7">Last {DAYS} days</h1>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Page views" value={totalViews.toLocaleString()} />
        <StatCard label="Link clicks" value={totalClicks.toLocaleString()} />
        <StatCard label="Click-through" value={`${ctr.toFixed(1)}%`} hint="clicks ÷ views" />
      </div>

      <section className="bg-graphite border border-steel rounded-[10px] p-5 mt-6">
        <p className="mono-label mb-4">Views per day</p>
        <BarChart days={viewDays} title="Page views per day" />
      </section>

      <section className="bg-graphite border border-steel rounded-[10px] p-5 mt-6 overflow-x-auto">
        <p className="mono-label mb-4">Your links by clicks (all time)</p>
        {links.length === 0 ? (
          <p className="text-mist text-sm">No links yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b border-steel">
                <th className="mono-label font-normal pb-2 pr-4">#</th>
                <th className="mono-label font-normal pb-2 pr-4">Link</th>
                <th className="mono-label font-normal pb-2 pr-4 text-right">Clicks</th>
                <th className="mono-label font-normal pb-2 text-right">Share</th>
              </tr>
            </thead>
            <tbody>
              {links.map((l, i) => (
                <tr key={l.id} className="border-b border-steel/50 last:border-0">
                  <td className="py-2.5 pr-4 text-mist">{i + 1}</td>
                  <td className="py-2.5 pr-4">
                    <span className="text-platinum">{l.title}</span>
                    {!l.visible && <span className="mono-label text-[10px] ml-2">hidden</span>}
                  </td>
                  <td className="py-2.5 pr-4 text-right text-platinum">
                    {l.click_count.toLocaleString()}
                  </td>
                  <td className="py-2.5 text-right text-mist">
                    {totalAllTime === 0 ? '—' : `${((l.click_count / totalAllTime) * 100).toFixed(1)}%`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  )
}
