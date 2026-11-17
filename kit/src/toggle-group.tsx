'use client'

import type { ComponentProps } from 'react'
import * as ToggleGroupPrimitive from 'radix-ui/toggle-group'
import { buttonClass, TOGGLE_ON, type ButtonSize, type ButtonVariant } from './button-class.ts'
import { cn } from './cn.ts'

// `single` is a radio group (the one on pressed again turns it off);
// `multiple` a set of toggle buttons. SegmentedControl is the same part
// held to one always chosen.

/** A set of buttons that stay pressed (Radix's Toggle Group), one or
 *  several on by `type`; the arrow keys move between them. */
export function ToggleGroup({ className, ...props }: ComponentProps<typeof ToggleGroupPrimitive.Root>) {
  return <ToggleGroupPrimitive.Root className={cn('inline-flex items-center gap-1', className)} {...props} />
}

/** An item of the group, looking as a Toggle does. */
export function ToggleGroupItem({
  variant = 'ghost',
  size = 'default',
  className,
  ...props
}: ComponentProps<typeof ToggleGroupPrimitive.Item> & {
  /** @defaultValue `'ghost'` */
  variant?: ButtonVariant
  /** @defaultValue `'default'` */
  size?: ButtonSize
}) {
  return <ToggleGroupPrimitive.Item className={buttonClass(variant, size, cn(TOGGLE_ON, className))} {...props} />
}
