'use client'

import type { ComponentProps } from 'react'
import * as RadioGroupPrimitive from 'radix-ui/radio-group'
import { Check } from 'lucide-react'
import { ROW } from './cell.ts'
import { cn } from './cn.ts'

// For choices that look like cells, use SegmentedControl.

/** One of several chosen (Radix's Radio Group); the arrow keys move and
 *  choose. Pair each item with a Label. */
export function RadioGroup({ className, ...props }: ComponentProps<typeof RadioGroupPrimitive.Root>) {
  return <RadioGroupPrimitive.Root className={cn('grid gap-3', className)} {...props} />
}

/** A circle, filled at its centre when chosen. */
export function RadioGroupItem({ className, ...props }: ComponentProps<typeof RadioGroupPrimitive.Item>) {
  return (
    <RadioGroupPrimitive.Item
      className={cn(
        'peer inline-flex size-4 shrink-0 items-center justify-center rounded-full border border-field-border bg-field transition-colors hover:border-field-border-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:cursor-not-allowed disabled:border-neutral-6 disabled:bg-neutral-2 data-[state=checked]:border-choice-on',
        className,
      )}
      {...props}
    >
      <RadioGroupPrimitive.Indicator className="block size-2 rounded-full bg-choice-on" />
    </RadioGroupPrimitive.Item>
  )
}

/** A choice as a row of a list -- its name and a check when chosen -- for
 *  settings; the row is the radio, so it needs no Label. Give its group
 *  `className="gap-0"` so the rows touch. */
export function RadioGroupRow({ className, children, ...props }: ComponentProps<typeof RadioGroupPrimitive.Item>) {
  return (
    <RadioGroupPrimitive.Item
      className={cn(ROW, 'data-[state=checked]:font-medium data-[state=checked]:text-neutral-12 disabled:cursor-not-allowed disabled:text-neutral-8 disabled:hover:text-neutral-8', className)}
      {...props}
    >
      <span className="min-w-0 flex-1 truncate">{children}</span>
      <RadioGroupPrimitive.Indicator>
        <Check aria-hidden className="size-4 text-neutral-12" strokeWidth={2} />
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  )
}
