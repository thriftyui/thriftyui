'use client'

import type { ComponentProps } from 'react'
import * as P from 'radix-ui/dropdown-menu'
import { Check, ChevronRight, Dot } from 'lucide-react'
import { cn } from './cn.ts'
import { MENU_CONTENT, MENU_INDICATOR, MENU_INSET, MENU_ITEM, MENU_LABEL, MENU_SEPARATOR, MENU_SHORTCUT } from './menu-class.ts'
import { closeQuietly } from './input-modality.ts'

// `inset` on an item gives it room at the start, to line up with items that
// carry a tick or a dot.

/** A menu opened by its button (Radix's Dropdown Menu): arrows move, Enter
 *  or Space choose, Escape closes and gives focus back. */
export const DropdownMenu = P.Root
/** The button that opens it. */
export const DropdownMenuTrigger = P.Trigger
/** A group of items. */
export const DropdownMenuGroup = P.Group
/** A submenu. */
export const DropdownMenuSub = P.Sub
/** A group of radio items. */
export const DropdownMenuRadioGroup = P.RadioGroup

/** The menu, in the menus' look. */
export function DropdownMenuContent({ className, onCloseAutoFocus, ...props }: ComponentProps<typeof P.Content>) {
  return (
    <P.Portal>
      <P.Content
        onCloseAutoFocus={(e) => {
          onCloseAutoFocus?.(e)
          closeQuietly(e)
        }}
        collisionPadding={8}
        className={cn(MENU_CONTENT, 'max-h-(--radix-dropdown-menu-content-available-height)', className)}
        {...props}
      />
    </P.Portal>
  )
}

/** An item. */
export function DropdownMenuItem({ inset, className, ...props }: ComponentProps<typeof P.Item> & { inset?: boolean }) {
  return <P.Item className={cn(MENU_ITEM, inset && MENU_INSET, className)} {...props} />
}

/** An item that checks and unchecks. */
export function DropdownMenuCheckboxItem({ className, children, ...props }: ComponentProps<typeof P.CheckboxItem>) {
  return (
    <P.CheckboxItem className={cn(MENU_ITEM, MENU_INSET, className)} {...props}>
      <span className={MENU_INDICATOR}>
        <P.ItemIndicator>
          <Check aria-hidden strokeWidth={2} />
        </P.ItemIndicator>
      </span>
      {children}
    </P.CheckboxItem>
  )
}

/** One of a radio group's items. */
export function DropdownMenuRadioItem({ className, children, ...props }: ComponentProps<typeof P.RadioItem>) {
  return (
    <P.RadioItem className={cn(MENU_ITEM, MENU_INSET, className)} {...props}>
      <span className={MENU_INDICATOR}>
        <P.ItemIndicator>
          <Dot aria-hidden strokeWidth={6} />
        </P.ItemIndicator>
      </span>
      {children}
    </P.RadioItem>
  )
}

/** A group's name; the arrows skip it. */
export function DropdownMenuLabel({ inset, className, ...props }: ComponentProps<typeof P.Label> & { inset?: boolean }) {
  return <P.Label className={cn(MENU_LABEL, inset && MENU_INSET, className)} {...props} />
}

/** A line between groups. */
export function DropdownMenuSeparator({ className, ...props }: ComponentProps<typeof P.Separator>) {
  return <P.Separator className={cn(MENU_SEPARATOR, className)} {...props} />
}

/** A key's name at an item's right, as text; it does not set the key. */
export function DropdownMenuShortcut({ className, ...props }: ComponentProps<'span'>) {
  return <span className={cn(MENU_SHORTCUT, className)} {...props} />
}

/** An item that opens a submenu; inside a DropdownMenuSub. */
export function DropdownMenuSubTrigger({ inset, className, children, ...props }: ComponentProps<typeof P.SubTrigger> & { inset?: boolean }) {
  return (
    <P.SubTrigger className={cn(MENU_ITEM, inset && MENU_INSET, className)} {...props}>
      {children}
      <ChevronRight aria-hidden className="ms-auto rtl:-scale-x-100" strokeWidth={1.75} />
    </P.SubTrigger>
  )
}

/** A submenu's content; inside a DropdownMenuSub. */
export function DropdownMenuSubContent({ className, ...props }: ComponentProps<typeof P.SubContent>) {
  return (
    <P.Portal>
      <P.SubContent collisionPadding={8} className={cn(MENU_CONTENT, 'max-h-(--radix-dropdown-menu-content-available-height)', className)} {...props} />
    </P.Portal>
  )
}
