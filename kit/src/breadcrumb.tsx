'use client'

import type { ComponentProps } from 'react'
import * as Slot from 'radix-ui/slot'
import { cn } from './cn.ts'

// After the W3C's Breadcrumb pattern: a labelled nav, the current page
// aria-current="page", separators drawn in CSS so none is read.
//
//   <Breadcrumb>
//     <BreadcrumbList>
//       <BreadcrumbItem><BreadcrumbLink href="/">Home</BreadcrumbLink></BreadcrumbItem>
//       <BreadcrumbItem><BreadcrumbPage>Settings</BreadcrumbPage></BreadcrumbItem>
//     </BreadcrumbList>
//   </Breadcrumb>

/** Where the page sits, the pages above it in order and the page itself
 *  last: a navigation landmark, named "Breadcrumb" unless given `aria-
 *  label`, holding a BreadcrumbList. */
export function Breadcrumb({ 'aria-label': label = 'Breadcrumb', ...props }: ComponentProps<'nav'>) {
  return <nav aria-label={label} {...props} />
}

/** The trail: the browser's <ol>, its items in a row that wraps, the
 *  separators drawn in CSS so a screen reader reads none. */
export function BreadcrumbList({ className, ...props }: ComponentProps<'ol'>) {
  return <ol className={cn('flex flex-wrap items-center text-sm text-neutral-11', className)} {...props} />
}

/** From the second on, a slanted line before it. */
export function BreadcrumbItem({ className, ...props }: ComponentProps<'li'>) {
  return (
    <li
      className={cn(
        "inline-flex items-center not-first:before:mx-2 not-first:before:inline-block not-first:before:h-[0.8em] not-first:before:rotate-15 rtl:not-first:before:-rotate-15 not-first:before:border-r not-first:before:border-neutral-8 not-first:before:content-['']",
        className,
      )}
      {...props}
    />
  )
}

/** A page above this one; `current` when it is this page. `asChild` for a
 *  router's link, as NavItem (nav-list.tsx). */
export function BreadcrumbLink({ asChild, current, className, ...props }: ComponentProps<'a'> & { asChild?: boolean; current?: boolean }) {
  const Link = asChild ? Slot.Root : 'a'
  return (
    <Link
      aria-current={current ? 'page' : undefined}
      className={cn(
        'rounded-sm underline-offset-2 transition-colors hover:text-neutral-12 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus aria-[current=page]:font-medium aria-[current=page]:text-neutral-12',
        className,
      )}
      {...props}
    />
  )
}

/** This page, when it is not a link. */
export function BreadcrumbPage({ className, ...props }: ComponentProps<'span'>) {
  return <span aria-current="page" className={cn('font-medium text-neutral-12', className)} {...props} />
}
