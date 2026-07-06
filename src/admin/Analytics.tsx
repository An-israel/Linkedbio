import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Link } from '../lib/types'

const DAYS = 30

interface DayCount {
  date: string // YYYY-MM-DD
  label: string // e.g. "Jun 8"
  count: number
}

function emptyDays(): DayCount[] {
  const out: DayCount[] = []
  const today = new Date()
  for (let i = DAYS - 1; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    out.push({
      date: d.toISOString().slice(0, 10),
      label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      count: 0,
    })
  }
  return out
}

function bucket(timestamps: string[]): DayCount[] {
  const days = emptyDays()
  const index = new Map(days.map((d, i) => [d.date, i]))
  for (const ts of timestamps) {
    const key = ts.slice(0, 10)
    const i = index.get(key)
    if (i !== undefined) days[i].count++
  }
  return days
}

/** Single-series bar chart: thin silver bars on obsidian, per-bar hover tooltip. */
function BarChart({ days, title }: { days: DayCount[]; title: string }) {
  const [hover, setHover] = useState<number | null>(null)
  const W = 600
  const H = 160
  const PAD_BOTTOM = 22
  const PAD_TOP = 8
  const max = Math.max(1, ...days.map((d) => d.count))
  const gap = 2
  const barW = (W - gap * (days.length - 1)) / days.length
  const plotH = H - PAD_BOTTOM - PAD_TOP

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`${title}: ${days.reduce((s, d) => s + d.count, 0)} total over the last ${DAYS} days`}
        className="w-full h-auto block"
        onMouseLeave={() => setHover(null)}
      >
        {/* recessive gridlines */}
        {[0.5, 1].map((f) => (
          <line
            key={f}
            x1={0}
            x2={W}
            y1={PAD_TOP + plotH * (1 - f)}
            y2={PAD_TOP + plotH * (1 - f)}
            stroke="#1C1E22"
            strokeWidth={1}
          />
        ))}
        <line x1={0} x2={W} y1={PAD_TOP + plotH} y2={PAD_TOP + plotH} stroke="#1C1E22" strokeWidth={1} />

        {days.map((d, i) => {
          const h = d.count === 0 ? 0 : Math.max(3, (d.count / max) * plotH)
          const x = i * (barW + gap)
          const y = PAD_TOP + plotH - h
          return (
            <g key={d.date}>
              {/* full-height hit target, bigger than the mark */}
              <rect
                x={x}
                y={PAD_TOP}
                width={barW}
                height={plotH}
                fill="transparent"
                onMouseEnter={() => setHover(i)}
              />
              {d.count > 0 && (
                <rect
                  x={x}
                  y={y}
                  width={barW}
                  height={h}
                  rx={2}
                  fill={hover === i ? '#EDEFF2' : '#C7CBD1'}
                  pointerEvents="none"
                />
              )}
              {/* sparse x labels: first, middle, last */}
              {(i === 0 || i === Math.floor(days.length / 2) || i === days.length - 1) && (
                <text
                  x={x + barW / 2}
                  y={H - 6}
                  textAnchor={i === 0 ? 'start' : i === days.length - 1 ? 'end' : 'middle'}
                  fill="#8A8F98"
                  fontSize={10}
                  fontFamily="JetBrains Mono, monospace"
                >
                  {d.label}
                </text>
              )}
            </g>
          )
        })}

        {/* max value label */}
        <text x={0} y={PAD_TOP + 4} fill="#8A8F98" fontSize={10} fontFamily="JetBrains Mono, monospace">
          {max}
        </text>
      </svg>

      {hover !== null && (
        <div
          className="absolute -top-1 pointer-events-none bg-graphite border border-steel rounded-[8px] px-2.5 py-1.5 text-xs whitespace-nowrap"
          style={{
            left: `${((hover + 0.5) / days.length) * 100}%`,
            transform: `translateX(${hover < days.length / 2 ? '8px' : 'calc(-100% - 8px)'})`,
          }}
        >
          <span className="text-mist">{days[hover].label}</span>{' '}
          <span className="text-platinum font-medium">{days[hover].count}</span>
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="bg-graphite border border-steel rounded-[10px] p-5">
      <p className="mono-label">{label}</p>
      <p className="display text-platinum text-3xl mt-2">{value}</p>
      {hint && <p className="text-mist text-xs mt-1">{hint}</p>}
    </div>
  )
}

