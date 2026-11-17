import { useState } from 'react'
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expectNoA11yViolations } from './test/a11y.ts'
import { fitTo, placeAt } from './value-place.ts'
import { ValueBox } from './value-box.tsx'

// The W3C's Spinbutton pattern and its Quantity example (aria-practices, content/patterns/
// spinbutton): a text field with role="spinbutton", Up and Down a step, Page Up and Down a larger
// one, Home and End the least and most; typed, set on Enter; Escape putting the value back.

describe('placeAt', () => {
  it('gives each digit its place, and the step to anything else', () => {
    expect(placeAt('-12.3 dB', 1, 0.1)).toBe(10)
    expect(placeAt('-12.3 dB', 2, 0.1)).toBe(1)
    expect(placeAt('-12.3 dB', 4, 0.1)).toBe(0.1)
    expect(placeAt('-12.3 dB', 0, 0.1)).toBe(0.1)
    expect(placeAt('-12.3 dB', 6, 0.1)).toBe(0.1)
    expect(placeAt('120 BPM', 0, 1)).toBe(100)
    expect(placeAt('120 BPM', 2, 1)).toBe(1)
    expect(placeAt('1.25', 3, 0.01)).toBe(0.01)
  })
})

describe('fitTo', () => {
  it('keeps a value on the step and within the range', () => {
    expect(fitTo(0.1 + 0.2, 0, 1, 0.1)).toBe(0.3)
    expect(fitTo(-1.94, -60, 0, 0.1)).toBe(-1.9)
    expect(fitTo(-75, -60, 0, 0.1)).toBe(-60)
    expect(fitTo(7, 0, 100, 5)).toBe(5)
  })
})

function Volume({ start = -6 }: { start?: number }) {
  const [db, setDb] = useState(start)
  return (
    <>
      <ValueBox
        aria-label="Volume"
        value={db}
        onValueChange={setDb}
        min={-60}
        max={0}
        step={0.1}
        largeStep={1}
        format={(v) => v.toFixed(1)}
        valueText={(v) => `${v.toFixed(1)} dB`}
      />
      <output>{db}</output>
    </>
  )
}

describe('ValueBox', () => {
  it('is a spin button in a text field, its value in words', async () => {
    const { container } = render(<Volume />)
    const box = screen.getByRole('spinbutton', { name: 'Volume' })
    expect(box.tagName).toBe('INPUT')
    expect(box.getAttribute('type')).toBe('text')
    expect(box.getAttribute('aria-valuenow')).toBe('-6')
    expect(box.getAttribute('aria-valuemin')).toBe('-60')
    expect(box.getAttribute('aria-valuemax')).toBe('0')
    expect(box.getAttribute('aria-valuetext')).toBe('-6.0 dB')
    expect((box as HTMLInputElement).value).toBe('-6.0')
    expect(box.style.width).toBe('calc(5ch + 0.25rem)')
    await expectNoA11yViolations(container)
  })

  it('steps with the arrows and Page Up and Down, and goes to the ends with Home and End', async () => {
    const user = userEvent.setup()
    render(<Volume />)
    const box = screen.getByRole('spinbutton')
    box.focus()
    await user.keyboard('{ArrowUp}')
    expect(box.getAttribute('aria-valuenow')).toBe('-5.9')
    await user.keyboard('{ArrowDown}{ArrowDown}')
    expect(box.getAttribute('aria-valuenow')).toBe('-6.1')
    await user.keyboard('{PageUp}')
    expect(box.getAttribute('aria-valuenow')).toBe('-5.1')
    await user.keyboard('{PageDown}{PageDown}')
    expect(box.getAttribute('aria-valuenow')).toBe('-7.1')
    await user.keyboard('{Home}')
    expect(box.getAttribute('aria-valuenow')).toBe('-60')
    await user.keyboard('{ArrowDown}')
    expect(box.getAttribute('aria-valuenow')).toBe('-60')
    await user.keyboard('{End}')
    expect(box.getAttribute('aria-valuenow')).toBe('0')
    await user.keyboard('{ArrowUp}')
    expect(box.getAttribute('aria-valuenow')).toBe('0')
  })

  it('sets what is typed on Enter, kept to the range, and puts the value back on Escape', async () => {
    const user = userEvent.setup()
    render(<Volume />)
    const box = screen.getByRole('spinbutton') as HTMLInputElement
    await user.clear(box)
    await user.type(box, '-12.34{Enter}')
    expect(box.getAttribute('aria-valuenow')).toBe('-12.3')
    expect(box.value).toBe('-12.3')
    await user.clear(box)
    await user.type(box, '-90{Enter}')
    expect(box.getAttribute('aria-valuenow')).toBe('-60')
    await user.clear(box)
    await user.type(box, '-3{Escape}')
    expect(box.value).toBe('-60.0')
    await user.clear(box)
    await user.type(box, 'loud{Enter}')
    expect(box.getAttribute('aria-valuenow')).toBe('-60')
    expect(box.value).toBe('-60.0')
  })

  it('sets what is typed on leaving the field', async () => {
    const user = userEvent.setup()
    render(<Volume />)
    const box = screen.getByRole('spinbutton') as HTMLInputElement
    await user.clear(box)
    await user.type(box, '-2')
    await user.tab()
    expect(box.getAttribute('aria-valuenow')).toBe('-2')
    expect(box.value).toBe('-2.0')
  })

  it('takes the app’s classes over its own, and its width when given', () => {
    render(<ValueBox aria-label="Tempo" value={120} onValueChange={() => {}} min={20} max={999} size={6} className="text-sm text-neutral-12" />)
    const box = screen.getByRole('spinbutton')
    expect(box.className.split(' ')).toContain('text-sm')
    expect(box.className.split(' ')).not.toContain('text-xs')
    expect(box.style.width).toBe('calc(6ch + 0.25rem)')
  })
})
