'use client'

import type { ComponentProps } from 'react'
import * as Slot from 'radix-ui/slot'
import { cn } from './cn.ts'

// Parts named as shadcn's. No shadow: it does not float.

/** A card: a box with a border on the card's ground, holding the parts
 *  below. `asChild` puts its look on the one element given, a <section> or
 *  an <a>, say. */
export function Card({ asChild = false, className, ...props }: ComponentProps<'div'> & {
  /** @defaultValue `false` */
  asChild?: boolean
}) {
  const Comp = asChild ? Slot.Root : 'div'
  return <Comp className={cn('flex flex-col rounded-lg border border-card-line bg-card', className)} {...props} />
}

/** The card's head: its title and description, stacked. */
export function CardHeader({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('flex flex-col gap-1 p-4 pb-0', className)} {...props} />
}

/** The card's title: an <h3> unless `asChild` gives another heading, so it
 *  sits under the page's own headings in order. */
export function CardTitle({ asChild = false, className, ...props }: ComponentProps<'h3'> & {
  /** @defaultValue `false` */
  asChild?: boolean
}) {
  const Comp = asChild ? Slot.Root : 'h3'
  return <Comp className={cn('text-base font-semibold text-neutral-12', className)} {...props} />
}

/** A line under the card's title: smaller, gray 11. */
export function CardDescription({ className, ...props }: ComponentProps<'p'>) {
  return <p className={cn('text-sm text-neutral-11', className)} {...props} />
}

/** The card's body, padded. */
export function CardContent({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('p-4 text-sm', className)} {...props} />
}

/** The card's foot: a row of actions, padded. */
export function CardFooter({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('flex items-center gap-2 p-4 pt-0', className)} {...props} />
}
