'use client'

import type { ComponentProps } from 'react'
import * as FormPrimitive from 'radix-ui/form'
import { buttonClass, type ButtonVariant } from './button-class.ts'
import { cn } from './cn.ts'
import { FIELD } from './input.tsx'

// Radix marks a field failing the browser's checks data-invalid, and sets
// aria-invalid only for a server's error (`serverInvalid`).

/** A form with checks and messages tied to each field (Radix's Form); on a
 *  failed submit, focus goes to the first field that failed. */
export function Form({ className, ...props }: ComponentProps<typeof FormPrimitive.Root>) {
  return <FormPrimitive.Root className={cn('flex flex-col gap-4', className)} {...props} />
}

/** A field: wires its label, control and messages. */
export function FormField({ className, ...props }: ComponentProps<typeof FormPrimitive.Field>) {
  return <FormPrimitive.Field className={cn('flex flex-col gap-1.5', className)} {...props} />
}

/** The field's label. */
export function FormLabel({ className, ...props }: ComponentProps<typeof FormPrimitive.Label>) {
  return <FormPrimitive.Label className={cn('text-sm font-medium text-neutral-12 data-[invalid]:text-field-error', className)} {...props} />
}

/** The field's control (an input), red-bordered while it fails. */
export function FormControl({ className, ...props }: ComponentProps<typeof FormPrimitive.Control>) {
  return <FormPrimitive.Control className={cn(FIELD, 'min-h-(--row-height) data-[invalid]:border-field-error', className)} {...props} />
}

/** A message shown when a check fails, read with its control; outside a
 *  FormField, give its `name`. */
export function FormMessage({ className, ...props }: ComponentProps<typeof FormPrimitive.Message>) {
  return <FormPrimitive.Message className={cn('text-xs text-field-error', className)} {...props} />
}

/** Gives a field's validity to a render function. */
export const FormValidityState = FormPrimitive.ValidityState

/** The submit button. */
export function FormSubmit({
  variant = 'solid',
  className,
  ...props
}: ComponentProps<typeof FormPrimitive.Submit> & {
  /** @defaultValue `'solid'` */
  variant?: ButtonVariant
}) {
  return <FormPrimitive.Submit className={buttonClass(variant, 'default', className)} {...props} />
}
