'use client'

import { createContext, useCallback, useContext, useEffect, useId, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore, type ComponentProps, type KeyboardEvent, type PointerEvent, type ReactNode } from 'react'
import * as Dialog from 'radix-ui/dialog'
import * as Slot from 'radix-ui/slot'
import { RemoveScroll } from 'react-remove-scroll'
import * as Toolbar from 'radix-ui/toolbar'
import * as VisuallyHidden from 'radix-ui/visually-hidden'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './tooltip.tsx'
import { ArrowLeftFromLine, ArrowLeftRight, ArrowRightFromLine, Columns2, EyeOff, Menu, PanelLeftClose, PanelRight, PanelRightClose, RotateCw, X, type LucideIcon } from 'lucide-react'
import { BAR, CELL, CELL_ICON, CELL_LABEL, LABEL_CELL } from './cell.ts'
import type { Ref } from 'react'
import { useMediaQuery, WIDE } from './use-media-query.ts'
import { DrawerHost } from './drawer-host.ts'
import { useSheetDrag } from './sheet-drag.ts'
import { cn } from './cn.ts'
import { focusAfterPress, openQuietly } from './input-modality.ts'
import { usePortalContainer } from './portal-container.tsx'

// A column on the page's left or right: a header, its content, a footer.
//
// From Tailwind's lg breakpoint up (1024px) it sits beside the page, an
// aside -- a complementary landmark, named by `aria-label` as there may be
// two. Its edge facing the page is a splitter on the W3C's Window Splitter
// pattern: dragged, or Left and Right (16px, Shift 64px), Home and End,
// Enter to collapse and restore. 256px to start, 224 to 480, never leaving
// the page under 400px; 224 so a column holds Google's 198px sign-in button
// with room either side.
//
// Below it the column opens as a sheet over the page: a left column from
// the left, `sheet="bottom"` up to just under the page's header. Radix's
// Dialog, not modal, so the bottom bar stays usable: no overlay; Escape or a
// press on the page closes it; one sheet at a time. Named by the column's
// label, focus going back to its ColumnTrigger as it closes. The sheets and
// the bar keep clear of a phone's notch and home indicator (safe-area
// insets).
//
// Or, on a wide window, over the page (`placement="floating"`): the column
// lies on the page between its header and footer, its width kept, moved by
// dragging either edge or by ColumnToolbar, the keyboard's way to the same
// places.

type Side = 'left' | 'right'
/** Where wide-window columns sit: docked, taking their own room beside the
 *  page, or floating over it, moved by dragging or by ColumnToolbar. */
export type Placement = 'docked' | 'floating'

/** A column's width to start, its narrowest and widest, and the least the
 *  page keeps (the page's own min-width, page.tsx). */
const START = 256
const MIN = 224
const MAX = 480

/** The width at which even columns kept docked open as sheets: 320 CSS pixels, WCAG's Reflow width. */
const REFLOW = '(width > 20rem)'

/** The narrowest and widest a docked column may be dragged, in px. */
export const COLUMN_MIN_WIDTH = MIN
/** The widest a docked column may be dragged, in px; never so wide that the
 *  page between drops below 400px. */
export const COLUMN_MAX_WIDTH = MAX
const PAGE_MIN = 400

/** A width limit given for both sides or per side, as one per side. */
function sided(given: number | Partial<Record<Side, number>>, fallback: number): Record<Side, number> {
  return typeof given === 'number' ? { left: given, right: given } : { left: given.left ?? fallback, right: given.right ?? fallback }
}
/** Over the page, how much of a column always stays on screen. */
const KEEP = 12

interface Columns {
  wide: boolean
  /** Whether the window's width is known: false while the page is drawn on
   *  a server and while that HTML is hydrated, when `wide` is not yet the
   *  window's. */
  known: boolean
  /** Where sheets are drawn (ColumnProvider). */
  container: HTMLElement | null
  open: Record<Side, boolean>
  setOpen: (side: Side, open: boolean) => void
  /** Each trigger adds itself (and the returned function takes it away), and
   *  says when it is pressed, so a closing sheet gives focus back to the
   *  one pressed, or else to one still there. */
  addTrigger: (side: Side, el: HTMLButtonElement) => () => void
  pressTrigger: (side: Side, el: HTMLButtonElement) => void
  focusTrigger: (side: Side) => void
  /** Whether a trigger for each side is on the page, which can show a
   *  collapsed column again without its splitter (ColumnSplitter). */
  triggered: Record<Side, boolean>
  /** Beside the page: each column's width, and whether it is collapsed. */
  widths: Record<Side, number>
  collapsed: Record<Side, boolean>
  setWidth: (side: Side, width: number) => void
  setCollapsed: (side: Side, collapsed: boolean) => void
  /** Over the page: how far each column is moved from its own edge, in
   *  pixels (rightward positive), and whether it is hidden off that edge. */
  placement: Placement
  offsets: Record<Side, number>
  setOffsets: (o: Partial<Record<Side, number>>) => void
  hidden: Record<Side, boolean>
  setHidden: (h: Partial<Record<Side, boolean>>) => void
  /** Each column's id on a wide window, for its triggers' aria-controls. */
  columnId: (side: Side) => string
  /** The narrowest and widest a docked column may be dragged. */
  minWidth: Record<Side, number>
  maxWidth: Record<Side, number>
}

