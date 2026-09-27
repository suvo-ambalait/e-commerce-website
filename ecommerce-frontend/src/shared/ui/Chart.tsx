import { useId, useState } from 'react'
import { cn } from '@/shared/lib/cn'

interface Point {
  label: string
  value: number
}

/* ------------------------------------------------------------------ *
 * Area / line chart — smooth, theme-aware, no dependencies
 * ------------------------------------------------------------------ */

/** Round `max` up to a tidy axis ceiling (1/2/5 × 10ⁿ steps, 4 intervals). */
function niceCeiling(max: number) {
  const rough = max / 4
  const pow = 10 ** Math.floor(Math.log10(rough || 1))
  const step = [1, 2, 5, 10].map((m) => m * pow).find((s) => s >= rough) ?? rough
  return { top: Math.ceil(max / step) * step, step }
}

export function AreaChart({
  data,
  height = 180,
  className,
  valueFormat = (n) => String(Math.round(n)),
  axisFormat,
  showLatest = true,
}: {
  data: Point[]
  height?: number
  className?: string
  valueFormat?: (n: number) => string
  /** y-axis tick labels (defaults to `valueFormat`) */
  axisFormat?: (n: number) => string
  /** "Latest: …" caption under the chart */
  showLatest?: boolean
}) {
  const id = useId()
  const [hover, setHover] = useState<number | null>(null)
  const w = 600
  const h = height
  const pad = { t: 10, r: 10, b: 24, l: 44 }
  const { top, step } = niceCeiling(Math.max(1, ...data.map((d) => d.value)))
  const innerW = w - pad.l - pad.r
  const innerH = h - pad.t - pad.b
  const stepX = data.length > 1 ? innerW / (data.length - 1) : 0
  const tick = axisFormat ?? valueFormat

  const pts = data.map((d, i) => ({
    x: pad.l + i * stepX,
    y: pad.t + innerH - (d.value / top) * innerH,
  }))

  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
  const area = `${line} L${pts[pts.length - 1].x.toFixed(1)},${pad.t + innerH} L${pts[0].x.toFixed(1)},${pad.t + innerH} Z`
  const last = data[data.length - 1]
  const focus = hover ?? data.length - 1
  const ticks = Array.from({ length: Math.round(top / step) + 1 }, (_, i) => i * step)
  const labelEvery = Math.ceil(data.length / 5)

  const onMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - r.left) / r.width) * w
    const i = Math.round((x - pad.l) / (stepX || 1))
    setHover(Math.max(0, Math.min(data.length - 1, i)))
  }

  return (
    <div className={cn('w-full', className)}>
      <div className="relative">
        <svg
          viewBox={`0 0 ${w} ${h}`}
          className="w-full overflow-visible"
          role="img"
          aria-label="Trend chart"
          onMouseMove={onMove}
          onMouseLeave={() => setHover(null)}
        >
          <defs>
            <linearGradient id={`${id}fill`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.22" />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
            </linearGradient>
          </defs>
          {ticks.map((t) => {
            const y = pad.t + innerH - (t / top) * innerH
            return (
              <g key={t}>
                <line x1={pad.l} x2={w - pad.r} y1={y} y2={y} stroke="var(--border)" strokeDasharray="3 5" />
                <text x={pad.l - 8} y={y + 3} textAnchor="end" className="fill-[var(--ink-mute)] text-[10px]">
                  {tick(t)}
                </text>
              </g>
            )
          })}
          <path d={area} fill={`url(#${id}fill)`} />
          <path d={line} fill="none" stroke="var(--accent)" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
          <line
            x1={pts[focus].x}
            x2={pts[focus].x}
            y1={pad.t}
            y2={pad.t + innerH}
            stroke="var(--accent)"
            strokeOpacity={0.35}
          />
          <circle cx={pts[focus].x} cy={pts[focus].y} r={5} fill="var(--surface)" stroke="var(--accent)" strokeWidth={2.5} />
          {data.map((d, i) =>
            (i % labelEvery === 0 && data.length - 1 - i >= labelEvery / 2) || i === data.length - 1 ? (
              <text
                key={d.label + i}
                x={pad.l + i * stepX}
                y={h - 6}
                textAnchor={i === 0 ? 'start' : i === data.length - 1 ? 'end' : 'middle'}
                className="fill-[var(--ink-mute)] text-[10px]"
              >
                {d.label}
              </text>
            ) : null,
          )}
        </svg>

        {/* tooltip */}
        <div
          className="pointer-events-none absolute z-10 -translate-y-full rounded-lg bg-[#0b0a10] px-2.5 py-1.5 text-white shadow-lg transition-[left,top] duration-100"
          style={{
            left: `clamp(0px, calc(${(pts[focus].x / w) * 100}% - 40px), calc(100% - 84px))`,
            top: `calc(${(pts[focus].y / h) * 100}% - 12px)`,
          }}
        >
          <p className="text-[10px] font-medium text-[#c4b5fd]">{data[focus].label}</p>
          <p className="text-sm font-bold tabular-nums">{valueFormat(data[focus].value)}</p>
        </div>
      </div>
      {showLatest && (
        <p className="mt-1 text-caption text-ink-mute">
          Latest: <span className="text-ink">{valueFormat(last.value)}</span>
        </p>
      )}
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
  const [hover, setHover] = useState<number | null>(null)
  const max = Math.max(1, ...data.map((d) => d.value))
  const peak = data.findIndex((d) => d.value === max)
  const barsH = height - 38
  return (
    <div className={cn('flex w-full items-end gap-2', className)} onMouseLeave={() => setHover(null)}>
      {data.map((d, i) => {
        const showValue = i === (hover ?? peak)
        return (
          <div
            key={d.label}
            className="flex min-w-0 flex-1 flex-col items-center gap-2"
            onMouseEnter={() => setHover(i)}
          >
            <div className="flex w-full flex-col items-center justify-end" style={{ height: barsH + 18 }}>
              <span
                className={cn(
                  'mb-1 text-caption font-bold text-ink tabular-nums transition-opacity',
                  showValue ? 'opacity-100' : 'opacity-0',
                )}
              >
                {d.value}
              </span>
              <div
                className={cn(
                  'w-full max-w-11 rounded-lg transition-colors',
                  i === (hover ?? peak) ? 'bg-accent' : 'bg-accent/80 hover:bg-accent',
                )}
                style={{ height: `${Math.max(6, (d.value / max) * barsH)}px` }}
                title={`${d.label}: ${d.value}`}
              />
            </div>
            <span className="w-full truncate text-center text-[11px] text-ink-mute">{d.label}</span>
          </div>
        )
      })}
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
