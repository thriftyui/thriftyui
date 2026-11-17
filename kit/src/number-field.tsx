'use client'

import { useEffect, useId, useRef, useState, type ComponentProps, type KeyboardEvent } from 'react'
import { Minus, Plus } from 'lucide-react'
import { cn } from './cn.ts'
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from './input-group.tsx'

// The W3C's Spinbutton pattern and its Quantity example (Radix has none).
// A typed value is kept as typed and marked aria-invalid when out of range;
// a stepped one stays in range; left empty with a minimum, it becomes the
// minimum. The buttons are out of the tab order, controls of the field,
// and a press is said through a hidden status, cleared after two seconds.
// One focus ring round all three.

/** What a NumberField takes: its value, its own or the app's, its least and
 *  most, its step and larger step, and the names of its two buttons; and an
 *  <input>'s other props. */
export interface NumberFieldProps extends Omit<ComponentProps<'input'>, 'value' | 'defaultValue' | 'onChange' | 'min' | 'max' | 'step' | 'type'> {
  value?: number | null
  /** @defaultValue `null` */
  defaultValue?: number | null
  onValueChange?: (value: number | null) => void
  min?: number
  max?: number
  /** @defaultValue `1` */
  step?: number
  /** The step for Page Up and Page Down; without it, those keys do nothing. */
  largeStep?: number
  /** @defaultValue `'Decrease'` */
  decrementLabel?: string
  /** @defaultValue `'Increase'` */
  incrementLabel?: string
}

/** How many places after the point a number has, so steps of 0.1 stay
 *  0.3 and not 0.30000000000000004. */
const places = (n: number) => (String(n).split('.')[1] ?? '').length

/** A number typed or stepped: the W3C's Spinbutton, the field its one tab
 *  stop, Up and Down one step, Home and End to the least and most, Page Up
 *  and Down a `largeStep`. A typed value out of range is kept and marked
 *  aria-invalid; a stepped one stays in range. */
export function NumberField({
  value: valueProp,
  defaultValue = null,
  onValueChange,
  min,
  max,
  step = 1,
  largeStep,
  decrementLabel = 'Decrease',
  incrementLabel = 'Increase',
  id: idProp,
  className,
  disabled,
  onKeyDown,
  onBlur,
  ...props
}: NumberFieldProps) {
  const ownId = useId()
  const id = idProp ?? ownId
  const [own, setOwn] = useState<number | null>(defaultValue)
  const value = valueProp !== undefined ? valueProp : own
  // What is in the box: the value, or what is being typed ("1.", "-").
  const [text, setText] = useState(value === null ? '' : String(value))
  const [said, setSaid] = useState('')
  const sayTimer = useRef<number | undefined>(undefined)

  // A value set from outside shows in the box unless the box already reads
  // as it: adjusted while rendering.
  const [seen, setSeen] = useState(value)
  if (value !== seen) {
    setSeen(value)
    if (parse(text) !== value) setText(value === null ? '' : String(value))
  }
  useEffect(() => () => window.clearTimeout(sayTimer.current), [])

  const set = (n: number | null) => {
    if (valueProp === undefined) setOwn(n)
    setText(n === null ? '' : String(n))
    onValueChange?.(n)
  }
  const fit = (n: number) => Math.min(Math.max(n, min ?? -Infinity), max ?? Infinity)
  const round = (n: number) => Number(n.toFixed(Math.max(places(step), places(min ?? 0))))
  const by = (delta: number) => set(fit(round((value ?? min ?? 0) + delta)))

  const invalid = value !== null && ((min !== undefined && value < min) || (max !== undefined && value > max))
  const atMin = min !== undefined && value !== null && value <= min
  const atMax = max !== undefined && value !== null && value >= max

  const press = (delta: number) => {
    if (disabled || (delta < 0 ? atMin : atMax)) return
    const next = fit(round((value ?? min ?? 0) + delta))
    set(next)
    setSaid(String(next))
    window.clearTimeout(sayTimer.current)
    sayTimer.current = window.setTimeout(() => setSaid(''), 2000)
  }

  const keyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    onKeyDown?.(e)
    if (e.defaultPrevented) return
    if (e.key === 'ArrowUp') by(step)
    else if (e.key === 'ArrowDown') by(-step)
    else if (e.key === 'Home' && min !== undefined) set(min)
    else if (e.key === 'End' && max !== undefined) set(max)
    else if (e.key === 'PageUp' && largeStep) by(largeStep)
    else if (e.key === 'PageDown' && largeStep) by(-largeStep)
    else return
    e.preventDefault()
  }

  return (
    <InputGroup className={cn('w-auto', className)}>
      <InputGroupAddon align="inline-start" className="ps-1">
        <InputGroupButton
          size="icon"
          tabIndex={-1}
          aria-controls={id}
          aria-label={decrementLabel}
          title={decrementLabel}
          aria-disabled={atMin || disabled || undefined}
          onClick={() => press(-step)}
          className="aria-disabled:text-neutral-8 aria-disabled:hover:text-neutral-8"
        >
          <Minus aria-hidden />
        </InputGroupButton>
      </InputGroupAddon>
      <InputGroupInput
        id={id}
        role="spinbutton"
        type="text"
        inputMode={places(step) > 0 || (min ?? 0) < 0 ? 'decimal' : 'numeric'}
        autoComplete="off"
        spellCheck={false}
        aria-valuenow={value ?? undefined}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-invalid={invalid || undefined}
        disabled={disabled}
        value={text}
        onChange={(e) => {
          setText(e.target.value)
          const n = parse(e.target.value)
          if (valueProp === undefined) setOwn(n)
          onValueChange?.(n)
        }}
        onKeyDown={keyDown}
        onBlur={(e) => {
          onBlur?.(e)
          if (text.trim() === '' && min !== undefined) set(min)
          else if (value !== null) setText(String(value))
        }}
        className="text-center tabular-nums"
        {...props}
      />
      <InputGroupAddon align="inline-end" className="pe-1">
        <InputGroupButton
          size="icon"
          tabIndex={-1}
          aria-controls={id}
          aria-label={incrementLabel}
          title={incrementLabel}
          aria-disabled={atMax || disabled || undefined}
          onClick={() => press(step)}
          className="aria-disabled:text-neutral-8 aria-disabled:hover:text-neutral-8"
        >
          <Plus aria-hidden />
        </InputGroupButton>
      </InputGroupAddon>
      <output htmlFor={id} className="sr-only">
        {said}
      </output>
    </InputGroup>
  )
}

/** The number in what was typed, or null: digits, one point and a leading
 *  minus kept, anything else dropped. */
function parse(text: string): number | null {
  const s = text.trim().replace(/[^\d.-]/g, '')
  if (s === '' || s === '-' || s === '.' || s === '-.') return null
  const n = Number(s)
  return Number.isFinite(n) ? n : null
}
