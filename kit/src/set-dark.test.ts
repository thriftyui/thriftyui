import { afterEach, describe, expect, it, vi } from 'vitest'
import { setDark } from './set-dark.ts'

const holds = () => [...document.head.querySelectorAll('style')].filter((s) => s.textContent?.includes('transition:none'))

describe('setDark', () => {
  afterEach(() => {
    vi.useRealTimers()
    document.documentElement.classList.remove('dark')
  })

  it('switches the class with transitions held off, then lets them back', () => {
    vi.useFakeTimers()
    setDark(true)
    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(holds()).toHaveLength(1)
    vi.advanceTimersByTime(1)
    expect(holds()).toHaveLength(0)
    setDark(false)
    expect(document.documentElement.classList.contains('dark')).toBe(false)
    vi.advanceTimersByTime(1)
    expect(holds()).toHaveLength(0)
  })

  it('does nothing when the page is already as asked', () => {
    setDark(false)
    expect(holds()).toHaveLength(0)
  })

  it('switches another element when given one', () => {
    vi.useFakeTimers()
    const part = document.createElement('div')
    setDark(true, part)
    expect(part.classList.contains('dark')).toBe(true)
    expect(document.documentElement.classList.contains('dark')).toBe(false)
    vi.advanceTimersByTime(1)
  })
})
