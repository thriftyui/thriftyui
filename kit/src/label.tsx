'use client'

import type { ComponentProps } from 'react'
import * as LabelPrimitive from 'radix-ui/label'
import { cn } from './cn.ts'

/** Radix's Label, in the kit's look: tied to its control by `htmlFor`; a
 *  press on it reaches the control. */
export function Label({ className, ...props }: ComponentProps<typeof LabelPrimitive.Root>) {
  return <LabelPrimitive.Root className={cn('text-sm font-medium text-neutral-12 select-none', className)} {...props} />
}
