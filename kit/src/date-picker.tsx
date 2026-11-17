'use client'

import { useId, useRef, useState } from 'react'
import * as PopoverPrimitive from 'radix-ui/popover'
import { CalendarDays } from 'lucide-react'
import { Calendar, type CalendarHandle } from './calendar.tsx'
import { sameDay, startOfDay } from './date.ts'
import { cn } from './cn.ts'
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from './input-group.tsx'
import { SURFACE } from './surface.ts'

// After the W3C's Date Picker Dialog example, without its OK and Cancel: a
// day chosen is the answer, Escape the cancel. yyyy-mm-dd reads the same
// in every locale.

const pad = (n: number) => String(n).padStart(2, '0')
const toText = (d: Date | null) => (d ? `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` : '')
/** yyyy-mm-dd, whole, to a date, or null when it is not one (2026-02-30
 *  is not). Two digits each for the month and day, so "2026-02-3", typed on
 *  the way to "2026-02-30", is not taken for the 3rd. */
const fromText = (t: string): Date | null => {
  const m = /^\s*(\d{4})-(\d{2})-(\d{2})\s*$/.exec(t)
  if (!m) return null
  const d = new Date(+m[1], +m[2] - 1, +m[3])
  return d.getMonth() === +m[2] - 1 ? d : null
}

/** A date typed (yyyy-mm-dd) or chosen from a Calendar: a field, marked
 *  aria-invalid on leaving if what is in it is not a date, and a button
 *  that opens the Calendar in a modal popover, a day chosen closing it.
 *  `min`, `max`, `weekStartsOn` and `locale` as the Calendar's. */
export function DatePicker({
  value,
  onValueChange,
  min,
  max,
  weekStartsOn,
  locale,
  id: idProp,
  className,
  disabled,
  'aria-label': ariaLabel,
}: {
  value: Date | null
  onValueChange: (date: Date | null) => void
  min?: Date
  max?: Date
  weekStartsOn?: number
  locale?: string
  /** The field's id, for its <label>. */
  id?: string
  className?: string
  disabled?: boolean
  'aria-label'?: string
}) {
  const ownId = useId()
  const id = idProp ?? ownId
  const [open, setOpen] = useState(false)
  const [text, setText] = useState(toText(value))
  // Not marked invalid while still being typed; on leaving, if not a date.
  const [focusedField, setFocusedField] = useState(false)
  const calendar = useRef<CalendarHandle>(null)

  // A value set from outside shows in the field unless the field already
  // reads as it: adjusted while rendering.
  const valueTime = value?.getTime()
  const [seen, setSeen] = useState(valueTime)
  if (valueTime !== seen) {
    setSeen(valueTime)
    if (!sameDay(fromText(text), value)) setText(toText(value))
  }

  const spoken = value ? new Intl.DateTimeFormat(locale, { dateStyle: 'long' }).format(value) : ''

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen} modal>
      <div className={cn('flex flex-col gap-1.5', className)}>
        <PopoverPrimitive.Anchor asChild>
          <InputGroup>
            <InputGroupInput
              id={id}
              aria-label={ariaLabel}
              aria-describedby={`${id}-format`}
              placeholder="yyyy-mm-dd"
              autoComplete="off"
              spellCheck={false}
              disabled={disabled}
              value={text}
              aria-invalid={(text.trim() !== '' && !fromText(text) && !focusedField) || undefined}
              onFocus={() => setFocusedField(true)}
              onBlur={() => setFocusedField(false)}
              onChange={(e) => {
                setText(e.target.value)
                const d = fromText(e.target.value)
                if (d || e.target.value.trim() === '') onValueChange(d)
              }}
              className="tabular-nums"
            />
            <InputGroupAddon align="inline-end" className="pe-1">
              <PopoverPrimitive.Trigger asChild>
                <InputGroupButton size="icon" disabled={disabled} aria-label={value ? `Change date, ${spoken}` : 'Choose date'}>
                  <CalendarDays aria-hidden />
                </InputGroupButton>
              </PopoverPrimitive.Trigger>
            </InputGroupAddon>
          </InputGroup>
        </PopoverPrimitive.Anchor>
        <span id={`${id}-format`} className="text-xs text-neutral-11">
          <span className="sr-only">Date format: </span>yyyy-mm-dd
        </span>
      </div>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          aria-label="Choose date"
          align="end"
          sideOffset={6}
          collisionPadding={8}
          onOpenAutoFocus={(e) => {
            e.preventDefault()
            calendar.current?.focus()
          }}
          className={cn(SURFACE, 'p-3 focus-visible:outline-2 focus-visible:outline-focus')}
        >
          <Calendar
            ref={calendar}
            value={value}
            onValueChange={(d) => {
              onValueChange(startOfDay(d))
              setOpen(false)
            }}
            min={min}
            max={max}
            weekStartsOn={weekStartsOn}
            locale={locale}
          />
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  )
}
