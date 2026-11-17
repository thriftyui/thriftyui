import { useState } from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { Tips, type Tip } from './tips.tsx'
import { expectNoA11yViolations } from './test/a11y.ts'

// Tips (tips.tsx): one at a time, by the control each is about; Next and
// Done; Hide tips; using the control moves on; focus is not taken.
//
// jsdom lays nothing out, so every box is 0 x 0 at 0,0 and a tip would
// count its control as out of view and hide (hideWhenDetached): the
// window it is measured against is the page's clientWidth and
// clientHeight, 0 here too. Here each element is given a box, and the page
// a size, so the control is in view.
const real = Element.prototype.getBoundingClientRect
const size = (name: 'clientWidth' | 'clientHeight') => Object.getOwnPropertyDescriptor(Element.prototype, name)
const realWidth = size('clientWidth')
const realHeight = size('clientHeight')
beforeAll(() => {
  Element.prototype.getBoundingClientRect = () => new DOMRect(100, 100, 40, 40)
  Object.defineProperty(Element.prototype, 'clientWidth', { configurable: true, get: () => 1024 })
  Object.defineProperty(Element.prototype, 'clientHeight', { configurable: true, get: () => 768 })
})
afterAll(() => {
  Element.prototype.getBoundingClientRect = real
  if (realWidth) Object.defineProperty(Element.prototype, 'clientWidth', realWidth)
  if (realHeight) Object.defineProperty(Element.prototype, 'clientHeight', realHeight)
})

function App({ onOpenChange = () => {} }: { onOpenChange?: (open: boolean) => void }) {
  const [open, setOpen] = useState(true)
  const tips: Tip[] = [
    { target: () => document.querySelector('[aria-label="Hide left"]'), text: 'Hide a column.' },
    { target: () => document.querySelector('[aria-label="Swap"]'), text: 'Swap the columns.' },
  ]
  return (
    <>
      <button type="button" aria-label="Hide left">
        H
      </button>
      <button type="button" aria-label="Swap">
        S
      </button>
      <Tips
        tips={tips}
        open={open}
        onOpenChange={(o) => {
          setOpen(o)
          onOpenChange(o)
        }}
      />
    </>
  )
}

describe('Tips', () => {
  it('shows the first tip, named and said, without taking focus', async () => {
    render(<App />)
    const card = await screen.findByRole('dialog', { name: 'Tip 1 of 2' })
    expect(card.textContent).toContain('Hide a column.')
    expect(screen.getByRole('status').textContent).toBe('Tip 1 of 2: Hide a column.')
    expect(document.activeElement).toBe(document.body)
  })

  it('moves on with Next, and Done puts them away', async () => {
    const user = userEvent.setup()
    const onOpenChange = vi.fn()
    render(<App onOpenChange={onOpenChange} />)
    await user.click(await screen.findByRole('button', { name: 'Next' }))
    expect((await screen.findByRole('dialog', { name: 'Tip 2 of 2' })).textContent).toContain('Swap the columns.')
    await user.click(screen.getByRole('button', { name: 'Done' }))
    expect(onOpenChange).toHaveBeenLastCalledWith(false)
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('moves on when the control it points at is used', async () => {
    const user = userEvent.setup()
    render(<App />)
    await screen.findByRole('dialog', { name: 'Tip 1 of 2' })
    await user.click(screen.getByRole('button', { name: 'Hide left' }))
    expect(await screen.findByRole('dialog', { name: 'Tip 2 of 2' })).toBeTruthy()
  })

  it('does not move on for a click elsewhere', async () => {
    const user = userEvent.setup()
    render(<App />)
    await screen.findByRole('dialog', { name: 'Tip 1 of 2' })
    await user.click(screen.getByRole('button', { name: 'Swap' }))
    await new Promise((r) => setTimeout(r, 600))
    expect(screen.getByRole('dialog', { name: 'Tip 1 of 2' })).toBeTruthy()
  })

  it('Hide tips puts them away', async () => {
    const user = userEvent.setup()
    const onOpenChange = vi.fn()
    render(<App onOpenChange={onOpenChange} />)
    await user.click(await screen.findByRole('button', { name: 'Hide tips' }))
    expect(onOpenChange).toHaveBeenLastCalledWith(false)
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('with `step`, shows the tip the app says, and asks to move on', async () => {
    const user = userEvent.setup()
    const onStepChange = vi.fn()
    const tips: Tip[] = [
      { target: () => document.querySelector('[aria-label="Pin"]'), text: 'Pin it.' },
      { target: () => document.querySelector('[aria-label="Open"]'), text: 'Open it.' },
    ]
    const { rerender } = render(
      <>
        <button type="button" aria-label="Pin">P</button>
        <button type="button" aria-label="Open">O</button>
        <Tips tips={tips} open onOpenChange={() => {}} step={0} onStepChange={onStepChange} />
      </>,
    )
    await screen.findByRole('dialog', { name: 'Tip 1 of 2' })
    await user.click(screen.getByRole('button', { name: 'Pin' }))
    // Out of the way at once; asked to move on after a moment.
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    await waitFor(() => expect(onStepChange).toHaveBeenLastCalledWith(1))
    // The app has not moved it on: the first again.
    expect(await screen.findByRole('dialog', { name: 'Tip 1 of 2' })).toBeTruthy()
    rerender(
      <>
        <button type="button" aria-label="Pin">P</button>
        <button type="button" aria-label="Open">O</button>
        <Tips tips={tips} open onOpenChange={() => {}} step={1} onStepChange={onStepChange} />
      </>,
    )
    expect((await screen.findByRole('dialog', { name: 'Tip 2 of 2' })).textContent).toContain('Open it.')
  })

  it("a drag tip fades as it is pressed and moves on once let go", async () => {
    const tips: Tip[] = [
      { target: () => document.querySelector('[aria-label="Edge"]'), text: 'Drag me.', on: 'drag' },
      { target: () => document.querySelector('[aria-label="Done"]'), text: 'Then this.' },
    ]
    function Drag() {
      const [open, setOpen] = useState(true)
      return (
        <>
          <div aria-label="Edge" role="separator" />
          <button type="button" aria-label="Done">D</button>
          <Tips tips={tips} open={open} onOpenChange={setOpen} />
        </>
      )
    }
    render(<Drag />)
    await screen.findByRole('dialog', { name: 'Tip 1 of 2' })
    const edge = screen.getByRole('separator')
    fireEvent.pointerDown(edge)
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    // Held: the next does not come.
    await new Promise((r) => setTimeout(r, 600))
    expect(screen.queryByRole('dialog')).toBeNull()
    fireEvent.pointerUp(edge)
    expect(await screen.findByRole('dialog', { name: 'Tip 2 of 2' })).toBeTruthy()
  })

  it('has no accessibility violations', async () => {
    render(<App />)
    await screen.findByRole('dialog')
    await expectNoA11yViolations(document.body)
  })
})
