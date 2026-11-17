'use client'

import { useState } from 'react'

// One image to a screen reader, its name holding the start, end, low and
// high; the pointer's readout is for the eye only. Drawn to the box's
// shape with a stroke that does not stretch; the dot drawn over the SVG so
// it stays round.

const W = 100
const H = 100

/** A small line showing how a value moved -- a price over a day: `points`,
 *  oldest first, no axes. To a screen reader, one image named by `label`
 *  with where it began and ended and its low and high, each written by
 *  `format`; under the pointer, a readout of the nearest point. */
export function Sparkline({
  points,
  label,
  format,
  caption,
  pointName,
  className,
}: {
  /** The values, oldest first: two or more. */
  points: number[]
  /** What it shows: "ETH over 24 hours". */
  label: string
  /** Writes a value: the currency, the units. */
  format: (n: number) => string
  /** Under the line at rest: the span it covers, say. */
  caption?: string
  /** A point's name in the readout, by its index: "3 h ago". With
   *  neither this nor `caption`, there is no readout line. */
  pointName?: (index: number) => string
  className?: string
}) {
  const [at, setAt] = useState<number | null>(null)
  const lo = Math.min(...points)
  const hi = Math.max(...points)
  const last = points.length - 1
  const x = (i: number) => (i / (last || 1)) * W
  // 6 of the 100 clear at the top and foot -- about 2px at its 2rem height
  // -- so the line's round ends show whole.
  const y = (v: number) => H - 6 - ((v - lo) / (hi - lo || 1)) * (H - 12)
  const d = points.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(2)} ${y(v).toFixed(2)}`).join('')
  const pick = (clientX: number, rect: DOMRect) => setAt(Math.max(0, Math.min(last, Math.round(((clientX - rect.left) / rect.width) * last))))
  const readout = caption !== undefined || pointName !== undefined
  return (
    <div className={className}>
      <div className="relative h-8">
        <svg
          role="img"
          aria-label={`${label}: from ${format(points[0])} to ${format(points[last])}, low ${format(lo)}, high ${format(hi)}`}
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="none"
          className="block size-full overflow-visible"
          onPointerMove={(e) => pick(e.clientX, e.currentTarget.getBoundingClientRect())}
          onPointerLeave={() => setAt(null)}
        >
          <path d={d} fill="none" stroke="var(--neutral-11)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
          {at !== null && <line x1={x(at)} x2={x(at)} y1="0" y2={H} stroke="var(--neutral-9)" strokeWidth="1" vectorEffect="non-scaling-stroke" />}
        </svg>
        {at !== null && (
          <span
            aria-hidden
            className="pointer-events-none absolute size-[5px] -translate-1/2 rounded-full bg-neutral-12 ring-[1.5px] ring-neutral-1"
            style={{ left: `${x(at)}%`, top: `${y(points[at])}%` }}
          />
        )}
      </div>
      {readout && (
        <p aria-hidden className="mt-1 h-4 text-[11px] text-neutral-11 tabular-nums">
          {at === null ? caption : `${pointName ? `${pointName(at)} · ` : ''}${format(points[at])}`}
        </p>
      )}
    </div>
  )
}
