'use client'

import type { ComponentProps } from 'react'
import { cn } from './cn.ts'

// The page: a header, the content, a footer. It sits in a Layout, which
// fills the window, beside the columns (column.tsx). Plain elements, as
// Radix has no layout parts: header, main and footer are the landmarks a
// screen reader moves by. The bars' heights are CSS variables shared with
// the columns (theme.css), so they line up: a 44px header, a 48px footer.

/** The window: the page, and a column on either side of it or both; the
 *  box the columns float in when they are over the page. */
export function Layout({ className, ...props }: ComponentProps<'div'>) {
    // In a right-to-left page the row is reversed, so a left column stays at
    // the left; an app wanting its navigation on the right gives side="right".
  return <div className={cn('relative flex h-dvh w-full overflow-hidden rtl:flex-row-reverse', className)} {...props} />
}

/** The page's room beside the columns. From 1024px up it keeps at least
 *  400px, however wide the columns are dragged. */
export function Page({ className, ...props }: ComponentProps<'div'>) {
  // Clear of the bottom bar on a phone (--bar-space, 0 without one).
  return <div className={cn('flex h-full min-w-0 flex-1 flex-col pb-(--bar-space) lg:min-w-[400px]', className)} {...props} />
}

/** The page's header: the bar's height plus a phone's safe-area inset,
 *  its border inside, so it lines up with the columns' headers. */
export function PageHeader({ className, ...props }: ComponentProps<'header'>) {
  return (
    <header
      className={cn('flex h-[calc(var(--header-height)+env(safe-area-inset-top))] shrink-0 items-stretch border-b border-page-line bg-page-bar pt-[env(safe-area-inset-top)] finish', className)}
      {...props}
    />
  )
}

/** The page's scrolling content, the skip link's target. With `snap`,
 *  scrolling rests at each PageSection's start: `snap` or
 *  `snap="proximity"` when one is near, `snap="mandatory"` always (for
 *  sections no taller than the room). A tab stop, so the keyboard can
 *  scroll it when nothing in it takes focus; -1 would take that away. */
export function PageContent({ snap, tabIndex = 0, className, ...props }: ComponentProps<'main'> & { snap?: boolean | 'proximity' | 'mandatory' }) {
  return (
    <main
      tabIndex={tabIndex}
      className={cn(
        'min-h-0 flex-1 overflow-y-auto focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus',
        snap && 'snap-y',
        snap === 'mandatory' ? 'snap-mandatory' : snap && 'snap-proximity',
        className,
      )}
      {...props}
    />
  )
}

/** A section of the page; in a PageContent with `snap`, a place
 *  scrolling rests at. */
export function PageSection({ className, ...props }: ComponentProps<'section'>) {
  return <section className={cn('snap-start', className)} {...props} />
}

/** The page's footer, along its bottom, lined up with the columns'
 *  footers. */
export function PageFooter({ className, ...props }: ComponentProps<'footer'>) {
  return <footer className={cn('flex h-(--footer-height) shrink-0 items-stretch border-t border-page-line bg-page-bar finish', className)} {...props} />
}
