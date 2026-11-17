'use client'

import type { ComponentProps } from 'react'
import * as PTF from 'radix-ui/unstable/password-toggle-field'
import { Eye, EyeOff } from 'lucide-react'
import { cn } from './cn.ts'
import { FIELD } from './input.tsx'

// Radix still exports it as unstable_: its API may change.

/** A password field with a button that shows and hides it (Radix's
 *  Password Toggle Field), laid out as one. */
export function PasswordToggleField({ children, ...props }: ComponentProps<typeof PTF.Root>) {
  return (
    <PTF.Root {...props}>
      <div className="relative flex">{children}</div>
    </PTF.Root>
  )
}

/** The password's field, in the kit's field look. */
export function PasswordToggleFieldInput({ className, ...props }: ComponentProps<typeof PTF.Input>) {
  return <PTF.Input className={cn(FIELD, 'min-h-(--row-height) pe-11', className)} {...props} />
}

/** Shows and hides the password; an eye, crossed while it is hidden. */
export function PasswordToggleFieldToggle({ className, ...props }: ComponentProps<typeof PTF.Toggle>) {
  return (
    <PTF.Toggle
      className={cn(
        'absolute inset-y-0 inset-e-0 flex aspect-square items-center justify-center text-neutral-11 transition-colors hover:text-neutral-12 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus',
        className,
      )}
      {...props}
    >
      <PTF.Icon visible={<Eye aria-hidden className="size-4" strokeWidth={1.75} />} hidden={<EyeOff aria-hidden className="size-4" strokeWidth={1.75} />} />
    </PTF.Toggle>
  )
}
