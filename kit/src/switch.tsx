'use client'

import type { ComponentProps } from 'react'
import * as SwitchPrimitive from 'radix-ui/switch'
import { cn } from './cn.ts'

// The knob is neutral step 1, not a fixed white, which lost contrast on
// the bright accents a theme can choose.

/** On or off (Radix's Switch), in the kit's look; pair it with a Label. */
export function Switch({ className, ...props }: ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      className={cn(
        'peer inline-flex h-5 w-9 shrink-0 items-center rounded-full bg-choice-track p-0.5 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:cursor-not-allowed disabled:bg-neutral-5 data-[state=checked]:bg-choice-on',
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb className="block size-4 rounded-full bg-neutral-1 shadow-sm transition-transform data-[state=checked]:translate-x-4 motion-reduce:transition-none" />
    </SwitchPrimitive.Root>
  )
}
