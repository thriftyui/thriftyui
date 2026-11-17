'use client'

import type { ComponentProps } from 'react'
import * as OTP from 'radix-ui/unstable/one-time-password-field'
import { cn } from './cn.ts'

/** A row of single-character boxes that moves as one field does, takes a
 *  pasted code whole and a password manager's autofill (Radix's One-Time
 *  Password Field, still unstable_: its API may change). */
export function OneTimePasswordField({ className, ...props }: ComponentProps<typeof OTP.Root>) {
  return <OTP.Root className={cn('flex gap-2', className)} {...props} />
}

/** One character's box, square at the row's height. */
export function OneTimePasswordFieldInput({ className, ...props }: ComponentProps<typeof OTP.Input>) {
  return (
    <OTP.Input
      className={cn(
        'size-(--row-height) rounded-md border border-field-border bg-field text-center text-base text-neutral-12 transition-colors hover:border-field-border-hover focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-focus',
        className,
      )}
      {...props}
    />
  )
}

/** The whole code in one hidden input, for the form. */
export const OneTimePasswordFieldHiddenInput = OTP.HiddenInput
