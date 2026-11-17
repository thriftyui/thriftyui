'use client'

import { useLayoutEffect, useRef, useState, type ComponentProps, type CSSProperties, type ReactNode } from 'react'
import { cn } from './cn.ts'

// The ID-1 card's shape (85.60 by 53.98 mm, corners 3.18 mm), kept at any
// size. The security print is decoration, hidden from screen readers. The
// face is laid out at FACE_WIDTH and scaled with the plate, measured by a
// ResizeObserver, as no CSS unit gives a ratio of two widths.

/** The face's own width, in CSS pixels: it is laid out at this and scaled
 *  to the plate. */
const FACE_WIDTH = 356

/** A button on the face: at least 24 CSS pixels on the screen at any
 *  scale -- 1.5rem over the face's scale where the face is drawn smaller. */
export const BANK_CARD_TARGET = 'size-[max(1.5rem,calc((1.5rem+0.5px)/var(--bank-card-scale,1)))]'

function useFace() {
  const ref = useRef<HTMLElement>(null)
  const [style, setStyle] = useState<CSSProperties>({ width: '100%', height: '100%' })
  useLayoutEffect(() => {
    const plate = ref.current
    if (!plate) return
    const fit = () => {
      const w = plate.clientWidth
      const h = plate.clientHeight
      // Hidden (an inactive tab, say), it has no size to fit.
      if (!w) return
      const scale = w / FACE_WIDTH
      // The scale as a variable too, so a control on the face can keep its
      // size on the screen (BANK_CARD_TARGET).
      setStyle({ width: w / scale, height: h / scale, transform: scale === 1 ? undefined : `scale(${scale})`, '--bank-card-scale': scale } as CSSProperties)
    }
    fit()
    const watch = new ResizeObserver(fit)
    watch.observe(plate)
    return () => watch.disconnect()
  }, [])
  return [ref, style] as const
}

function Microprint({ words, edge }: { words: string; edge: 'top' | 'bottom' }) {
  return (
    <div
      aria-hidden
      className={cn(
        'pointer-events-none absolute inset-x-3 overflow-hidden text-[4px] leading-none tracking-[0.12em] whitespace-nowrap text-bank-card-print',
        edge === 'top' ? 'top-1.5' : 'bottom-1.5',
      )}
    >
      {/* Longer than the widest face's edge holds: about 480 letters. */}
      {`${words} · `.repeat(Math.ceil(480 / (words.length + 3)))}
    </div>
  )
}

/** A card-shaped plate: a <section>, named by `aria-label` for what it
 *  shows. `art` is drawn behind the face, filling the plate; `microprint`,
 *  the words repeated along its edges (in capitals, as such printing is);
 *  the children are the face, laid out at 356px wide and scaled to the
 *  plate. The face is a container (Tailwind's @container), so what does
 *  not fit a narrow plate can go. */
export function BankCard({
  art,
  microprint,
  className,
  faceClassName,
  children,
  ...props
}: ComponentProps<'section'> & {
  art?: ReactNode
  microprint?: string
  /** The face's own classes: its padding and layout. */
  faceClassName?: string
}) {
  const [ref, face] = useFace()
  return (
    <section
      ref={ref}
      className={cn(
        'relative aspect-[85.6/53.98] shrink-0 overflow-hidden [border-radius:3.715%/5.891%] border border-bank-card-line bg-bank-card text-bank-card-text shadow-(--surface-shadow)',
        className,
      )}
      {...props}
    >
      {art}
      <div style={face} className={cn('@container absolute top-0 left-0 flex origin-top-left flex-col p-4', faceClassName)}>
        {microprint && <Microprint words={microprint} edge="top" />}
        {microprint && <Microprint words={microprint} edge="bottom" />}
        {children}
      </div>
    </section>
  )
}

// The guilloché's curves: a rosette, a hypotrochoid -- the curve a point
// traces on a circle rolling inside another (x = (R - r)cos t + d cos((R -
// r)t / r), y = (R - r)sin t - d sin((R - r)t / r)) -- and a band of sine
// waves, each a little out of phase with the last, so they weave.

function rosette(cx: number, cy: number, R: number, r: number, d: number, turns: number) {
  const k = (R - r) / r
  const pts: string[] = []
  const n = 1400
  for (let i = 0; i <= n; i++) {
    const t = (i / n) * Math.PI * 2 * turns
    const x = cx + (R - r) * Math.cos(t) + d * Math.cos(k * t)
    const y = cy + (R - r) * Math.sin(t) - d * Math.sin(k * t)
    pts.push(`${x.toFixed(2)} ${y.toFixed(2)}`)
  }
  return `M${pts.join('L')}`
}

function waves(width: number, y0: number, amp: number, lines: number) {
  const out: string[] = []
  for (let l = 0; l < lines; l++) {
    const phase = (l / lines) * Math.PI
    const pts: string[] = []
    for (let x = 0; x <= width; x += 2) pts.push(`${x} ${(y0 + Math.sin(x / 14 + phase) * amp + Math.sin(x / 37 + phase * 2) * amp * 0.4).toFixed(2)}`)
    out.push(`M${pts.join('L')}`)
  }
  return out
}

const ROSETTE = rosette(250, 60, 58, 21, 34, 7)
const ROSETTE_SMALL = rosette(250, 60, 30, 11, 18, 11)
const WAVES = waves(320, 96, 7, 9)

/** Guilloché: fine interlaced curves filling the plate behind its face, in
 *  the card's print colour (--bank-card-print; the neutral's step 8 unless
 *  set). Give it as a BankCard's `art`. */
export function Guilloche({ className }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 320 120" preserveAspectRatio="xMidYMid slice" className={cn('pointer-events-none absolute inset-0 size-full', className)}>
      <g fill="none" stroke="var(--bank-card-print, var(--neutral-8))" strokeWidth="0.4" opacity="0.55">
        <path d={ROSETTE} />
        <path d={ROSETTE_SMALL} />
        {WAVES.map((d, i) => (
          <path key={i} d={d} />
        ))}
      </g>
    </svg>
  )
}
