'use client'

import type { ComponentProps } from 'react'
import * as CheckboxPrimitive from 'radix-ui/checkbox'
import { Check, Minus } from 'lucide-react'
import { cn } from './cn.ts'

// Checked, the accent's step 12 with a neutral step 1 tick, as the solid
// button: a fixed white lost contrast on the bright accents.

/** Checked, unchecked or in between (Radix's Checkbox), in the kit's look.
 *  Pair it with a Label, whose press reaches it. */
export function Checkbox({ className, ...props }: ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      className={cn(
        'peer inline-flex size-4 shrink-0 items-center justify-center rounded-sm border border-field-border bg-field text-neutral-1 transition-colors hover:border-field-border-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:cursor-not-allowed disabled:border-neutral-6 disabled:bg-neutral-2 data-[state=checked]:border-choice-on data-[state=checked]:bg-choice-on data-[state=indeterminate]:border-choice-on data-[state=indeterminate]:bg-choice-on',
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator className="group flex items-center justify-center">
        <Check aria-hidden className="size-3.5 group-data-[state=indeterminate]:hidden" strokeWidth={2.5} />
        <Minus aria-hidden className="hidden size-3.5 group-data-[state=indeterminate]:block" strokeWidth={2.5} />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}
