'use client'

import { ChevronLeft } from 'lucide-react'
import * as Slot from 'radix-ui/slot'
import { CELL, CELL_ICON, ROW } from './cell.ts'
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ComponentProps, type ReactNode } from 'react'
import { cn } from './cn.ts'
import { pressedByPointer } from './input-modality.ts'

// A list first; picking an item shows its detail in the list's place,
// with Back to return -- Material's list-detail layout as it is on a narrow
// screen. Not tabs: one thing shows at a time, and there is no tab list.
//
// ListDetail holds which item is open; ListDetailList and ListDetailItem are
// the list; ListDetailContent is one item's detail; ListDetailBack returns
// (drawn only while a detail shows); ListDetailTitle names what shows.
//
// Focus moves into Back when a detail opens and back to its item when the
// list returns. After a pointer press it moves with `focusVisible: false`,
// as Chrome would otherwise ring focus given by script; a click's
// event.detail is 0 when Enter or Space pressed it.
//
// The app may hold which item is open (`value`, `onValueChange`), so a
// detail can lead to another; the list may be any element (`asChild`), so a
// whole home view hides while a detail shows; and an item may be a whole
// row (`label` its name for the title, the children anything).

interface State {
  open: { value: string; label: string } | null
  /** Keeps an item's name, for the title of a detail the app opens. */
  name: (value: string, label: string) => void
  choose: (value: string, label: string, byPointer: boolean) => void
  back: (byPointer: boolean) => void
  backRef: React.RefObject<HTMLButtonElement | null>
  itemRefs: React.RefObject<Map<string, HTMLButtonElement>>
  contentRef: React.RefObject<HTMLDivElement | null>
}

const Ctx = createContext<State | null>(null)

function useListDetail() {
  const c = useContext(Ctx)
  if (!c) throw new Error('ListDetail parts must be inside ListDetail.')
  return c
}

/** A list first; picking an item shows its detail in the list's place, with
 *  Back to return. Holds which item is open, its own or the app's (`value`,
 *  null at the list, and `onValueChange`), and moves focus into the detail
 *  and back to its item. */
export function ListDetail({
  children,
  value: given,
  onValueChange,
}: {
  children: ReactNode
  /** The open item's value, or null at the list, for an app that holds it. */
  value?: string | null
  onValueChange?: (value: string | null) => void
}) {
  const [own, setOwn] = useState<string | null>(null)
  const held = given !== undefined
  const value = held ? given : own
  // Each item's name, kept after the list has gone, for the title of a
  // detail the app opens.
  const [labels, setLabels] = useState<Record<string, string>>({})
  const name = useCallback((v: string, label: string) => setLabels((m) => (m[v] === label ? m : { ...m, [v]: label })), [])
  const open = value === null ? null : { value, label: labels[value] ?? value }
  const last = useRef<string | null>(null)
  const backRef = useRef<HTMLButtonElement | null>(null)
  const contentRef = useRef<HTMLDivElement | null>(null)
  const itemRefs = useRef(new Map<string, HTMLButtonElement>())
  const moved = useRef(false)
  const byPointer = useRef(false)
  // After the list or a detail has been drawn, move focus to match (not on
  // the first draw: opening the dialog places focus itself). A change the
  // app made, not a press of an item or Back, moves it too, its ring shown
  // as the last thing done says.
  const seen = useRef(value)
  useEffect(() => {
    if (seen.current === value) return
    seen.current = value
    if (!moved.current) byPointer.current = pressedByPointer()
    moved.current = false
    if (value !== null) last.current = value
    const how = { focusVisible: !byPointer.current }
    if (value !== null) (backRef.current ?? contentRef.current)?.focus(how)
    else if (last.current) itemRefs.current.get(last.current)?.focus(how)
  }, [value])
  const set = (v: string | null) => {
    if (!held) setOwn(v)
    onValueChange?.(v)
  }
  const choose = (v: string, label: string, pointer: boolean) => {
    moved.current = true
    byPointer.current = pointer
    name(v, label)
    set(v)
  }
  const back = (pointer: boolean) => {
    moved.current = true
    byPointer.current = pointer
    set(null)
  }
  return <Ctx.Provider value={{ open, name, choose, back, backRef, itemRefs, contentRef }}>{children}</Ctx.Provider>
}

