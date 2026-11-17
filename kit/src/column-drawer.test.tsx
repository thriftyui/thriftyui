import { describe, expect, it } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expectNoA11yViolations } from './test/a11y.ts'
import { ColumnDrawer, ColumnDrawerClose, ColumnDrawerContent, ColumnDrawerTrigger } from './column-drawer.tsx'

function Drawer(props: { rows?: number; header?: boolean; size?: 'half' | 'full' }) {
  return (
    <ColumnDrawer>
      <ColumnDrawerContent aria-label="Queue" {...props}>
        <ColumnDrawerClose />
        <button type="button">Inside</button>
      </ColumnDrawerContent>
      <ColumnDrawerTrigger>Queue</ColumnDrawerTrigger>
    </ColumnDrawer>
  )
}

describe('ColumnDrawer', () => {
  it('says whether it is open, and which region it controls', async () => {
    const user = userEvent.setup()
    const { container } = render(<Drawer />)
    const button = screen.getByRole('button', { name: 'Queue' })
    expect(button.getAttribute('aria-expanded')).toBe('false')
    await user.click(button)
    expect(button.getAttribute('aria-expanded')).toBe('true')
    const region = screen.getByRole('region', { name: 'Queue' })
    expect(button.getAttribute('aria-controls')).toBe(region.id)
    // Focus stays on the button, as a disclosure's does.
    expect(document.activeElement).toBe(button)
    await expectNoA11yViolations(container)
  })

  it('closes on Escape from inside, focus going back to its button', async () => {
    const user = userEvent.setup()
    render(<Drawer />)
    const button = screen.getByRole('button', { name: 'Queue' })
    await user.click(button)
    await user.click(screen.getByRole('button', { name: 'Inside' }))
    await user.keyboard('{Escape}')
    expect(button.getAttribute('aria-expanded')).toBe('false')
    expect(document.activeElement).toBe(button)
  })

  it('closes from its own close button, focus going back to its button', async () => {
    const user = userEvent.setup()
    render(<Drawer />)
    const button = screen.getByRole('button', { name: 'Queue' })
    await user.click(button)
    await user.click(screen.getByRole('button', { name: 'Close the drawer' }))
    await waitFor(() => expect(button.getAttribute('aria-expanded')).toBe('false'))
    expect(document.activeElement).toBe(button)
  })

  it('is as tall as its rows, and its header, never taller than full', async () => {
    const user = userEvent.setup()
    render(<Drawer rows={3} header />)
    await user.click(screen.getByRole('button', { name: 'Queue' }))
    const region = screen.getByRole('region', { name: 'Queue' })
    expect(region.style.height).toBe('calc(var(--header-height) + 3 * var(--row-height))')
    expect(region.style.maxHeight).toContain('100% - var(--header-height) - var(--footer-height)')
    expect(region.className).not.toMatch(/\bh-1\/2\b/)
  })

  it('is half the column by default, or full', async () => {
    const user = userEvent.setup()
    const { unmount } = render(<Drawer />)
    await user.click(screen.getByRole('button', { name: 'Queue' }))
    expect(screen.getByRole('region', { name: 'Queue' }).className).toMatch(/\bh-1\/2\b/)
    unmount()
    render(<Drawer size="full" />)
    await user.click(screen.getByRole('button', { name: 'Queue' }))
    const region = screen.getByRole('region', { name: 'Queue' })
    expect(region.className).toContain('h-[calc(100%-var(--header-height)-var(--footer-height)-env(safe-area-inset-top)-var(--drawer-inset-bottom,0px))]')
    expect(region.style.height).toBe('')
  })
})
