'use client'

import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react'
import * as RadioGroup from 'radix-ui/radio-group'
import { ROW } from './cell.ts'
import { cn } from './cn.ts'

// Radix's Radio Group underneath, vertical and not looping, as a wheel
// stops at its ends. Its look is CSS scroll snap, mandatory (every row is
// one row high); turned by hand it chooses on scrollend, or after 150ms
// still where a browser lacks it (Safari before 26.2). The chosen row's
// text is neutral 12, medium: step 11 on the band falls under 4.5:1 with
// some neutrals.

/** How long a turn by hand must be still before it chooses, in ms, where
 *  the browser has no scrollend. */
const STILL = 150

/** An option of a Wheel: its value, its label, a quieter detail at the
 *  row's end, something at its start (a colour, an icon), and whether it is
 *  disabled. */
export interface WheelOption {
  value: string
  label: string
  /** At the row's end, quieter: what the option is set to, say. */
  detail?: string
  /** At the row's start: a colour, an icon. */
  start?: ReactNode
  /** Not for this choice: dimmed, passed over, kept in its place. */
  disabled?: boolean
}

/** A picker wheel: one option chosen by turning a column of them, the
 *  chosen one in a band across the middle, `rows` showing (five). Radix's
 *  Radio Group underneath, so it is one tab stop, Up and Down moving and
 *  choosing; named by `label`. */
export function Wheel({
  label,
  options,
  value,
  onValueChange,
  rows = 5,
  disabled = false,
  className,
}: {
  /** Names the wheel. */
  label: string
  options: WheelOption[]
  value: string
  onValueChange: (value: string) => void
  /** How many rows show, the chosen one in the middle -- just above it
   *  when the count is even.
   *  @defaultValue `5` */
  rows?: number
  /** Out of use: dimmed, not turned, pressed or focused.
   *  @defaultValue `false` */
  disabled?: boolean
  className?: string
}) {
  const box = useRef<HTMLDivElement>(null)
  const index = options.findIndex((o) => o.value === value)
  // The latest options, value and handler, for the scroll listener set up
  // once.
  const latest = useRef({ options, value, onValueChange, disabled })
  useEffect(() => {
    latest.current = { options, value, onValueChange, disabled }
  })

  // Turn to the chosen row; nothing when a turn by hand already put it
  // there.
  const turned = useRef(false)
  useEffect(() => {
    const el = box.current
    const row = el?.querySelector<HTMLElement>('[role=radio]')
    if (!el || !row || index < 0) return
    const top = index * row.offsetHeight
    const still = !turned.current || window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (Math.abs(el.scrollTop - top) > 1) el.scrollTo({ top, behavior: still ? 'auto' : 'smooth' })
    turned.current = true
  }, [index])

  // Choose the row a turn comes to rest on.
  useEffect(() => {
    const el = box.current
    if (!el) return
    const settle = () => {
      const row = el.querySelector<HTMLElement>('[role=radio]')
      const { options, value, onValueChange, disabled } = latest.current
      if (disabled || !row || options.length === 0) return
      const i = Math.min(options.length - 1, Math.max(0, Math.round(el.scrollTop / row.offsetHeight)))
      if (options[i].value !== value && !options[i].disabled) onValueChange(options[i].value)
    }
    if ('onscrollend' in window) {
      el.addEventListener('scrollend', settle)
      return () => el.removeEventListener('scrollend', settle)
    }
    let timer = 0
    const onScroll = () => {
      window.clearTimeout(timer)
      timer = window.setTimeout(settle, STILL)
    }
    el.addEventListener('scroll', onScroll)
    return () => {
      window.clearTimeout(timer)
      el.removeEventListener('scroll', onScroll)
    }
  }, [])

  return (
    <div
      className={cn('relative h-[calc(var(--wheel-rows)*var(--row-height))] shrink-0', className)}
      // The rows above the chosen one: half of the rest, the fewer when
      // they do not halve.
      style={{ '--wheel-rows': rows, '--wheel-above': Math.floor((rows - 1) / 2) } as CSSProperties}
    >
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-[calc(var(--wheel-above)*var(--row-height))] h-(--row-height) rounded-md bg-chosen" />
      <RadioGroup.Root
        ref={box}
        orientation="vertical"
        loop={false}
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        aria-label={label}
        className={cn(
          'relative h-full mask-y-from-60% snap-y snap-mandatory overflow-y-auto overscroll-contain pt-[calc(var(--wheel-above)*var(--row-height))] pb-[calc((var(--wheel-rows)-1-var(--wheel-above))*var(--row-height))] scroll-pt-[calc(var(--wheel-above)*var(--row-height))] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
          disabled && 'pointer-events-none overflow-hidden opacity-30',
        )}
      >
        {options.map((o) => (
          <RadioGroup.Item
            key={o.value}
            value={o.value}
            disabled={o.disabled}
            // A disabled row is no place to rest, so a turn passes it.
            className={cn(ROW, 'group rounded-md data-[disabled]:opacity-40 data-[state=checked]:font-medium data-[state=checked]:text-neutral-12', !o.disabled && 'snap-start')}
          >
            {o.start}
            <span className="min-w-0 flex-1 truncate">{o.label}</span>
            {o.detail && <span className="text-xs font-normal text-neutral-11 group-data-[state=checked]:text-neutral-12">{o.detail}</span>}
          </RadioGroup.Item>
        ))}
      </RadioGroup.Root>
    </div>
  )
}