const ColumnsContext = createContext<Columns | null>(null)

const noChange = () => () => {}

/** Whether the window can be asked about yet: false on a server and while
 *  hydrating (when React uses useSyncExternalStore's server snapshot), true
 *  after, and from the first render in an app drawn in the browser alone. */
const useKnown = () =>
  useSyncExternalStore(
    noChange,
    () => true,
    () => false,
  )

function useColumns() {
  const c = useContext(ColumnsContext)
  if (!c) throw new Error('A Column or ColumnTrigger must be inside a ColumnProvider.')
  return c
}

/** Holds whether the window is wide, which column's sheet is open when it
 *  is not, the columns' widths beside the page, and their places over it.
 *  Wraps the Layout. */
/** `closeOn`: when it changes (the page's address, say), any open sheet
 *  closes, so following a link shows the page. `defaultHidden`: sides whose
 *  columns start hidden on a wide window, for a column opened when wanted;
 *  a trigger with `always` shows them. `defaultWidth`, `minWidth`,
 *  `maxWidth`: in px, one number for both columns or one per side ({ left:
 *  256 }); 256, 224 and 480 unless given, smaller where the columns sit in a
 *  box narrower than a window. `defaultAlign`: where floating columns start,
 *  at their own edges or side by side in the middle. `narrow`: below the
 *  breakpoint, sheets, or the columns kept beside the page down to 320px --
 *  for a desktop app whose window is made narrow on purpose. */
