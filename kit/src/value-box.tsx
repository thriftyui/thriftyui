'use client'

import { useRef, useState, type ComponentProps, type KeyboardEvent, type PointerEvent } from 'react'
import { cn } from './cn.ts'
import { fitTo, placeAt } from './value-place.ts'

// The W3C's Spinbutton pattern, after its Quantity example: a text field with role="spinbutton",
// so the browser keeps its own editing keys. What is typed is set on Enter or on leaving the
// field; Escape puts the shown value back. Dragged up or down, the value changes by the place of
// the digit under the pointer -- tens, ones, tenths -- a notch every 4px, the pointer held to the
// field; a press without a drag selects the text, to type over it. Right-aligned in a fixed width,
// so the digits keep their places.

/** Pixels of drag for each notch. */
const NOTCH = 4

/** Where the pressed character is in the field's text: its right edge is the text's end. */
function indexAt(input: HTMLInputElement, x: number): number {
  const text = input.value
  const ctx = document.createElement('canvas').getContext('2d')
  if (!ctx) return -1
  const style = getComputedStyle(input)
  ctx.font = style.font
  const end = input.getBoundingClientRect().right - parseFloat(style.paddingRight) - parseFloat(style.borderRightWidth)
  const start = end - ctx.measureText(text).width
  for (let i = 0; i < text.length; i++) if (x < start + ctx.measureText(text.slice(0, i + 1)).width) return i
  return -1
}

/** A number as digits, held by the app (`value`, `onValueChange`) between `min` and `max`: typed and
 *  set with Enter, stepped with the arrows (`step`), Page Up and Down (`largeStep`), Home and End, or
 *  dragged up and down a digit's place at a time. `format` writes it; `valueText` says it in words,
 *  its unit with it. A text field's other props pass on. */
export function ValueBox({
  value,
  onValueChange,
  min,
  max,
  step = 1,
  largeStep,
  format = String,
  valueText,
  size,
  disabled,
  className,
  style,
  onKeyDown,
  onBlur,
  ...props
}: Omit<ComponentProps<'input'>, 'value' | 'defaultValue' | 'onChange' | 'min' | 'max' | 'step' | 'type'> & {
  value: number
  onValueChange: (value: number) => void
  min: number
  max: number
  /** The arrows' step, and the finest a value is kept to.
   *  @defaultValue `1` */
  step?: number
  /** The step for Page Up and Page Down; without it, those keys do nothing. */
  largeStep?: number
  /** Writes the value for the field.
   *  @defaultValue `String` */
  format?: (value: number) => string
  /** The value in words for a screen reader, with its unit: "-6.0 dB". */
  valueText?: (value: number) => string
  /** Its width in characters; the wider of `min` and `max` written, unless given. */
  size?: number
}) {
  // What is being typed; null while the field shows the value.
  const [draft, setDraft] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const drag = useRef<{ y: number; from: number; place: number; moved: boolean } | null>(null)
  const shown = format(value)
  const width = size ?? Math.max(format(min).length, format(max).length)

  const set = (n: number) => {
    const next = fitTo(n, min, max, step)
    if (next !== value) onValueChange(next)
  }
  const commit = () => {
    if (draft === null) return
    const n = Number(draft.trim().replace(',', '.'))
    if (draft.trim() !== '' && Number.isFinite(n)) set(n)
    setDraft(null)
  }

  const keys = (e: KeyboardEvent<HTMLInputElement>) => {
    onKeyDown?.(e)
    if (e.defaultPrevented || disabled) return
    const typed = draft === null ? value : Number(draft.trim().replace(',', '.'))
    const from = Number.isFinite(typed) ? typed : value
    const by = { ArrowUp: step, ArrowDown: -step, PageUp: largeStep, PageDown: largeStep === undefined ? undefined : -largeStep }[e.key]
    if (by !== undefined) set(from + by)
    else if (e.key === 'Home') set(min)
    else if (e.key === 'End') set(max)
    else if (e.key === 'Enter') commit()
    else if (e.key === 'Escape' && draft !== null) setDraft(null)
    else return
    if (e.key !== 'Enter' && e.key !== 'Escape') setDraft(null)
    e.preventDefault()
  }

  return (
    <input
      type="text"
      role="spinbutton"
      inputMode={step < 1 ? 'decimal' : 'numeric'}
      autoComplete="off"
      spellCheck={false}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={value}
      aria-valuetext={valueText?.(value)}
      disabled={disabled}
      value={draft ?? shown}
      data-dragging={dragging || undefined}
      onChange={(e) => setDraft(e.target.value)}
      onKeyDown={keys}
      onBlur={(e) => {
        commit()
        onBlur?.(e)
      }}
      onPointerDown={(e: PointerEvent<HTMLInputElement>) => {
        // While typing, a press places the caret as in any text field.
        if (disabled || e.button !== 0 || draft !== null) return
        e.preventDefault()
        e.currentTarget.setPointerCapture(e.pointerId)
        drag.current = { y: e.clientY, from: value, place: placeAt(shown, indexAt(e.currentTarget, e.clientX), step), moved: false }
      }}
      onPointerMove={(e) => {
        const d = drag.current
        if (!d) return
        const up = d.y - e.clientY
        if (!d.moved && Math.abs(up) < NOTCH) return
        d.moved = true
        setDragging(true)
        set(d.from + Math.trunc(up / NOTCH) * d.place)
      }}
      onPointerUp={(e) => {
        const d = drag.current
        drag.current = null
        setDragging(false)
        if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId)
        if (d && !d.moved) {
          e.currentTarget.focus()
          e.currentTarget.select()
          setDraft(shown)
        }
      }}
      onPointerCancel={() => {
        drag.current = null
        setDragging(false)
      }}
      className={cn(
        'cursor-ns-resize touch-none rounded-sm bg-transparent text-end font-mono text-xs text-neutral-11 tabular-nums not-focus:select-none hover:text-neutral-12 focus:cursor-text focus:text-chosen-text px-0.5 focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-focus disabled:text-neutral-8 data-[dragging]:text-chosen-text',
        className,
      )}
      // The characters' width and its side padding, so the ring clears the digits and none is cut off.
      style={{ width: `calc(${width}ch + 0.25rem)`, ...style }}
      {...props}
    />
  )
}
