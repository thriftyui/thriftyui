'use client'

import type { ComponentProps } from 'react'
import * as ScrollAreaPrimitive from 'radix-ui/scroll-area'
import { cn } from './cn.ts'

// The viewport is a tab stop so the keyboard can scroll it when nothing
// inside can be focused; pass viewportTabIndex={-1} when something can.

/** The browser's own scrolling with a slim bar drawn alike everywhere
 *  (Radix's Scroll Area). Give it a height, and an `aria-label` for its
 *  tab stop. */
export function ScrollArea({
  className,
  children,
  viewportTabIndex = 0,
  ...props
}: ComponentProps<typeof ScrollAreaPrimitive.Root> & {
  /** @defaultValue `0` */
  viewportTabIndex?: number
}) {
  return (
    <ScrollAreaPrimitive.Root className={cn('relative overflow-hidden', className)} {...props}>
      <ScrollAreaPrimitive.Viewport
        tabIndex={viewportTabIndex}
        className="size-full rounded-[inherit] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus">
        {children}
      </ScrollAreaPrimitive.Viewport>
      <ScrollBar />
      <ScrollBar orientation="horizontal" />
      <ScrollAreaPrimitive.Corner />
    </ScrollAreaPrimitive.Root>
  )
}

/** Its bar: slim, a gray thumb on a clear track; vertical unless
 *  `orientation` says horizontal. */
export function ScrollBar({ className, orientation = 'vertical', ...props }: ComponentProps<typeof ScrollAreaPrimitive.Scrollbar>) {
  return (
    <ScrollAreaPrimitive.Scrollbar
      orientation={orientation}
      className={cn(
        'flex touch-none p-0.5 select-none',
        orientation === 'vertical' ? 'h-full w-2.5' : 'h-2.5 flex-col',
        className,
      )}
      {...props}
    >
      <ScrollAreaPrimitive.Thumb className="relative flex-1 rounded-full bg-neutral-9 transition-colors hover:bg-neutral-10" />
    </ScrollAreaPrimitive.Scrollbar>
  )
}
