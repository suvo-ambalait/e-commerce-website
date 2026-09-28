import { useId, useLayoutEffect, useRef, useState } from 'react'
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

/** Smooth path through points that never overshoots (monotone cubic, Fritsch–Carlson). */
function monotonePath(pts: { x: number; y: number }[]) {
  const n = pts.length
  if (n === 0) return ''
  if (n < 3) return pts.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
  const dx = pts.slice(1).map((p, i) => p.x - pts[i].x)
  const slope = pts.slice(1).map((p, i) => (p.y - pts[i].y) / (dx[i] || 1))
  const m = pts.map((_, i) => {
    if (i === 0) return slope[0]
    if (i === n - 1) return slope[n - 2]
    const a = slope[i - 1]
    const b = slope[i]
    return a * b <= 0 ? 0 : (3 * (dx[i - 1] + dx[i])) / ((2 * dx[i] + dx[i - 1]) / a + (dx[i] + 2 * dx[i - 1]) / b)
  })
  let d = `M${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`
  for (let i = 0; i < n - 1; i++) {
    const h = dx[i] / 3
    d += ` C${(pts[i].x + h).toFixed(1)},${(pts[i].y + m[i] * h).toFixed(1)} ${(pts[i + 1].x - h).toFixed(1)},${(
      pts[i + 1].y -
      m[i + 1] * h
    ).toFixed(1)} ${pts[i + 1].x.toFixed(1)},${pts[i + 1].y.toFixed(1)}`
  }
  return d
}

/** Tracks an element's rendered width so SVGs draw at 1:1 pixels instead of scaling. */
function useWidth<T extends HTMLElement>(fallback: number) {
  const ref = useRef<T>(null)
  const [width, setWidth] = useState(fallback)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    setWidth(el.clientWidth || fallback)
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width || fallback))
    ro.observe(el)
    return () => ro.disconnect()
  }, [fallback])
  return [ref, width] as const
}

