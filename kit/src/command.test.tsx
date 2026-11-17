import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expectNoA11yViolations } from './test/a11y.ts'
import { Command, CommandDialog, type CommandGroup } from './command.tsx'

// The W3C's Combobox pattern, its list always shown, with grouped options
// (aria-practices, combobox-pattern.html, listbox-pattern.html).

const groups = (ran: (id: string) => void): CommandGroup[] => [
  {
    heading: 'Pages',
    items: [
      { id: 'orders', label: 'Orders', onSelect: () => ran('orders') },
      { id: 'items', label: 'Items', keywords: ['products'], onSelect: () => ran('items') },
    ],
  },
  {
    heading: 'Account',
    items: [
      { id: 'billing', label: 'Billing', disabled: true, onSelect: () => ran('billing') },
      { id: 'sign-out', label: 'Sign out', shortcut: '⇧⌘Q', onSelect: () => ran('sign-out') },
    ],
  },
]

describe('Command', () => {
  it('is a combobox over a listbox of named groups, the first command highlighted', async () => {
    const { container } = render(<Command groups={groups(() => {})} label="Commands" />)
    const box = screen.getByRole('combobox', { name: 'Commands' })
    expect(box.getAttribute('aria-expanded')).toBe('true')
    expect(screen.getAllByRole('group').map((g) => g.getAttribute('aria-labelledby') && document.getElementById(g.getAttribute('aria-labelledby')!)?.textContent)).toEqual(['Pages', 'Account'])
    const active = document.getElementById(box.getAttribute('aria-activedescendant')!)
    expect(active?.textContent).toBe('Orders')
    expect(active?.getAttribute('aria-selected')).toBe('true')
    await expectNoA11yViolations(container)
  })

  it('filters by label and keywords, moves past disabled commands, wraps, and runs with Enter', async () => {
    const user = userEvent.setup()
    const ran = vi.fn()
    render(<Command groups={groups(ran)} label="Commands" />)
    const box = screen.getByRole('combobox', { name: 'Commands' })
    const activeText = () => document.getElementById(box.getAttribute('aria-activedescendant')!)?.textContent
    await user.click(box)
    await user.keyboard('{ArrowDown}{ArrowDown}')
    expect(activeText()).toContain('Sign out')
    await user.keyboard('{ArrowDown}')
    expect(activeText()).toBe('Orders')
    await user.keyboard('{ArrowUp}{Enter}')
    expect(ran).toHaveBeenCalledWith('sign-out')
    await user.type(box, 'prod')
    expect(screen.getAllByRole('option').map((o) => o.textContent)).toEqual(['Items'])
    await user.keyboard('{Enter}')
    expect(ran).toHaveBeenLastCalledWith('items')
  })

  it('says when nothing matches, and Escape clears the field', async () => {
    const user = userEvent.setup()
    render(<Command groups={groups(() => {})} label="Commands" empty="No commands match." />)
    const box = screen.getByRole('combobox', { name: 'Commands' })
    await user.type(box, 'zzz')
    expect(screen.getByRole('status').textContent).toBe('No commands match.')
    expect(box.getAttribute('aria-expanded')).toBe('false')
    await user.keyboard('{Escape}')
    expect((box as HTMLInputElement).value).toBe('')
  })
})

describe('CommandDialog', () => {
  it('is a named dialog with the field focused, closing when a command runs', async () => {
    const user = userEvent.setup()
    const ran = vi.fn()
    function Palette() {
      const [open, setOpen] = useState(true)
      return <CommandDialog open={open} onOpenChange={setOpen} groups={groups(ran)} label="Commands" />
    }
    render(<Palette />)
    expect(screen.getByRole('dialog', { name: 'Command menu' })).toBeTruthy()
    expect(document.activeElement).toBe(screen.getByRole('combobox', { name: 'Commands' }))
    await user.keyboard('{Enter}')
    expect(ran).toHaveBeenCalledWith('orders')
    expect(screen.queryByRole('dialog')).toBeNull()
  })
})

describe('CommandDialog, closing', () => {
  it('gives focus back to what opened it', async () => {
    const user = userEvent.setup()
    function Opened() {
      const [open, setOpen] = useState(false)
      return (
        <>
          <button type="button" onClick={() => setOpen(true)}>
            Open
          </button>
          <CommandDialog open={open} onOpenChange={setOpen} label="Commands" groups={[{ heading: 'Go', items: [{ id: 'a', label: 'Home', onSelect: () => {} }] }]} />
        </>
      )
    }
    render(<Opened />)
    const opener = screen.getByRole('button', { name: 'Open' })
    await user.click(opener)
    expect(screen.getByRole('dialog')).toBeTruthy()
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(document.activeElement).toBe(opener)
  })
})
