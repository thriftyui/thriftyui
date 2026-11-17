'use client'

import { cloneElement, createContext, isValidElement, useContext, type ComponentProps, type ReactElement, type ReactNode } from 'react'
import * as NavigationMenuPrimitive from 'radix-ui/navigation-menu'
import { ChevronDown } from 'lucide-react'
import { cn } from './cn.ts'
import { Steady } from './steady.tsx'
import { SURFACE } from './surface.ts'

// Navigation (a <nav>), not a menu. A link takes its look from where it
// is -- a cell in the bar, a row in the content -- told by context, since
// Radix renders the content in its Viewport.

const InContent = createContext(false)
/** A site's links along a bar, some opening content of more links
 *  (Radix's Navigation Menu), shown in a surface under the item. */
export function NavigationMenu({ className, children, ...props }: ComponentProps<typeof NavigationMenuPrimitive.Root>) {
  return (
    <NavigationMenuPrimitive.Root className={cn('relative z-10 flex', className)} {...props}>
      {children}
      {/* Round the viewport too: Radix draws the content's links inside it. */}
      <div className="absolute top-full inset-s-0 flex justify-start pt-1">
        <NavigationMenuPrimitive.Viewport
          className={cn(
            SURFACE,
            'relative h-(--radix-navigation-menu-viewport-height) w-(--radix-navigation-menu-viewport-width) overflow-hidden transition-[width,height] duration-200 motion-reduce:transition-none',
          )}
        />
      </div>
    </NavigationMenuPrimitive.Root>
  )
}

/** The bar's items. */
export function NavigationMenuList({ className, ...props }: ComponentProps<typeof NavigationMenuPrimitive.List>) {
  return <NavigationMenuPrimitive.List className={cn('flex min-h-(--row-height) items-stretch', className)} {...props} />
}

/** An item: a link, or a trigger with its content. */
export const NavigationMenuItem = NavigationMenuPrimitive.Item

const CELL_TEXT =
  'flex items-center gap-1 px-3 text-sm text-neutral-11 outline-hidden transition-colors select-none hover:text-neutral-12 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus data-[active]:font-semibold data-[active]:text-accent-12 data-[state=open]:text-neutral-12'

/** The button that opens an item's content. */
export function NavigationMenuTrigger({ className, children, ...props }: ComponentProps<typeof NavigationMenuPrimitive.Trigger>) {
  return (
    <NavigationMenuPrimitive.Trigger className={cn(CELL_TEXT, 'group', className)} {...props}>
      {children}
      <ChevronDown aria-hidden className="size-3.5 transition-transform duration-200 group-data-[state=open]:rotate-180 motion-reduce:transition-none" strokeWidth={1.75} />
    </NavigationMenuPrimitive.Trigger>
  )
}

/** An item's content of more links. */
export function NavigationMenuContent({ className, children, ...props }: ComponentProps<typeof NavigationMenuPrimitive.Content>) {
  return (
    <NavigationMenuPrimitive.Content
      // Laid over each other in the viewport, as Radix's own example, so one fades out where the next fades in.
      className={cn('absolute top-0 inset-s-0 w-max p-2 data-[motion^=from-]:motion-safe:animate-fade-in data-[motion^=to-]:motion-safe:animate-fade-out', className)}
      {...props}
    >
      <InContent.Provider value>{children}</InContent.Provider>
    </NavigationMenuPrimitive.Content>
  )
}

/** Plain words, or a link given by asChild holding plain words, kept at their bold width (Steady), so the
 *  page's link turning bold moves none beside it. */
function steady(children: ReactNode, asChild?: boolean): ReactNode {
  if (typeof children === 'string' && !asChild) return <Steady>{children}</Steady>
  if (asChild && isValidElement(children)) {
    const child = children as ReactElement<{ children?: ReactNode }>
    if (typeof child.props.children === 'string') return cloneElement(child, undefined, <Steady>{child.props.children}</Steady>)
  }
  return children
}

/** A link: a cell in the bar, a row inside NavigationMenuContent. The page
 *  showing is marked with `active` (Radix then sets aria-current). */
export function NavigationMenuLink({ className, children, asChild, ...props }: ComponentProps<typeof NavigationMenuPrimitive.Link>) {
  const inContent = useContext(InContent)
  return (
    <NavigationMenuPrimitive.Link
      className={cn(
        inContent
          ? 'block rounded-md px-3 py-2 text-sm text-neutral-12 transition-colors hover:text-accent-12 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus data-[active]:font-semibold data-[active]:text-chosen-text'
          : CELL_TEXT,
        className,
      )}
      asChild={asChild}
      {...props}
    >
      {steady(children, asChild)}
    </NavigationMenuPrimitive.Link>
  )
}
