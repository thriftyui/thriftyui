'use client'

import type { ComponentProps } from 'react'
import * as SelectPrimitive from 'radix-ui/select'
import { Check, ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from './cn.ts'
import { FIELD } from './input.tsx'
import { MENU_CONTENT, MENU_INDICATOR, MENU_INSET, MENU_ITEM, MENU_LABEL, MENU_SEPARATOR } from './menu-class.ts'
import { closeQuietly } from './input-modality.ts'

/** One value from a list, opened from a field-like button (Radix's
 *  Select): arrows move, Enter or Space choose, typed letters jump. */
export const Select = SelectPrimitive.Root
/** A group of items; pair it with a SelectLabel. */
export const SelectGroup = SelectPrimitive.Group
/** The chosen value's text in the button; `placeholder` when there is
 *  none. Left unstyled, as Radix asks. */
export const SelectValue = SelectPrimitive.Value

/** The button, in the field look. */
export function SelectTrigger({ className, children, ...props }: ComponentProps<typeof SelectPrimitive.Trigger>) {
  return (
    <SelectPrimitive.Trigger
      className={cn(
        FIELD,
        'flex min-h-(--row-height) items-center justify-between gap-2 text-start data-[placeholder]:text-neutral-11 [&>span]:truncate',
        className,
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        <ChevronDown aria-hidden className="size-4 shrink-0 text-neutral-11" strokeWidth={1.75} />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  )
}

/** The list, in the menus' look, under its button and at least as wide,
 *  within the room on screen and no taller than 20rem, scrolling past it
 *  as a list grows; `position` "popper" unless given (Radix's is
 *  "item-aligned"). */
export function SelectContent({ className, children, position = 'popper', onCloseAutoFocus, ...props }: ComponentProps<typeof SelectPrimitive.Content>) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        onCloseAutoFocus={(e) => {
          onCloseAutoFocus?.(e)
          closeQuietly(e)
        }}
        position={position}
        sideOffset={4}
        collisionPadding={8}
        className={cn(
          MENU_CONTENT,
          'max-h-[min(var(--radix-select-content-available-height),20rem)] overflow-hidden p-0',
          position === 'popper' && 'min-w-(--radix-select-trigger-width)',
          className,
        )}
        {...props}
      >
        <SelectPrimitive.ScrollUpButton className="flex cursor-default items-center justify-center py-1 text-neutral-11">
          <ChevronUp aria-hidden className="size-4" strokeWidth={1.75} />
        </SelectPrimitive.ScrollUpButton>
        <SelectPrimitive.Viewport className="p-1">{children}</SelectPrimitive.Viewport>
        <SelectPrimitive.ScrollDownButton className="flex cursor-default items-center justify-center py-1 text-neutral-11">
          <ChevronDown aria-hidden className="size-4" strokeWidth={1.75} />
        </SelectPrimitive.ScrollDownButton>
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  )
}

/** An item of the list. */
export function SelectItem({ className, children, ...props }: ComponentProps<typeof SelectPrimitive.Item>) {
  return (
    <SelectPrimitive.Item className={cn(MENU_ITEM, MENU_INSET, className)} {...props}>
      <span className={MENU_INDICATOR}>
        <SelectPrimitive.ItemIndicator>
          <Check aria-hidden strokeWidth={2} />
        </SelectPrimitive.ItemIndicator>
      </span>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  )
}

/** A group's name; the arrows skip it. */
export function SelectLabel({ className, ...props }: ComponentProps<typeof SelectPrimitive.Label>) {
  return <SelectPrimitive.Label className={cn(MENU_LABEL, MENU_INSET, className)} {...props} />
}

/** A line between groups. */
export function SelectSeparator({ className, ...props }: ComponentProps<typeof SelectPrimitive.Separator>) {
  return <SelectPrimitive.Separator className={cn(MENU_SEPARATOR, className)} {...props} />
}
