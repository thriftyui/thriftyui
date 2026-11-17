'use client'

import { useId, type ComponentProps, type ReactNode } from 'react'
import { buttonClass } from './button-class.ts'
import { cn } from './cn.ts'

// A group named by its heading, not a landmark, so two cards may share a
// title. Waiting shows by its accent edge and its buttons together, not by
// colour alone.

/** An assistant asking before it acts, as a card: its `title` ("Allow
 *  Bash?") as a heading, what it would do as its children, and while
 *  `waiting`, Allow, Always allow and Deny for the handlers given.
 *  Answered, the buttons go and `status` says what became of it. */
export function ApprovalCard({
  title,
  heading: Heading = 'h3',
  waiting = true,
  status,
  onAllow,
  onAlwaysAllow,
  onDeny,
  className,
  children,
  ...props
}: Omit<ComponentProps<'div'>, 'title'> & {
  /** What is asked: "Allow Bash?" */
  title: ReactNode
  /** The heading's level.
   *  @defaultValue `'h3'` */
  heading?: 'h2' | 'h3' | 'h4'
  /** It waits for an answer: the buttons show.
   *  @defaultValue `true` */
  waiting?: boolean
  /** Beside the title once it no longer waits: what became of it. */
  status?: ReactNode
  onAllow?: () => void
  /** Allow, and do not ask again for the same. */
  onAlwaysAllow?: () => void
  onDeny?: () => void
}) {
  const id = useId()
  const answers = waiting && (onAllow || onAlwaysAllow || onDeny)
  return (
    <div
      role="group"
      aria-labelledby={id}
      className={cn('flex flex-col gap-2 rounded-lg border p-3', waiting ? 'border-accent-11' : 'border-neutral-6', className)}
      {...props}
    >
      <div className="flex items-center justify-between gap-2">
        <Heading id={id} className="text-sm font-semibold text-neutral-12">
          {title}
        </Heading>
        {!waiting && status && <span className="text-xs text-neutral-11">{status}</span>}
      </div>
      {children}
      {answers && (
        <div className="flex flex-wrap gap-2">
          {onAllow && (
            <button type="button" onClick={onAllow} className={buttonClass('solid')}>
              Allow
            </button>
          )}
          {onAlwaysAllow && (
            <button type="button" onClick={onAlwaysAllow} className={buttonClass('default')}>
              Always allow
            </button>
          )}
          {onDeny && (
            <button type="button" onClick={onDeny} className={buttonClass('default')}>
              Deny
            </button>
          )}
        </div>
      )}
    </div>
  )
}
