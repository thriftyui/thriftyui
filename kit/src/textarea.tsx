'use client'

import type { ComponentProps } from 'react'
import { FIELD } from './input.tsx'
import { cn } from './cn.ts'

/** Several lines to type in: the browser's <textarea> in the kit's field
 *  look, three rows to start, resized up and down only. */
export function Textarea({ className, ...props }: ComponentProps<'textarea'>) {
  return <textarea className={cn(FIELD, 'min-h-[calc(3*var(--row-height))] resize-y py-2', className)} {...props} />
}
