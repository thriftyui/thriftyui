'use client'

import type { ComponentProps } from 'react'
import * as Slot from 'radix-ui/slot'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { CELL_ICON } from './cell.ts'
import { cn } from './cn.ts'

// The W3C has no pagination pattern; this follows its landmarks and
// aria-current. Parts named as shadcn's. At an end, Previous or Next has no
// href, so it is given role="link" and aria-disabled to keep its name.
//
//   <Pagination>
//     <PaginationContent>
//       <PaginationItem><PaginationPrevious href={page > 1 ? `?p=${page - 1}` : undefined} /></PaginationItem>
//       {pageRange(page, total).map((p, i) =>
//         <PaginationItem key={i}>{p === 'gap' ? <PaginationEllipsis /> : <PaginationLink href={`?p=${p}`} current={p === page}>{p}</PaginationLink>}</PaginationItem>)}
//       <PaginationItem><PaginationNext href={page < total ? `?p=${page + 1}` : undefined} /></PaginationItem>
//     </PaginationContent>
//   </Pagination>

const PAGE_CELL =
  'flex h-(--row-height) min-w-(--row-height) items-center justify-center gap-1 rounded-md px-2 text-sm text-neutral-11 tabular-nums transition-colors hover:text-neutral-12 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus aria-[current=page]:font-semibold aria-[current=page]:text-chosen-text aria-disabled:pointer-events-none aria-disabled:text-neutral-8'

/** Links to the pages of something too long for one: a navigation landmark,
 *  named "Pagination" unless given `aria-label`, holding a
 *  PaginationContent. */
export function Pagination({ 'aria-label': label = 'Pagination', className, ...props }: ComponentProps<'nav'>) {
  return <nav aria-label={label} className={cn('flex justify-center', className)} {...props} />
}

/** The pages' list: the browser's <ul>, in a row. */
export function PaginationContent({ className, ...props }: ComponentProps<'ul'>) {
  return <ul className={cn('flex items-center gap-1', className)} {...props} />
}

/** One place in the list -- a page, Previous, Next, a gap: the browser's
 *  <li>. */
export function PaginationItem(props: ComponentProps<'li'>) {
  return <li {...props} />
}

/** A page; `current` for the one showing. `asChild` for a router's link. */
export function PaginationLink({ asChild, current, className, ...props }: ComponentProps<'a'> & { asChild?: boolean; current?: boolean }) {
  const Link = asChild ? Slot.Root : 'a'
  return <Link aria-current={current ? 'page' : undefined} className={cn(PAGE_CELL, className)} {...props} />
}

function Step({ by, href, className, ...props }: ComponentProps<'a'> & { by: -1 | 1 }) {
  return (
    <a
      href={href}
      {...(href ? {} : { role: 'link', 'aria-disabled': true })}
      aria-label={by < 0 ? 'Previous page' : 'Next page'}
      className={cn(PAGE_CELL, className)}
      {...props}
    >
      {by < 0 ? <ChevronLeft aria-hidden className={cn(CELL_ICON, 'rtl:-scale-x-100')} strokeWidth={1.75} /> : <ChevronRight aria-hidden className={cn(CELL_ICON, 'rtl:-scale-x-100')} strokeWidth={1.75} />}
    </a>
  )
}

/** No href at the first page. */
export function PaginationPrevious(props: ComponentProps<'a'>) {
  return <Step by={-1} {...props} />
}

/** No href at the last page. */
export function PaginationNext(props: ComponentProps<'a'>) {
  return <Step by={1} {...props} />
}

/** Pages left out: drawn, not read (the numbers either side say it). */
export function PaginationEllipsis({ className, ...props }: ComponentProps<'span'>) {
  return (
    <span aria-hidden className={cn('flex h-(--row-height) min-w-(--row-height) items-center justify-center text-sm text-neutral-11', className)} {...props}>
      ...
    </span>
  )
}
