'use client'

import { useEffect, useRef, type KeyboardEvent, type PointerEvent, type ReactNode } from 'react'
import { cn } from './cn.ts'
import { FADER_TOP_DB, fromDb, gainAt, meterHeight, positionOf, toDb, type LevelMeterParts } from './fader-scale.ts'

/** A fader's slot and a meter's well: dark in either theme, as they are on a desk -- Radix's gray 1
 *  in dark, the audio blocks' glass -- with an edge that shows them on a dark ground too. */
const DARK = 'bg-[#111111] ring-1 ring-neutral-7'

// A mixer's fader: the W3C's Slider pattern, up and down. Its value a place on the throw, 0 to
// 1, on a fader's scale (fader-scale.ts); its keys move it in dB -- Up and Down 1 dB, Shift 0.1,
// Page Up and Page Down 6, Home silence, End the top -- and it says its level in words. Dragged,
// it moves as far as the pointer, a tenth as far with Shift; a press on its track without a drag
// puts it there, so nothing needs a drag (WCAG 2.2, 2.5.7); Alt-click puts it back at 0 dB. Its
// pieces are marked (data-part: scale, throw, slot, cap), so an app can restyle each from its
// className.

/** The cap's height, in px. */
const CAP = 22
/** Below this the keys go to silence. */
const FLOOR = -60
const UNITY = positionOf(1)
const round1 = (n: number) => Math.round(n * 10) / 10
const spoken = (db: number) => (db === -Infinity ? 'Silent' : `${db.toFixed(1)} dB`)
const at = (m: number) => `calc(${CAP / 2}px + ${1 - positionOf(fromDb(m))} * (100% - ${CAP}px))`

/** A vertical fader on a mixer's scale, its marks beside it: `position`, 0 (silence) to 1
 *  (+12 dB), held by the app (`onPositionChange`). Its children sit beside it -- a LevelMeter.
 *  Name it with aria-label. */
export function Fader({
  position,
  onPositionChange,
  marks = [12, 6, 0, -6, -12, -20, -30, -40],
  'aria-label': label,
  cap = 'dark',
  light = false,
  className,
  children,
}: {
  position: number
  onPositionChange: (position: number) => void
  /** The marks beside it, in dB; silence at its foot always.
   *  @defaultValue `[12, 6, 0, -6, -12, -20, -30, -40]` */
  marks?: number[]
  'aria-label': string
  /** The cap's metal: dark, or light, its line across the middle the other.
   *  @defaultValue `'dark'` */
  cap?: 'dark' | 'light'
  /** A small light on the cap, on while the app says so: in a DAW, while the control is automated.
   *  A picture: say what it means in the fader's name.
   *  @defaultValue `false` */
  light?: boolean
  className?: string
  children?: ReactNode
}) {
  const track = useRef<HTMLDivElement>(null)
  const db = round1(toDb(gainAt(position)))
  const set = (p: number) => onPositionChange(Math.min(1, Math.max(0, p)))
  const setDb = (d: number) => set(d === -Infinity ? 0 : positionOf(fromDb(Math.min(FADER_TOP_DB, d))))

  const onKeyDown = (e: KeyboardEvent) => {
    const fine = e.shiftKey ? 0.1 : 1
    const by: Record<string, number> = { ArrowUp: fine, ArrowRight: fine, ArrowDown: -fine, ArrowLeft: -fine, PageUp: 6, PageDown: -6 }
    if (e.key in by) {
      const step = by[e.key]
      if (db === -Infinity) {
        if (step > 0) setDb(FLOOR)
      } else {
        const next = round1(db + step)
        setDb(next < FLOOR ? -Infinity : next)
      }
    } else if (e.key === 'Home') set(0)
    else if (e.key === 'End') set(1)
    else return
    e.preventDefault()
  }

  // The throw: where the cap's middle can go, inside the track's ends.
  const placeOf = (clientY: number) => {
    const box = track.current!.getBoundingClientRect()
    return 1 - (clientY - box.top - CAP / 2) / (box.height - CAP)
  }
  const press = useRef<{ y: number; from: number; moved: boolean; onCap: boolean; height: number } | null>(null)
  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return
    // As the Knob: no mouse events after it, focus without the ring and without scrolling.
    e.preventDefault()
    e.currentTarget.focus({ preventScroll: true, focusVisible: false } as FocusOptions)
    if (e.altKey) {
      set(UNITY)
      return
    }
    e.currentTarget.setPointerCapture(e.pointerId)
    const box = track.current!.getBoundingClientRect()
    const capY = box.top + CAP / 2 + (1 - position) * (box.height - CAP)
    press.current = { y: e.clientY, from: position, moved: false, onCap: Math.abs(e.clientY - capY) <= CAP / 2 + 2, height: box.height - CAP }
  }
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const p = press.current
    if (!p) return
    const dy = p.y - e.clientY
    if (!p.moved && Math.abs(dy) < 3) return
    p.moved = true
    set(p.from + (dy / p.height) * (e.shiftKey ? 0.1 : 1))
  }
  const onPointerUp = (e: PointerEvent<HTMLDivElement>) => {
    const p = press.current
    press.current = null
    if (p && !p.moved && !p.onCap) set(placeOf(e.clientY))
  }
  const all = [...marks, -Infinity]

  return (
    <div className={cn('flex h-56 w-full justify-center gap-1', className)}>
      <div aria-hidden data-part="scale" className="relative w-5 font-mono text-[9px] text-neutral-11 tabular-nums">
        {all.map((m) => (
          <span key={m} className="absolute end-0 -translate-y-1/2 leading-none" style={{ top: at(m) }}>
            {m === -Infinity ? '-∞' : m > 0 ? `+${m}` : m}
          </span>
        ))}
      </div>
      <div
        ref={track}
        role="slider"
        tabIndex={0}
        aria-label={label}
        aria-orientation="vertical"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(position * 100)}
        aria-valuetext={spoken(db)}
        data-part="throw"
        onKeyDown={onKeyDown}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={() => (press.current = null)}
        className="relative w-9 shrink-0 cursor-grab touch-none rounded-sm select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus active:cursor-grabbing"
      >
        {all.map((m) => (
          <span key={m} aria-hidden className="absolute inset-x-0 flex justify-between" style={{ top: at(m) }}>
            <span className={cn('h-px w-2', m === 0 ? 'bg-neutral-12' : 'bg-neutral-9')} />
            <span className={cn('h-px w-2', m === 0 ? 'bg-neutral-12' : 'bg-neutral-9')} />
          </span>
        ))}
        <span aria-hidden data-part="slot" className={cn('absolute inset-y-1 left-1/2 w-1.5 -translate-x-1/2 rounded-full', DARK)} />
        {/* The cap: metal of its theme, a line of the other across its middle. */}
        <span
          aria-hidden
          data-part="cap"
          className={cn(cap, 'absolute inset-x-0.5 flex items-center rounded-[3px] border border-neutral-7 bg-(image:--metal) shadow-[0_2px_3px_var(--black-a6)]')}
          style={{ height: CAP, top: `calc(${1 - position} * (100% - ${CAP}px))` }}
        >
          {light && <span data-part="light" className="ms-1 size-1.5 shrink-0 rounded-full bg-(--red-9)" />}
          <span className="mx-0.5 h-0.5 flex-1 rounded-full bg-neutral-12" />
        </span>
      </div>
      {children}
    </div>
  )
}

