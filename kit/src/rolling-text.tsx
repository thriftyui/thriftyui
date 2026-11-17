'use client'

import { useEffect, useState } from 'react'
import { cn } from './cn.ts'

// Each character a column of the printable ASCII characters -- every one a
// US keyboard types, space to tilde, in their code order -- slid into place,
// matched from the start; any other character shown at once; new columns roll in from a space, extra
// ones roll out. Code font, so columns line up; masked top and bottom so a
// character fades rather than cuts. A screen reader hears the whole text;
// the roll stops with reduced motion.

const CHARS = Array.from({ length: 95 }, (_, i) => String.fromCharCode(32 + i)).join('')
/** How long a roll takes, in ms (Tailwind's duration-500). */
const ROLL = 500

function Wheel({ char }: { char: string }) {
  const at = CHARS.indexOf(char)
  if (at < 0) return <span className="inline-block h-[1.5em] w-[1ch] text-center leading-[1.5em]">{char}</span>
  return (
    <span className="relative inline-block h-[1.5em] w-[1ch] overflow-hidden">
      <span
        className="absolute inset-x-0 top-0 flex flex-col motion-safe:duration-500 motion-safe:ease-out motion-safe:transition-transform"
        style={{ transform: `translateY(${-at * 1.5}em)` }}
      >
        {[...CHARS].map((c) => (
          <span key={c} className="block h-[1.5em] text-center leading-[1.5em]">
            {c === ' ' ? ' ' : c}
          </span>
        ))}
      </span>
    </span>
  )
}

/** Text that rolls, character by character, to each new value. One line;
 *  the code font. */
export function RollingText({ text, className }: { text: string; className?: string }) {
  // The columns: the longer of this text and the last while a roll runs,
  // adjusted while rendering when the text changes.
  const [last, setLast] = useState(text)
  const [columns, setColumns] = useState(text.length)
  if (text !== last) {
    setLast(text)
    setColumns(Math.max(columns, text.length))
  }
  useEffect(() => {
    if (columns === text.length) return
    const done = window.setTimeout(() => setColumns(text.length), ROLL)
    return () => window.clearTimeout(done)
  }, [columns, text.length])
  return (
    <span className={cn('inline-flex font-mono', className)}>
      <span className="sr-only">{text}</span>
      <span
        aria-hidden
        className="inline-flex h-[1.5em] overflow-hidden whitespace-pre motion-safe:duration-500 motion-safe:ease-out [mask-image:linear-gradient(transparent,black_20%,black_80%,transparent)] motion-safe:transition-[width]"
        style={{ width: `${text.length}ch` }}
      >
        {Array.from({ length: columns }, (_, i) => (
          <Wheel key={i} char={text[i] ?? ' '} />
        ))}
      </span>
    </span>
  )
}
