import { describe, expect, it } from 'vitest'
import { cn } from './cn.ts'

// The later class wins where two set the same thing, on this kit's own
// classes; false and empty are dropped.

describe('cn', () => {
  it('lets a later class override an earlier one of the same kind', () => {
    expect(cn('px-3', 'px-0')).toBe('px-0')
    expect(cn('bg-neutral-2', 'bg-accent-9')).toBe('bg-accent-9')
    expect(cn('h-(--header-height)', 'h-8')).toBe('h-8')
    expect(cn('ml-auto', 'ml-0')).toBe('ml-0')
    expect(cn('aria-pressed:text-accent-11', 'aria-pressed:text-neutral-12')).toBe('aria-pressed:text-neutral-12')
  })
  it('keeps classes that set different things', () => {
    expect(cn('text-sm text-neutral-11', 'text-accent-11')).toBe('text-sm text-accent-11')
  })
  it('drops false, null and undefined', () => {
    expect(cn('px-3', false, null, undefined, 'py-1')).toBe('px-3 py-1')
  })
})
