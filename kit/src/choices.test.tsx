import { describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expectNoA11yViolations } from './test/a11y.ts'
import { Checkbox } from './checkbox.tsx'
import { Label } from './label.tsx'
import { RadioGroup, RadioGroupItem, RadioGroupRow } from './radio-group.tsx'
import { Slider } from './slider.tsx'
import { Switch } from './switch.tsx'

describe('Checkbox', () => {
  it('is a checkbox named by its label, toggled by a press on the label and by Space', async () => {
    const user = userEvent.setup()
    const { container } = render(
      <>
        <Checkbox id="terms" />
        <Label htmlFor="terms">Accept</Label>
      </>,
    )
    const box = screen.getByRole('checkbox', { name: 'Accept' })
    expect(box.getAttribute('aria-checked')).toBe('false')
    await user.click(screen.getByText('Accept'))
    expect(box.getAttribute('aria-checked')).toBe('true')
    await user.keyboard(' ')
    expect(box.getAttribute('aria-checked')).toBe('false')
    await expectNoA11yViolations(container)
  })

  it('is "mixed" in between', async () => {
    const { container } = render(<Checkbox aria-label="All" checked="indeterminate" />)
    expect(screen.getByRole('checkbox', { name: 'All' }).getAttribute('aria-checked')).toBe('mixed')
    await expectNoA11yViolations(container)
  })
})

describe('RadioGroup', () => {
  const group = (onValueChange = vi.fn()) =>
    render(
      <RadioGroup aria-label="Size" defaultValue="m" onValueChange={onValueChange}>
        {['s', 'm', 'l'].map((v) => (
          <div key={v} className="flex items-center gap-2">
            <RadioGroupItem value={v} id={`size-${v}`} />
            <Label htmlFor={`size-${v}`}>{v.toUpperCase()}</Label>
          </div>
        ))}
      </RadioGroup>,
    )

  it('is a named group of radios, one chosen, chosen by a press', async () => {
    const onValueChange = vi.fn()
    const { container } = group(onValueChange)
    expect(screen.getByRole('radiogroup', { name: 'Size' })).toBeTruthy()
    expect(screen.getByRole('radio', { name: 'M' }).getAttribute('aria-checked')).toBe('true')
    await userEvent.click(screen.getByRole('radio', { name: 'L' }))
    expect(onValueChange).toHaveBeenLastCalledWith('l')
    await expectNoA11yViolations(container)
  })

  it('takes one tab stop, on the chosen radio, and the arrows choose', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    group(onValueChange)
    await user.tab()
    expect(document.activeElement).toBe(screen.getByRole('radio', { name: 'M' }))
    // Radix chooses the radio an arrow focuses while the key is down.
    await user.keyboard('{ArrowDown>}')
    await waitFor(() => expect(onValueChange).toHaveBeenLastCalledWith('l'))
    await user.keyboard('{/ArrowDown}')
  })
})

describe('RadioGroupRow', () => {
  it('is a radio named by its text, its check shown only when chosen', async () => {
    const onValueChange = vi.fn()
    const { container } = render(
      <RadioGroup aria-label="Theme" defaultValue="light" onValueChange={onValueChange} className="gap-0">
        <RadioGroupRow value="light">Light</RadioGroupRow>
        <RadioGroupRow value="dark">Dark</RadioGroupRow>
      </RadioGroup>,
    )
    const light = screen.getByRole('radio', { name: 'Light' })
    const dark = screen.getByRole('radio', { name: 'Dark' })
    expect(light.getAttribute('aria-checked')).toBe('true')
    expect(light.querySelector('svg')).toBeTruthy()
    expect(dark.querySelector('svg')).toBeNull()
    await userEvent.click(dark)
    expect(onValueChange).toHaveBeenLastCalledWith('dark')
    expect(dark.querySelector('svg')).toBeTruthy()
    await expectNoA11yViolations(container)
  })
})

describe('Switch', () => {
  it('is a switch named by its label, toggled by a press and by Space', async () => {
    const user = userEvent.setup()
    const { container } = render(
      <>
        <Switch id="wifi" />
        <Label htmlFor="wifi">Wi-Fi</Label>
      </>,
    )
    const sw = screen.getByRole('switch', { name: 'Wi-Fi' })
    expect(sw.getAttribute('aria-checked')).toBe('false')
    await user.click(sw)
    expect(sw.getAttribute('aria-checked')).toBe('true')
    await user.keyboard(' ')
    expect(sw.getAttribute('aria-checked')).toBe('false')
    await expectNoA11yViolations(container)
  })
})

// A range slider's two ends are named apart, as the W3C's multi-thumb
// slider names its ends (slider.tsx).
describe('Slider', () => {
  it('names one thumb as the slider, and the arrows move it', async () => {
    const user = userEvent.setup()
    const { container } = render(<Slider aria-label="Volume" defaultValue={[40]} />)
    const thumb = screen.getByRole('slider', { name: 'Volume' })
    expect(thumb.getAttribute('aria-valuenow')).toBe('40')
    thumb.focus()
    await user.keyboard('{ArrowRight}')
    expect(thumb.getAttribute('aria-valuenow')).toBe('41')
    await user.keyboard('{End}')
    expect(thumb.getAttribute('aria-valuenow')).toBe('100')
    await expectNoA11yViolations(container)
  })

  it('names two thumbs Minimum and Maximum', async () => {
    const { container } = render(<Slider aria-label="Price" defaultValue={[20, 80]} />)
    expect(screen.getByRole('slider', { name: 'Minimum Price' })).toBeTruthy()
    expect(screen.getByRole('slider', { name: 'Maximum Price' })).toBeTruthy()
    await expectNoA11yViolations(container)
  })

  it('names two thumbs from a visible label', () => {
    render(
      <>
        <span id="price-label">Price</span>
        <Slider aria-labelledby="price-label" defaultValue={[20, 80]} />
      </>,
    )
    expect(screen.getByRole('slider', { name: 'Minimum Price' })).toBeTruthy()
    expect(screen.getByRole('slider', { name: 'Maximum Price' })).toBeTruthy()
  })

  it('takes thumbLabels', () => {
    render(<Slider aria-label="Dates" thumbLabels={['From', 'To']} defaultValue={[1, 9]} />)
    expect(screen.getByRole('slider', { name: 'From' })).toBeTruthy()
    expect(screen.getByRole('slider', { name: 'To' })).toBeTruthy()
  })

  it('draws a thin bar for a thumb with thumb="bar"', async () => {
    const { container } = render(<Slider aria-label="Position" thumb="bar" defaultValue={[30]} />)
    const t = screen.getByRole('slider', { name: 'Position' })
    expect(t.className).toContain('w-1')
    expect(t.className).not.toContain('size-4')
    await expectNoA11yViolations(container)
  })
})
