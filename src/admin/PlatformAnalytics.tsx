import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Link, Profile } from '../lib/types'

interface PromoPerf {
  id: string
  label: string
  type: string
  clicks: number
}

export function PlatformAnalytics() {
  const [topPages, setTopPages] = useState<Profile[]>([])
  const [topLinks, setTopLinks] = useState<(Link & { profiles: { username: string } | null })[]>([])
  const [promoPerf, setPromoPerf] = useState<PromoPerf[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      if (!supabase) return
      const [pagesRes, linksRes, clicksRes, bannersRes, slidesRes, popupsRes] =
        await Promise.all([
          supabase.from('profiles').select('*').order('page_views', { ascending: false }).limit(10),
          supabase
            .from('links')
            .select('*, profiles(username)')
            .order('click_count', { ascending: false })
            .limit(10),
          supabase.from('promo_clicks').select('source_id, source_type'),
          supabase.from('promo_banners').select('id, title'),
          supabase.from('promo_slides').select('id, caption'),
          supabase.from('promo_popups').select('id, title'),
        ])

      setTopPages((pagesRes.data as Profile[]) ?? [])
      setTopLinks((linksRes.data as (Link & { profiles: { username: string } | null })[]) ?? [])

      const counts = new Map<string, number>()
      for (const c of (clicksRes.data as { source_id: string }[]) ?? []) {
        counts.set(c.source_id, (counts.get(c.source_id) ?? 0) + 1)
      }
      const perf: PromoPerf[] = [
        ...(((bannersRes.data as { id: string; title: string }[]) ?? []).map((b) => ({
          id: b.id, label: b.title, type: 'banner', clicks: counts.get(b.id) ?? 0,
        }))),
        ...(((slidesRes.data as { id: string; caption: string | null }[]) ?? []).map((s) => ({
          id: s.id, label: s.caption || '(slide)', type: 'slide', clicks: counts.get(s.id) ?? 0,
        }))),
        ...(((popupsRes.data as { id: string; title: string }[]) ?? []).map((p) => ({
          id: p.id, label: p.title, type: 'popup', clicks: counts.get(p.id) ?? 0,
        }))),
      ].sort((a, b) => b.clicks - a.clicks)
      setPromoPerf(perf)
      setLoading(false)
    }
    void load()
  }, [])

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="skeleton h-40 rounded-[10px]" />
        ))}
      </div>
    )
  }

  return (
    <div>
      <p className="mono-label">Analytics</p>
      <h1 className="display text-platinum text-xl mt-1 mb-7">Platform deep dive</h1>

      <section className="bg-graphite border border-steel rounded-[10px] p-5 overflow-x-auto">
        <p className="mono-label mb-4">Top pages by views</p>
        <table className="w-full text-sm">
          <tbody>
            {topPages.map((p, i) => (
              <tr key={p.id} className="border-b border-steel/50 last:border-0">
                <td className="py-2 pr-3 text-mist w-8">{i + 1}</td>
                <td className="py-2 pr-3">
                  <a href={`/${p.username}`} target="_blank" rel="noopener noreferrer" className="text-platinum hover:text-silver transition-colors">
                    @{p.username}
                  </a>
                </td>
                <td className="py-2 text-right text-platinum">{p.page_views.toLocaleString()} views</td>
              </tr>
            ))}
            {topPages.length === 0 && (
              <tr><td className="py-4 text-mist text-center">No data yet.</td></tr>
            )}
          </tbody>
        </table>
      </section>

      <section className="bg-graphite border border-steel rounded-[10px] p-5 mt-6 overflow-x-auto">
        <p className="mono-label mb-4">Top links by clicks</p>
        <table className="w-full text-sm">
          <tbody>
            {topLinks.map((l, i) => (
              <tr key={l.id} className="border-b border-steel/50 last:border-0">
                <td className="py-2 pr-3 text-mist w-8">{i + 1}</td>
                <td className="py-2 pr-3">
                  <span className="text-platinum">{l.title}</span>
                  <span className="text-mist text-xs ml-2">@{l.profiles?.username}</span>
                </td>
                <td className="py-2 text-right text-platinum">{l.click_count.toLocaleString()} clicks</td>
              </tr>
            ))}
            {topLinks.length === 0 && (
              <tr><td className="py-4 text-mist text-center">No data yet.</td></tr>
            )}
          </tbody>
        </table>
      </section>

      <section className="bg-graphite border border-steel rounded-[10px] p-5 mt-6 overflow-x-auto">
        <p className="mono-label mb-4">Promo performance</p>
        <table className="w-full text-sm">
          <tbody>
            {promoPerf.map((p) => (
              <tr key={p.id} className="border-b border-steel/50 last:border-0">
                <td className="py-2 pr-3">
                  <span className="text-platinum">{p.label}</span>
                  <span className="mono-label text-[10px] ml-2 text-mist">{p.type}</span>
                </td>
                <td className="py-2 text-right text-platinum">{p.clicks.toLocaleString()} clicks</td>
              </tr>
            ))}
            {promoPerf.length === 0 && (
              <tr><td className="py-4 text-mist text-center">No promos yet.</td></tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  )
}
