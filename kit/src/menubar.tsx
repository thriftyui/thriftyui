'use client'

import type { ComponentProps } from 'react'
import * as P from 'radix-ui/menubar'
import { Check, ChevronRight, Dot } from 'lucide-react'
import { cn } from './cn.ts'
import { MENU_CONTENT, MENU_INDICATOR, MENU_INSET, MENU_ITEM, MENU_LABEL, MENU_SEPARATOR, MENU_SHORTCUT } from './menu-class.ts'
import { closeQuietly } from './input-modality.ts'

// `inset` on an item gives it room at the start, to line up with items that
// carry a tick or a dot.

/** A row of menus, as at the top of a desktop app (Radix's Menubar): one
 *  tab stop, the arrows along the row and into a menu. */
export function Menubar({ className, ...props }: ComponentProps<typeof P.Root>) {
  return <P.Root className={cn('flex min-h-(--row-height) items-stretch', className)} {...props} />
}

/** A menu of the row: its trigger and content. */
export const MenubarMenu = P.Menu

/** A menu's name in the row: a cell, its text darker on hover and while its
 *  menu is open; a focus ring for the keyboard. */
export function MenubarTrigger({ className, ...props }: ComponentProps<typeof P.Trigger>) {
  return (
    <P.Trigger
      className={cn(
        'flex cursor-default items-center px-3 text-sm text-neutral-11 outline-hidden transition-colors select-none hover:text-neutral-12 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus data-[highlighted]:text-neutral-12 data-[state=open]:text-neutral-12',
        className,
      )}
      {...props}
    />
  )
}
/** A group of items. */
export const MenubarGroup = P.Group
/** A submenu. */
export const MenubarSub = P.Sub
/** A group of radio items. */
export const MenubarRadioGroup = P.RadioGroup

/** A menu's content, in the menus' look. */
export function MenubarContent({ className, onCloseAutoFocus, ...props }: ComponentProps<typeof P.Content>) {
  return (
    <P.Portal>
      <P.Content
        onCloseAutoFocus={(e) => {
          onCloseAutoFocus?.(e)
          closeQuietly(e)
        }}
        collisionPadding={8}
        sideOffset={4}
        className={cn(MENU_CONTENT, 'max-h-(--radix-menubar-content-available-height)', className)}
        {...props}
      />
    </P.Portal>
  )
}

/** An item. */
export function MenubarItem({ inset, className, ...props }: ComponentProps<typeof P.Item> & { inset?: boolean }) {
  return <P.Item className={cn(MENU_ITEM, inset && MENU_INSET, className)} {...props} />
}

/** An item that checks and unchecks. */
export function MenubarCheckboxItem({ className, children, ...props }: ComponentProps<typeof P.CheckboxItem>) {
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
export function MenubarRadioItem({ className, children, ...props }: ComponentProps<typeof P.RadioItem>) {
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
export function MenubarLabel({ inset, className, ...props }: ComponentProps<typeof P.Label> & { inset?: boolean }) {
  return <P.Label className={cn(MENU_LABEL, inset && MENU_INSET, className)} {...props} />
}

/** A line between groups. */
export function MenubarSeparator({ className, ...props }: ComponentProps<typeof P.Separator>) {
  return <P.Separator className={cn(MENU_SEPARATOR, className)} {...props} />
}

/** A key's name at an item's right, as text; it does not set the key. */
export function MenubarShortcut({ className, ...props }: ComponentProps<'span'>) {
  return <span className={cn(MENU_SHORTCUT, className)} {...props} />
}

/** An item that opens a submenu; inside a MenubarSub. */
export function MenubarSubTrigger({ inset, className, children, ...props }: ComponentProps<typeof P.SubTrigger> & { inset?: boolean }) {
  return (
    <P.SubTrigger className={cn(MENU_ITEM, inset && MENU_INSET, className)} {...props}>
      {children}
      <ChevronRight aria-hidden className="ms-auto rtl:-scale-x-100" strokeWidth={1.75} />
    </P.SubTrigger>
  )
}

/** A submenu's content; inside a MenubarSub. */
export function MenubarSubContent({ className, ...props }: ComponentProps<typeof P.SubContent>) {
  return (
    <P.Portal>
      <P.SubContent collisionPadding={8} className={cn(MENU_CONTENT, 'max-h-(--radix-menubar-content-available-height)', className)} {...props} />
    </P.Portal>
  )
}