export function ColumnProvider({
  children,
  placement = 'docked',
  closeOn,
  defaultWidth = START,
  defaultHidden = [],
  minWidth = MIN,
  maxWidth = MAX,
  defaultAlign = 'edges',
  narrow = 'sheets',
  container,
}: {
  children: ReactNode
    /** Where a narrow window's sheets are drawn: the page's body unless
     *  given. To keep a fixed sheet inside the element given, that element
     *  needs a transform (an example's frame on a page, say). */
  container?: HTMLElement | null
  /** @defaultValue `'docked'` */
  placement?: Placement
  closeOn?: unknown
  /** @defaultValue `START` */
  defaultWidth?: number | Partial<Record<Side, number>>
  /** @defaultValue `[]` */
  defaultHidden?: Side[]
  /** @defaultValue `MIN` */
  minWidth?: number | Partial<Record<Side, number>>
  /** @defaultValue `MAX` */
  maxWidth?: number | Partial<Record<Side, number>>
  /** @defaultValue `'edges'` */
  defaultAlign?: 'edges' | 'center'
  /** @defaultValue `'sheets'` */
  narrow?: 'sheets' | 'docked'
}) {
  // Kept by their numbers, so limits given as a new object each render
  // change nothing.
  const { left: minLeft, right: minRight } = sided(minWidth, MIN)
  const { left: maxLeft, right: maxRight } = sided(maxWidth, MAX)
  const mins = useMemo(() => ({ left: minLeft, right: minRight }), [minLeft, minRight])
  const maxes = useMemo(() => ({ left: maxLeft, right: maxRight }), [maxLeft, maxRight])
  // Kept docked, the columns are drawn as on a wide window down to 320px, where they open as sheets
  // after all, so the page still reflows there (WCAG 2.2, 1.4.10 Reflow).
  const docked = narrow === 'docked'
  const roomy = useMediaQuery(REFLOW)
  const wide = useMediaQuery(WIDE) || (docked && roomy)
  const known = useKnown() || docked
  // The app's own element for the sheets, else the shared one
  // (portal-container.tsx), else the body.
  const shared = usePortalContainer()
  const sheetsIn = container ?? shared ?? null
  const base = useId()
  const columnId = useCallback((side: Side) => `${base}column-${side}`, [base])
  const [open, setOpenState] = useState<Record<Side, boolean>>({ left: false, right: false })
  const triggers = useRef<Record<Side, Set<HTMLButtonElement>>>({ left: new Set(), right: new Set() })
  const pressed = useRef<Record<Side, HTMLButtonElement | null>>({ left: null, right: null })
  // On a narrow window one sheet at a time: opening one closes the other.
  const setOpen = useCallback(
    (side: Side, o: boolean) => setOpenState((s) => (o && !wide ? { left: false, right: false, [side]: true } : { ...s, [side]: o })),
    [wide],
  )
  const [triggered, setTriggered] = useState<Record<Side, boolean>>({ left: false, right: false })
  const addTrigger = useCallback((side: Side, el: HTMLButtonElement) => {
    triggers.current[side].add(el)
    setTriggered((t) => (t[side] ? t : { ...t, [side]: true }))
    return () => {
      triggers.current[side].delete(el)
      // A trigger's ref callback is removed and added again on each of its
      // renders (ColumnTrigger), so "none left" is decided after that has
      // run, not between.
      queueMicrotask(() => {
        if (triggers.current[side].size === 0) setTriggered((t) => (t[side] ? { ...t, [side]: false } : t))
      })
    }
  }, [])
  const pressTrigger = useCallback((side: Side, el: HTMLButtonElement) => {
    pressed.current[side] = el
  }, [])
    // The pressed one is kept through re-renders (a ref callback's cleanup
    // runs on each), and passed over only once it has left the page.
  const focusTrigger = useCallback((side: Side) => {
    const p = pressed.current[side]
    const el = p?.isConnected ? p : [...triggers.current[side]].find((t) => t.isConnected)
    if (el) focusAfterPress(el)
  }, [])
  // Kept here, not in the column, so a column switched off and on again
  // comes back at the width it had.
  const [widths, setWidths] = useState<Record<Side, number>>(() => {
    const starts = sided(defaultWidth, START)
    const fit = (side: Side) => Math.min(maxes[side], Math.max(mins[side], starts[side]))
    return { left: fit('left'), right: fit('right') }
  })
  const [collapsed, setCollapsedState] = useState<Record<Side, boolean>>(() => ({
    left: defaultHidden.includes('left'),
    right: defaultHidden.includes('right'),
  }))
  const setWidth = useCallback((side: Side, w: number) => {
    setWidths((s) => ({ ...s, [side]: w }))
    setCollapsedState((s) => ({ ...s, [side]: false }))
  }, [])
  const setCollapsed = useCallback((side: Side, c: boolean) => setCollapsedState((s) => ({ ...s, [side]: c })), [])
  const [offsets, setOffsetsState] = useState<Record<Side, number>>({ left: 0, right: 0 })
  const [hidden, setHiddenState] = useState<Record<Side, boolean>>(() => ({
    left: defaultHidden.includes('left'),
    right: defaultHidden.includes('right'),
  }))
  const setOffsets = useCallback((o: Partial<Record<Side, number>>) => setOffsetsState((s) => ({ ...s, ...o })), [])
  // Centred to start: measured once the columns are drawn (a parent's
  // layout effect runs after its children's), in the Layout they float in,
  // with ColumnToolbar's Center sums; before the first paint, so they do
  // not move from the edges where they are drawn first.
  useLayoutEffect(() => {
    if (placement !== 'floating' || defaultAlign !== 'center' || !wide) return
    const left = document.getElementById(columnId('left'))
    const right = document.getElementById(columnId('right'))
    const vw = (left ?? right)?.parentElement?.getBoundingClientRect().width
    if (vw === undefined) return
    const wl = left ? widths.left : 0
    const wr = right ? widths.right : 0
    const start = (vw - wl - wr) / 2
    setOffsetsState({ left: Math.round(start), right: Math.round(start + wl - (vw - wr)) })
    // When the columns show on a wide window: at first, and when the window
    // turns wide again.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wide])
  const setHidden = useCallback((h: Partial<Record<Side, boolean>>) => setHiddenState((s) => ({ ...s, ...h })), [])
    // Widened, the columns are beside the page again: no sheet stays open,
    // so narrowing later does not bring one back. Set while rendering, not in
    // an effect.
  const [prevWide, setPrevWide] = useState(wide)
  if (wide !== prevWide) {
    setPrevWide(wide)
    if (wide) setOpenState({ left: false, right: false })
  }
  const [prevCloseOn, setPrevCloseOn] = useState(closeOn)
  if (closeOn !== prevCloseOn) {
    setPrevCloseOn(closeOn)
    setOpenState({ left: false, right: false })
  }
  const value = useMemo(
    () => ({ wide, known, container: sheetsIn, open, setOpen, addTrigger, pressTrigger, focusTrigger, triggered, widths, collapsed, setWidth, setCollapsed, placement, offsets, setOffsets, hidden, setHidden, columnId, minWidth: mins, maxWidth: maxes }),
    [wide, known, sheetsIn, open, setOpen, addTrigger, pressTrigger, focusTrigger, triggered, widths, collapsed, setWidth, setCollapsed, placement, offsets, setOffsets, hidden, setHidden, columnId, mins, maxes],
  )
  return <ColumnsContext.Provider value={value}>{children}</ColumnsContext.Provider>
}

/** While a sheet is open, the page behind it holds still: no bounce and no
 *  pull-to-refresh (overscroll-behavior: none on the root, which WebKit on
 *  iOS also reads to turn its page's bounce off). */
function usePageHeld(on: boolean) {
  useEffect(() => {
    if (!on) return
    const root = document.documentElement.style
    const before = root.overscrollBehaviorY
    root.overscrollBehaviorY = 'none'
    return () => {
      root.overscrollBehaviorY = before
    }
  }, [on])
}

/** A column at the page's left or right, holding its header, content and
 *  footer: beside the page on a wide window, an aside named by `aria-
 *  label`, its width the person's by the splitter at its edge; on a narrow
 *  one, a sheet over the page, from the side or (`sheet="bottom"`) up from
 *  the bottom. `resizable={false}` leaves out the splitter. */
export function Column({
  side,
  sheet = 'side',
  resizable = true,
  className,
  children,
  'aria-label': label,
  ...props
}: ComponentProps<'aside'> & {
  side: Side
  'aria-label': string
  /** @defaultValue `'side'` */
  sheet?: 'side' | 'bottom'
  /** false: no splitter at its edge, the column the width the provider
   *  gives it -- for a layout whose columns do not move, as a social
   *  feed's (give it one width: minWidth and maxWidth the same).
   *  @defaultValue `true` */
  resizable?: boolean
}) {
  const { wide, known, container, open, setOpen, focusTrigger, widths, collapsed, placement, columnId } = useColumns()
  const id = columnId(side)
  const drawerClose = useRef<(() => boolean) | null>(null)
  const registerDrawer = useCallback((close: (() => boolean) | null) => {
    drawerClose.current = close
  }, [])
  const host = (node: ReactNode) => <DrawerHost.Provider value={registerDrawer}>{node}</DrawerHost.Provider>
  usePageHeld(!wide && open[side])
  // A sheet up from the bottom is dragged down to close, as the kit's
  // bottom Sheet is (sheet-drag.ts).
  const { attach: attachSheet, style: sheetStyle, dragged: sheetDragged, handlers: sheetHandlers } = useSheetDrag({ enabled: !wide && sheet === 'bottom', onClose: () => setOpen(side, false) })
    // Before the window can be asked (on a server, and hydrating) a column
    // is drawn as on a wide window and CSS hides it below the breakpoint, so
    // the server's HTML has the wide layout from the first paint.
  const early = !known
  if ((wide || early) && placement === 'floating')
    return host(
      <FloatingColumn side={side} label={label} className={cn(early && 'max-lg:hidden', className)} {...props}>
        {children}
      </FloatingColumn>
    )
  if (wide || early) {
    const shut = collapsed[side]
    return (
      <aside
        id={id}
        data-column=""
        data-side={side}
        aria-label={label}
        style={{ width: shut ? 0 : widths[side] }}
        // It may shrink below its width when the window narrows, so the
        // page keeps its least width.
        className={cn(
          'relative flex h-full min-w-0 shrink flex-col border-column-line bg-column',
          side === 'left' ? 'border-r' : 'border-l',
          early && 'max-lg:hidden',
          className,
        )}
        {...props}
      >
        {/* Collapsed, its contents are out of the tab order and hidden from
            screen readers; the splitter stays, to bring it back. */}
        <div inert={shut || undefined} className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          {host(children)}
        </div>
        {/* The splitter in the column, at its edge by the page, so it is
            in the column's landmark, as all of a page's content is to be
            (axe-core, region; W3C ARIA Authoring Practices, Landmark
            Regions). */}
        {resizable && <ColumnSplitter side={side} controls={id} label={label} />}
      </aside>
    )
  }
  return (
    <Dialog.Root modal={false} open={open[side]} onOpenChange={(o) => setOpen(side, o)}>
      <Dialog.Portal container={container ?? undefined}>
        {/* The page's scrolling locked while it is open, as Radix's modal
            Dialog locks it, though the sheet stays non-modal for focus and
            a press outside: on iOS a drag the sheet cannot take is stopped
            rather than passed to the page. */}
        <RemoveScroll as={Slot.Root} enabled={open[side]} allowPinchZoom>
        <Dialog.Content
          ref={attachSheet}
          data-column=""
          data-side={side}
          data-dragged={sheetDragged || undefined}
          style={sheet === 'bottom' ? sheetStyle : undefined}
          {...(sheet === 'bottom' ? sheetHandlers : {})}
          aria-describedby={undefined}
          onOpenAutoFocus={openQuietly}
          // A press on the bottom bar or on a column's trigger is theirs:
          // the trigger toggles the sheet itself. Radix closes a sheet that
          // is not modal on a press outside unless this prevents it.
          onInteractOutside={(e) => {
            const t = e.target as Element | null
            if (t?.closest('[data-columns-bar], [data-column-trigger]')) e.preventDefault()
          }}
          // Focus moving out (to the bar, say) does not close it.
          onFocusOutside={(e) => e.preventDefault()}
                    // An open drawer in the column takes Escape first; the sheet
                    // closes on the next one (Radix closes only if this is not
                    // prevented).
          onEscapeKeyDown={(e) => {
            if (drawerClose.current?.()) e.preventDefault()
          }}
                    // Back to the button that opened it -- unless focus has already
                    // gone somewhere: into the other sheet, or to the new page's heading
                    // after a link was followed, which Chrome would otherwise take back.
          onCloseAutoFocus={(e) => {
            e.preventDefault()
            const at = document.activeElement
            if (at && at !== document.body && at.isConnected && !(e.currentTarget as Element | null)?.contains(at)) return
            if (!open.left && !open.right) focusTrigger(side)
          }}
                    // Above the page, clear of the bottom bar (--bar-space). A scroll
                    // inside it stays in it (overscroll-behavior: contain), so on a
                    // phone it does not pull the page behind down to refresh.
          className={cn(
            'fixed z-50 flex flex-col border-column-line bg-column shadow-xl focus-visible:outline-hidden [&_*]:overscroll-contain',
            sheet === 'bottom'
              ? 'inset-x-0 top-[calc(var(--header-height)+env(safe-area-inset-top))] bottom-(--bar-space) data-[state=closed]:motion-safe:animate-sink data-[state=open]:motion-safe:animate-rise'
              : cn(
                  'top-0 bottom-(--bar-space) w-(--column-width) max-w-[85%] pt-[env(safe-area-inset-top)]',
                  side === 'left'
                    ? 'left-0 border-r data-[state=closed]:motion-safe:animate-slide-out-left data-[state=open]:motion-safe:animate-slide-in-left'
                    : 'right-0 border-l data-[state=closed]:motion-safe:animate-slide-out-right data-[state=open]:motion-safe:animate-slide-in-right',
                ),
            'data-dragged:animate-none!',
            className,
          )}
        >
          {/* A bottom sheet's handle, a mark at the top of its header that
              says it can be dragged; its header's close button and Escape
              close it without dragging. */}
          {sheet === 'bottom' && <span aria-hidden className="pointer-events-none absolute top-1.5 left-1/2 z-10 h-1 w-10 -translate-x-1/2 rounded-full bg-neutral-8" />}
          <VisuallyHidden.Root asChild>
            <Dialog.Title>{label}</Dialog.Title>
          </VisuallyHidden.Root>
          {host(children)}
        </Dialog.Content>
        </RemoveScroll>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

/** A column over the page, on a wide window. It sits at its own edge,
 *  moved by `offsets` and slid off that edge when `hidden`; it slides
 *  between places unless being dragged (and not at all for reduced motion).
 *  A strip on each side edge drags it, by pointer only: the keyboard moves
 *  it with ColumnToolbar. */
function FloatingColumn({
  side,
  label,
  className,
  children,
  ...props
}: ComponentProps<'aside'> & { side: Side; label: string }) {
  const { widths, offsets, setOffsets, hidden, columnId } = useColumns()
  const ref = useRef<HTMLElement>(null)
  const drag = useRef<{ x: number; offset: number } | null>(null)
  const [dragging, setDragging] = useState(false)
  const width = widths[side]
  const off = hidden[side]

  // Keep KEEP px of the column on screen: the left column's left edge is
  // its offset; the right column's is the window's width less its own,
  // plus its offset.
  const clamp = (o: number) => {
    const vw = ref.current?.parentElement?.getBoundingClientRect().width ?? window.innerWidth
    return side === 'left'
      ? Math.min(vw - KEEP, Math.max(KEEP - width, o))
      : Math.min(width - KEEP, Math.max(KEEP - vw, o))
  }
  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return
    e.preventDefault()
    e.currentTarget.setPointerCapture(e.pointerId)
    drag.current = { x: e.clientX, offset: offsets[side] }
    setDragging(true)
  }
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current
    if (!d) return
    setOffsets({ [side]: Math.round(clamp(d.offset + e.clientX - d.x)) })
  }
  const onPointerEnd = (e: PointerEvent<HTMLDivElement>) => {
    if (!drag.current) return
    drag.current = null
    setDragging(false)
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId)
  }
  const grip = (edge: 'left' | 'right') => (
    <div
      aria-hidden
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerEnd}
      onPointerCancel={onPointerEnd}
      className={cn(
                // Above everything in the column, its footer included, so it runs
                // the column's full height; on a touch screen a 24px grip, unseen.
        "absolute inset-y-0 z-50 w-1.5 cursor-grab touch-none hover:bg-column-edge active:cursor-grabbing pointer-coarse:before:absolute pointer-coarse:before:inset-y-0 pointer-coarse:before:w-6 pointer-coarse:before:content-['']",
        edge === 'left' ? 'left-0 before:left-0' : 'right-0 before:right-0',
        dragging && 'bg-column-edge-active',
      )}
    />
  )
  return (
    <aside
      ref={ref}
      id={columnId(side)}
      data-column=""
      data-side={side}
      aria-label={label}
      // Hidden off its edge, it is out of the tab order and hidden from
      // screen readers until the toolbar shows it again.
      inert={off || undefined}
      style={{
        width,
        transform: off ? `translateX(${side === 'left' ? '-100%' : '100%'})` : `translateX(${offsets[side]}px)`,
      }}
      className={cn(
        'absolute top-(--header-height) bottom-(--footer-height) z-20 flex flex-col overflow-hidden border border-column-line bg-column shadow-(--overlay-shadow)',
        side === 'left' ? 'left-0' : 'right-0',
        !dragging && 'transition-transform duration-200 ease-out motion-reduce:transition-none',
        className,
      )}
      {...props}
    >
      {grip('left')}
      {grip('right')}
      {children}
    </aside>
  )
}

