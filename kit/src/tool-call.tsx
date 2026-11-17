'use client'

import { Children, type ComponentProps, type ReactNode } from 'react'
import { ChevronRight } from 'lucide-react'
import { cn } from './cn.ts'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './collapsible.tsx'

//   <ToolCall action="Edited" subject="src/app.ts">
//     <Diff removed={before} added={after} aria-label="The change to src/app.ts" />
//   </ToolCall>

/** One thing an assistant did -- read a file, ran a command: a quiet line
 *  of its `action` and `subject`, opening to its children as its detail
 *  (Radix's Collapsible). `running` adds an ellipsis and "running";
 *  `failed`, the danger colour and "failed". With no detail, a line, not a
 *  button. */
export function ToolCall({
  action,
  subject,
  running = false,
  failed = false,
  defaultOpen,
  className,
  children,
  ...props
}: Omit<ComponentProps<'div'>, 'title'> & {
  /** What was done: "Read", "Ran", "Searched for". */
  action: ReactNode
  /** To what: a file, a command, a search. */
  subject?: ReactNode
  /** It has not finished.
   *  @defaultValue `false` */
  running?: boolean
  /** It ended in an error.
   *  @defaultValue `false` */
  failed?: boolean
  /** Open to start with. */
  defaultOpen?: boolean
  /** Its detail, shown when the line is opened. */
  children?: ReactNode
}) {
  const line = (
    <>
      {/* The spaces between the parts are for the line's name, which a
          screen reader reads; a flex row draws none of them. */}
      <span className={cn('shrink-0 font-medium', failed && 'text-danger-11')}>{action}</span>
      {subject !== undefined && subject !== '' && <> <span className="min-w-0 truncate font-mono">{subject}</span></>}
      {failed && <> <span className="shrink-0 text-danger-11">failed</span></>}
      {running && (
        <>
          {' '}
          <span aria-hidden className="shrink-0">
            …
          </span>
          <span className="sr-only">running</span>
        </>
      )}
    </>
  )
  if (Children.toArray(children).length === 0)
    return (
      <div className={cn('flex max-w-full items-center gap-1.5 py-0.5 ps-5 text-xs text-neutral-11', className)} {...props}>
        {line}
      </div>
    )
  return (
    <Collapsible defaultOpen={defaultOpen} className={cn('text-xs text-neutral-11', className)} {...props}>
      <CollapsibleTrigger className="group flex max-w-full items-center gap-1.5 rounded-sm py-0.5 text-start hover:text-neutral-12 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus">
        {/* Pointing to the line's end, and down when open: flipped in a
            right-to-left page, so it turns the other way there. */}
        <ChevronRight
          aria-hidden
          className="size-3.5 shrink-0 group-data-[state=open]:rotate-90 motion-safe:transition-transform rtl:-scale-x-100 rtl:group-data-[state=open]:-rotate-90"
          strokeWidth={1.75}
        />
        {line}
      </CollapsibleTrigger>
      <CollapsibleContent className="ps-5">
        <div className="mt-1 flex flex-col gap-1">{children}</div>
      </CollapsibleContent>
    </Collapsible>
  )
}
