'use client'

import type { ComponentProps } from 'react'
import { cn } from './cn.ts'

/** A placeholder in the shape of content still loading, hidden from a
 *  screen reader and inert: with no children, a block sized by its
 *  className; with children, their shape, hiding them. Not `loading`, the
 *  children alone. Say what is loading once, on the region that holds the
 *  skeletons. */
export function Skeleton({ loading = true, className, children, ...props }: ComponentProps<'span'> & {
  /** @defaultValue `true` */
  loading?: boolean
}) {
  if (!loading) return <>{children}</>
  return (
    <span
      aria-hidden
      tabIndex={-1}
      inert
      className={cn(
        'block rounded-md bg-neutral-4 motion-safe:animate-pulse',
        children !== undefined && 'w-fit text-transparent [&_*]:invisible',
        className,
      )}
      {...props}
    >
      {children}
    </span>
  )
}