/** The controls that place columns over the page: Radix's Toolbar (one tab
 *  stop, the arrows between its buttons). `sides` are the columns there
 *  are; with one, only Reset and its Hide. Flip trades the two columns'
 *  places from wherever they are, which, with both at their own edges, is
 *  what a swap would do, so there is no swap. */
export function ColumnToolbar({ sides, className }: { sides: Side[]; className?: string }) {
  const { widths, offsets, setOffsets, hidden, setHidden, columnId } = useColumns()
  const both = sides.includes('left') && sides.includes('right')
  // Positions as left edges, measured from the Layout's left: the box the
  // columns float in, the window in an app, a smaller box where the
  // columns are shown inside a page (the window's width would put Align
  // right past a smaller box's edge).
  const vw = () => document.getElementById(columnId(sides[0]))?.parentElement?.getBoundingClientRect().width ?? window.innerWidth
  const leftX = () => offsets.left
  const rightX = () => vw() - widths.right + offsets.right
  // A left edge for each column, back to offsets.
  const place = (l: number, r: number) => setOffsets({ left: l, right: r - (vw() - widths.right) })

  const reset = () => {
    setOffsets({ left: 0, right: 0 })
    setHidden({ left: false, right: false })
  }
  const flip = () => place(rightX(), leftX())
  const alignLeft = () => place(0, widths.left)
  const alignCenter = () => {
    const start = (vw() - widths.left - widths.right) / 2
    place(start, start + widths.left)
  }
  const alignRight = () => place(vw() - widths.right - widths.left, vw() - widths.right)

    // Each control an icon in an equal cell, no button drawn round it; named
    // by a tooltip and by aria-label. A Hide that is on shows its icon in the
    // accent.
  const items: { label: string; Icon: LucideIcon; onClick: () => void; pressed?: boolean }[] = [
    { label: 'Reset', Icon: RotateCw, onClick: reset },
    ...(both
      ? [
          { label: 'Flip', Icon: ArrowLeftRight, onClick: flip },
          { label: 'Align left', Icon: PanelLeftClose, onClick: alignLeft },
          { label: 'Center', Icon: Columns2, onClick: alignCenter },
          { label: 'Align right', Icon: PanelRightClose, onClick: alignRight },
        ]
      : []),
    ...(sides.includes('left') ? [{ label: 'Hide left', Icon: ArrowLeftFromLine, onClick: () => setHidden({ left: !hidden.left }), pressed: hidden.left }] : []),
    ...(both
      ? [
          {
            label: 'Hide both',
            Icon: EyeOff,
            onClick: () => setHidden({ left: !(hidden.left && hidden.right), right: !(hidden.left && hidden.right) }),
            pressed: hidden.left && hidden.right,
          },
        ]
      : []),
    ...(sides.includes('right') ? [{ label: 'Hide right', Icon: ArrowRightFromLine, onClick: () => setHidden({ right: !hidden.right }), pressed: hidden.right }] : []),
  ]
  const buttons = items.filter((i) => i.pressed === undefined)
  const toggles = items.filter((i) => i.pressed !== undefined)
  return (
    <TooltipProvider delayDuration={300}>
      <Toolbar.Root aria-label="Columns" className={cn(BAR, className)}>
        {buttons.map(({ label, Icon, onClick }) => (
          <Tooltip key={label}>
            <TooltipTrigger asChild>
              <Toolbar.Button aria-label={label} onClick={onClick} className={LABEL_CELL}>
                <Icon aria-hidden className={cn(CELL_ICON, 'shrink-0')} strokeWidth={1.75} />
                <span aria-hidden className={CELL_LABEL}>
                  {label}
                </span>
              </Toolbar.Button>
            </TooltipTrigger>
            <TooltipContent side="top">{label}</TooltipContent>
          </Tooltip>
        ))}
        {/* The Hides stay pressed until pressed again: Radix's Toolbar
            ToggleGroup, several on at once. What is pressed is what is
            hidden. The group spans its cells' columns of the
            bar, laid out as the bar is. */}
        {toggles.length > 0 && (
          <Toolbar.ToggleGroup
            type="multiple"
            aria-label="Hide"
            value={toggles.filter((t) => t.pressed).map((t) => t.label)}
            onValueChange={() => {}}
            className={BAR}
            style={{ gridColumn: `span ${toggles.length}` }}
          >
            {toggles.map(({ label, Icon, onClick, pressed }) => (
              <Tooltip key={label}>
                <TooltipTrigger asChild>
                  <Toolbar.ToggleItem value={label} aria-label={label} onClick={onClick} className={LABEL_CELL}>
                    <Icon aria-hidden className={cn(CELL_ICON, 'shrink-0')} strokeWidth={1.75} />
                    <span aria-hidden className={CELL_LABEL}>
                      {label}
                    </span>
                  </Toolbar.ToggleItem>
                </TooltipTrigger>
                <TooltipContent side="top">
                  {label}
                  {pressed ? ' (on)' : ''}
                </TooltipContent>
              </Tooltip>
            ))}
          </Toolbar.ToggleGroup>
        )}
      </Toolbar.Root>
    </TooltipProvider>
  )
}

