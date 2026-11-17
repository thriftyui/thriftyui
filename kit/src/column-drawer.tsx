'use client'

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ComponentProps, type KeyboardEvent, type ReactNode } from 'react'
import * as Collapsible from 'radix-ui/collapsible'
import { PanelBottomOpen, X } from 'lucide-react'
import { CELL, CELL_ICON, WIDE_CELL } from './cell.ts'
import { useDrawerHost } from './drawer-host.ts'
import { cn } from './cn.ts'
import { focusAfterPress } from './input-modality.ts'

// A column's drawer: a part of the column that rises from its footer over
// the column's body (never the page's), opened by a button in the footer.
// Radix's Collapsible, on the W3C's Disclosure pattern: not a dialog, so the
// column and page stay usable while it is open. Escape inside it closes it
// and gives focus back to its button; in a column shown as a sheet, the
// first Escape closes the drawer and the next the sheet.
//
//   <Column side="left" aria-label="...">
//     <ColumnDrawer>
//       <ColumnHeader>...</ColumnHeader>
//       <ColumnContent>...</ColumnContent>
//       <ColumnDrawerContent aria-label="...">
//         ...its own header, with a ColumnDrawerClose, if it has one...
//       </ColumnDrawerContent>
//       <ColumnFooter><ColumnDrawerTrigger>...</ColumnDrawerTrigger></ColumnFooter>
//     </ColumnDrawer>
//   </Column>
//
// ColumnDrawer takes no room of its own (display: contents), so the
// column's header, content and footer stay its rows.

interface DrawerState {
  open: boolean
  close: () => void
  triggerRef: React.RefObject<HTMLButtonElement | null>
}

const Ctx = createContext<DrawerState | null>(null)

function useDrawer() {
  const c = useContext(Ctx)
  if (!c) throw new Error('A drawer\'s trigger, content and close must be inside its ColumnDrawer or DialogDrawer.')
  return c
}

/** A column's drawer, rising from the column's footer over its body:
 *  Radix's Collapsible Root, open by its own state or the app's (`open`,
 *  `defaultOpen`, `onOpenChange`). The column's header, content and footer
 *  go inside it, with its trigger in the footer. */
export function ColumnDrawer({
  children,
  open: given,
  defaultOpen = false,
  onOpenChange,
}: {
  children: ReactNode
  open?: boolean
  /** @defaultValue `false` */
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
}) {
  const [own, setOwn] = useState(defaultOpen)
  const open = given ?? own
  const setOpen = useCallback(
    (o: boolean) => {
      setOwn(o)
      onOpenChange?.(o)
    },
    [onOpenChange],
  )
  const triggerRef = useRef<HTMLButtonElement | null>(null)
  const close = useCallback(() => {
    setOpen(false)
    if (triggerRef.current) focusAfterPress(triggerRef.current)
  }, [setOpen])
  // Tell the column how to close this drawer while it is open, so its sheet
  // can give Escape to the drawer first.
  const register = useDrawerHost()
  useEffect(() => {
    if (!register) return
    register(
      open
        ? () => {
            close()
            return true
          }
        : null,
    )
    return () => register(null)
  }, [register, open, close])
  return (
    <Ctx.Provider value={{ open, close, triggerRef }}>
      <Collapsible.Root open={open} onOpenChange={setOpen} className="contents">
        {children}
      </Collapsible.Root>
    </Ctx.Provider>
  )
}

/** The drawer's button, filling its footer: one control the footer's
 *  width, its icon and words edged when the footer wears a pattern. */
export function ColumnDrawerTrigger({
  icon,
  className,
  children,
  ...props
}: ComponentProps<'button'> & {
  /** The icon before its words, hidden from a screen reader; the kit's
   *  drawer icon, a box opening at its foot, unless given. */
  icon?: ReactNode
}) {
  const { triggerRef } = useDrawer()
  return (
    <Collapsible.Trigger ref={triggerRef} className={cn(WIDE_CELL, className)} {...props}>
      <span className="pattern-text flex items-center gap-2">
        {icon ?? <PanelBottomOpen aria-hidden className={CELL_ICON} strokeWidth={1.75} />}
        {children}
      </span>
    </Collapsible.Trigger>
  )
}

/** How tall the drawer rises from the column's footer: `rows={n}` for n
 *  rows (a bar more with `header`), or `size` "half" (the default) or
 *  "full", up to the column's header. `rows` wins; never taller than full. */
// --drawer-inset-bottom: room under the footer the drawer keeps clear of,
// 0 unless what holds it sets it (a dialog on a phone, over the home
// indicator).
const SIZES = {
  half: 'h-1/2',
  full: 'h-[calc(100%-var(--header-height)-var(--footer-height)-env(safe-area-inset-top)-var(--drawer-inset-bottom,0px))]',
} as const
const FULL = 'calc(100% - var(--header-height) - var(--footer-height) - env(safe-area-inset-top) - var(--drawer-inset-bottom, 0px))'

/** What the drawer holds: Radix's Collapsible Content, rising over the
 *  column's body. Sized by `rows` or `size`; named by `aria-label`, it is a
 *  region. */
export function ColumnDrawerContent({
  rows,
  header = false,
  size = 'half',
  className,
  style,
  onKeyDown,
  'aria-label': label,
  ...props
}: ComponentProps<'div'> & {
  rows?: number
  /** @defaultValue `false` */
  header?: boolean
  /** @defaultValue `'half'` */
  size?: keyof typeof SIZES
}) {
  const { close } = useDrawer()
  return (
    <Collapsible.Content
      // Named, it is a region a screen reader can find.
      {...(label ? { role: 'region', 'aria-label': label } : {})}
      onKeyDown={(e: KeyboardEvent<HTMLDivElement>) => {
        onKeyDown?.(e)
        if (e.key === 'Escape' && !e.defaultPrevented) {
          e.preventDefault()
          close()
        }
      }}
      className={cn(
        'absolute inset-x-0 bottom-[calc(var(--footer-height)+var(--drawer-inset-bottom,0px))] z-30 flex flex-col overflow-y-auto border-t border-column-line bg-column-bar data-[state=closed]:motion-safe:animate-sink data-[state=open]:motion-safe:animate-rise',
        rows === undefined && SIZES[size],
        className,
      )}
      style={
        rows === undefined
          ? style
          : { height: `calc(${header ? 'var(--header-height) + ' : ''}${rows} * var(--row-height))`, maxHeight: FULL, ...style }
      }
      {...props}
    />
  )
}

/** Closes the drawer from inside it (its own header, say), focus going
 *  back to its button. */
export function ColumnDrawerClose({ className, ...props }: ComponentProps<'button'>) {
  const { close } = useDrawer()
  return (
    <button type="button" aria-label="Close the drawer" onClick={close} className={cn(CELL, className)} {...props}>
      <X aria-hidden className={CELL_ICON} strokeWidth={1.75} />
    </button>
  )
}
