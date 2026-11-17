'use client'

import type { ComponentProps } from 'react'
import * as ToastPrimitive from 'radix-ui/toast'
import { X } from 'lucide-react'
import { buttonClass } from './button-class.ts'
import { cn } from './cn.ts'

// F8 jumps to the toasts; Radix leaves it to the app to make that known. An
// Action needs `altText`: the toast may be gone before a screen reader user
// reaches it.

/** Wraps the toasts and their viewport, usually the app. */
export const ToastProvider = ToastPrimitive.Provider

/** Where toasts show: the window's lower right. */
export function ToastViewport({ className, ...props }: ComponentProps<typeof ToastPrimitive.Viewport>) {
  return (
    <ToastPrimitive.Viewport
      className={cn(
        'fixed right-0 bottom-0 z-[95] m-0 flex w-full max-w-sm list-none flex-col gap-2 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] outline-hidden',
        className,
      )}
      {...props}
    />
  )
}

/** A short message that comes and goes on its own (Radix's Toast);
 *  swiped away, paused while hovered or focused. */
export function Toast({ className, ...props }: ComponentProps<typeof ToastPrimitive.Root>) {
  return (
    <ToastPrimitive.Root
      className={cn(
        'relative flex items-start gap-3 rounded-lg border border-popover-line bg-popover p-4 pe-10 text-popover-text',
        'data-[state=closed]:motion-safe:animate-fade-out data-[state=open]:motion-safe:animate-slide-in-right',
        'data-[swipe=move]:translate-x-(--radix-toast-swipe-move-x) data-[swipe=cancel]:translate-x-0 data-[swipe=cancel]:motion-safe:transition-transform data-[swipe=end]:motion-safe:animate-slide-out-right',
        className,
      )}
      {...props}
    />
  )
}

/** Its title. */
export function ToastTitle({ className, ...props }: ComponentProps<typeof ToastPrimitive.Title>) {
  return <ToastPrimitive.Title className={cn('text-sm font-semibold', className)} {...props} />
}

/** Its message. */
export function ToastDescription({ className, ...props }: ComponentProps<typeof ToastPrimitive.Description>) {
  return <ToastPrimitive.Description className={cn('text-sm text-neutral-11', className)} {...props} />
}

/** An action safe to ignore; give `altText`. */
export function ToastAction({ className, ...props }: ComponentProps<typeof ToastPrimitive.Action>) {
  return <ToastPrimitive.Action className={buttonClass('default', 'default', cn('shrink-0', className))} {...props} />
}

/** Dismisses it early. */
export function ToastClose({ className, ...props }: ComponentProps<typeof ToastPrimitive.Close>) {
  return (
    <ToastPrimitive.Close
      aria-label="Close"
      className={cn(
        'absolute top-2 inset-e-2 inline-flex size-7 items-center justify-center text-neutral-11 transition-colors hover:text-neutral-12 focus-visible:outline-2 focus-visible:outline-focus',
        className,
      )}
      {...props}
    >
      <X aria-hidden className="size-4" strokeWidth={1.75} />
    </ToastPrimitive.Close>
  )
}