/** The edge between a column and the page, which resizes the column: the
 *  W3C's Window Splitter pattern, an 8px strip over the edge, a line drawn
 *  while hovered, focused or dragged. Gone while its column is collapsed if
 *  a trigger can show it again, as at the window's edge it would catch a
 *  drag meant for the window; with no trigger it stays, the only way back. */
function ColumnSplitter({ side, controls, label }: { side: Side; controls: string; label: string }) {
  const { widths, collapsed, setWidth, setCollapsed, minWidth, maxWidth, triggered, focusTrigger } = useColumns()
  const MIN = minWidth[side]
  const MAX = maxWidth[side]
  const ref = useRef<HTMLDivElement>(null)
  const drag = useRef<{ x: number; width: number; max: number } | null>(null)
  const [dragging, setDragging] = useState(false)
  const shut = collapsed[side]
  const width = shut ? 0 : widths[side]

  // The column's width as drawn, and the widest it may go: up to MAX, and
  // only as far as the page can give while keeping PAGE_MIN. The page is
  // the splitter's other neighbour (the Layout's order: column, splitter,
  // page, splitter, column). Read when the person acts, not while drawing.
  const measure = () => {
    const column = document.getElementById(controls)
    const page = side === 'left' ? column?.nextElementSibling : column?.previousElementSibling
    const now = column?.getBoundingClientRect().width ?? width
    const pageWidth = page?.getBoundingClientRect().width ?? PAGE_MIN
    return { now, max: Math.max(MIN, Math.min(MAX, now + pageWidth - PAGE_MIN)) }
  }
  const set = (w: number, max: number) => setWidth(side, Math.round(Math.min(max, Math.max(MIN, w))))

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return
    e.preventDefault()
    e.currentTarget.setPointerCapture(e.pointerId)
    const { now, max } = measure()
    drag.current = { x: e.clientX, width: shut ? MIN : now, max }
    if (shut) setWidth(side, MIN)
    setDragging(true)
  }
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current
    if (!d) return
    // Toward the page widens the column: rightward for the left one.
    const moved = side === 'left' ? e.clientX - d.x : d.x - e.clientX
    set(d.width + moved, d.max)
  }
  const onPointerEnd = (e: PointerEvent<HTMLDivElement>) => {
    if (!drag.current) return
    drag.current = null
    setDragging(false)
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId)
  }

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const step = e.shiftKey ? 64 : 16
    // Left and Right move the splitter: for the left column, Right is wider;
    // for the right column, Left is.
    const wider = side === 'left' ? 'ArrowRight' : 'ArrowLeft'
    const narrower = side === 'left' ? 'ArrowLeft' : 'ArrowRight'
    const { now, max } = measure()
    if (e.key === wider) set(shut ? MIN : now + step, max)
    else if (e.key === narrower) {
      if (!shut) set(now - step, max)
    } else if (e.key === 'Home') set(MIN, max)
    else if (e.key === 'End') set(max, max)
    else if (e.key === 'Enter') {
      setCollapsed(side, !shut)
      if (!shut && triggered[side]) focusTrigger(side)
    } else return
    e.preventDefault()
  }

  if (shut && triggered[side]) return null

  return (
    <div className={cn('absolute inset-y-0 z-10 w-0', side === 'left' ? '-right-px' : '-left-px')}>
      <div
        ref={ref}
        role="separator"
        aria-orientation="vertical"
        aria-label={`Resize ${label.toLowerCase()}`}
        aria-controls={controls}
        aria-valuenow={width}
        aria-valuemin={0}
        aria-valuemax={MAX}
        aria-valuetext={shut ? 'Collapsed' : `${width} pixels`}
        tabIndex={0}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerEnd}
        onPointerCancel={onPointerEnd}
        onKeyDown={onKeyDown}
        data-dragging={dragging || undefined}
        // 8px to grip, 24px on a touch screen (pointer-coarse), its line
        // drawn in the middle either way.
        className="group absolute inset-y-0 -left-1 z-10 w-2 cursor-col-resize touch-none focus-visible:outline-hidden pointer-coarse:-left-3 pointer-coarse:w-6"
      >
        <span
          aria-hidden
          className="absolute inset-y-0 left-1/2 w-0.5 -translate-x-1/2 bg-transparent transition-colors group-hover:bg-column-edge group-focus-visible:bg-column-edge-active group-data-dragging:bg-column-edge-active"
        />
      </div>
    </div>
  )
}

