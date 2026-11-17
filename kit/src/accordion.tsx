'use client'

import type { ComponentProps } from 'react'
import * as AccordionPrimitive from 'radix-ui/accordion'
import { ChevronDown } from 'lucide-react'
import { cn } from './cn.ts'

// The heading is an h3 unless `level` says otherwise, as Radix's page asks
// it to fit the page's headings.

/** Headings that open and close the content under them (Radix's
 *  Accordion): one at a time (`type="single"`) or several. */
export function Accordion({ className, ...props }: ComponentProps<typeof AccordionPrimitive.Root>) {
  return <AccordionPrimitive.Root className={cn('flex flex-col', className)} {...props} />
}

/** A heading and its content. */
export function AccordionItem({ className, ...props }: ComponentProps<typeof AccordionPrimitive.Item>) {
  return <AccordionPrimitive.Item className={cn('border-b border-neutral-6', className)} {...props} />
}

type HeadingLevel = 2 | 3 | 4 | 5 | 6

/** The button that opens and closes an item: Radix's Accordion Trigger,
 *  inside Radix's Header, which is a heading of `level` (3 unless given),
 *  with an arrow that turns as it opens. In the kit's look; it takes
 *  Radix's props, and `level`. */
export function AccordionTrigger({
  className,
  children,
  level = 3,
  ...props
}: ComponentProps<typeof AccordionPrimitive.Trigger> & {
  /** @defaultValue `3` */
  level?: HeadingLevel
}) {
  const Heading = `h${level}` as const
  return (
    <AccordionPrimitive.Header asChild>
      <Heading className="flex">
        <AccordionPrimitive.Trigger
          className={cn(
            'group flex min-h-(--row-height) flex-1 items-center justify-between gap-2 py-2 text-start text-sm font-medium text-neutral-12 transition-colors hover:text-neutral-12 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus disabled:text-neutral-8',
            className,
          )}
          {...props}
        >
          {children}
          <ChevronDown
            aria-hidden
            className="size-4 shrink-0 text-neutral-11 transition-transform duration-200 group-data-[state=open]:rotate-180 motion-reduce:transition-none group-disabled:text-neutral-8"
            strokeWidth={1.75}
          />
        </AccordionPrimitive.Trigger>
      </Heading>
    </AccordionPrimitive.Header>
  )
}

/** What an item opens, to its height (at once with reduced motion). */
export function AccordionContent({ className, children, ...props }: ComponentProps<typeof AccordionPrimitive.Content>) {
  return (
    <AccordionPrimitive.Content
      className="overflow-hidden text-sm text-neutral-11 [--open-height:var(--radix-accordion-content-height)] data-[state=closed]:motion-safe:animate-close-height data-[state=open]:motion-safe:animate-open-height"
      {...props}
    >
      <div className={cn('pb-3', className)}>{children}</div>
    </AccordionPrimitive.Content>
  )
}
