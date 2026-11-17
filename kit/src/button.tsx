'use client'

import type { ComponentProps } from 'react'
import * as Slot from 'radix-ui/slot'
import { buttonClass, type ButtonSize, type ButtonVariant } from './button-class.ts'

/** A button standing on its own, the row's height: a `variant` (default,
 *  solid, danger, ghost, pill) and a `size` (default, or icon). `asChild`
 *  puts its look on the element given, a link say. */
export function Button({
  variant = 'default',
  size = 'default',
  asChild = false,
  className,
  ...props
}: ComponentProps<'button'> & {
  /** @defaultValue `'default'` */
  variant?: ButtonVariant
  /** @defaultValue `'default'` */
  size?: ButtonSize
  /** @defaultValue `false` */
  asChild?: boolean
}) {
  const Comp = asChild ? Slot.Root : 'button'
  return (
    <Comp
      // A <button> that is not told otherwise would submit its form.
      {...(asChild ? {} : { type: 'button' as const })}
      className={buttonClass(variant, size, className)}
      {...props}
    />
  )
}
