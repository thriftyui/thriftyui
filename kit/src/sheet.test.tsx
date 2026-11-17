import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState, type ReactNode } from 'react'
import { expectNoA11yViolations } from './test/a11y.ts'
import { Sheet, SheetContent, SheetDescription, SheetTitle } from './sheet.tsx'

// A bottom sheet's drag (sheet-drag.ts): jsdom lays nothing out, so the
// sheet is given a height (400px) and the clock is set by hand, for the
// speed a drag is let go at.

let now = 0

beforeEach(() => {
  now = 0
  vi.spyOn(performance, 'now').mockImplementation(() => now)
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(() => ({ height: 400, width: 390, top: 0, left: 0, right: 390, bottom: 400, x: 0, y: 0, toJSON: () => ({}) }))
})
afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

function Bottom({ children, ...props }: Omit<Parameters<typeof SheetContent>[0], 'side'> & { children?: ReactNode }) {
  const [open, setOpen] = useState(true)
  return (
    <>
      <p>{open ? 'open' : 'closed'}</p>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" {...props}>
          <SheetTitle>Places</SheetTitle>
          <SheetDescription>Places found.</SheetDescription>
          {children}
        </SheetContent>
      </Sheet>
    </>
  )
}

/** Presses at y 100 on `at`, moves by `dy` over `ms`, lets go. */
function drag(at: Element, dy: number, ms: number) {
  fireEvent.pointerDown(at, { button: 0, pointerId: 1, clientX: 100, clientY: 100 })
  now += ms / 2
  fireEvent.pointerMove(at, { pointerId: 1, clientX: 100, clientY: 100 + dy / 2 })
  now += ms / 2
  fireEvent.pointerMove(at, { pointerId: 1, clientX: 100, clientY: 100 + dy })
  fireEvent.pointerUp(at, { pointerId: 1, clientX: 100, clientY: 100 + dy })
}

const sheet = () => screen.getByRole('dialog')
const state = () => screen.getByText(/^(open|closed)$/).textContent

describe('A bottom sheet, dragged', () => {
  it('closes when dragged past a quarter of its height', async () => {
    render(<Bottom />)
    drag(sheet(), 120, 1000)
    await waitFor(() => expect(state()).toBe('closed'))
  })

  it('goes back when dragged less, slowly', async () => {
    render(<Bottom />)
    drag(sheet(), 60, 1000)
    await new Promise((r) => setTimeout(r, 400))
    expect(state()).toBe('open')
    expect(sheet().style.translate).toBe('')
  })

  it('closes when flicked down, however short', async () => {
    render(<Bottom />)
    drag(sheet(), 40, 50)
    await waitFor(() => expect(state()).toBe('closed'))
  })

  it('follows the finger while dragged, never above its place', () => {
    render(<Bottom />)
    const at = sheet()
    fireEvent.pointerDown(at, { button: 0, pointerId: 1, clientX: 100, clientY: 100 })
    fireEvent.pointerMove(at, { pointerId: 1, clientX: 100, clientY: 160 })
    expect(at.style.translate).toBe('0 60px')
  })

  it('leaves an upward drag, a sideways one and a field to scrolling and typing', async () => {
    render(
      <Bottom>
        <input aria-label="Search" />
      </Bottom>,
    )
    drag(sheet(), -150, 1000)
    fireEvent.pointerDown(sheet(), { button: 0, pointerId: 1, clientX: 100, clientY: 100 })
    fireEvent.pointerMove(sheet(), { pointerId: 1, clientX: 200, clientY: 130 })
    expect(sheet().style.translate).toBe('')
    fireEvent.pointerUp(sheet(), { pointerId: 1, clientX: 200, clientY: 130 })
    drag(screen.getByRole('textbox', { name: 'Search' }), 200, 1000)
    await new Promise((r) => setTimeout(r, 400))
    expect(state()).toBe('open')
  })

  it('leaves a list that has scrolled from its top to scroll', async () => {
    render(
      <Bottom>
        <ul data-testid="list">
          <li>One</li>
        </ul>
      </Bottom>,
    )
    const list = screen.getByTestId('list')
    Object.defineProperty(list, 'scrollHeight', { value: 800 })
    Object.defineProperty(list, 'clientHeight', { value: 200 })
    list.scrollTop = 120
    drag(screen.getByText('One'), 200, 1000)
    await new Promise((r) => setTimeout(r, 400))
    expect(state()).toBe('open')
  })

  it('does not close with dismissible={false}', async () => {
    render(<Bottom dismissible={false} />)
    drag(sheet(), 300, 50)
    await new Promise((r) => setTimeout(r, 400))
    expect(state()).toBe('open')
  })

  it('has a handle drawn, not a control, without heights', async () => {
    const { baseElement } = render(<Bottom />)
    expect(screen.queryByRole('button', { name: /^Show/ })).toBeNull()
    await expectNoA11yViolations(baseElement)
  })
})

describe('A bottom sheet with heights', () => {
  it('rests at the highest unless given, as a part of its height', () => {
    render(<Bottom heights={[0.25, 0.5, 1]} />)
    expect(sheet().style.translate).toBe('0 0%')
  })

  it('moves a height up by its handle, and from the top back to the lowest', async () => {
    const user = userEvent.setup()
    const { baseElement } = render(<Bottom heights={[0.25, 0.5, 1]} height={undefined} />)
    expect(screen.getByRole('button', { name: 'Show less' })).toBeTruthy()
    await user.click(screen.getByRole('button', { name: 'Show less' }))
    expect(sheet().style.translate).toBe('0 75%')
    await user.click(screen.getByRole('button', { name: 'Show more' }))
    expect(sheet().style.translate).toBe('0 50%')
    await expectNoA11yViolations(baseElement)
  })

  it('settles at the nearest height when let go slowly', () => {
    const changed = vi.fn()
    render(<Bottom heights={[0.25, 0.5, 1]} onHeightChange={changed} />)
    // From the top (0px down) to 190px down: nearest the half (200px).
    drag(sheet(), 190, 2000)
    expect(changed).toHaveBeenLastCalledWith(1)
  })

  it('goes a height on when flicked, and closes from the lowest', async () => {
    const changed = vi.fn()
    render(<Bottom heights={[0.25, 0.5, 1]} height={0} onHeightChange={changed} />)
    drag(sheet(), -30, 50)
    expect(changed).toHaveBeenLastCalledWith(1)
    drag(sheet(), 30, 50)
    await waitFor(() => expect(state()).toBe('closed'))
  })
})

describe('A side sheet', () => {
  it('is not dragged and has no handle', () => {
    render(
      <Sheet open>
        <SheetContent side="right">
          <SheetTitle>Menu</SheetTitle>
          <SheetDescription>The menu.</SheetDescription>
        </SheetContent>
      </Sheet>,
    )
    const at = screen.getByRole('dialog')
    fireEvent.pointerDown(at, { button: 0, pointerId: 1, clientX: 100, clientY: 100 })
    fireEvent.pointerMove(at, { pointerId: 1, clientX: 100, clientY: 300 })
    expect(at.style.translate).toBe('')
    expect(screen.queryByRole('button', { name: /^Show/ })).toBeNull()
  })
})
