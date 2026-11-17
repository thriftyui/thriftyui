'use client'

import type { ComponentProps, MouseEvent } from 'react'
import { cn } from './cn.ts'

// Hidden until focused (WCAG technique G1); it moves focus itself, so the
// address gains no "#main".
//
//   <SkipLink href="#main">Skip to content</SkipLink>  ...first in the app
//   <PageContent id="main" tabIndex={-1}>

/** The first thing a keyboard reaches: a link to the page's content
 *  (`href`, "#main" unless given), hidden until focused. It moves focus to
 *  the element it names, which needs tabIndex={-1}. */
export function SkipLink({ href = '#main', className, onClick, ...props }: ComponentProps<'a'>) {
  return (
    <a
      href={href}
      onClick={(e: MouseEvent<HTMLAnchorElement>) => {
        onClick?.(e)
        const target = href.startsWith('#') ? document.getElementById(href.slice(1)) : null
        if (e.defaultPrevented || !target) return
        e.preventDefault()
        target.focus()
      }}
      className={cn(
        'sr-only focus:not-sr-only focus:fixed focus:top-2 focus:inset-s-2 focus:z-[100] focus:rounded-md focus:bg-neutral-1 focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:text-neutral-12 focus:outline-2 focus:outline-focus',
        className,
      )}
      {...props}
    />
  )
}
