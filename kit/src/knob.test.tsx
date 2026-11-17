import { describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expectNoA11yViolations } from './test/a11y.ts'
import { Knob } from './knob.tsx'

describe('Knob', () => {
  it('is a named slider with its value, range and value in words', async () => {
    const { container } = render(<Knob aria-label="Tempo" min={30} max={300} defaultValue={120} valueText={(v) => `${v} BPM`} />)
    const knob = screen.getByRole('slider', { name: 'Tempo' })
    expect([knob.getAttribute('aria-valuemin'), knob.getAttribute('aria-valuemax'), knob.getAttribute('aria-valuenow'), knob.getAttribute('aria-valuetext')]).toEqual(['30', '300', '120', '120 BPM'])
    expect(knob.getAttribute('tabindex')).toBe('0')
    await expectNoA11yViolations(container)
  })

  it('fills its ring from its origin, either side of it', () => {
    const { container, rerender } = render(<Knob aria-label="Pan" min={-100} max={100} origin={0} value={0} />)
    const fills = () => container.querySelectorAll('svg path').length
    // The track only, at the origin.
    expect(fills()).toBe(1)
    rerender(<Knob aria-label="Pan" min={-100} max={100} origin={0} value={-50} />)
    expect(fills()).toBe(2)
    const left = container.querySelectorAll('svg path')[1].getAttribute('d')
    rerender(<Knob aria-label="Pan" min={-100} max={100} origin={0} value={50} />)
    // The same length of arc, on the other side of the top.
    const right = container.querySelectorAll('svg path')[1].getAttribute('d')
    expect(left).not.toBe(right)
    expect(left?.startsWith('M 50 4')).toBe(false)
    expect(right?.startsWith('M 50 4')).toBe(true)
  })

  it("turns by the Slider pattern's keys, within its range", async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<Knob aria-label="Volume" defaultValue={50} onValueChange={onValueChange} />)
    const knob = screen.getByRole('slider')
    await user.tab()
    const now = () => knob.getAttribute('aria-valuenow')
    await user.keyboard('{ArrowUp}')
    expect(now()).toBe('51')
    await user.keyboard('{ArrowLeft}{ArrowLeft}')
    expect(now()).toBe('49')
    await user.keyboard('{ArrowRight}')
    expect(now()).toBe('50')
    await user.keyboard('{ArrowDown}')
    expect(now()).toBe('49')
    await user.keyboard('{PageUp}')
    expect(now()).toBe('59')
    await user.keyboard('{End}')
    expect(now()).toBe('100')
    await user.keyboard('{ArrowUp}')
    expect(now()).toBe('100')
    await user.keyboard('{Home}{PageDown}')
    expect(now()).toBe('0')
    expect(onValueChange).toHaveBeenLastCalledWith(0)
  })

  it('turns up as it is dragged up, a step every 4px, and a scroll a step a notch', () => {
    render(<Knob aria-label="Volume" defaultValue={50} />)
    const knob = screen.getByRole('slider')
    knob.setPointerCapture = () => {}
    fireEvent.pointerDown(knob, { button: 0, pointerId: 1, clientX: 20, clientY: 100 })
    fireEvent.pointerMove(knob, { pointerId: 1, clientX: 20, clientY: 60 })
    fireEvent.pointerUp(knob, { pointerId: 1, clientX: 20, clientY: 60 })
    expect(knob.getAttribute('aria-valuenow')).toBe('60')
    const up = new WheelEvent('wheel', { deltaY: -100, cancelable: true })
    act(() => {
      knob.dispatchEvent(up)
    })
    expect(up.defaultPrevented).toBe(true)
    expect(knob.getAttribute('aria-valuenow')).toBe('61')
  })

  it('sets the value where its ring is pressed, without dragging', () => {
    render(<Knob aria-label="Volume" defaultValue={0} />)
    const knob = screen.getByRole('slider')
    knob.setPointerCapture = () => {}
    knob.getBoundingClientRect = () => ({ left: 0, top: 0, width: 100, height: 100, right: 100, bottom: 100, x: 0, y: 0, toJSON: () => ({}) })
    // Straight up from the middle: halfway round the ring.
    fireEvent.pointerDown(knob, { button: 0, pointerId: 1, clientX: 50, clientY: 2 })
    fireEvent.pointerUp(knob, { pointerId: 1, clientX: 50, clientY: 2 })
    expect(knob.getAttribute('aria-valuenow')).toBe('50')
    // Straight right: 225 of the ring's 270 degrees.
    fireEvent.pointerDown(knob, { button: 0, pointerId: 1, clientX: 98, clientY: 50 })
    fireEvent.pointerUp(knob, { pointerId: 1, clientX: 98, clientY: 50 })
    expect(knob.getAttribute('aria-valuenow')).toBe('83')
  })

  it('does nothing while disabled, and is out of the tab order', async () => {
    render(<Knob aria-label="Volume" defaultValue={10} disabled />)
    const knob = screen.getByRole('slider')
    expect(knob.getAttribute('tabindex')).toBe('-1')
    fireEvent.keyDown(knob, { key: 'ArrowUp' })
    expect(knob.getAttribute('aria-valuenow')).toBe('10')
  })
})
