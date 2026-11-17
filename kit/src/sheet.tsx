'use client'

import { useRef, useState, type ComponentProps } from 'react'
import * as DialogPrimitive from 'radix-ui/dialog'
import { cn } from './cn.ts'
import { usePortalContainer } from './portal-container.tsx'
import { useSheetDrag } from './sheet-drag.ts'
import { closeQuietly, openQuietly } from './input-modality.ts'

// Sizes are percentages, so inside a PortalContainer they are that
// element's. A bottom sheet with `heights` gets a handle that moves it to
// the next height -- the drag's move without dragging (WCAG 2.5.7); without,
// the handle is a mark only. `dismissible={false}` with Radix's
// `modal={false}` makes a sheet that stays, the page behind still usable.

/** A dialog that slides in from an edge of the window (Radix's Dialog),
 *  for what is not a column. */
export const Sheet = DialogPrimitive.Root
/** The button that opens the sheet: Radix's Dialog Trigger. */
export const SheetTrigger = DialogPrimitive.Trigger
/** A button that closes the sheet: Radix's Dialog Close. */
export const SheetClose = DialogPrimitive.Close
/** The sheet's name, for a screen reader: Radix's Dialog Title. */
export const SheetTitle = DialogPrimitive.Title
/** What the sheet is for, read after its name: Radix's Dialog Description. */
export const SheetDescription = DialogPrimitive.Description

const SIDES = {
  left: 'inset-y-0 left-0 w-(--column-width) max-w-[85%] border-r pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] data-[state=closed]:motion-safe:animate-slide-out-left data-[state=open]:motion-safe:animate-slide-in-left',
  right: 'inset-y-0 right-0 w-(--column-width) max-w-[85%] border-l pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] data-[state=closed]:motion-safe:animate-slide-out-right data-[state=open]:motion-safe:animate-slide-in-right',
  top: 'inset-x-0 top-0 max-h-[85%] border-b pt-[env(safe-area-inset-top)] data-[state=closed]:motion-safe:animate-lift data-[state=open]:motion-safe:animate-drop',
  bottom: 'inset-x-0 bottom-0 max-h-[85%] rounded-t-xl border-t pb-[env(safe-area-inset-bottom)] data-[state=closed]:motion-safe:animate-sink data-[state=open]:motion-safe:animate-rise',
} as const

/** The sheet itself, over a dimmed page: Radix's Dialog Content, sliding in
 *  from `side` -- left, right (the default), top or bottom. A side sheet is
 *  the columns' width at most 85% of the window, a top or bottom one at
 *  most 85% of its height. It keeps clear of a phone's notch and home bar.
 *  From the bottom, it is dragged down to close (`drag={false}` not), and
 *  with `heights` -- parts of its full height, lowest first, such as
 *  [0.25, 0.5, 1] -- it rests at one of them (`height`, an index, and
 *  `onHeightChange`; the highest unless given), dragged between them or
 *  moved by its handle. */
export function SheetContent({
  side = 'right',
  drag = true,
  heights,
  height,
  onHeightChange,
  dismissible = true,
  className,
  style,
  onOpenAutoFocus,
  onCloseAutoFocus,
  children,
  ...props
}: ComponentProps<typeof DialogPrimitive.Content> & {
  /** @defaultValue `'right'` */
  side?: keyof typeof SIDES
  /** From the bottom: whether it is dragged.
   *  @defaultValue `true` */
  drag?: boolean
  /** From the bottom: the parts of its full height it rests at, lowest
   *  first. */
  heights?: number[]
  /** The index in `heights` it rests at, for an app that holds it. */
  height?: number
  onHeightChange?: (index: number) => void
  /** false: a drag never closes it.
   *  @defaultValue `true` */
  dismissible?: boolean
}) {
  const container = usePortalContainer()
  const bottom = side === 'bottom'
  const [own, setOwn] = useState(heights ? heights.length - 1 : 0)
  const at = height ?? own
  const setAt = (i: number) => {
    if (height === undefined) setOwn(i)
    onHeightChange?.(i)
  }
  const closer = useRef<HTMLButtonElement>(null)
  const { attach, style: dragStyle, dragged, handlers } = useSheetDrag({ enabled: bottom && drag, heights: bottom ? heights : undefined, at, onAt: setAt, onClose: () => closer.current?.click(), dismissible })
  const top = heights ? at === heights.length - 1 : true
  return (
    <DialogPrimitive.Portal container={container}>
      <DialogPrimitive.Overlay className="fixed inset-0 z-[65] bg-overlay data-[state=closed]:motion-safe:animate-fade-out data-[state=open]:motion-safe:animate-fade-in" />
      <DialogPrimitive.Content
        ref={attach}
        data-dragged={dragged || undefined}
        className={cn(
          'fixed z-[70] flex flex-col overflow-y-auto border-dialog-line bg-dialog text-neutral-12 focus-visible:outline-hidden',
          SIDES[side],
          bottom && heights && 'h-[85%]',
          'data-dragged:animate-none!',
          className,
        )}
        style={bottom && drag ? { ...dragStyle, ...style } : style}
        {...(bottom && drag ? handlers : {})}
        onOpenAutoFocus={(e) => {
          onOpenAutoFocus?.(e)
          openQuietly(e)
        }}
        onCloseAutoFocus={(e) => {
          onCloseAutoFocus?.(e)
          closeQuietly(e)
        }}
        {...props}
      >
        {bottom && drag && (
          <div className="flex shrink-0 justify-center pt-2 pb-1">
            {heights ? (
              <button
                type="button"
                aria-label={top ? 'Show less' : 'Show more'}
                onClick={() => setAt(top ? 0 : at + 1)}
                className="flex h-6 w-16 items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-focus"
              >
                <span className="h-1 w-10 rounded-full bg-neutral-8" />
              </button>
            ) : (
              <span aria-hidden className="h-1 w-10 rounded-full bg-neutral-8" />
            )}
          </div>
        )}
        {children}
        <DialogPrimitive.Close ref={closer} hidden tabIndex={-1} aria-hidden />
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  )
}