/** The button that opens and closes a column's sheet: in the page's header
 *  (an icon: `icon="menu"` for navigation, a sidebar by default, or the
 *  app's own), or in the bottom bar with a label. Below the lg breakpoint
 *  only, unless `always`: then on a wide window it hides and shows the
 *  column too. Several may serve one column; a closing sheet gives focus
 *  back to the one pressed. */
export function ColumnTrigger({
  side,
  icon = 'column',
  always = false,
  className,
  children,
  onClick,
  ref,
  ...props
}: ComponentProps<'button'> & {
  side: Side
  /** @defaultValue `'column'` */
  icon?: 'column' | 'menu' | ReactNode
  /** @defaultValue `false` */
  always?: boolean
  ref?: Ref<HTMLButtonElement>
}) {
  const { wide, known, open, setOpen, addTrigger, pressTrigger, placement, collapsed, setCollapsed, hidden, setHidden, columnId } = useColumns()
  if (wide && !always) return null
  // A trigger for the narrow window only, drawn before the window is
  // known: CSS hides it from the breakpoint up, where the column shows
  // (Column, `early`).
  const narrowOnly = !known && !always
  const floating = placement === 'floating'
  const shown = wide ? !(floating ? hidden[side] : collapsed[side]) : open[side]
  const toggle = () => {
    if (!wide) setOpen(side, !open[side])
    else if (floating) setHidden({ [side]: shown })
    else setCollapsed(side, shown)
  }
  return (
    <button
      type="button"
      data-column-trigger={side}
            // A ref callback's cleanup (React 19), so the trigger leaves the
            // column's list when it unmounts.
      ref={(el) => {
        if (!el) return
        const remove = addTrigger(side, el)
        if (typeof ref === 'function') ref(el)
        else if (ref) ref.current = el
        return () => {
          remove()
          if (typeof ref === 'function') ref(null)
          else if (ref) ref.current = null
        }
      }}
      aria-haspopup={wide ? undefined : 'dialog'}
      aria-controls={wide ? columnId(side) : undefined}
      aria-expanded={shown}
      onClick={(e) => {
        onClick?.(e)
        if (e.defaultPrevented) return
        pressTrigger(side, e.currentTarget)
        toggle()
      }}
      className={cn(
        children
          ? 'flex min-w-0 items-center justify-center gap-2 text-sm text-neutral-11 transition-colors hover:text-neutral-12 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus aria-expanded:text-accent-12'
          : CELL,
        narrowOnly && 'lg:hidden',
        className,
      )}
      {...props}
    >
      {icon === 'menu' ? (
        <Menu aria-hidden className={CELL_ICON} strokeWidth={1.75} />
      ) : icon === 'column' ? (
        <PanelRight aria-hidden className={cn(CELL_ICON, side === 'left' && '-scale-x-100')} strokeWidth={1.75} />
      ) : (
        icon
      )}
      {children}
    </button>
  )
}

