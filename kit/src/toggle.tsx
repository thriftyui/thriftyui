'use client'

import type { ComponentProps } from 'react'
import * as TogglePrimitive from 'radix-ui/toggle'
import { buttonClass, TOGGLE_ON, type ButtonSize, type ButtonVariant } from './button-class.ts'
import { cn } from './cn.ts'

// A button that stays pressed until pressed again: Radix's Toggle, the
// W3C's toggle button. Its label stays the same pressed or not ("Mute"); a
// button whose label changes with its state is a plain Button instead.

/** A button that stays on until pressed again. Pressed, its text turns
 *  semibold and its icon heavier, in the chosen colour. Takes Radix
 *  Toggle's props. */
export function Toggle({
  variant = 'ghost',
  size = 'default',
  className,
  ...props
}: ComponentProps<typeof TogglePrimitive.Root> & {
  /** @defaultValue `'ghost'` */
  variant?: ButtonVariant
  /** @defaultValue `'default'` */
  size?: ButtonSize
}) {
  return <TogglePrimitive.Root className={buttonClass(variant, size, cn(TOGGLE_ON, className))} {...props} />
}
