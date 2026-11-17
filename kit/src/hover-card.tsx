'use client'

import type { ComponentProps } from 'react'
import * as HoverCardPrimitive from 'radix-ui/hover-card'
import { cn } from './cn.ts'
import { SURFACE } from './surface.ts'

// It opens on a resting pointer, so a keyboard or screen reader may never
// see it: nothing in it should be needed.

/** A preview of what is behind a link (Radix's Hover Card). */
export const HoverCard = HoverCardPrimitive.Root
/** The link that opens it when hovered. */
export const HoverCardTrigger = HoverCardPrimitive.Trigger

/** What it shows, on the kit's floating surface; `sideOffset` 6 and
 *  `collisionPadding` 8 unless given (Radix's are 0). */
export function HoverCardContent({ className, sideOffset = 6, collisionPadding = 8, ...props }: ComponentProps<typeof HoverCardPrimitive.Content>) {
  return (
    <HoverCardPrimitive.Portal>
      <HoverCardPrimitive.Content
        sideOffset={sideOffset}
        collisionPadding={collisionPadding}
        className={cn(SURFACE, 'max-h-(--radix-hover-card-content-available-height) w-64 overflow-y-auto p-4', className)}
        {...props}
      />
    </HoverCardPrimitive.Portal>
  )
}
