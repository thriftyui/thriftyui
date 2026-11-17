import { describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { expectNoA11yViolations } from './test/a11y.ts'
import { RollingNumber } from './rolling-number.tsx'
import { RollingText } from './rolling-text.tsx'
import { Sparkline } from './sparkline.tsx'

const usd = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)

describe('RollingNumber', () => {
  it('is read once, whole, its wheels hidden; each digit a wheel turned to it, matched from the right', async () => {
    const { container, rerender } = render(<RollingNumber value={1234.5} format={usd} />)
    expect(container.textContent?.startsWith('$1,234.50')).toBe(true)
    const shown = container.querySelector('[aria-hidden]')!
    const wheels = () => [...shown.querySelectorAll(':scope > span.overflow-hidden > span')] as HTMLElement[]
    expect(wheels().map((w) => w.style.transform)).toEqual(['translateY(-1em)', 'translateY(-2em)', 'translateY(-3em)', 'translateY(-4em)', 'translateY(-5em)', 'translateY(0em)'])
    await expectNoA11yViolations(container)
    rerender(<RollingNumber value={99} format={usd} />)
    expect(container.querySelector('.sr-only')?.textContent).toBe('$99.00')
    expect(wheels().map((w) => w.style.transform)).toEqual(['translateY(-9em)', 'translateY(-9em)', 'translateY(0em)', 'translateY(0em)'])
  })

  it('rolls only where less motion is not asked for', () => {
    const { container } = render(<RollingNumber value={7} format={String} />)
    const wheel = container.querySelector('[aria-hidden] span.overflow-hidden > span')!
    expect(wheel.className).toContain('motion-safe:transition-transform')
    expect(wheel.className.split(' ')).not.toContain('transition-transform')
  })
})

describe('Sparkline', () => {
  it('is one image named by what it shows, its start and end, low and high', async () => {
    const { container } = render(<Sparkline points={[3, 1, 4, 2]} label="Price over a day" format={usd} caption="24 hours" />)
    expect(screen.getByRole('img', { name: 'Price over a day: from $3.00 to $2.00, low $1.00, high $4.00' })).toBeTruthy()
    expect(screen.getByText('24 hours').getAttribute('aria-hidden')).toBe('true')
    await expectNoA11yViolations(container)
  })

  it('reads out the nearest point under the pointer, across the whole box', () => {
    render(<Sparkline points={[3, 1, 4, 2]} label="Price" format={usd} caption="24 hours" pointName={(i) => `point ${i}`} />)
    const svg = screen.getByRole('img')
    svg.getBoundingClientRect = () => ({ left: 0, width: 300, top: 0, height: 32, right: 300, bottom: 32, x: 0, y: 0, toJSON: () => ({}) })
    fireEvent.pointerMove(svg, { clientX: 290 })
    expect(screen.getByText('point 3 · $2.00')).toBeTruthy()
    fireEvent.pointerMove(svg, { clientX: 105 })
    expect(screen.getByText('point 1 · $1.00')).toBeTruthy()
    fireEvent.pointerLeave(svg)
    expect(screen.getByText('24 hours')).toBeTruthy()
  })

  it('has no readout line with neither a caption nor point names', () => {
    const { container } = render(<Sparkline points={[1, 2]} label="Price" format={String} />)
    expect(container.querySelector('p')).toBeNull()
  })
})

describe('RollingText', () => {
  it('is read once, whole; each character a wheel turned to it; past its end, columns roll out to a space and go', async () => {
    const { container, rerender } = render(<RollingText text="Go 12" />)
    expect(container.querySelector('.sr-only')?.textContent).toBe('Go 12')
    const shown = container.querySelector('[aria-hidden]') as HTMLElement
    const wheels = () => [...shown.querySelectorAll(':scope > span > span')].map((w) => (w as HTMLElement).style.transform)
    // Printable ASCII from the space: G is 39, o 79, the space 0, 1 is 17, 2 is 18.
    expect(wheels()).toEqual(['translateY(-58.5em)', 'translateY(-118.5em)', 'translateY(0em)', 'translateY(-25.5em)', 'translateY(-27em)'])
    expect(shown.style.width).toBe('5ch')
    await expectNoA11yViolations(container)
    vi.useFakeTimers()
    rerender(<RollingText text="Up" />)
    expect(shown.style.width).toBe('2ch')
    expect(wheels()).toHaveLength(5)
    expect(wheels().slice(2)).toEqual(['translateY(0em)', 'translateY(0em)', 'translateY(0em)'])
    act(() => vi.advanceTimersByTime(500))
    expect(wheels()).toHaveLength(2)
    vi.useRealTimers()
  })

  it('rolls only where less motion is not asked for; a character outside its wheels stands still', () => {
    const { container } = render(<RollingText text="aé" />)
    const shown = container.querySelector('[aria-hidden]') as HTMLElement
    expect(shown.className).toContain('motion-safe:transition-[width]')
    const strip = shown.querySelector(':scope > span > span') as HTMLElement
    expect(strip.className).toContain('motion-safe:transition-transform')
    expect(shown.lastElementChild?.textContent).toBe('é')
  })
})
