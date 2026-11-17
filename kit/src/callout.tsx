'use client'

import type { ComponentProps } from 'react'
import { cn } from './cn.ts'

const TONES = {
  gray: 'bg-neutral-3 text-neutral-12',
  accent: 'bg-accent-3 text-accent-12',
  danger: 'bg-danger-3 text-danger-12',
  success: 'bg-success-3 text-success-12',
  warning: 'bg-warning-3 text-warning-12',
} as const

/** A short message set apart from the page, in one of five `tone`s (gray
 *  the default), on the tone's step 3 with step 12 text. Read where it
 *  stands; for a message that must interrupt, give it role="alert". */
export function Callout({ tone = 'gray', className, ...props }: ComponentProps<'div'> & {
  /** @defaultValue `'gray'` */
  tone?: keyof typeof TONES
}) {
  return <div className={cn('flex items-start gap-3 rounded-lg p-3 text-sm', TONES[tone], className)} {...props} />
}

/** An icon before the text, for the eye: aria-hidden it, as the text says
 *  what matters. */
export function CalloutIcon({ className, ...props }: ComponentProps<'span'>) {
  return <span aria-hidden className={cn('flex h-5 shrink-0 items-center [&_svg]:size-4', className)} {...props} />
}

/** The callout's words, beside its icon. */
export function CalloutText({ className, ...props }: ComponentProps<'p'>) {
  return <p className={cn('min-w-0 leading-5', className)} {...props} />
}
