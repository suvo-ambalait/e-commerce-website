import { useId } from 'react'
import { cn } from '@/shared/lib/cn'

interface Point {
  label: string
  value: number
}

/* ------------------------------------------------------------------ *
 * Area / line chart — smooth, theme-aware, no dependencies
 * ------------------------------------------------------------------ */
export function AreaChart({
  data,
  height = 180,
  className,
  valueFormat = (n) => String(Math.round(n)),
}: {
  data: Point[]
  height?: number
  className?: string
  valueFormat?: (n: number) => string
}) {
  const id = useId()
  const w = 600
  const h = height
  const pad = { t: 12, r: 6, b: 22, l: 6 }
  const max = Math.max(1, ...data.map((d) => d.value))
  const innerW = w - pad.l - pad.r
  const innerH = h - pad.t - pad.b
  const stepX = data.length > 1 ? innerW / (data.length - 1) : 0

  const pts = data.map((d, i) => ({
    x: pad.l + i * stepX,
    y: pad.t + innerH - (d.value / max) * innerH,
  }))

  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
  const area = `${line} L${pts[pts.length - 1].x.toFixed(1)},${pad.t + innerH} L${pts[0].x.toFixed(1)},${pad.t + innerH} Z`
  const last = data[data.length - 1]

  return (
    <div className={cn('w-full', className)}>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full overflow-visible" role="img" aria-label="Trend chart">
        <defs>
          <linearGradient id={`${id}fill`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.20" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((g) => (
          <line
            key={g}
            x1={pad.l}
            x2={w - pad.r}
            y1={pad.t + innerH * g}
            y2={pad.t + innerH * g}
            stroke="var(--border)"
            strokeDasharray="2 4"
          />
        ))}
        <path d={area} fill={`url(#${id}fill)`} />
        <path d={line} fill="none" stroke="var(--accent)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={pts[pts.length - 1].x} cy={pts[pts.length - 1].y} r={3.5} fill="var(--accent)" />
        {data.map((d, i) =>
          i % Math.ceil(data.length / 6) === 0 || i === data.length - 1 ? (
            <text
              key={d.label + i}
              x={pad.l + i * stepX}
              y={h - 6}
              textAnchor="middle"
              className="fill-[var(--ink-mute)] text-[10px]"
            >
              {d.label}
            </text>
          ) : null,
        )}
      </svg>
      <p className="mt-1 text-caption text-ink-mute">
        Latest: <span className="text-ink">{valueFormat(last.value)}</span>
      </p>
    </div>
  )
}

/* ------------------------------------------------------------------ *
 * Bar chart
 * ------------------------------------------------------------------ */
export function BarChart({
  data,
  height = 180,
  className,
}: {
  data: Point[]
  height?: number
  className?: string
}) {
  const max = Math.max(1, ...data.map((d) => d.value))
  const barsH = height - 20
  return (
    <div className={cn('flex w-full items-end gap-2', className)}>
      {data.map((d) => (
        <div key={d.label} className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
          <div className="flex w-full items-end justify-center" style={{ height: barsH }}>
            <div
              className="w-full max-w-10 rounded-t-sm bg-accent/75"
              style={{ height: `${Math.max(4, (d.value / max) * barsH)}px` }}
              title={`${d.label}: ${d.value}`}
            />
          </div>
          <span className="w-full truncate text-center text-[10px] text-ink-mute">{d.label}</span>
        </div>
      ))}
    </div>
  )
}

/* ------------------------------------------------------------------ *
 * Horizontal breakdown (category / vendor share)
 * ------------------------------------------------------------------ */
export function BreakdownBars({
  data,
  className,
  valueFormat = (n) => String(n),
}: {
  data: Point[]
  className?: string
  valueFormat?: (n: number) => string
}) {
  const max = Math.max(1, ...data.map((d) => d.value))
  return (
    <div className={cn('space-y-2.5', className)}>
      {data.map((d) => (
        <div key={d.label}>
          <div className="mb-1 flex justify-between text-caption">
            <span className="text-ink-soft">{d.label}</span>
            <span className="tabular-nums text-ink-mute">{valueFormat(d.value)}</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-surface-sunken">
            <div className="h-full rounded-full bg-accent" style={{ width: `${(d.value / max) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  )
}

export function Sparkline({ values, className }: { values: number[]; className?: string }) {
  const max = Math.max(1, ...values)
  const min = Math.min(...values)
  const range = max - min || 1
  const w = 100
  const h = 28
  const step = values.length > 1 ? w / (values.length - 1) : 0
  const d = values
    .map((v, i) => `${i === 0 ? 'M' : 'L'}${(i * step).toFixed(1)},${(h - ((v - min) / range) * h).toFixed(1)}`)
    .join(' ')
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={cn('h-7 w-24', className)} preserveAspectRatio="none">
      <path d={d} fill="none" stroke="var(--accent)" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
