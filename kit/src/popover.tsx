'use client'

import type { ComponentProps } from 'react'
import * as PopoverPrimitive from 'radix-ui/popover'
import { cn } from './cn.ts'
import { SURFACE } from './surface.ts'
import { closeQuietly, openQuietly } from './input-modality.ts'

/** Content over the page from a button (Radix's Popover): focus moves in
 *  as it opens and back as it closes; Escape or a press outside closes it. */
export const Popover = PopoverPrimitive.Root
/** The button that opens and closes it. */
export const PopoverTrigger = PopoverPrimitive.Trigger
/** Another element to place it against, instead of its button. */
export const PopoverAnchor = PopoverPrimitive.Anchor
/** A button inside that closes it. */
export const PopoverClose = PopoverPrimitive.Close

/** What it shows, on the kit's floating surface; `sideOffset` 6 and
 *  `collisionPadding` 8 unless given (Radix's are 0). */
export function PopoverContent({ className, sideOffset = 6, collisionPadding = 8, onOpenAutoFocus, onCloseAutoFocus, ...props }: ComponentProps<typeof PopoverPrimitive.Content>) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        sideOffset={sideOffset}
        collisionPadding={collisionPadding}
        onOpenAutoFocus={(e) => {
          onOpenAutoFocus?.(e)
          openQuietly(e)
        }}
        onCloseAutoFocus={(e) => {
          onCloseAutoFocus?.(e)
          closeQuietly(e)
        }}
        className={cn(
          SURFACE,
          'max-h-(--radix-popover-content-available-height) w-72 max-w-(--radix-popover-content-available-width) overflow-y-auto p-4 focus-visible:outline-2 focus-visible:outline-focus',
          className,
        )}
        {...props}
      />
    </PopoverPrimitive.Portal>
  )
}
