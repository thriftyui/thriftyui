'use client'

import type { ComponentProps } from 'react'
import * as SeparatorPrimitive from 'radix-ui/separator'
import { cn } from './cn.ts'

/** A line between parts (Radix's Separator), across or down by
 *  `orientation`. Decorative unless told otherwise (Radix's is not), as most
 *  lines only draw. */
export function Separator({ className, orientation = 'horizontal', decorative = true, ...props }: ComponentProps<typeof SeparatorPrimitive.Root>) {
  return (
    <SeparatorPrimitive.Root
      orientation={orientation}
      decorative={decorative}
      className={cn('shrink-0 bg-neutral-6', orientation === 'horizontal' ? 'h-px w-full' : 'h-full w-px', className)}
      {...props}
    />
  )
}
