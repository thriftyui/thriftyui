'use client'

import type { ComponentProps } from 'react'
import * as AvatarPrimitive from 'radix-ui/avatar'
import { cn } from './cn.ts'

/** A person's picture in a circle, the row's height (Radix's Avatar). */
export function Avatar({ className, ...props }: ComponentProps<typeof AvatarPrimitive.Root>) {
  return (
    <AvatarPrimitive.Root
      className={cn('relative inline-flex size-(--row-height) shrink-0 overflow-hidden rounded-full select-none', className)}
      {...props}
    />
  )
}

/** The picture; give it an `alt` naming the person. Shown once loaded. */
export function AvatarImage({ className, ...props }: ComponentProps<typeof AvatarPrimitive.Image>) {
  return <AvatarPrimitive.Image className={cn('size-full object-cover', className)} {...props} />
}

/** Their initials, while the picture loads or if it cannot; `delayMs`
 *  waits first, so a quick load does not flash. */
export function AvatarFallback({ className, ...props }: ComponentProps<typeof AvatarPrimitive.Fallback>) {
  return (
    <AvatarPrimitive.Fallback
      className={cn('flex size-full items-center justify-center bg-neutral-3 text-xs font-medium text-neutral-11', className)}
      {...props}
    />
  )
}
