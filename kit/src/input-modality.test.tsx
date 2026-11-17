import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { Dialog, DialogClose, DialogContent, DialogTitle, DialogTrigger } from './dialog.tsx'
import { Popover, PopoverContent, PopoverTrigger } from './popover.tsx'

// Focus moved on opening: after a pointer's press, without a ring
// (focusVisible false); after a key's, as Radix moves it, the ring left to
// the browser.

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

function Opened() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Open
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent aria-describedby={undefined}>
          <DialogTitle>Settings</DialogTitle>
          <button type="button">Close</button>
          <button type="button">Save</button>
        </DialogContent>
      </Dialog>
    </>
  )
}

describe('Focus on opening a dialog', () => {
  it('goes to its first button without a ring after a pointer press', () => {
    const focus = vi.spyOn(HTMLElement.prototype, 'focus')
    render(<Opened />)
    fireEvent.pointerDown(document.body)
    fireEvent.click(screen.getByRole('button', { name: 'Open' }))
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Close' }))
    expect(focus.mock.calls.some(([o]) => (o as FocusOptions | undefined)?.focusVisible === false)).toBe(true)
  })

  it('goes there as Radix moves it after a key press', () => {
    const focus = vi.spyOn(HTMLElement.prototype, 'focus')
    render(<Opened />)
    fireEvent.keyDown(document.body, { key: 'Enter' })
    fireEvent.click(screen.getByRole('button', { name: 'Open' }))
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Close' }))
    expect(focus.mock.calls.some(([o]) => (o as FocusOptions | undefined)?.focusVisible === false)).toBe(false)
  })
})

/** A dialog opened from its own trigger, for focus going back on closing. */
function Triggered() {
  return (
    <Dialog>
      <DialogTrigger>Open</DialogTrigger>
      <DialogContent aria-describedby={undefined}>
        <DialogTitle>Settings</DialogTitle>
        <DialogClose>Done</DialogClose>
      </DialogContent>
    </Dialog>
  )
}

const quiet = (focus: { mock: { calls: unknown[][] } }, el: HTMLElement) =>
  focus.mock.calls.some((call, i) => (call[0] as FocusOptions | undefined)?.focusVisible === false && (focus as unknown as { mock: { contexts: unknown[] } }).mock.contexts[i] === el)

describe('Focus on closing', () => {
  it('goes back to the trigger without a ring after a pointer press', async () => {
    render(<Triggered />)
    const trigger = screen.getByRole('button', { name: 'Open' })
    fireEvent.pointerDown(trigger)
    fireEvent.click(trigger)
    const focus = vi.spyOn(HTMLElement.prototype, 'focus')
    const done = screen.getByRole('button', { name: 'Done' })
    fireEvent.pointerDown(done)
    fireEvent.click(done)
    await waitFor(() => expect(document.activeElement).toBe(trigger))
    expect(quiet(focus, trigger)).toBe(true)
  })

  it('goes back as Radix sends it after Escape', async () => {
    render(<Triggered />)
    const trigger = screen.getByRole('button', { name: 'Open' })
    fireEvent.pointerDown(trigger)
    fireEvent.click(trigger)
    const focus = vi.spyOn(HTMLElement.prototype, 'focus')
    fireEvent.keyDown(document.activeElement!, { key: 'Escape' })
    await waitFor(() => expect(document.activeElement).toBe(trigger))
    expect(quiet(focus, trigger)).toBe(false)
  })

  it('stays where a press outside a popover put it', async () => {
    render(
      <>
        <Popover>
          <PopoverTrigger>Filter</PopoverTrigger>
          <PopoverContent aria-label="Filter">
            <button type="button">Apply</button>
          </PopoverContent>
        </Popover>
        <button type="button">Elsewhere</button>
      </>,
    )
    const user = userEvent.setup()
    const trigger = screen.getByRole('button', { name: 'Filter' })
    await user.click(trigger)
    await waitFor(() => expect(screen.getByRole('button', { name: 'Apply' })).toBeTruthy())
    const focus = vi.spyOn(HTMLElement.prototype, 'focus')
    await user.click(screen.getByRole('button', { name: 'Elsewhere' }))
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Apply' })).toBeNull())
    expect(quiet(focus, trigger)).toBe(false)
  })
})
