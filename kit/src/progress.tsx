'use client'

import type { ComponentProps } from 'react'
import * as ProgressPrimitive from 'radix-ui/progress'
import { cn } from './cn.ts'

// The bar fills by value out of `max`, as a screen reader hears it. With no
// value the length is unknown: a third of the bar pulses, still for
// reduced motion.

/** How far a task has gone (Radix's Progress), in the kit's look. */
export function Progress({ className, value, max = 100, ...props }: ComponentProps<typeof ProgressPrimitive.Root>) {
  const known = value !== null && value !== undefined
  const done = known ? Math.min(100, Math.max(0, (value / max) * 100)) : 0
  return (
    <ProgressPrimitive.Root
      value={value}
      max={max}
      className={cn('relative h-1.5 w-full overflow-hidden rounded-full bg-choice-track', className)}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className={cn(
          'h-full bg-choice-on transition-transform duration-300 motion-reduce:transition-none',
          known ? 'w-full' : 'w-1/3 animate-pulse motion-reduce:animate-none',
        )}
        style={known ? { transform: `translateX(-${100 - done}%)` } : undefined}
      />
    </ProgressPrimitive.Root>
  )
}
