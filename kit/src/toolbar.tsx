'use client'

import type { ComponentProps } from 'react'
import * as ToolbarPrimitive from 'radix-ui/toolbar'
import { buttonClass, type ButtonSize, type ButtonVariant } from './button-class.ts'
import { cn } from './cn.ts'

// Name it with aria-label, and a button with only an icon with its own.

/** A row of controls that is one tab stop, the arrow keys moving between
 *  them (Radix's Toolbar). */
export function Toolbar({ className, ...props }: ComponentProps<typeof ToolbarPrimitive.Root>) {
  return <ToolbarPrimitive.Root className={cn('flex items-center gap-1', className)} {...props} />
}

/** A button of the toolbar, looking as Button does (ghost, icon). */
export function ToolbarButton({
  variant = 'ghost',
  size = 'icon',
  className,
  ...props
}: ComponentProps<typeof ToolbarPrimitive.Button> & {
  /** @defaultValue `'ghost'` */
  variant?: ButtonVariant
  /** @defaultValue `'icon'` */
  size?: ButtonSize
}) {
  return <ToolbarPrimitive.Button className={buttonClass(variant, size, className)} {...props} />
}

/** A line between groups of its items. */
export function ToolbarSeparator({ className, ...props }: ComponentProps<typeof ToolbarPrimitive.Separator>) {
  return <ToolbarPrimitive.Separator className={cn('mx-1 h-5 w-px bg-neutral-6', className)} {...props} />
}
