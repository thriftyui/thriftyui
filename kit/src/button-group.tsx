'use client'

import type { ComponentProps } from 'react'
import { GROUP, GROUP_CELL } from './cell.ts'
import { cn } from './cn.ts'

// Radix has no part for it -- a group of buttons is buttons -- so a
// role="group", each button its own tab stop.

/** A row of buttons in equal cells, named by `aria-label`. For choosing
 *  one of several, SegmentedControl. */
export function ButtonGroup({ className, ...props }: ComponentProps<'div'> & { 'aria-label': string }) {
  return <div role="group" className={cn(GROUP, className)} {...props} />
}

/** A button of the group: text or an icon, the text cut short where it has
 *  no room. */
export function ButtonGroupItem({ className, children, ...props }: ComponentProps<'button'>) {
  return (
    <button type="button" className={cn(GROUP_CELL, className)} {...props}>
      <span className="truncate">{children}</span>
    </button>
  )
}
