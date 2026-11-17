'use client'

import type { ComponentProps, MouseEvent } from 'react'
import { buttonClass, type ButtonVariant } from './button-class.ts'
import { cn } from './cn.ts'

// Parts named as shadcn's. An addon a field needs -- a unit, a currency --
// is not read with it: name it in the field's label, or point at it with
// aria-describedby. InputGroupButton stays over 24px at the smallest
// density (WCAG 2.5.8).

/** A field with something inside its edge -- an icon, a unit, a button: the
 *  group draws the border, ground and focus ring for the InputGroupInput or
 *  InputGroupTextarea inside, and the error colour when it is aria-invalid. */
export function InputGroup({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'relative flex w-full min-w-0 items-center rounded-md border border-field-border bg-field text-sm transition-colors hover:border-field-border-hover',
        'has-[[data-input-group-control]:focus-visible]:outline-2 has-[[data-input-group-control]:focus-visible]:-outline-offset-1 has-[[data-input-group-control]:focus-visible]:outline-focus',
        'has-[[data-input-group-control][aria-invalid=true]]:border-field-error',
        'has-[[data-input-group-control]:disabled]:bg-neutral-2',
        'has-[>[data-align=block-start]]:flex-col has-[>[data-align=block-end]]:flex-col',
        className,
      )}
      {...props}
    />
  )
}

const ALIGN = {
  'inline-start': 'order-first ps-3',
  'inline-end': 'order-last pe-3',
  'block-start': 'order-first w-full justify-start px-3 pt-2',
  'block-end': 'order-last w-full justify-start px-3 pb-2',
} as const

/** Something at the field's edge: `align` inline-start (before the text,
 *  the default), inline-end (after it), block-start (above it) or block-end
 *  (below it). A press on its text puts focus in the field. */
export function InputGroupAddon({
  align = 'inline-start',
  className,
  onClick,
  ...props
}: ComponentProps<'div'> & {
  /** @defaultValue `'inline-start'` */
  align?: keyof typeof ALIGN
}) {
  return (
    <div
      data-align={align}
      onClick={(e: MouseEvent<HTMLDivElement>) => {
        onClick?.(e)
        if (e.defaultPrevented || (e.target as HTMLElement).closest('button, a, input, select, textarea')) return
        e.currentTarget.parentElement?.querySelector<HTMLElement>('[data-input-group-control]')?.focus()
      }}
      className={cn('flex shrink-0 cursor-text items-center gap-2 text-neutral-11 select-none [&_svg]:size-4 [&_svg]:shrink-0', ALIGN[align], className)}
      {...props}
    />
  )
}

/** A line of text in an addon: a unit, a prefix. */
export function InputGroupText({ className, ...props }: ComponentProps<'span'>) {
  return <span className={cn('flex items-center gap-2 text-neutral-11', className)} {...props} />
}

/** The group's one-line field: the browser's <input>, drawing no border of
 *  its own. */
export function InputGroupInput({ className, ...props }: ComponentProps<'input'>) {
  return (
    <input
      data-input-group-control=""
      className={cn(
        'min-h-(--row-height) w-full min-w-0 flex-1 bg-transparent px-3 text-neutral-12 outline-none placeholder:text-neutral-11 disabled:cursor-not-allowed disabled:text-neutral-8',
        'in-has-[>[data-align=inline-start]]:ps-2 in-has-[>[data-align=inline-end]]:pe-2',
        className,
      )}
      {...props}
    />
  )
}

/** The group's field of several lines: the browser's <textarea>, three rows
 *  tall to start, drawing no border of its own. */
export function InputGroupTextarea({ className, ...props }: ComponentProps<'textarea'>) {
  return (
    <textarea
      data-input-group-control=""
      className={cn(
        'min-h-[calc(3*var(--row-height))] w-full min-w-0 flex-1 resize-none bg-transparent px-3 py-2 text-neutral-12 outline-none placeholder:text-neutral-11 disabled:cursor-not-allowed disabled:text-neutral-8',
        className,
      )}
      {...props}
    />
  )
}

/** A button inside the field's edge: ghost unless given a variant; `icon`
 *  a square, for an icon alone (give it an aria-label). Its `type` is
 *  "button" unless given, so it does not submit a form (HTML's is
 *  "submit"). */
export function InputGroupButton({
  variant = 'ghost',
  size = 'default',
  type = 'button',
  className,
  ...props
}: ComponentProps<'button'> & {
  /** @defaultValue `'ghost'` */
  variant?: ButtonVariant
  /** @defaultValue `'default'` */
  size?: 'default' | 'icon'
}) {
  return (
    <button
      type={type}
      className={buttonClass(
        variant,
        size,
        cn('min-h-0 h-[calc(var(--row-height)-0.5rem)] focus-visible:outline-offset-0', size === 'default' && 'px-2', className),
      )}
      {...props}
    />
  )
}
