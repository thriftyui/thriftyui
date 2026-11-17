import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

// Every motion a part's state starts is behind Tailwind's motion-safe
// variant, so it runs only when the system has not asked for less
// motion. motion-reduce:animate-none cannot undo it: data-[state=open]: is
// the more specific selector and wins over the media query (in Chrome with
// reduced motion emulated, the dialog still fades).

const DIR = import.meta.dirname
const STATE_MOTION = /(?:group-)?data-\[[^\]]*\]:(?!motion-safe:)(?:animate|transition)-(?!none)[\w-]*/g

describe('Motion', () => {
  it('is behind motion-safe wherever a state starts it', () => {
    const found = readdirSync(DIR)
      .filter((f) => /\.(ts|tsx)$/.test(f) && !f.includes('.test.'))
      .flatMap((f) => [...readFileSync(join(DIR, f), 'utf8').matchAll(STATE_MOTION)].map((m) => `${f}: ${m[0]}`))
    expect(found).toEqual([])
  })

  // A transition behind motion-safe needs its duration and easing behind
  // it too: with less motion asked for, the transition's property falls
  // back to CSS's initial value, all, and a duration left outside still
  // animates every change (seen in Chrome with reduced motion emulated:
  // RollingText's wheels kept rolling over 0.5s).
  it('keeps no duration outside motion-safe where a transition is behind it', () => {
    const found = readdirSync(DIR)
      .filter((f) => /\.(ts|tsx)$/.test(f) && !f.includes('.test.'))
      .flatMap((f) =>
        [...readFileSync(join(DIR, f), 'utf8').matchAll(/className="([^"]*)"/g)]
          .filter((m) => m[1].includes('motion-safe:transition') && /(?<![:\w-])(duration|ease)-/.test(m[1]))
          .map((m) => `${f}: ${m[1]}`),
      )
    expect(found).toEqual([])
  })
})
