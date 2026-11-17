import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expectNoA11yViolations } from './test/a11y.ts'
import { Button } from './button.tsx'
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from './context-menu.tsx'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from './dropdown-menu.tsx'
import { Label } from './label.tsx'
import { Menubar, MenubarContent, MenubarItem, MenubarMenu, MenubarTrigger } from './menubar.tsx'
import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger } from './navigation-menu.tsx'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select.tsx'

describe('DropdownMenu', () => {
  it('opens from its button, the arrows move, Enter chooses, focus goes back', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    render(
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button>Edit</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel>Edit</DropdownMenuLabel>
          <DropdownMenuItem onSelect={onSelect}>
            Copy <DropdownMenuShortcut>Ctrl C</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem>Paste</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuCheckboxItem checked>Show ruler</DropdownMenuCheckboxItem>
          <DropdownMenuRadioGroup value="m">
            <DropdownMenuRadioItem value="s">Small</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="m">Medium</DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>,
    )
    const trigger = screen.getByRole('button', { name: 'Edit' })
    trigger.focus()
    await user.keyboard('{Enter}')
    const menu = await screen.findByRole('menu')
    expect(screen.getByRole('menuitemcheckbox', { name: 'Show ruler' }).getAttribute('aria-checked')).toBe('true')
    expect(screen.getByRole('menuitemradio', { name: 'Medium' }).getAttribute('aria-checked')).toBe('true')
    await expectNoA11yViolations(menu)
    await waitFor(() => expect(document.activeElement).toBe(screen.getByRole('menuitem', { name: /Copy/ })))
    await user.keyboard('{Enter}')
    expect(onSelect).toHaveBeenCalled()
    await waitFor(() => expect(screen.queryByRole('menu')).toBeNull())
    expect(document.activeElement).toBe(trigger)
  })
})

describe('ContextMenu', () => {
  it('opens on a right-click over its area', async () => {
    render(
      <ContextMenu>
        <ContextMenuTrigger className="block h-20 w-40">Right-click here</ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem>Rename</ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>,
    )
    fireEvent.contextMenu(screen.getByText('Right-click here'))
    expect(await screen.findByRole('menuitem', { name: 'Rename' })).toBeTruthy()
  })
})

describe('Menubar', () => {
  it('is a menu bar of menus, opened by its triggers', async () => {
    const user = userEvent.setup()
    const { container } = render(
      <Menubar aria-label="Application">
        <MenubarMenu>
          <MenubarTrigger>File</MenubarTrigger>
          <MenubarContent>
            <MenubarItem>New</MenubarItem>
          </MenubarContent>
        </MenubarMenu>
        <MenubarMenu>
          <MenubarTrigger>View</MenubarTrigger>
          <MenubarContent>
            <MenubarItem>Zoom</MenubarItem>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>,
    )
    expect(screen.getByRole('menubar')).toBeTruthy()
    await expectNoA11yViolations(container)
    await user.click(screen.getByRole('menuitem', { name: 'File' }))
    expect(await screen.findByRole('menuitem', { name: 'New' })).toBeTruthy()
  })
})

describe('Select', () => {
  it('is a combobox named by its label, showing what is chosen; choosing changes it', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    const { container } = render(
      <>
        <Label htmlFor="fruit">Fruit</Label>
        <Select onValueChange={onValueChange}>
          <SelectTrigger id="fruit">
            <SelectValue placeholder="Pick one" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="apple">Apple</SelectItem>
            <SelectItem value="pear">Pear</SelectItem>
          </SelectContent>
        </Select>
      </>,
    )
    const trigger = screen.getByRole('combobox', { name: 'Fruit' })
    expect(trigger.textContent).toContain('Pick one')
    await expectNoA11yViolations(container)
    trigger.focus()
    await user.keyboard('{Enter}')
    const pear = await screen.findByRole('option', { name: 'Pear' })
    await user.click(pear)
    expect(onValueChange).toHaveBeenCalledWith('pear')
    await waitFor(() => expect(screen.getByRole('combobox', { name: 'Fruit' }).textContent).toContain('Pear'))
  })

  it('keeps its list within the room below or above it (the audit’s T1)', async () => {
    render(
      <Select defaultOpen>
        <SelectTrigger aria-label="Fruit">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="apple">Apple</SelectItem>
        </SelectContent>
      </Select>,
    )
    const list = await screen.findByRole('listbox')
    // The room Radix measures, and no taller than 20rem, past which the list scrolls.
    expect(list.className).toContain('max-h-[min(var(--radix-select-content-available-height),20rem)]')
  })
})

describe('NavigationMenu', () => {
  it('is navigation: links, the page showing marked, an item opening its content', async () => {
    const user = userEvent.setup()
    const { container } = render(
      <NavigationMenu aria-label="Site">
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuLink href="/" active>
              Home
            </NavigationMenuLink>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuTrigger>Learn</NavigationMenuTrigger>
            <NavigationMenuContent>
              <NavigationMenuLink href="/guides">
                Guides
              </NavigationMenuLink>
            </NavigationMenuContent>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>,
    )
    expect(screen.getByRole('navigation', { name: 'Site' })).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Home' }).getAttribute('aria-current')).toBe('page')
    await expectNoA11yViolations(container)
    await user.click(screen.getByRole('button', { name: 'Learn' }))
    const inside = await screen.findByRole('link', { name: 'Guides' })
    // A row inside the content, a cell in the bar: each from where it is.
    expect(inside.className).toContain('rounded-md')
    expect(screen.getByRole('link', { name: 'Home' }).className).not.toContain('rounded-md')
  })
})
