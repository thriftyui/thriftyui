'use client'

import { cn } from './cn.ts'

// Each digit a column of 0 to 9 slid into place, matched from the right so
// units stay units; the rest of the text stands still. A screen reader
// hears the whole number once; the roll stops with reduced motion.

const DIGITS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']

function Wheel({ digit }: { digit: number }) {
  return (
    <span className="relative inline-block h-[1em] w-[1ch] overflow-hidden leading-none">
      <span
        className="absolute inset-x-0 top-0 flex flex-col motion-safe:duration-700 motion-safe:ease-out motion-safe:transition-transform"
        style={{ transform: `translateY(${-digit}em)` }}
      >
        {DIGITS.map((d) => (
          <span key={d} className="block h-[1em] text-center leading-none">
            {d}
          </span>
        ))}
      </span>
    </span>
  )
}

/** A number written by `format` (Intl.NumberFormat's, say), its digits
 *  rolling to each new value, keeping its width. */
export function RollingNumber({ value, format, className }: { value: number; format: (n: number) => string; className?: string }) {
  const text = format(value)
  const chars = [...text]
  return (
    <span className={cn('inline-flex tabular-nums', className)}>
      <span className="sr-only">{text}</span>
      <span aria-hidden className="inline-flex items-end leading-none">
        {chars.map((c, i) => {
          const fromRight = chars.length - i
          return /[0-9]/.test(c) ? (
            <Wheel key={`d${fromRight}`} digit={Number(c)} />
          ) : (
            <span key={`s${fromRight}-${c}`} className="inline-block h-[1em] leading-none">
              {c}
            </span>
          )
        })}
      </span>
    </span>
  )
}