export function Analytics() {
  const [views, setViews] = useState<string[]>([])
  const [clicks, setClicks] = useState<{ clicked_at: string; link_id: string }[]>([])
  const [links, setLinks] = useState<Link[]>([])
  const [selectedLink, setSelectedLink] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      if (!supabase) {
        setError('Supabase is not configured — analytics needs the backend.')
        setLoading(false)
        return
      }
      const since = new Date()
      since.setDate(since.getDate() - DAYS)
      const sinceIso = since.toISOString()

      const [viewsRes, clicksRes, linksRes] = await Promise.all([
        supabase.from('page_views').select('created_at').gte('created_at', sinceIso),
        supabase.from('link_clicks').select('clicked_at, link_id').gte('clicked_at', sinceIso),
        supabase.from('links').select('*').order('click_count', { ascending: false }),
      ])

      if (viewsRes.error || clicksRes.error || linksRes.error) {
        setError('Failed to load analytics data.')
      } else {
        setViews((viewsRes.data ?? []).map((r) => r.created_at as string))
        setClicks((clicksRes.data ?? []) as { clicked_at: string; link_id: string }[])
        setLinks((linksRes.data as Link[]) ?? [])
      }
      setLoading(false)
    }
    void load()
  }, [])

  const viewDays = useMemo(() => bucket(views), [views])
  const clickDays = useMemo(
    () =>
      bucket(
        clicks
          .filter((c) => !selectedLink || c.link_id === selectedLink)
          .map((c) => c.clicked_at)
      ),
    [clicks, selectedLink]
  )

  const totalViews = views.length
  const totalClicks = clicks.length
  const ctr = totalViews === 0 ? 0 : (totalClicks / totalViews) * 100
  const totalAllTimeClicks = links.reduce((s, l) => s + l.click_count, 0)

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="skeleton h-28 rounded-[10px]" />
        ))}
      </div>
    )
  }

  if (error) {
    return <p className="text-danger text-sm">{error}</p>
  }

  return (
    <div>
      <p className="mono-label">Analytics</p>
      <h1 className="display text-platinum text-xl mt-1 mb-7">Last {DAYS} days</h1>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Page views" value={totalViews.toLocaleString()} />
        <StatCard label="Link clicks" value={totalClicks.toLocaleString()} />
        <StatCard
          label="Click-through"
          value={`${ctr.toFixed(1)}%`}
          hint="clicks ÷ views"
        />
      </div>

      <section className="bg-graphite border border-steel rounded-[10px] p-5 mt-6">
        <p className="mono-label mb-4">Views per day</p>
        <BarChart days={viewDays} title="Page views per day" />
      </section>

      <section className="bg-graphite border border-steel rounded-[10px] p-5 mt-6">
        <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
          <p className="mono-label">Clicks per day</p>
          <select
            value={selectedLink}
            onChange={(e) => setSelectedLink(e.target.value)}
            aria-label="Filter clicks by link"
            className="bg-obsidian border border-steel rounded-[8px] text-sm text-platinum px-2.5 py-1.5"
          >
            <option value="">All links</option>
            {links.map((l) => (
              <option key={l.id} value={l.id}>
                {l.title}
              </option>
            ))}
          </select>
        </div>
        <BarChart days={clickDays} title="Link clicks per day" />
      </section>

      <section className="bg-graphite border border-steel rounded-[10px] p-5 mt-6 overflow-x-auto">
        <p className="mono-label mb-4">Top links (all time)</p>
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
                    {totalAllTimeClicks === 0
                      ? '—'
                      : `${((l.click_count / totalAllTimeClicks) * 100).toFixed(1)}%`}
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
