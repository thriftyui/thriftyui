import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Resizable, ResizableArea, ResizableHandle } from './resizable.tsx'

describe('Resizable', () => {
  it('between the areas: controls the first, and the arrows, Home, End and Enter move it', async () => {
    render(
      <Resizable defaultSize={50}>
        <ResizableArea id="first">One</ResizableArea>
        <ResizableHandle aria-label="One" />
        <ResizableArea>Two</ResizableArea>
      </Resizable>,
    )
    const handle = screen.getByRole('separator', { name: 'One' })
    expect(handle.getAttribute('aria-controls')).toBe('first')
    handle.focus()
    await userEvent.keyboard('{ArrowRight}')
    expect(handle.getAttribute('aria-valuenow')).toBe('55')
    await userEvent.keyboard('{Home}')
    expect(handle.getAttribute('aria-valuenow')).toBe('10')
    await userEvent.keyboard('{End}')
    expect(handle.getAttribute('aria-valuenow')).toBe('90')
    await userEvent.keyboard('{Enter}')
    expect(handle.getAttribute('aria-valuenow')).toBe('0')
  })

  it('at the start of the second area, inside its landmark: still the first area its control', async () => {
    render(
      <Resizable orientation="vertical" defaultSize={60}>
        <ResizableArea id="view">View</ResizableArea>
        <ResizableArea>
          <section aria-label="Below">
            <ResizableHandle aria-label="View" />
            Below
          </section>
        </ResizableArea>
      </Resizable>,
    )
    const handle = screen.getByRole('separator', { name: 'View' })
    expect(screen.getByRole('region', { name: 'Below' }).contains(handle)).toBe(true)
    expect(handle.getAttribute('aria-controls')).toBe('view')
    handle.focus()
    await userEvent.keyboard('{ArrowDown}')
    expect(handle.getAttribute('aria-valuenow')).toBe('65')
  })
})