export function AreaChart({
  data,
  height = 180,
  className,
  valueFormat = (n) => String(Math.round(n)),
  axisFormat,
  showLatest = true,
  showAverage = true,
}: {
  data: Point[]
  height?: number
  className?: string
  valueFormat?: (n: number) => string
  /** y-axis tick labels (defaults to `valueFormat`) */
  axisFormat?: (n: number) => string
  /** "Latest: …" caption under the chart */
  showLatest?: boolean
  /** dashed reference line at the period average */
  showAverage?: boolean
}) {
  const id = useId()
  const [wrapRef, w] = useWidth<HTMLDivElement>(600)
  const [hover, setHover] = useState<number | null>(null)
  const h = height
  const tick = axisFormat ?? valueFormat
  const { top, step } = niceCeiling(Math.max(1, ...data.map((d) => d.value)))
  const ticks = Array.from({ length: Math.round(top / step) + 1 }, (_, i) => i * step)
  const longestTick = Math.max(...ticks.map((t) => tick(t).length))
  const pad = { t: 12, r: 12, b: 28, l: Math.max(32, longestTick * 7 + 10) }
  const innerW = Math.max(1, w - pad.l - pad.r)
  const innerH = h - pad.t - pad.b
  const stepX = data.length > 1 ? innerW / (data.length - 1) : 0
  const yOf = (v: number) => pad.t + innerH - (v / top) * innerH
  const baseY = pad.t + innerH

  const pts = data.map((d, i) => ({ x: pad.l + i * stepX, y: yOf(d.value) }))
  const line = monotonePath(pts)
  const area = `${line} L${pts[pts.length - 1].x.toFixed(1)},${baseY} L${pts[0].x.toFixed(1)},${baseY} Z`
  const last = data[data.length - 1]
  const lastPt = pts[pts.length - 1]
  const avg = data.reduce((n, d) => n + d.value, 0) / (data.length || 1)
  const avgY = yOf(avg)

  // x labels: as many as fit (~72px apart), always ending on the last point
  const fit = Math.max(2, Math.floor(innerW / 72))
  const labelEvery = Math.max(1, Math.ceil((data.length - 1) / (fit - 1)))
  const showLabel = (i: number) =>
    i === data.length - 1 || (i % labelEvery === 0 && data.length - 1 - i >= labelEvery * 0.6)

  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    const i = Math.round((e.clientX - r.left - pad.l) / (stepX || 1))
    setHover(Math.max(0, Math.min(data.length - 1, i)))
  }

  const focusPt = hover !== null ? pts[hover] : null
  const prev = hover !== null && hover > 0 ? data[hover - 1].value : null
  const change = hover !== null && prev ? (data[hover].value - prev) / prev : null

  return (
    <div className={cn('w-full', className)}>
      <div ref={wrapRef} className="relative">
        <svg
          width={w}
          height={h}
          className="block touch-pan-y select-none overflow-visible"
          role="img"
          aria-label={`Trend chart, latest ${valueFormat(last.value)}`}
          onPointerMove={onMove}
          onPointerLeave={() => setHover(null)}
        >
          <defs>
            <linearGradient id={`${id}fill`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.2" />
              <stop offset="70%" stopColor="var(--accent)" stopOpacity="0.04" />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* grid + y ticks */}
          {ticks.map((t) => (
            <g key={t}>
              <line
                x1={pad.l}
                x2={w - pad.r}
                y1={yOf(t)}
                y2={yOf(t)}
                stroke={t === 0 ? 'var(--border-strong)' : 'var(--border)'}
                strokeOpacity={t === 0 ? 1 : 0.7}
              />
              <text
                x={pad.l - 10}
                y={yOf(t)}
                dy="0.32em"
                textAnchor="end"
                className="fill-ink-mute text-[11px] tabular-nums"
              >
                {tick(t)}
              </text>
            </g>
          ))}

          {/* average reference */}
          {showAverage && data.length > 1 && (
            <g>
              <line
                x1={pad.l}
                x2={w - pad.r}
                y1={avgY}
                y2={avgY}
                stroke="var(--ink-mute)"
                strokeOpacity={0.55}
                strokeDasharray="4 4"
              />
              <text
                x={pad.l + 6}
                y={avgY - 6}
                className="fill-ink-mute text-[10px] font-semibold uppercase tracking-[0.08em]"
              >
                Avg {tick(avg)}
              </text>
            </g>
          )}

          <path d={area} fill={`url(#${id}fill)`} />
          <path d={line} fill="none" stroke="var(--accent)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />

          {/* hover crosshair */}
          {focusPt && (
            <g>
              <line
                x1={focusPt.x}
                x2={focusPt.x}
                y1={pad.t}
                y2={baseY}
                stroke="var(--accent)"
                strokeOpacity={0.4}
                strokeDasharray="3 3"
              />
              <circle cx={focusPt.x} cy={focusPt.y} r={9} fill="var(--accent)" fillOpacity={0.15} />
              <circle cx={focusPt.x} cy={focusPt.y} r={4.5} fill="var(--surface)" stroke="var(--accent)" strokeWidth={2} />
            </g>
          )}

          {/* resting marker on the latest point */}
          {!focusPt && <circle cx={lastPt.x} cy={lastPt.y} r={4} fill="var(--accent)" stroke="var(--surface)" strokeWidth={2} />}

          {/* x labels */}
          {data.map((d, i) =>
            showLabel(i) ? (
              <text
                key={d.label + i}
                x={pts[i].x}
                y={h - 8}
                textAnchor={i === 0 ? 'start' : i === data.length - 1 ? 'end' : 'middle'}
                className={cn('text-[11px]', hover === i ? 'fill-ink font-semibold' : 'fill-ink-mute')}
              >
                {d.label}
              </text>
            ) : null,
          )}
        </svg>

        {/* soft pulse on the latest point while idle */}
        {!focusPt && (
          <span
            aria-hidden
            className="pointer-events-none absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 animate-ping rounded-full bg-accent/40"
            style={{ left: lastPt.x, top: lastPt.y }}
          />
        )}

        {/* tooltip (hover only) */}
        {focusPt && hover !== null && (
          <div
            className="pointer-events-none absolute z-10 min-w-28 -translate-x-1/2 -translate-y-full rounded-xl border border-white/10! bg-[#0b0a10] px-3 py-2 text-white shadow-[0_12px_28px_rgba(11,10,16,0.35)]"
            style={{
              left: Math.min(Math.max(focusPt.x, pad.l + 56), w - 56),
              top: Math.max(focusPt.y - 14, 8),
            }}
          >
            <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#c4b5fd]">{data[hover].label}</p>
            <p className="mt-0.5 text-sm font-bold tabular-nums">{valueFormat(data[hover].value)}</p>
            {change !== null && Number.isFinite(change) && (
              <p
                className={cn(
                  'mt-0.5 text-[10px] font-semibold tabular-nums',
                  change >= 0 ? 'text-[#86efac]' : 'text-[#fca5a5]',
                )}
              >
                {change >= 0 ? '▲' : '▼'} {Math.abs(change * 100).toFixed(0)}% vs day before
              </p>
            )}
          </div>
        )}
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
/**
 * Vertical bars on a faint grid. `height` is a minimum: add `flex-1` via
 * `className` inside a flex-column parent and the chart grows to fill it.
 * The tallest bar(s) are highlighted; hovering a bar shows its value.
 */
export function BarChart({
  data,
  height = 180,
  className,
  valueFormat = (n) => String(n),
}: {
  data: Point[]
  height?: number
  className?: string
  /** text in the value bubble above a bar */
  valueFormat?: (n: number) => string
}) {
  const [hover, setHover] = useState<number | null>(null)
  const max = Math.max(1, ...data.map((d) => d.value))
  const allInts = data.every((d) => Number.isInteger(d.value))
  let { top, step } = niceCeiling(max)
  if (allInts && step < 1) {
    step = 1
    top = Math.ceil(max)
  }
  const ticks = Array.from({ length: Math.round(top / step) + 1 }, (_, i) => i * step).reverse()
  const isPeak = (v: number) => v === max && max > 0

  return (
    <div className={cn('flex w-full flex-col', className)} style={{ minHeight: height }}>
      {/* top padding leaves room for the value bubble over a full-height bar */}
      <div className="flex flex-1 gap-2 pt-7">
        {/* y axis */}
        <div className="flex flex-col justify-between text-right text-[10px] leading-none text-ink-mute tabular-nums">
          {ticks.map((t) => (
            <span key={t}>{t}</span>
          ))}
        </div>

        {/* plot */}
        <div className="relative flex-1" onMouseLeave={() => setHover(null)}>
          {/* grid lines */}
          <div aria-hidden className="pointer-events-none absolute inset-0 flex flex-col justify-between">
            {ticks.map((t, i) => (
              <span
                key={t}
                className={cn('block h-px w-full', i === ticks.length - 1 ? 'bg-border-strong' : 'bg-border/70')}
              />
            ))}
          </div>

          <div className="absolute inset-0 flex items-end gap-1.5 sm:gap-2">
            {data.map((d, i) => {
              const active = hover === i
              const peak = isPeak(d.value)
              const showValue = active || (hover === null && peak)
              return (
                <div
                  key={d.label}
                  className="group relative flex h-full min-w-0 flex-1 cursor-default items-end justify-center"
                  onMouseEnter={() => setHover(i)}
                >
                  {/* hover column wash */}
                  <span
                    aria-hidden
                    className={cn(
                      'absolute inset-x-0 inset-y-0 rounded-lg bg-accent-soft/60 transition-opacity',
                      active ? 'opacity-100' : 'opacity-0',
                    )}
                  />
                  <div
                    className={cn(
                      'relative w-full max-w-9 rounded-t-md transition-[background-color,height] duration-500 ease-out',
                      peak || active ? 'bg-accent' : 'bg-accent/40',
                    )}
                    style={{ height: `${Math.max(2, (d.value / top) * 100)}%` }}
                    title={`${d.label}: ${valueFormat(d.value)}`}
                  >
                    <span
                      className={cn(
                        'absolute bottom-full left-1/2 mb-1.5 -translate-x-1/2 whitespace-nowrap rounded-md bg-ink px-1.5 py-0.5 text-[11px] font-semibold text-bg tabular-nums shadow-sm transition-[opacity,transform]',
                        showValue ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-1 opacity-0',
                      )}
                    >
                      {valueFormat(d.value)}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* x labels, offset to line up with the plot */}
      <div className="mt-2 flex gap-2">
        <span aria-hidden className="invisible text-[10px] tabular-nums">
          {ticks[0]}
        </span>
        <div className="flex flex-1 gap-1.5 sm:gap-2">
          {data.map((d, i) => (
            <span
              key={d.label}
              className={cn(
                'min-w-0 flex-1 truncate text-center text-[11px]',
                hover === i || isPeak(d.value) ? 'font-semibold text-ink' : 'text-ink-mute',
              )}
            >
              {d.label}
            </span>
          ))}
        </div>
      </div>
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
