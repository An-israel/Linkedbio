import { useState } from 'react'

export const DAYS = 30

export interface DayCount {
  date: string // YYYY-MM-DD
  label: string // e.g. "Jun 8"
  count: number
}

export function emptyDays(days = DAYS): DayCount[] {
  const out: DayCount[] = []
  const today = new Date()
  for (let i = days - 1; i >= 0; i--) {
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

export function bucket(timestamps: string[], days = DAYS): DayCount[] {
  const buckets = emptyDays(days)
  const index = new Map(buckets.map((d, i) => [d.date, i]))
  for (const ts of timestamps) {
    const i = index.get(ts.slice(0, 10))
    if (i !== undefined) buckets[i].count++
  }
  return buckets
}

/** Single-series bar chart: thin silver bars on obsidian, per-bar hover tooltip. */
export function BarChart({ days, title }: { days: DayCount[]; title: string }) {
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
        aria-label={`${title}: ${days.reduce((s, d) => s + d.count, 0)} total over the last ${days.length} days`}
        className="w-full h-auto block"
        onMouseLeave={() => setHover(null)}
      >
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

export function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="bg-graphite border border-steel rounded-[10px] p-5">
      <p className="mono-label">{label}</p>
      <p className="display text-platinum text-3xl mt-2">{value}</p>
      {hint && <p className="text-mist text-xs mt-1">{hint}</p>}
    </div>
  )
}
