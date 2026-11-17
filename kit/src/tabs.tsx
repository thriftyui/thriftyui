'use client'

import { createContext, useContext, useState, type ComponentProps, type ReactNode } from 'react'
import * as Direction from 'radix-ui/direction'
import * as TabsPrimitive from 'radix-ui/tabs'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { CELL, CELL_ICON } from './cell.ts'
import { cn } from './cn.ts'
import { Steady } from './steady.tsx'

// Radix's Tabs under flat part names (Tabs, TabsList, TabsTrigger,
// TabsContent), and parts Radix does not have: TabsPrevious and TabsNext,
// named for where they go ("Next: Second") and disabled at the ends;
// TabsCurrent, the name of the tab showing, a polite live region; and
// TabsSlides and TabsSlide, bodies that slide into place. They step through
// `items` (the tabs' values in order, and their names), so a tab can be
// reached with no tab list at all.

type Item = { value: string; label: string }

interface TabsState {
  value: string
  setValue: (v: string) => void
  items: Item[]
}

const TabsContext = createContext<TabsState | null>(null)

/** The tabs: Radix's Tabs Root in the kit's look. Takes Radix's props,
 *  and `items` for TabsPrevious, TabsNext and TabsCurrent. */
export function Tabs({
  items = [],
  value: given,
  defaultValue,
  onValueChange,
  ...props
}: ComponentProps<typeof TabsPrimitive.Root> & {
  /** @defaultValue `[]` */
  items?: Item[]
}) {
  const [own, setOwn] = useState(defaultValue ?? items[0]?.value ?? '')
  const value = given ?? own
  const setValue = (v: string) => {
    setOwn(v)
    onValueChange?.(v)
  }
  return (
    <TabsContext.Provider value={{ value, setValue, items }}>
      <TabsPrimitive.Root value={value} onValueChange={setValue} {...props} />
    </TabsContext.Provider>
  )
}

/** The row of tabs: Radix's Tabs List. */
export const TabsList = TabsPrimitive.List
/** One tab's body: Radix's Tabs Content. */
export const TabsContent = TabsPrimitive.Content

/** One tab: Radix's Trigger, the chosen one semibold. Plain words keep
 *  their bold width from the start (Steady), so choosing a tab moves none
 *  beside it. A mouse press leaves no focus ring and does not scroll the
 *  page; the keyboard keeps its ring. */
export function TabsTrigger({ value, disabled, onMouseDown, asChild, children, ...props }: ComponentProps<typeof TabsPrimitive.Trigger>) {
  const tabs = useContext(TabsContext)
  return (
    <TabsPrimitive.Trigger
      value={value}
      disabled={disabled}
      asChild={asChild}
      onMouseDown={(e) => {
        onMouseDown?.(e)
        if (e.defaultPrevented || !tabs || disabled || e.button !== 0 || e.ctrlKey) return
        e.preventDefault()
        e.currentTarget.focus({ focusVisible: false, preventScroll: true })
        tabs.setValue(value)
      }}
      {...props}
    >
      {typeof children === 'string' && !asChild ? <Steady>{children}</Steady> : children}
    </TabsPrimitive.Trigger>
  )
}

function useTabs() {
  const t = useContext(TabsContext)
  if (!t) throw new Error('TabsPrevious, TabsNext and TabsCurrent must be inside Tabs.')
  return t
}

function Step({ by, className, ...props }: ComponentProps<'button'> & { by: -1 | 1 }) {
  const { value, setValue, items } = useTabs()
  const at = items.findIndex((i) => i.value === value)
  const to = items[at + by]
  return (
    <button
      type="button"
      disabled={!to}
      aria-label={to ? `${by < 0 ? 'Previous' : 'Next'}: ${to.label}` : by < 0 ? 'Previous' : 'Next'}
      onClick={() => to && setValue(to.value)}
      className={cn(CELL, className)}
      {...props}
    >
      {by < 0 ? <ChevronLeft aria-hidden className={cn(CELL_ICON, 'rtl:-scale-x-100')} strokeWidth={1.75} /> : <ChevronRight aria-hidden className={cn(CELL_ICON, 'rtl:-scale-x-100')} strokeWidth={1.75} />}
    </button>
  )
}

/** A button to the tab before, through the tabs' `items`, named for where
 *  it goes ("Previous: First"); disabled at the first. */
export function TabsPrevious(props: ComponentProps<'button'>) {
  return <Step by={-1} {...props} />
}

/** A button to the next tab, through the tabs' `items`, named for where it
 *  goes ("Next: Second"); disabled at the last. */
export function TabsNext(props: ComponentProps<'button'>) {
  return <Step by={1} {...props} />
}

/** The name of the tab showing, announced when it changes. */
export function TabsCurrent({ className, ...props }: ComponentProps<'span'>) {
  const { value, items } = useTabs()
  return (
    <span aria-live="polite" aria-atomic="true" className={cn('min-w-0 flex-1 self-center truncate text-center text-sm font-medium', className)} {...props}>
      {items.find((i) => i.value === value)?.label}
    </span>
  )
}

/** The bodies in a strip that slides to the one showing: side by side
 *  (horizontal, the default) or stacked (vertical). The strip moves by a
 *  transform, 300ms; with reduced motion it moves at once. Holds
 *  TabsSlide parts in the order of Tabs' `items`. */
export function TabsSlides({
  orientation = 'horizontal',
  className,
  children,
}: {
  /** @defaultValue `'horizontal'` */
  orientation?: 'horizontal' | 'vertical'
  className?: string
  children: ReactNode
}) {
  const { value, items } = useTabs()
  const at = Math.max(0, items.findIndex((i) => i.value === value))
    // In a right-to-left page the strip runs from the right, so it moves the
    // other way; the direction is Radix's, as its own parts read it.
  const sign = Direction.useDirection() === 'rtl' ? 1 : -1
  return (
    <div className={cn('relative min-h-0 flex-1 overflow-hidden', className)}>
      <div
        data-orientation={orientation}
        className={cn(
          'flex size-full transition-transform duration-300 ease-out motion-reduce:transition-none',
          orientation === 'vertical' ? 'flex-col' : 'flex-row',
        )}
        style={{ transform: orientation === 'vertical' ? `translateY(-${at * 100}%)` : `translateX(${sign * at * 100}%)` }}
      >
        {children}
      </div>
    </div>
  )
}

/** One body in TabsSlides: kept on the page (`forceMount`) so it can sit
 *  in the strip, and `inert` while not showing, so the keyboard and screen
 *  readers stay in the one that is. */
export function TabsSlide({ value, className, ...props }: ComponentProps<typeof TabsPrimitive.Content>) {
  const { value: showing } = useTabs()
  return (
    <TabsPrimitive.Content
      forceMount
      value={value}
      inert={value !== showing || undefined}
      className={cn('size-full shrink-0 overflow-y-auto', className)}
      {...props}
    />
  )
}
