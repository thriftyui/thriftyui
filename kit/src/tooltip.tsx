'use client'

import type { ComponentProps } from 'react'
import * as TooltipPrimitive from 'radix-ui/tooltip'
import { cn } from './cn.ts'

/** Sets the wait before a tooltip shows, for those inside it. */
export const TooltipProvider = TooltipPrimitive.Provider
/** A small dark label for what it is on, on hover or focus (Radix's
 *  Tooltip); a screen reader hears it too. */
export const Tooltip = TooltipPrimitive.Root
/** What the tooltip is on. */
export const TooltipTrigger = TooltipPrimitive.Trigger

/** The label; `sideOffset` 4 and `collisionPadding` 8 unless given
 *  (Radix's are 0). */
export function TooltipContent({ className, sideOffset = 4, collisionPadding = 8, ...props }: ComponentProps<typeof TooltipPrimitive.Content>) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        sideOffset={sideOffset}
        collisionPadding={collisionPadding}
        className={cn(
          'z-[90] max-w-(--radix-tooltip-content-available-width) rounded-sm bg-neutral-12 px-2 py-1 text-xs text-neutral-1 data-[state=closed]:motion-safe:animate-fade-out data-[state=delayed-open]:motion-safe:animate-fade-in data-[state=instant-open]:motion-safe:animate-fade-in',
          className,
        )}
        {...props}
      />
    </TooltipPrimitive.Portal>
  )
}