/** Where a meter's fill turns from green to yellow, and from yellow to red, in dB. [CONJECTURE] A
 *  common colouring of a digital peak meter. */
const METER_YELLOW = -12
const METER_RED = -3

/** The meter's colours by height, fixed to the well: the fill shows as much of them as its level
 *  reaches, so a quiet signal is green alone; the whole scale shows under it, faint, so the meter
 *  reads at rest as an LED meter's unlit segments do. */
const METER_COLOURS = `linear-gradient(to top, var(--success-9) 0 ${meterHeight(METER_YELLOW) * 100}%, var(--warning-9) 0 ${meterHeight(METER_RED) * 100}%, var(--danger-9) 0)`

/** A level meter's well beside a fader: its fill, its held peak and its clip light, handed to
 *  `onParts` to be drawn each frame by `showLevel` (fader-scale.ts), not by React. A picture,
 *  hidden from a screen reader; say a clip in words of the app's own. Its pieces are marked
 *  (data-part: clip, well, scale, fill, peak) for its className to restyle. */
export function LevelMeter({ onParts, className }: { onParts?: (parts: LevelMeterParts | null) => void; className?: string }) {
  const fill = useRef<HTMLElement>(null)
  const peak = useRef<HTMLElement>(null)
  const clip = useRef<HTMLElement>(null)
  useEffect(() => {
    if (!onParts) return
    onParts(fill.current && peak.current && clip.current ? { fill: fill.current, peak: peak.current, clip: clip.current } : null)
    return () => onParts(null)
  }, [onParts])
  return (
    <div aria-hidden className={cn('flex w-2.5 shrink-0 flex-col gap-1 py-1', className)}>
      <span ref={clip} data-part="clip" className="h-1.5 rounded-[1px] bg-neutral-6 data-[on]:bg-danger-9" />
      {/* The well a size container, so its fill's colours are laid out against the whole well (100cqh). */}
      <span data-part="well" className={cn('relative flex-1 overflow-hidden rounded-[2px] [container-type:size]', DARK)}>
        <span data-part="scale" className="absolute inset-0 bg-bottom bg-no-repeat opacity-[0.22]" style={{ backgroundImage: METER_COLOURS, backgroundSize: '100% 100cqh' }} />
        <span
          ref={fill}
          data-part="fill"
          className="absolute inset-x-0 bottom-0 h-0 bg-bottom bg-no-repeat"
          style={{ backgroundImage: METER_COLOURS, backgroundSize: '100% 100cqh' }}
        />
        <span ref={peak} data-part="peak" className="absolute inset-x-0 bottom-0 h-px bg-[#eeeeee] opacity-0" />
      </span>
    </div>
  )
}
