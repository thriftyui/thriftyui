'use client'

import { useEffect, useId, useImperativeHandle, useMemo, useRef, useState, type KeyboardEvent, type Ref } from 'react'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import { cn } from './cn.ts'
import { sameDay, startOfDay } from './date.ts'
import { focusAfterPress } from './input-modality.ts'

// The date grid of the W3C's Date Picker Dialog example, on its own so it
// can sit in a page too. The month's name is a polite live region; one day
// is the tab stop. Keys: arrows by day and week, Home and End the week's
// ends, Page Up and Down a month (with Shift, a year). Moving off the month
// shows the next. Days outside min and max can be reached, not chosen.
// Each day is named by its full date, so one reached from another month is
// not heard as a bare number.

const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n)
/** The same day `n` months on, or the month's last day if it has fewer. */
const addMonths = (d: Date, n: number) => {
  const last = new Date(d.getFullYear(), d.getMonth() + n + 1, 0).getDate()
  return new Date(d.getFullYear(), d.getMonth() + n, Math.min(d.getDate(), last))
}
const key = (d: Date) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`

/** What a Calendar takes: the chosen day and what to call when one is
 *  chosen, the month to show first, the first and last days that can be
 *  chosen, the week's first day, and the locale its names are in. */
export interface CalendarProps {
  value: Date | null
  onValueChange: (date: Date) => void
  /** The month shown to begin with: the value's, else today's. */
  defaultMonth?: Date
  min?: Date
  max?: Date
  /** 0 Sunday (the default) to 6 Saturday.
   *  @defaultValue `0` */
  weekStartsOn?: number
  locale?: string
  className?: string
  ref?: Ref<CalendarHandle>
}

/** What a Calendar's ref gives: a way to put focus on it. */
export interface CalendarHandle {
  /** Puts focus on the grid's tab stop: the chosen day, else today. */
  focus: () => void
}

/** A month of days to choose one from: the W3C's date grid, a tab stop on
 *  one day, arrows, Page Up and Down, and Home and End to move, Enter or
 *  Space to choose. Days outside `min` and `max` can be reached, not
 *  chosen. */
export function Calendar({ value, onValueChange, defaultMonth, min, max, weekStartsOn = 0, locale, className, ref }: CalendarProps) {
  const id = useId()
  // Today, read once as the calendar opens.
  const [today] = useState(() => startOfDay(new Date()))
  // The day the keyboard is on; the month shown is its month.
  const [focused, setFocused] = useState(() => startOfDay(value ?? defaultMonth ?? today))
  const grid = useRef<HTMLTableElement>(null)
  const moved = useRef(false)

  useImperativeHandle(ref, () => ({ focus: () => focusDay(grid.current) }), [])

  // A value set from outside brings its month into view: adjusted while
  // rendering.
  const valueTime = value?.getTime()
  const [seen, setSeen] = useState(valueTime)
  if (valueTime !== seen) {
    setSeen(valueTime)
    if (value) setFocused(startOfDay(value))
  }

  // After a key moves the day, focus follows it.
  useEffect(() => {
    if (!moved.current) return
    moved.current = false
    grid.current?.querySelector<HTMLElement>(`[data-day="${key(focused)}"]`)?.focus()
  }, [focused])

  const month = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(focused)
  const weekdays = useMemo(() => {
    // A week from a known Sunday (2023-01-01), turned to start on weekStartsOn.
    const sunday = new Date(2023, 0, 1)
    return Array.from({ length: 7 }, (_, i) => {
      const d = addDays(sunday, (i + weekStartsOn) % 7)
      return {
        short: new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(d).slice(0, 2),
        long: new Intl.DateTimeFormat(locale, { weekday: 'long' }).format(d),
      }
    })
  }, [locale, weekStartsOn])
  const label = (d: Date) => new Intl.DateTimeFormat(locale, { dateStyle: 'full' }).format(d)

  // The month's weeks: empty cells before the 1st and after the last day.
  const year = focused.getFullYear()
  const monthIndex = focused.getMonth()
  const weeks = useMemo(() => {
    const first = new Date(year, monthIndex, 1)
    const days = new Date(year, monthIndex + 1, 0).getDate()
    const lead = (first.getDay() - weekStartsOn + 7) % 7
    const cells: (Date | null)[] = [...Array<null>(lead).fill(null), ...Array.from({ length: days }, (_, i) => addDays(first, i))]
    while (cells.length % 7) cells.push(null)
    return Array.from({ length: cells.length / 7 }, (_, w) => cells.slice(w * 7, w * 7 + 7))
  }, [year, monthIndex, weekStartsOn])

  const out = (d: Date) => (min && d < startOfDay(min)) || (max && d > startOfDay(max))
  const choose = (d: Date) => {
    if (!out(d)) onValueChange(d)
  }
  const go = (d: Date) => {
    moved.current = true
    setFocused(d)
  }
  const show = (n: number) => setFocused((f) => addMonths(f, n))

  const onKeyDown = (e: KeyboardEvent<HTMLTableElement>) => {
    const f = focused
    const dow = (f.getDay() - weekStartsOn + 7) % 7
    if (e.key === 'ArrowRight') go(addDays(f, 1))
    else if (e.key === 'ArrowLeft') go(addDays(f, -1))
    else if (e.key === 'ArrowDown') go(addDays(f, 7))
    else if (e.key === 'ArrowUp') go(addDays(f, -7))
    else if (e.key === 'Home') go(addDays(f, -dow))
    else if (e.key === 'End') go(addDays(f, 6 - dow))
    else if (e.key === 'PageDown') go(addMonths(f, e.shiftKey ? 12 : 1))
    else if (e.key === 'PageUp') go(addMonths(f, e.shiftKey ? -12 : -1))
    else if (e.key === 'Enter' || e.key === ' ') choose(f)
    else return
    e.preventDefault()
  }

  const NAV = 'inline-flex size-8 items-center justify-center rounded-md text-neutral-11 transition-colors hover:text-neutral-12 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus [&_svg]:size-4'

  return (
    <div className={cn('flex w-fit flex-col gap-2', className)}>
      <div className="flex items-center gap-1">
        <button type="button" aria-label="Previous year" className={NAV} onClick={() => show(-12)}>
          <ChevronsLeft aria-hidden className="rtl:-scale-x-100" />
        </button>
        <button type="button" aria-label="Previous month" className={NAV} onClick={() => show(-1)}>
          <ChevronLeft aria-hidden className="rtl:-scale-x-100" />
        </button>
        <div id={`${id}-month`} aria-live="polite" className="flex-1 text-center text-sm font-medium text-neutral-12">
          {month}
        </div>
        <button type="button" aria-label="Next month" className={NAV} onClick={() => show(1)}>
          <ChevronRight aria-hidden className="rtl:-scale-x-100" />
        </button>
        <button type="button" aria-label="Next year" className={NAV} onClick={() => show(12)}>
          <ChevronsRight aria-hidden className="rtl:-scale-x-100" />
        </button>
      </div>
      <table ref={grid} role="grid" aria-labelledby={`${id}-month`} onKeyDown={onKeyDown} className="border-collapse text-sm">
        <thead>
          <tr>
            {weekdays.map((w) => (
              <th key={w.long} scope="col" abbr={w.long} className="size-9 text-xs font-normal text-neutral-11">
                {w.short}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {weeks.map((week, w) => (
            <tr key={w}>
              {week.map((d, i) =>
                d === null ? (
                  <td key={i} className="size-9" />
                ) : (
                  <td
                    key={i}
                    data-day={key(d)}
                    tabIndex={sameDay(d, focused) ? 0 : -1}
                    aria-selected={sameDay(d, value) || undefined}
                    aria-disabled={out(d) || undefined}
                    aria-label={label(d)}
                    onClick={() => {
                      setFocused(d)
                      choose(d)
                    }}
                    className={cn(
                      'size-9 cursor-default rounded-md text-center tabular-nums text-neutral-12 transition-colors select-none hover:text-accent-11 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus',
                      sameDay(d, today) && 'font-semibold',
                      sameDay(d, value) && 'bg-button-solid text-button-solid-text hover:bg-button-solid/90',
                      out(d) && 'text-neutral-8 hover:text-neutral-8',
                    )}
                  >
                    {d.getDate()}
                  </td>
                ),
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/** The grid's day that takes focus, focused as after the press that opened it. */
function focusDay(grid: HTMLElement | null) {
  const day = grid?.querySelector<HTMLElement>('[tabindex="0"]')
  if (day) focusAfterPress(day)
}
