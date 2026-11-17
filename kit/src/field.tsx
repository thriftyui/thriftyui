'use client'

import { createContext, useContext, useId, type ComponentProps } from 'react'
import * as Slot from 'radix-ui/slot'
import { cn } from './cn.ts'
import { Label } from './label.tsx'

// For a field outside Form, which checks input; Field only names and
// describes. Parts named as shadcn's; Field is a group, so the control is
// read with its label.

interface FieldIds {
  control: string
  description: string
  error: string
  invalid: boolean
}

const FieldContext = createContext<FieldIds | null>(null)

const useField = () => {
  const ids = useContext(FieldContext)
  if (!ids) throw new Error('A Field part must be inside a Field.')
  return ids
}

/** A field's label, control, help and error, wired together, for a field
 *  outside Form: a group, which makes the ids its parts share. `invalid`
 *  shows the FieldError and marks the control aria-invalid. */
export function Field({ invalid = false, className, ...props }: ComponentProps<'div'> & {
  /** @defaultValue `false` */
  invalid?: boolean
}) {
  const id = useId()
  return (
    <FieldContext.Provider value={{ control: `${id}-control`, description: `${id}-description`, error: `${id}-error`, invalid }}>
      <div role="group" data-invalid={invalid || undefined} className={cn('flex flex-col gap-1.5', className)} {...props} />
    </FieldContext.Provider>
  )
}

/** The field's label: a Label whose `for` is the control's id; in the error
 *  colour when the field is invalid. */
export function FieldLabel({ className, ...props }: ComponentProps<typeof Label>) {
  const ids = useField()
  return <Label htmlFor={ids.control} className={cn(ids.invalid && 'text-field-error', className)} {...props} />
}

/** Wraps the field's one control -- an Input, a Select's trigger, a Switch
 *  -- and gives it the id, aria-describedby naming the description (and the
 *  error, when invalid) and aria-invalid. */
export function FieldControl(props: ComponentProps<typeof Slot.Root>) {
  const ids = useField()
  return (
    <Slot.Root
      id={ids.control}
      aria-describedby={[ids.description, ids.invalid ? ids.error : null].filter(Boolean).join(' ')}
      aria-invalid={ids.invalid || undefined}
      {...props}
    />
  )
}

/** A line of help under the control, read with it: small, gray 11. */
export function FieldDescription({ className, ...props }: ComponentProps<'p'>) {
  const ids = useField()
  return <p id={ids.description} className={cn('text-xs text-neutral-11', className)} {...props} />
}

/** What is wrong, read with the control: shown only while the field is
 *  `invalid`, in the error colour. */
export function FieldError({ className, ...props }: ComponentProps<'p'>) {
  const ids = useField()
  if (!ids.invalid) return null
  return <p id={ids.error} className={cn('text-xs text-field-error', className)} {...props} />
}
