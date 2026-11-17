'use client'

import type { ComponentProps } from 'react'
import * as AlertDialogPrimitive from 'radix-ui/alert-dialog'
import { buttonClass, type ButtonVariant } from './button-class.ts'
import { cn } from './cn.ts'
import { usePortalContainer } from './portal-container.tsx'
import { closeQuietly, openQuietly } from './input-modality.ts'

/** A modal that interrupts and must be answered (Radix's Alert Dialog): a
 *  press outside does not close it. A box in the middle, on a phone too. */
export const AlertDialog = AlertDialogPrimitive.Root
/** The button that opens it. */
export const AlertDialogTrigger = AlertDialogPrimitive.Trigger

/** The dialog's box. */
export function AlertDialogContent({ className, onOpenAutoFocus, onCloseAutoFocus, ...props }: ComponentProps<typeof AlertDialogPrimitive.Content>) {
  const container = usePortalContainer()
  return (
    <AlertDialogPrimitive.Portal container={container}>
      <AlertDialogPrimitive.Overlay className="fixed inset-0 z-[65] bg-overlay data-[state=closed]:motion-safe:animate-fade-out data-[state=open]:motion-safe:animate-fade-in" />
      {/* Marked modal, as the W3C's Alert Dialog pattern asks ("aria-modal
          set to true", aria-practices, alertdialog-pattern.html): it is
          always modal in Radix, which keeps focus in it, stops presses
          outside and hides the rest of the page from screen readers, and
          its backdrop dims the window -- the pattern's two conditions. */}
      <AlertDialogPrimitive.Content
        aria-modal
        onOpenAutoFocus={(e) => {
          onOpenAutoFocus?.(e)
          openQuietly(e)
        }}
        onCloseAutoFocus={(e) => {
          onCloseAutoFocus?.(e)
          closeQuietly(e)
        }}
        className={cn(
          'fixed top-1/2 left-1/2 z-[70] flex w-[min(26rem,calc(100%-2rem))] -translate-x-1/2 -translate-y-1/2 flex-col gap-3 rounded-lg border border-dialog-line bg-dialog p-5 text-neutral-12 shadow-(--overlay-shadow) focus-visible:outline-hidden data-[state=closed]:motion-safe:animate-fade-out data-[state=open]:motion-safe:animate-fade-in',
          className,
        )}
        {...props}
      />
    </AlertDialogPrimitive.Portal>
  )
}

/** Its name, read as it opens. */
export function AlertDialogTitle({ className, ...props }: ComponentProps<typeof AlertDialogPrimitive.Title>) {
  return <AlertDialogPrimitive.Title className={cn('text-base font-semibold', className)} {...props} />
}

/** Its description, read as it opens. */
export function AlertDialogDescription({ className, ...props }: ComponentProps<typeof AlertDialogPrimitive.Description>) {
  return <AlertDialogPrimitive.Description className={cn('text-sm text-neutral-11', className)} {...props} />
}

/** Its buttons, in a row at its foot, the action last. */
export function AlertDialogFooter({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('mt-2 flex justify-end gap-2', className)} {...props} />
}

/** Closes it without acting; looks unlike the Action. */
export function AlertDialogCancel({ className, ...props }: ComponentProps<typeof AlertDialogPrimitive.Cancel>) {
  return <AlertDialogPrimitive.Cancel className={buttonClass('default', 'default', className)} {...props} />
}

/** Closes it and acts: `solid`, or `danger` for what cannot be undone. */
export function AlertDialogAction({
  variant = 'solid',
  className,
  ...props
}: ComponentProps<typeof AlertDialogPrimitive.Action> & {
  /** @defaultValue `'solid'` */
  variant?: Extract<ButtonVariant, 'solid' | 'danger'>
}) {
  return <AlertDialogPrimitive.Action className={buttonClass(variant, 'default', className)} {...props} />
}