/** The bottom bar on a narrow window, for floating columns: one labelled
 *  trigger per column, in the page footer's place, clear of the home
 *  indicator. Radix's Toolbar, inside a navigation landmark of the same
 *  name. Its triggers toggle; the sheets stay open while it is pressed. */
export function ColumnBar({ children, className, 'aria-label': label = 'Columns' }: {
  children: ReactNode
  className?: string
  /** @defaultValue `'Columns'` */
  'aria-label'?: string
}) {
  const { wide, known } = useColumns()
    // While the bar shows, the page and the sheets keep clear of it by
    // --bar-space, set on the root, as the sheets are drawn outside the app's
    // tree.
  useEffect(() => {
    if (wide) return
    const root = document.documentElement.style
    root.setProperty('--bar-space', 'calc(var(--footer-height) + env(safe-area-inset-bottom))')
    return () => root.setProperty('--bar-space', '0px')
  }, [wide])
  if (wide) return null
  return (
    // Drawn before the window is known, CSS hides it from the breakpoint
    // up (Column, `early`).
    <nav aria-label={label} className={cn(!known && 'lg:hidden')}>
      <Toolbar.Root
        data-columns-bar
        aria-label={label}
        className={cn(
          BAR,
          'fixed inset-x-0 bottom-0 z-[60] border-t border-column-line bg-column-bar finish pb-[env(safe-area-inset-bottom)]',
          className,
        )}
      >
        {children}
      </Toolbar.Root>
    </nav>
  )
}

