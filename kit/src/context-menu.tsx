'use client'

import type { ComponentProps } from 'react'
import * as P from 'radix-ui/context-menu'
import { Check, ChevronRight, Dot } from 'lucide-react'
import { cn } from './cn.ts'
import { MENU_CONTENT, MENU_INDICATOR, MENU_INSET, MENU_ITEM, MENU_LABEL, MENU_SEPARATOR, MENU_SHORTCUT } from './menu-class.ts'

// `inset` on an item gives it room at the start, to line up with items that
// carry a tick or a dot.

/** A menu opened where the pointer is pressed with its second button, or
 *  long-pressed (Radix's Context Menu). */
export const ContextMenu = P.Root
/** The area it opens from; wrap it round the target. */
export const ContextMenuTrigger = P.Trigger
/** A group of items. */
export const ContextMenuGroup = P.Group
/** A submenu. */
export const ContextMenuSub = P.Sub
/** A group of radio items. */
export const ContextMenuRadioGroup = P.RadioGroup

/** The menu, in the menus' look. */
export function ContextMenuContent({ className, ...props }: ComponentProps<typeof P.Content>) {
  return (
    <P.Portal>
      <P.Content
        collisionPadding={8}
        className={cn(MENU_CONTENT, 'max-h-(--radix-context-menu-content-available-height)', className)}
        {...props}
      />
    </P.Portal>
  )
}

/** An item. */
export function ContextMenuItem({ inset, className, ...props }: ComponentProps<typeof P.Item> & { inset?: boolean }) {
  return <P.Item className={cn(MENU_ITEM, inset && MENU_INSET, className)} {...props} />
}

/** An item that checks and unchecks. */
export function ContextMenuCheckboxItem({ className, children, ...props }: ComponentProps<typeof P.CheckboxItem>) {
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
export function ContextMenuRadioItem({ className, children, ...props }: ComponentProps<typeof P.RadioItem>) {
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
export function ContextMenuLabel({ inset, className, ...props }: ComponentProps<typeof P.Label> & { inset?: boolean }) {
  return <P.Label className={cn(MENU_LABEL, inset && MENU_INSET, className)} {...props} />
}

/** A line between groups. */
export function ContextMenuSeparator({ className, ...props }: ComponentProps<typeof P.Separator>) {
  return <P.Separator className={cn(MENU_SEPARATOR, className)} {...props} />
}

/** A key's name at an item's right, as text; it does not set the key. */
export function ContextMenuShortcut({ className, ...props }: ComponentProps<'span'>) {
  return <span className={cn(MENU_SHORTCUT, className)} {...props} />
}

/** An item that opens a submenu; inside a ContextMenuSub. */
export function ContextMenuSubTrigger({ inset, className, children, ...props }: ComponentProps<typeof P.SubTrigger> & { inset?: boolean }) {
  return (
    <P.SubTrigger className={cn(MENU_ITEM, inset && MENU_INSET, className)} {...props}>
      {children}
      <ChevronRight aria-hidden className="ms-auto rtl:-scale-x-100" strokeWidth={1.75} />
    </P.SubTrigger>
  )
}

/** A submenu's content; inside a ContextMenuSub. */
export function ContextMenuSubContent({ className, ...props }: ComponentProps<typeof P.SubContent>) {
  return (
    <P.Portal>
      <P.SubContent collisionPadding={8} className={cn(MENU_CONTENT, 'max-h-(--radix-context-menu-content-available-height)', className)} {...props} />
    </P.Portal>
  )
}
