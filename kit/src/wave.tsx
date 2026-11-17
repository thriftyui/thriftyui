'use client'

import type { ComponentProps } from 'react'
import { cn } from './cn.ts'
import { outlineOf } from './wave-peaks.ts'

// A sound's wave, drawn whole: for each column of the drawing, the lowest and the highest the
// sound reaches there (wave-peaks.ts), filled between, and a line where it is playing. A
// picture, hidden from a screen reader: the app says the sound's name and where it is in words
// of its own.

/** A sound's wave from its `peaks` (wave-peaks.ts, peaksOf), its colour the text's; `at`, 0 to 1, draws a line
 *  where it is playing, none where it is not given. Its size is its className's. */
export function Wave({ peaks, at, className, ...props }: ComponentProps<'svg'> & { peaks: [number, number][]; at?: number }) {
  const n = Math.max(1, peaks.length)
  return (
    <svg aria-hidden viewBox={`0 0 ${n} 2`} preserveAspectRatio="none" className={cn('block h-16 w-full text-neutral-11', className)} {...props}>
      {peaks.length > 0 && <path d={outlineOf(peaks)} fill="currentColor" />}
      {at !== undefined && <line x1={at * n} x2={at * n} y1={0} y2={2} stroke="currentColor" strokeWidth={1.5} vectorEffect="non-scaling-stroke" className="text-accent-11" />}
    </svg>
  )
}
