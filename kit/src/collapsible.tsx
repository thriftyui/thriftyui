'use client'

import type { ComponentProps } from 'react'
import * as CollapsiblePrimitive from 'radix-ui/collapsible'
import { cn } from './cn.ts'

/** Shows and hides its content (Radix's Collapsible). */
export const Collapsible = CollapsiblePrimitive.Root
/** The button that opens and closes it; unstyled -- give it a look, a
 *  Button by `asChild`, say. */
export const CollapsibleTrigger = CollapsiblePrimitive.Trigger

/** What it shows and hides, opening to its height (at once with reduced
 *  motion). */
export function CollapsibleContent({ className, ...props }: ComponentProps<typeof CollapsiblePrimitive.Content>) {
  return (
    <CollapsiblePrimitive.Content
      className={cn(
        'overflow-hidden [--open-height:var(--radix-collapsible-content-height)] data-[state=closed]:motion-safe:animate-close-height data-[state=open]:motion-safe:animate-open-height',
        className,
      )}
      {...props}
    />
  )
}
