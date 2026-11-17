'use client'

import type { ComponentProps } from 'react'
import { cn } from './cn.ts'

// The accent under step 12 text: step 11 on step 3 falls under 4.5:1 with
// some accents a theme can choose.

const TONES = {
  gray: 'bg-badge text-badge-text',
  accent: 'bg-badge-accent text-badge-accent-text',
  danger: 'bg-badge-danger text-badge-danger-text',
} as const

/** A short label beside something -- a count, a state, "New" -- read as
 *  part of its text, in a `tone`: gray, accent or danger. */
export function Badge({ tone = 'gray', className, ...props }: ComponentProps<'span'> & {
  /** @defaultValue `'gray'` */
  tone?: keyof typeof TONES
}) {
  return <span className={cn('inline-flex w-fit shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap [&_svg]:size-3', TONES[tone], className)} {...props} />
}
