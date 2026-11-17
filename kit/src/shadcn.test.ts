import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

// shadcn.css sets, from shadcn's tokens, everything theme.css lets a theme
// set: each part's own colour, each step the parts read, and the corners.
// A part colour or a step added to theme.css and not here would keep the
// kit's own value in a shadcn project.

const DIR = import.meta.dirname
const theme = readFileSync(join(DIR, 'theme.css'), 'utf8')
const shadcn = readFileSync(join(DIR, 'shadcn.css'), 'utf8')
const set = (css: string, name: string) => new RegExp(`(^|\\s)--${name}:`, 'm').test(css)

describe('shadcn.css', () => {
  it("sets every part's own colour theme.css names, from a shadcn token", () => {
    const parts = [...theme.matchAll(/--color-([a-z-]+): var\(--([a-z-]+), var\(--[a-z0-9-]+\)\)/g)].map((m) => m[2])
    expect(parts.length).toBeGreaterThan(30)
    // --card is shadcn's own name: read as it is, not set.
    const missing = parts.filter((p) => p !== 'card' && !set(shadcn, p))
    expect(missing).toEqual([])
  })

  it('sets the twelve steps of neutral, accent and danger', () => {
    const missing = ['neutral', 'accent', 'danger'].flatMap((s) => Array.from({ length: 12 }, (_, i) => `${s}-${i + 1}`)).filter((n) => !set(shadcn, n))
    expect(missing).toEqual([])
  })

  it('draws each from shadcn tokens, not from a Radix scale', () => {
    const values = [...shadcn.matchAll(/^\s*--[a-z0-9-]+:\s*(.+);$/gm)].map((m) => m[1])
    expect(values.filter((v) => /var\(--(gray|blue|red|green|yellow)-\d+\)/.test(v))).toEqual([])
  })

  it("the bars from the kit's own three tokens, each its body's colour when unset", () => {
    expect(shadcn).toMatch(/--page-bar: var\(--header, var\(--background\)\);/)
    expect(shadcn).toMatch(/--column-bar: var\(--sidebar-header, var\(--sidebar\)\);/)
    expect(shadcn).toMatch(/--dialog-bar: var\(--dialog-header, var\(--background\)\);/)
  })

  it("inside a column, the twelve greys and the chosen row from shadcn's sidebar set", () => {
    const block = shadcn.match(/\[data-column\],\n\[data-column\] \.light,\n\[data-column\] \.dark \{([^}]*)\}/)?.[1] ?? ''
    const missing = Array.from({ length: 12 }, (_, i) => `neutral-${i + 1}`).filter((n) => !set(block, n))
    expect(missing).toEqual([])
    expect(block).toMatch(/--neutral-12: var\(--sidebar-foreground\);/)
    expect(block).toMatch(/--chosen-text: var\(--sidebar-accent-foreground\);/)
    // Only the sidebar set: nothing of the page's.
    expect(block).not.toMatch(/var\(--(background|foreground|muted)\)/)
  })

  it('sets every corner theme.css sets, from --radius', () => {
    const corners = [...theme.matchAll(/^\s*--(radius-[a-z0-9]+): calc/gm)].map((m) => m[1])
    expect(corners.length).toBe(8)
    expect(corners.filter((c) => !new RegExp(`--${c}: (calc\\(var\\(--radius\\)|var\\(--radius\\))`).test(shadcn))).toEqual([])
  })
})
