'use client'

import type { ComponentProps } from 'react'
import { cn } from './cn.ts'

/** A key to press, or a shortcut: the browser's <kbd>, read as keyboard
 *  input, in the mono font. For several keys, a Kbd each, side by side. */
export function Kbd({ className, ...props }: ComponentProps<'kbd'>) {
  return (
    <kbd
      className={cn('inline-flex h-5 min-w-5 items-center justify-center rounded-sm border border-neutral-6 bg-neutral-2 px-1 font-mono text-[0.75rem] font-medium text-neutral-11', className)}
      {...props}
    />
  )
}
