'use client'

import type { ComponentProps, ReactNode } from 'react'
import * as Slot from 'radix-ui/slot'
import { ChevronDown } from 'lucide-react'
import { ROW } from './cell.ts'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './collapsible.tsx'
import { cn } from './cn.ts'

// The kit needs no router: NavItem styles the link it is given.
//
//   <NavList aria-label="Pages">
//     <NavItem asChild><NavLink to="/" end>Overview</NavLink></NavItem>
//   </NavList>

/** A list of places to go: a navigation landmark, named by `aria-label` for
 *  what it lists, holding NavItems in a <ul>. */
export function NavList({ className, children, ...props }: ComponentProps<'nav'> & { 'aria-label': string }) {
  return (
    <nav className={className} {...props}>
      <ul className="flex flex-col">{children}</ul>
    </nav>
  )
}

/** A place in the list: a link the list's width, marked where it is aria-
 *  current="page". `asChild` puts its look on a router's link, React
 *  Router's NavLink say, which sets aria-current itself. */
export function NavItem({ asChild, className, ...props }: ComponentProps<'a'> & { asChild?: boolean }) {
  const Link = asChild ? Slot.Root : 'a'
  return (
    <li>
      <Link className={cn(ROW, className)} {...props} />
    </li>
  )
}

/** A group of places under a button that shows and hides them -- the
 *  W3C's disclosure pattern for site navigation (not an accordion or a
 *  tree). Give `defaultOpen` to the group holding the page showing.
 *
 *    <NavGroup label="Layouts" defaultOpen={inLayouts}>
 *      <NavItem asChild><NavLink to="/layouts/page">Page</NavLink></NavItem>
 *    </NavGroup> */
export function NavGroup({
  label,
  defaultOpen,
  open,
  onOpenChange,
  className,
  children,
}: {
  label: ReactNode
  defaultOpen?: boolean
  open?: boolean
  onOpenChange?: (open: boolean) => void
  className?: string
  children: ReactNode
}) {
  return (
    <li>
      <Collapsible defaultOpen={defaultOpen} open={open} onOpenChange={onOpenChange}>
        <CollapsibleTrigger className={cn(ROW, 'group justify-between', className)}>
          {label}
          <ChevronDown
            aria-hidden
            className="size-4 shrink-0 transition-transform group-data-[state=open]:rotate-180 motion-reduce:transition-none"
            strokeWidth={1.75}
          />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <ul className="flex flex-col [&>li>a]:ps-6">{children}</ul>
        </CollapsibleContent>
      </Collapsible>
    </li>
  )
}
