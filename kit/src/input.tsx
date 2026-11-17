'use client'

import type { ComponentProps } from 'react'
import { cn } from './cn.ts'

// The border is all that shows a field is there, so it holds 3:1 against
// the page; the placeholder is step 11, as step 10 falls under 4.5:1.

/** The kit's field look as a class list, for a control that must look like
 *  Input without being one. */
export const FIELD =
  'w-full min-w-0 rounded-md border border-field-border bg-field px-3 text-sm text-neutral-12 transition-colors placeholder:text-neutral-11 hover:border-field-border-hover focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-focus disabled:cursor-not-allowed disabled:bg-neutral-2 disabled:text-neutral-8'

/** A field to type in: the browser's <input> in the kit's field look. */
export function Input({ className, ...props }: ComponentProps<'input'>) {
  return <input className={cn(FIELD, 'min-h-(--row-height)', className)} {...props} />
}
