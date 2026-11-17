'use client'

import type { ComponentProps } from 'react'
import { LoaderCircle } from 'lucide-react'
import { cn } from './cn.ts'

// A status, not silent as Radix Themes' is: a screen reader hears `label`
// when it appears.

/** A sign that something is loading: a turning circle, and `label` said to
 *  a screen reader. Still where less motion is asked for. */
export function Spinner({ label = 'Loading', className, ...props }: ComponentProps<'span'> & {
  /** @defaultValue `'Loading'` */
  label?: string
}) {
  return (
    <span role="status" className={cn('inline-flex text-neutral-11', className)} {...props}>
      <LoaderCircle aria-hidden className="size-4 motion-safe:animate-spin" strokeWidth={2} />
      <span className="sr-only">{label}</span>
    </span>
  )
}
