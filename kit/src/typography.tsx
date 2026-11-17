'use client'

import type { ComponentProps } from 'react'
import * as Slot from 'radix-ui/slot'
import { cn } from './cn.ts'

// Each on its own HTML element. A link is underlined, not told by colour
// alone.

const HEADING_SIZES = { 1: 'text-3xl', 2: 'text-2xl', 3: 'text-xl', 4: 'text-lg', 5: 'text-base', 6: 'text-sm' } as const

/** A heading, <h1> to <h6> by `level`; its size follows the level unless
 *  `size` gives another, so the outline and the look can differ. */
export function Heading({
  level = 2,
  size,
  className,
  ...props
}: ComponentProps<'h2'> & {
  /** @defaultValue `2` */
  level?: 1 | 2 | 3 | 4 | 5 | 6
  size?: 1 | 2 | 3 | 4 | 5 | 6
}) {
  const Tag = `h${level}` as const
  return <Tag className={cn('font-semibold tracking-tight text-neutral-12', HEADING_SIZES[size ?? level], className)} {...props} />
}

const TEXT_SIZES = { xs: 'text-xs', sm: 'text-sm', md: 'text-base', lg: 'text-lg' } as const

/** A paragraph (or, with `asChild`, the element given -- a <span>, a
 *  <label>), in four sizes, its colour the text's or, `quiet`, the quiet
 *  text's. */
export function Text({
  size = 'md',
  quiet = false,
  asChild = false,
  className,
  ...props
}: ComponentProps<'p'> & {
  /** @defaultValue `'md'` */
  size?: keyof typeof TEXT_SIZES
  /** @defaultValue `false` */
  quiet?: boolean
  /** @defaultValue `false` */
  asChild?: boolean
}) {
  const Comp = asChild ? Slot.Root : 'p'
  return <Comp className={cn(TEXT_SIZES[size], quiet ? 'text-neutral-11' : 'text-neutral-12', className)} {...props} />
}

/** A link: an <a>, or with `asChild` a router's link, given the look. */
export function Link({ asChild = false, className, ...props }: ComponentProps<'a'> & {
  /** @defaultValue `false` */
  asChild?: boolean
}) {
  const Comp = asChild ? Slot.Root : 'a'
  return (
    <Comp
      className={cn(
        'rounded-xs text-accent-12 underline underline-offset-2 hover:decoration-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus',
        className,
      )}
      {...props}
    />
  )
}

/** A short fragment of code in a line of text: the browser's <code>. */
export function Code({ className, ...props }: ComponentProps<'code'>) {
  return <code className={cn('rounded-sm bg-neutral-3 px-1 py-0.5 font-mono text-[0.9em] text-neutral-12', className)} {...props} />
}

/** A block of code: a <pre> that keeps its lines and scrolls sideways
 *  when they are long, a tab stop ringed for the keyboard to scroll it
 *  (axe-core, scrollable-region-focusable), named by `aria-label`. Its
 *  text takes the colour around it, so a tool's quiet line stays quiet;
 *  lines marked removed or added colour their own spans. */
export function CodeBlock({ className, ...props }: ComponentProps<'pre'>) {
  return (
    <pre
      tabIndex={0}
      className={cn(
        'overflow-x-auto rounded-md bg-neutral-3 px-2 py-1.5 font-mono text-xs leading-5 whitespace-pre focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus',
        className,
      )}
      {...props}
    />
  )
}

/** A quotation from another source: the browser's <blockquote>; its
 *  source's address in `cite`, and its name, if shown, in a <cite> after. */
export function Blockquote({ className, ...props }: ComponentProps<'blockquote'>) {
  return <blockquote className={cn('border-s-2 border-neutral-6 ps-4 text-neutral-11', className)} {...props} />
}
