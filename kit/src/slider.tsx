'use client'

import { useId, type ComponentProps } from 'react'
import * as SliderPrimitive from 'radix-ui/slider'
import { cn } from './cn.ts'

// Each thumb is a slider of its own to a screen reader, so the name given
// goes to the thumbs: with two and no thumbLabels, "Minimum" and
// "Maximum" before it, as the W3C's multi-thumb slider does. `valueText`
// says a value in words where the number alone is unclear.

const ENDS = ['Minimum', 'Maximum']

/** One thumb, or two for a range (Radix's Slider). `thumb="bar"` draws a
 *  thin upright bar, for marking a place -- a song's position, say. */
export function Slider({
  thumbLabels,
  thumb = 'round',
  valueText,
  className,
  defaultValue,
  value,
  min = 0,
  max = 100,
  'aria-label': label,
  'aria-labelledby': labelledBy,
  ...props
}: ComponentProps<typeof SliderPrimitive.Root> & {
  thumbLabels?: string[]
  /** @defaultValue `'round'` */
  thumb?: 'round' | 'bar'
  /** A thumb's value in words, for a screen reader: (243) => "4 minutes, 3 seconds". */
  valueText?: (value: number) => string
}) {
  const values = Array.isArray(value) ? value : Array.isArray(defaultValue) ? defaultValue : [min]
  const wordId = useId()
  const ends = values.length === 2 && !thumbLabels
  return (
    <SliderPrimitive.Root
      defaultValue={defaultValue}
      value={value}
      min={min}
      max={max}
      className={cn(
        'relative flex w-full touch-none items-center select-none data-[disabled]:opacity-50 data-[orientation=vertical]:h-full data-[orientation=vertical]:min-h-40 data-[orientation=vertical]:w-auto data-[orientation=vertical]:flex-col',
        className,
      )}
      {...props}
    >
      <SliderPrimitive.Track className="relative grow overflow-hidden rounded-full bg-choice-track data-[orientation=horizontal]:h-1.5 data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-1.5">
        <SliderPrimitive.Range className="absolute bg-choice-on data-[orientation=horizontal]:h-full data-[orientation=vertical]:w-full" />
      </SliderPrimitive.Track>
      {values.map((_, i) => (
        <SliderPrimitive.Thumb
          key={i}
          aria-label={thumbLabels?.[i] ?? (ends && label ? `${ENDS[i]} ${label}` : label)}
          aria-labelledby={thumbLabels?.[i] ? undefined : ends && !label && labelledBy ? `${wordId}-${i} ${labelledBy}` : labelledBy}
          aria-valuetext={valueText?.(values[i])}
          className={cn(
            'block transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus',
            thumb === 'bar' ? 'h-3.5 w-1 rounded-full bg-neutral-12' : 'size-4 rounded-full border-2 border-choice-on bg-neutral-1 shadow-sm',
          )}
        />
      ))}
      {/* The words a pair of thumbs named by aria-labelledby begins with. */}
      {ends && !label && labelledBy
        ? ENDS.map((w, i) => (
            <span key={w} id={`${wordId}-${i}`} hidden>
              {w}
            </span>
          ))
        : null}
    </SliderPrimitive.Root>
  )
}
