'use client'

import { useId, type ReactNode } from 'react'
import { cn } from './cn.ts'

// The W3C's Meter pattern (Radix has none): role meter, named by its label
// through aria-labelledby. Not for progress -- that is Progress.

/** A measure within a known range -- a battery, storage used, a score: the
 *  W3C's Meter, `value` between `min` and `max` (0 and 100), named by its
 *  `label` shown above it or by `aria-label`; `valueText` says it in words
 *  where a percentage would not. Not for progress: Progress is. */
export function Meter({
  value,
  min = 0,
  max = 100,
  label,
  'aria-label': ariaLabel,
  valueText,
  className,
}: {
  value: number
  /** @defaultValue `0` */
  min?: number
  /** @defaultValue `100` */
  max?: number
  /** Shown above the bar, and its name. */
  label?: ReactNode
  /** The name, when there is no label shown. */
  'aria-label'?: string
  valueText?: string
  className?: string
}) {
  const id = useId()
  const now = Math.min(max, Math.max(min, value))
  const part = max > min ? ((now - min) / (max - min)) * 100 : 0
  return (
    <div className={cn('flex w-full flex-col gap-1.5', className)}>
      {(label || valueText) && (
        <div className="flex items-baseline justify-between gap-2 text-sm">
          {label && (
            <span id={id} className="text-neutral-12">
              {label}
            </span>
          )}
          {valueText && (
            <span aria-hidden className="text-neutral-11 tabular-nums">
              {valueText}
            </span>
          )}
        </div>
      )}
      <div
        role="meter"
        aria-valuenow={now}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuetext={valueText}
        aria-labelledby={label ? id : undefined}
        aria-label={label ? undefined : ariaLabel}
        className="h-1.5 w-full overflow-hidden rounded-full bg-choice-track"
      >
        <div className="h-full bg-choice-on" style={{ width: `${part}%` }} />
      </div>
    </div>
  )
}