/** The list, drawn only while no detail shows. `asChild` puts that on the
 *  element given instead -- a whole home view, say, holding lists of its
 *  own. */
export function ListDetailList({ className, asChild = false, ...props }: ComponentProps<'ul'> & {
  /** @defaultValue `false` */
  asChild?: boolean
}) {
  const { open } = useListDetail()
  if (open) return null
  if (asChild) return <Slot.Root className={className} {...props} />
  return <ul className={cn('flex flex-col', className)} {...props} />
}

/** One item of the list. `summary` is its current setting, shown after
 *  its name and read with it ("Plan and billing Yearly"). With `label`, the
 *  children are the whole row and `label` names it for the detail's title. */
export function ListDetailItem({
  value,
  summary,
  label,
  children,
  className,
}: {
  value: string
  summary?: string
  label?: string
  children: ReactNode
  className?: string
}) {
  const { choose, itemRefs, name: keepName } = useListDetail()
  const name = label ?? (typeof children === 'string' ? children : value)
  useEffect(() => keepName(value, name), [keepName, value, name])
  if (label) {
    return (
      <li>
        <button
          type="button"
          ref={(el) => {
            if (el) itemRefs.current.set(value, el)
            else itemRefs.current.delete(value)
          }}
          onClick={(e) => choose(value, name, e.detail > 0)}
          className={cn(ROW, className)}
        >
          {children}
        </button>
      </li>
    )
  }
  return (
    <li>
      <button
        type="button"
        ref={(el) => {
          if (el) itemRefs.current.set(value, el)
          else itemRefs.current.delete(value)
        }}
        onClick={(e) => choose(value, name, e.detail > 0)}
        // The kit's row (cell.ts), its name at the left and the
        // arrow at the right.
        className={cn(ROW, 'justify-between', className)}
      >
        {/* The name never shrinks; the summary is what is cut short
            ("Pro..." beside an email). Names are short. */}
        <span className="shrink-0">{children}</span>
        {/* A space, so the name reads "Plan and billing Yearly", not run
            together; the flex row draws none. */}
        {summary && ' '}
        {summary && <span className="ms-auto min-w-0 truncate text-neutral-11">{summary}</span>}
        <svg aria-hidden viewBox="0 0 16 16" className="size-4 shrink-0 text-neutral-11 rtl:-scale-x-100" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M6 3l5 5-5 5" />
        </svg>
      </button>
    </li>
  )
}

/** One item's detail, shown while its `value` is open. */
export function ListDetailContent({ value, className, ...props }: ComponentProps<'div'> & { value: string }) {
  const { open, contentRef } = useListDetail()
  if (open?.value !== value) return null
  return <div ref={contentRef} tabIndex={-1} className={cn('focus-visible:outline-hidden', className)} {...props} />
}

/** The button back to the list, "Back to the list" to a screen reader:
 *  drawn only while a detail shows. */
export function ListDetailBack({ className, ...props }: ComponentProps<'button'>) {
  const { open, back, backRef } = useListDetail()
  if (!open) return null
  return (
    <button
      type="button"
      ref={backRef}
      onClick={(e) => back(e.detail > 0)}
      aria-label="Back to the list"
      className={cn(CELL, className)}
      {...props}
    >
      <ChevronLeft aria-hidden className={cn(CELL_ICON, 'rtl:-scale-x-100')} strokeWidth={1.75} />
    </button>
  )
}

/** The name of what shows: the open item's, or at the list, its children. */
export function ListDetailTitle({ children, className, ...props }: ComponentProps<'span'>) {
  const { open } = useListDetail()
  return (
        // Edged words when the bar wears a pattern, with room above and below
        // for the edge, which truncate's overflow would cut.
    <span aria-live="polite" className={cn('min-w-0 flex-1 self-center truncate py-1 text-sm font-medium', className)} {...props}>
      <span className="pattern-text">{open ? open.label : children}</span>
    </span>
  )
}
