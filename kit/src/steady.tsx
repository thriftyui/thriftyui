'use client'

import { cn } from './cn.ts'

// The word over a hidden bold copy of itself in one grid column, so the
// column is the bold width. The copy is ::after content with visibility:
// hidden -- never read out -- and its overflow across left visible, or a tab
// sized as small as it can be would lose the bold width again; its overflow
// down clipped, so the copy below its zero height makes nothing scroll.

/** Words that keep the width of their bold selves, so turning bold moves
 *  nothing beside them. The kit's TabsTrigger puts plain words through it
 *  by itself. */
export function Steady({ children, className }: { children: string; className?: string }) {
  return (
    <span
      data-text={children}
      className={cn(
        'inline-grid after:invisible after:h-0 after:overflow-y-clip after:font-semibold after:select-none after:content-[attr(data-text)]',
        className,
      )}
    >
      {children}
    </span>
  )
}
