'use client'

import type { ComponentProps } from 'react'
import * as Slot from 'radix-ui/slot'
import { BAR } from './cell.ts'
import { cn } from './cn.ts'

// Three to five sections, each icon and label, as phone tab bars are; the
// same landmark name as a column's NavList with the same links.
//
//   <NavBar aria-label="Sections">
//     <NavBarItem asChild>
//       <NavLink to="/accounts"><Wallet aria-hidden />Accounts</NavLink>
//     </NavBarItem>
//   </NavBar>
//
// Below 1024px only, hidden by CSS so a server's first paint is right; the
// page keeps clear of it by CSS too (theme.css, --bar-space, :has()).

/** A phone's bar of an app's sections along the bottom: a navigation
 *  landmark named by `aria-label`, NavBarItems in equal cells. */
export function NavBar({ className, children, ...props }: ComponentProps<'nav'> & { 'aria-label': string }) {
  return (
    <nav
      data-nav-bar=""
      // The footer's height, its border inside it as in every bar, and
      // room below for a phone's home indicator (the safe-area inset).
      className={cn(
        'fixed inset-x-0 bottom-0 z-[60] h-[calc(var(--footer-height)+env(safe-area-inset-bottom))] border-t border-page-line bg-page-bar pb-[env(safe-area-inset-bottom)] finish lg:hidden',
        className,
      )}
      {...props}
    >
      <ul className={cn(BAR, 'h-full')}>{children}</ul>
    </nav>
  )
}

/** A section: its icon over its label, the whole cell to press; the one
 *  showing (aria-current="page") bold in the chosen colour. `asChild` for a
 *  router's link. */
export function NavBarItem({ asChild, className, ...props }: ComponentProps<'a'> & { asChild?: boolean }) {
  const Link = asChild ? Slot.Root : 'a'
  return (
    <li className="flex min-w-0">
      <Link
        className={cn(
          'flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 text-xs text-neutral-11 transition-colors hover:text-neutral-12 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus aria-[current=page]:font-semibold aria-[current=page]:text-chosen-text [&_svg]:size-5 [&_svg]:shrink-0',
          className,
        )}
        {...props}
      />
    </li>
  )
}
