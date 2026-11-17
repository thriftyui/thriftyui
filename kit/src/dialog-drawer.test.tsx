import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expectNoA11yViolations } from './test/a11y.ts'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './dialog.tsx'
import { DialogDrawer, DialogDrawerClose, DialogDrawerContent, DialogDrawerTrigger } from './dialog-drawer.tsx'

function Example() {
  return (
    <Dialog>
      <DialogTrigger>Open</DialogTrigger>
      <DialogContent aria-describedby={undefined}>
        <DialogDrawer>
          <DialogHeader>
            <DialogTitle>Library</DialogTitle>
          </DialogHeader>
          <div>Saved</div>
          <DialogDrawerContent aria-label="Filters">
            <DialogDrawerClose />
            <button type="button">Inside</button>
          </DialogDrawerContent>
          <DialogFooter>
            <DialogDrawerTrigger>Filters</DialogDrawerTrigger>
          </DialogFooter>
        </DialogDrawer>
      </DialogContent>
    </Dialog>
  )
}

describe('DialogDrawer', () => {
  it('opens from the footer, focus staying on its button', async () => {
    const user = userEvent.setup()
    render(<Example />)
    await user.click(screen.getByRole('button', { name: 'Open' }))
    const button = screen.getByRole('button', { name: 'Filters' })
    await user.click(button)
    expect(button.getAttribute('aria-expanded')).toBe('true')
    expect(button.getAttribute('aria-controls')).toBe(screen.getByRole('region', { name: 'Filters' }).id)
    expect(document.activeElement).toBe(button)
    await expectNoA11yViolations(screen.getByRole('dialog'))
  })

  it('opens and closes from its button by Space and by Enter', async () => {
    const user = userEvent.setup()
    render(<Example />)
    await user.click(screen.getByRole('button', { name: 'Open' }))
    const button = screen.getByRole('button', { name: 'Filters' })
    button.focus()
    await user.keyboard(' ')
    expect(button.getAttribute('aria-expanded')).toBe('true')
    await user.keyboard('{Enter}')
    expect(button.getAttribute('aria-expanded')).toBe('false')
    await user.keyboard('{Enter}')
    expect(button.getAttribute('aria-expanded')).toBe('true')
  })

  it('takes the first Escape, the dialog the next', async () => {
    const user = userEvent.setup()
    render(<Example />)
    await user.click(screen.getByRole('button', { name: 'Open' }))
    const button = screen.getByRole('button', { name: 'Filters' })
    await user.click(button)
    await user.click(screen.getByRole('button', { name: 'Inside' }))
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeNull()
    expect(button.getAttribute('aria-expanded')).toBe('false')
    expect(document.activeElement).toBe(button)
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('leaves Escape to the dialog while it is closed', async () => {
    const user = userEvent.setup()
    render(<Example />)
    await user.click(screen.getByRole('button', { name: 'Open' }))
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('closes from its own close button, focus going back to its button', async () => {
    const user = userEvent.setup()
    render(<Example />)
    await user.click(screen.getByRole('button', { name: 'Open' }))
    const button = screen.getByRole('button', { name: 'Filters' })
    await user.click(button)
    await user.click(screen.getByRole('button', { name: 'Close the drawer' }))
    expect(button.getAttribute('aria-expanded')).toBe('false')
    expect(document.activeElement).toBe(button)
  })
})
