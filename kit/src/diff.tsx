'use client'

import type { ComponentProps } from 'react'
import { cn } from './cn.ts'
import { CodeBlock } from './typography.tsx'

// <del> and <ins>, whose roles a screen reader may say; each line marked
// - or + as well as by colour, the marks left out of a selection.

/** A change to some text, as lines: what was `removed`, then what was
 *  `added`, each marked - or + as well as by colour, in the kit's
 *  CodeBlock, a tab stop that scrolls sideways. Name it with `aria-label`. */
export function Diff({
  removed,
  added,
  className,
  ...props
}: Omit<ComponentProps<'pre'>, 'children'> & {
  /** The lines taken out; none for a new file. */
  removed?: string
  /** The lines put in; none for a deletion. */
  added?: string
}) {
  const lines = (text: string | undefined) => (text === undefined ? [] : text.split('\n'))
  return (
    <CodeBlock className={cn('px-0', className)} {...props}>
      {/* As wide as its longest line, so each line's ground runs to the
          end when it is scrolled sideways (fit-content: CSS Box Sizing). */}
      <span className="block w-fit min-w-full">
      {lines(removed).map((l, i) => (
        <del key={`-${i}`} className="block bg-danger-3 px-2 text-danger-12 no-underline">
          <span className="select-none">- </span>
          {l}
        </del>
      ))}
      {lines(added).map((l, i) => (
        <ins key={`+${i}`} className="block bg-success-3 px-2 text-success-12 no-underline">
          <span className="select-none">+ </span>
          {l}
        </ins>
      ))}
      </span>
    </CodeBlock>
  )
}
