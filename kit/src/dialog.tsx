'use client'

import { useCallback, useRef, type ComponentProps } from 'react'
import * as DialogPrimitive from 'radix-ui/dialog'
import { DrawerHost } from './drawer-host.ts'
import { cn } from './cn.ts'
import { usePortalContainer } from './portal-container.tsx'
import { closeQuietly, openQuietly } from './input-modality.ts'

// Below 1024px a dialog fills the screen; from 1024px up it is a box of
// `size` (sm 360x480, md 420x560, lg 560x640, xl 720x720, full), never
// larger than the window less 1rem round it. With no description, pass
// aria-describedby={undefined} to DialogContent.
//
// Radix hears Escape on the document first (a capture listener), so an open
// dialog drawer registers its close (drawer-host.ts) and onEscapeKeyDown
// closes the drawer instead of the dialog, as a column's sheet does.

/** A dialog (Radix's Dialog): holds its parts. */
export const Dialog = DialogPrimitive.Root
/** The button that opens it. */
export const DialogTrigger = DialogPrimitive.Trigger
/** A button that closes it. */
export const DialogClose = DialogPrimitive.Close
/** Its name, read as it opens: small and bold, filling its header bar beside the close button
 *  (DialogHeader); `sr-only` for a dialog whose name is not shown. */
export function DialogTitle({ className, ...props }: ComponentProps<typeof DialogPrimitive.Title>) {
  return <DialogPrimitive.Title className={cn('flex-1 self-center px-4 text-sm font-semibold', className)} {...props} />
}
/** Its description, read as it opens; optional. */
export const DialogDescription = DialogPrimitive.Description

const SIZES = {
  sm: 'lg:h-[min(480px,calc(100dvh-2rem))] lg:w-[min(360px,calc(100vw-2rem))]',
  md: 'lg:h-[min(560px,calc(100dvh-2rem))] lg:w-[min(420px,calc(100vw-2rem))]',
  lg: 'lg:h-[min(640px,calc(100dvh-2rem))] lg:w-[min(560px,calc(100vw-2rem))]',
  xl: 'lg:h-[min(720px,calc(100dvh-2rem))] lg:w-[min(720px,calc(100vw-2rem))]',
  full: 'lg:h-[calc(100dvh-2rem)] lg:w-[calc(100vw-2rem)]',
} as const

/** A dialog's size from 1024px up: sm, md (the default), lg, xl, or full,
 *  the window less 1rem round it; below it, a dialog fills the screen. */
export type DialogSize = keyof typeof SIZES

/** The dialog, over the dimmed page. */
export function DialogContent({
  size = 'md',
  className,
  onEscapeKeyDown,
  onOpenAutoFocus,
  onCloseAutoFocus,
  children,
  ...props
}: ComponentProps<typeof DialogPrimitive.Content> & {
  /** @defaultValue `'md'` */
  size?: DialogSize
}) {
  const container = usePortalContainer()
  const drawerClose = useRef<(() => boolean) | null>(null)
  const registerDrawer = useCallback((close: (() => boolean) | null) => {
    drawerClose.current = close
  }, [])
  return (
    <DialogPrimitive.Portal container={container}>
      <DialogPrimitive.Overlay className="fixed inset-0 z-[65] bg-overlay data-[state=closed]:motion-safe:animate-fade-out data-[state=open]:motion-safe:animate-fade-in" />
      <DialogPrimitive.Content
        onEscapeKeyDown={(e) => {
          onEscapeKeyDown?.(e)
          if (!e.defaultPrevented && drawerClose.current?.()) e.preventDefault()
        }}
        onOpenAutoFocus={(e) => {
          onOpenAutoFocus?.(e)
          openQuietly(e)
        }}
        onCloseAutoFocus={(e) => {
          onCloseAutoFocus?.(e)
          closeQuietly(e)
        }}
        className={cn(
          'fixed inset-0 z-[70] flex flex-col overflow-hidden bg-dialog pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] focus-visible:outline-hidden data-[state=closed]:motion-safe:animate-fade-out data-[state=open]:motion-safe:animate-fade-in',
          // A drawer in it keeps clear of the home indicator too (column-drawer.tsx).
          '[--drawer-inset-bottom:env(safe-area-inset-bottom)] lg:[--drawer-inset-bottom:0px]',
          'lg:inset-auto lg:top-1/2 lg:left-1/2 lg:-translate-x-1/2 lg:-translate-y-1/2 lg:rounded-lg lg:border lg:border-dialog-line lg:pt-0 lg:pb-0 lg:shadow-(--overlay-shadow)',
          SIZES[size],
          className,
        )}
        {...props}
      >
        <DrawerHost.Provider value={registerDrawer}>{children}</DrawerHost.Provider>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  )
}

/** A bar along the dialog's top, the header's height, in its background. */
export function DialogHeader({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('flex h-(--header-height) shrink-0 items-stretch border-b border-dialog-line bg-dialog-bar finish', className)} {...props} />
}

/** A bar along its bottom, the footer's height, opaque above a dialog
 *  drawer, which rises from behind it. */
export function DialogFooter({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('relative z-40 flex h-(--footer-height) shrink-0 items-stretch border-t border-dialog-line bg-dialog-bar finish', className)} {...props} />
}
