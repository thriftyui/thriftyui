'use client'

import type { ComponentProps } from 'react'
import { cn } from './cn.ts'

// The browser's <table>, as the W3C's Table pattern advises; parts named
// as shadcn's. The scrolling box is a tab stop so the keyboard can scroll
// it.

/** A table of data on the browser's own <table>, in a box that scrolls
 *  sideways when the table is wider than its room. The box is a tab stop,
 *  so the keyboard can scroll it; given `aria-label`, it is a region of
 *  that name. Name the table by a TableCaption or that label. */
export function Table({ className, 'aria-label': label, ...props }: ComponentProps<'table'>) {
  return (
    <div tabIndex={0} role={label ? 'region' : undefined} aria-label={label} className="w-full overflow-x-auto rounded-md focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus">
      <table aria-label={label} className={cn('w-full caption-bottom border-collapse text-sm', className)} {...props} />
    </div>
  )
}

/** The table's head rows: the browser's <thead>, a line under its last row. */
export function TableHeader({ className, ...props }: ComponentProps<'thead'>) {
  return <thead className={cn('[&_tr]:border-b [&_tr]:border-neutral-6', className)} {...props} />
}

/** The table's body rows: the browser's <tbody>, no line under its last
 *  row. */
export function TableBody({ className, ...props }: ComponentProps<'tbody'>) {
  return <tbody className={cn('[&_tr:last-child]:border-0', className)} {...props} />
}

/** The table's foot rows, totals say: the browser's <tfoot>, a line above,
 *  in medium weight. */
export function TableFooter({ className, ...props }: ComponentProps<'tfoot'>) {
  return <tfoot className={cn('border-t border-neutral-6 font-medium', className)} {...props} />
}

/** A row: the browser's <tr>, a line under it. */
export function TableRow({ className, ...props }: ComponentProps<'tr'>) {
  return <tr className={cn('border-b border-neutral-6', className)} {...props} />
}

/** A header cell: the browser's <th>, a column's header (`scope="col"`)
 *  unless given another scope, a row's header say. */
export function TableHead({ scope = 'col', className, ...props }: ComponentProps<'th'>) {
  return <th scope={scope} className={cn('h-10 px-3 text-start align-middle font-medium whitespace-nowrap text-neutral-11', className)} {...props} />
}

/** A data cell: the browser's <td>. */
export function TableCell({ className, ...props }: ComponentProps<'td'>) {
  return <td className={cn('px-3 py-2.5 align-middle text-neutral-12', className)} {...props} />
}

/** The table's name, shown under it: the browser's <caption>, which names
 *  the table for a screen reader. */
export function TableCaption({ className, ...props }: ComponentProps<'caption'>) {
  return <caption className={cn('mt-3 text-sm text-neutral-11', className)} {...props} />
}
