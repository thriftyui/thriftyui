import { useState } from 'react'
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expectNoA11yViolations } from './test/a11y.ts'
import { Fader, LevelMeter } from './fader.tsx'
import { fromDb, gainAt, meterHeight, positionOf, showLevel, toDb, type LevelMeterParts } from './fader-scale.ts'

// The W3C's Slider pattern, up and down (aria-practices, content/patterns/slider/
// slider-pattern.html), its keys in dB; the scales Ardour's (control_math.h, logmeter.h).

describe('the scales', () => {
  it('puts a gain on the fader and back, 0 dB about 61% of the way up and +12 at the top', () => {
    expect(positionOf(1)).toBeCloseTo(0.608, 2)
    expect(positionOf(fromDb(12))).toBeCloseTo(1, 5)
    expect(positionOf(0)).toBe(0)
    for (const db of [-40, -6, 0, 6]) expect(toDb(gainAt(positionOf(fromDb(db))))).toBeCloseTo(db, 5)
  })
  it('gives a level its height on the meter: 0 dBFS at 100 of 115, silence at none', () => {
    expect(meterHeight(0)).toBeCloseTo(100 / 115, 5)
    expect(meterHeight(-80)).toBe(0)
    expect(meterHeight(12)).toBe(1)
  })
})

function Volume({ start = positionOf(1) }: { start?: number }) {
  const [p, setP] = useState(start)
  return <Fader aria-label="Volume" position={p} onPositionChange={setP} />
}

describe('Fader', () => {
  it('is a vertical slider saying its level in dB', async () => {
    const { container } = render(<Volume />)
    const f = screen.getByRole('slider', { name: 'Volume' })
    expect(f.getAttribute('aria-orientation')).toBe('vertical')
    expect(f.getAttribute('aria-valuetext')).toBe('0.0 dB')
    await expectNoA11yViolations(container)
  })

  it('moves by its keys in dB: a step, a tenth with Shift, six with Page Up and Down, and to its ends', async () => {
    const user = userEvent.setup()
    render(<Volume />)
    const f = screen.getByRole('slider')
    f.focus()
    await user.keyboard('{ArrowUp}')
    expect(f.getAttribute('aria-valuetext')).toBe('1.0 dB')
    await user.keyboard('{Shift>}{ArrowDown}{/Shift}')
    expect(f.getAttribute('aria-valuetext')).toBe('0.9 dB')
    await user.keyboard('{PageDown}')
    expect(f.getAttribute('aria-valuetext')).toBe('-5.1 dB')
    await user.keyboard('{End}')
    expect(f.getAttribute('aria-valuetext')).toBe('12.0 dB')
    await user.keyboard('{Home}')
    expect(f.getAttribute('aria-valuetext')).toBe('Silent')
    await user.keyboard('{ArrowUp}')
    expect(f.getAttribute('aria-valuetext')).toBe('-60.0 dB')
    await user.keyboard('{ArrowDown}')
    expect(f.getAttribute('aria-valuetext')).toBe('Silent')
  })

  it('takes the app’s classes over its own', () => {
    const { container } = render(<Fader aria-label="Volume" position={0.5} onPositionChange={() => {}} className="h-40" />)
    const root = container.firstElementChild as HTMLElement
    expect(root.className.split(' ')).toContain('h-40')
    expect(root.className.split(' ')).not.toContain('h-56')
  })

  it('lights its cap only when asked, a picture a screen reader does not hear', async () => {
    const { container, rerender } = render(<Fader aria-label="Volume" position={0.5} onPositionChange={() => {}} />)
    expect(container.querySelector('[data-part=light]')).toBeNull()
    rerender(<Fader aria-label="Volume, automated" position={0.5} onPositionChange={() => {}} light />)
    expect(container.querySelector('[data-part=cap] [data-part=light]')).not.toBeNull()
    expect(screen.getByRole('slider', { name: 'Volume, automated' })).toBeTruthy()
    await expectNoA11yViolations(container)
  })
})

describe('LevelMeter', () => {
  it('hands over its pieces, which showLevel draws: the level, the held peak and the clip light', () => {
    let parts: LevelMeterParts | null = null
    render(<LevelMeter onParts={(p) => (parts = p)} />)
    expect(parts).not.toBeNull()
    const p = parts as unknown as LevelMeterParts
    showLevel(p, { level: 0, peak: -6, clipped: true })
    expect(p.fill.style.height).toBe(`${(100 / 115) * 100}%`)
    expect(p.peak.style.opacity).toBe('1')
    expect(p.clip.hasAttribute('data-on')).toBe(true)
    showLevel(p, { level: -Infinity, peak: -Infinity, clipped: false })
    expect(p.fill.style.height).toBe('0%')
    expect(p.peak.style.opacity).toBe('0')
    expect(p.clip.hasAttribute('data-on')).toBe(false)
  })
})
