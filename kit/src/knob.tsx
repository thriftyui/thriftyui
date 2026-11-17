'use client'

import { useEffect, useRef, useState, type ComponentProps } from 'react'
import { cn } from './cn.ts'

// A rotary control for a value in a range. Radix has none, so it follows
// the W3C's Slider pattern: role="slider" with its aria-value attributes,
// named by aria-label or aria-labelledby, and the pattern's keys. Dragged
// up or down a step every 4px; scrolled over, a step a notch; clicked on
// its ring, set there -- the single-pointer way WCAG 2.5.7 asks for in
// place of dragging. Drawn as a 270-degree ring filled from `origin`; its
// size is its className's (size-14 unless given).

/** The ring's sweep, in degrees, and where it starts: from the lower left
 *  (225 degrees round from the top, clockwise) to the lower right. */
const SWEEP = 270
const START = -135
/** Pixels dragged for a step, and the steps Page Up and Page Down move. */
const PX_PER_STEP = 4
const PAGE = 10

/** A point on a circle of radius r about (50, 50), at an angle from the
 *  top, clockwise. */
const at = (deg: number, r: number) => {
  const a = ((deg - 90) * Math.PI) / 180
  return [50 + r * Math.cos(a), 50 + r * Math.sin(a)] as const
}
const arc = (from: number, to: number, r: number) => {
  const [x0, y0] = at(from, r)
  const [x1, y1] = at(to, r)
  return `M ${x0} ${y0} A ${r} ${r} 0 ${to - from > 180 ? 1 : 0} 1 ${x1} ${y1}`
}

/** A rotary control for a value in a range -- a tempo, a volume. Named by
 *  aria-label; dragged up and down, or turned by the Slider pattern's keys.
 *  `valueText` says its value in words ("120 BPM"); `origin` is where its
 *  ring fills from: the minimum, or the middle for a pan. */
export function Knob({
  value: given,
  defaultValue,
  onValueChange,
  min = 0,
  max = 100,
  step = 1,
  origin,
  valueText,
  disabled = false,
  className,
  ...props
}: Omit<ComponentProps<'div'>, 'defaultValue' | 'onChange'> & {
  value?: number
  defaultValue?: number
  onValueChange?: (value: number) => void
  /** @defaultValue `0` */
  min?: number
  /** @defaultValue `100` */
  max?: number
  /** @defaultValue `1` */
  step?: number
  /** Where the ring's fill starts: `min` unless given, 0 for a pan from
   *  -100 to 100. */
  origin?: number
  /** The value in words, for a screen reader: (120) => "120 BPM". */
  valueText?: (value: number) => string
  /** @defaultValue `false` */
  disabled?: boolean
}) {
  const [own, setOwn] = useState(defaultValue ?? min)
  const value = given ?? own
  const fit = (v: number) => Math.min(max, Math.max(min, Math.round((v - min) / step) * step + min))
  const set = (v: number) => {
    const next = fit(v)
    if (next === value) return
    if (given === undefined) setOwn(next)
    onValueChange?.(next)
  }
  // The latest value and setter, for the listeners set up once.
  const latest = useRef({ value, set, disabled })
  useEffect(() => {
    latest.current = { value, set, disabled }
  })

  const el = useRef<HTMLDivElement>(null)
  // Scrolled over, a step a notch; the page does not scroll.
  useEffect(() => {
    const knob = el.current
    if (!knob) return
    const wheel = (e: WheelEvent) => {
      const { value, set, disabled } = latest.current
      if (disabled || e.deltaY === 0) return
      e.preventDefault()
      set(value + (e.deltaY < 0 ? step : -step))
    }
    knob.addEventListener('wheel', wheel, { passive: false })
    return () => knob.removeEventListener('wheel', wheel)
  }, [step])

  // A press: dragged, it turns by how far it goes up or down; let go
  // without moving, it sets the value where it was pressed on the ring.
  const press = useRef<{ x: number; y: number; from: number; moved: boolean } | null>(null)
  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (disabled || e.button !== 0) return
        // Cancelled, so no mouse events follow and a drag selects no text.
        // Focus is given here instead, without a ring (script focus would
        // otherwise count as the keyboard's) and without scrolling.
    e.preventDefault()
    e.currentTarget.setPointerCapture(e.pointerId)
    e.currentTarget.focus({ preventScroll: true, focusVisible: false })
    press.current = { x: e.clientX, y: e.clientY, from: value, moved: false }
  }
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const p = press.current
    if (!p) return
    const dy = p.y - e.clientY
    if (!p.moved && Math.abs(dy) < PX_PER_STEP && Math.abs(e.clientX - p.x) < PX_PER_STEP) return
    p.moved = true
    set(p.from + Math.trunc(dy / PX_PER_STEP) * step)
  }
  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const p = press.current
    press.current = null
    if (!p || p.moved) return
    // The angle of the press from the top, clockwise, as the ring runs.
    const box = e.currentTarget.getBoundingClientRect()
    const deg = (Math.atan2(e.clientX - (box.left + box.width / 2), -(e.clientY - (box.top + box.height / 2))) * 180) / Math.PI
    const along = (deg - START + 360) % 360
    // A press in the gap at the foot goes to the nearer end.
    const t = along <= SWEEP ? along / SWEEP : along - SWEEP < (360 - SWEEP) / 2 ? 1 : 0
    set(min + t * (max - min))
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (disabled) return
    const by: Record<string, number> = { ArrowRight: step, ArrowUp: step, ArrowLeft: -step, ArrowDown: -step, PageUp: step * PAGE, PageDown: -step * PAGE }
    if (e.key in by) set(value + by[e.key])
    else if (e.key === 'Home') set(min)
    else if (e.key === 'End') set(max)
    else return
    e.preventDefault()
  }

  const angle = (v: number) => START + ((v - min) / (max - min || 1)) * SWEEP
  const turned = angle(value)
  const from = angle(Math.min(max, Math.max(min, origin ?? min)))
  return (
    <div
      ref={el}
      role="slider"
      tabIndex={disabled ? -1 : 0}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={value}
      aria-valuetext={valueText?.(value)}
      aria-disabled={disabled || undefined}
      onKeyDown={onKeyDown}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={() => (press.current = null)}
      className={cn(
        'relative size-14 shrink-0 cursor-grab touch-none rounded-full select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus active:cursor-grabbing aria-disabled:cursor-not-allowed aria-disabled:opacity-50',
        className,
      )}
      {...props}
    >
      <svg aria-hidden viewBox="0 0 100 100" className="size-full overflow-visible">
        <path d={arc(START, START + SWEEP, 46)} fill="none" stroke="var(--neutral-9)" strokeWidth="5" strokeLinecap="round" />
        {turned !== from && <path d={arc(Math.min(from, turned), Math.max(from, turned), 46)} fill="none" stroke="var(--accent-12)" strokeWidth="5" strokeLinecap="round" />}
      </svg>
      {/* The face, the kit's metal, still as light falls on it; over it
          the line pointing at the value, turned. */}
      <div className="absolute inset-[18%] rounded-full border border-neutral-7 bg-(image:--metal)" />
      <div className="absolute inset-[18%]" style={{ transform: `rotate(${turned}deg)` }}>
        <span className="absolute top-[8%] left-1/2 h-[30%] w-[6%] -translate-x-1/2 rounded-full bg-neutral-12" />
      </div>
    </div>
  )
}
