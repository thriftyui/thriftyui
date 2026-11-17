'use client'

import type { ComponentProps } from 'react'
import * as Slot from 'radix-ui/slot'
import { cn } from './cn.ts'

// Parts named as shadcn's; EmptyTitle is a heading (shadcn's is a div), so
// a screen reader can reach it.

/** What a place shows with nothing in it yet, and what to do about it:
 *  centred, holding EmptyHeader and EmptyContent. A border, if wanted, is
 *  its className. */
export function Empty({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('flex min-w-0 flex-1 flex-col items-center justify-center gap-6 rounded-lg p-6 text-center text-balance md:p-12', className)} {...props} />
}

/** The empty state's head: its EmptyMedia, EmptyTitle and EmptyDescription,
 *  stacked and centred. */
export function EmptyHeader({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('flex max-w-sm flex-col items-center gap-2', className)} {...props} />
}

/** An icon, on its own; for the eye only. */
export function EmptyMedia({ className, ...props }: ComponentProps<'div'>) {
  return <div aria-hidden className={cn('mb-2 flex shrink-0 items-center justify-center text-neutral-11 [&_svg]:size-8 [&_svg]:shrink-0', className)} {...props} />
}

/** What is empty, as a heading: an <h3>, or with `asChild` the heading
 *  element given, for another level. */
export function EmptyTitle({ asChild = false, className, ...props }: ComponentProps<'h3'> & {
  /** @defaultValue `false` */
  asChild?: boolean
}) {
  const Comp = asChild ? Slot.Root : 'h3'
  return <Comp className={cn('text-lg font-medium tracking-tight text-neutral-12', className)} {...props} />
}

/** A line or two under the title: why it is empty, what will fill it. */
export function EmptyDescription({ className, ...props }: ComponentProps<'p'>) {
  return <p className={cn('text-sm/relaxed text-neutral-11', className)} {...props} />
}

/** What to do: a button, a link. */
export function EmptyContent({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('flex w-full max-w-sm min-w-0 flex-col items-center gap-4 text-sm text-balance', className)} {...props} />
}