/** One column's trigger in the bottom bar. */
export function ColumnBarItem({
  side,
  icon,
  children,
}: {
  side: Side
  /** As ColumnTrigger's: 'menu', 'column' (a sidebar), or an icon of the
   *  app's own. */
  icon?: 'column' | 'menu' | ReactNode
  children: ReactNode
}) {
  return (
    <Toolbar.Button asChild>
      <ColumnTrigger side={side} icon={icon} className="h-(--footer-height)">
        {children}
      </ColumnTrigger>
    </Toolbar.Button>
  )
}

/** Closes the column's sheet: put it in the column's header. Beside the
 *  page there is nothing to close, and it draws nothing; nor before the
 *  window is known, when the column is drawn as on a wide window (Column,
 *  `early`) and a sheet can only open once it is. */
export function ColumnClose({ className, ...props }: ComponentProps<'button'>) {
  const { wide, known } = useColumns()
  if (wide || !known) return null
  return (
    <Dialog.Close aria-label="Close" className={cn(CELL, className)} {...props}>
      <X aria-hidden className={CELL_ICON} strokeWidth={1.75} />
    </Dialog.Close>
  )
}

/** In the page's background, as the page's header is, so the bars read as
 *  one across the window; the column's body keeps its own (neutral step
 *  2). */
export function ColumnHeader({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('flex h-(--header-height) shrink-0 items-stretch border-b border-column-line bg-column-bar finish', className)} {...props} />
}

/** The column's body, between its header and footer: it takes the room left
 *  and scrolls. */
export function ColumnContent({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('min-h-0 flex-1 overflow-y-auto', className)} {...props} />
}

/** In the page's background, as the page's footer is, and opaque above
 *  the column's drawer, so the drawer rises from behind it. */
export function ColumnFooter({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('relative z-40 flex h-(--footer-height) shrink-0 items-stretch border-t border-column-line bg-column-bar finish', className)} {...props} />
}
