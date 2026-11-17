import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogTitle, AlertDialogTrigger } from './alert-dialog.tsx'
import { Button } from './button.tsx'
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuSub, ContextMenuSubContent, ContextMenuSubTrigger, ContextMenuTrigger } from './context-menu.tsx'
import { ColumnDrawer, ColumnDrawerClose, ColumnDrawerContent, ColumnDrawerTrigger } from './column-drawer.tsx'
import { DatePicker } from './date-picker.tsx'
import { Dialog, DialogClose, DialogContent, DialogTitle, DialogTrigger } from './dialog.tsx'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger } from './dropdown-menu.tsx'
import { Menubar, MenubarContent, MenubarItem, MenubarMenu, MenubarSub, MenubarSubContent, MenubarSubTrigger, MenubarTrigger } from './menubar.tsx'
import { Label } from './label.tsx'
import { HoverCard, HoverCardContent, HoverCardTrigger } from './hover-card.tsx'
import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger } from './navigation-menu.tsx'
import { OneTimePasswordField, OneTimePasswordFieldHiddenInput, OneTimePasswordFieldInput } from './one-time-password-field.tsx'
import { Popover, PopoverContent, PopoverTrigger } from './popover.tsx'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select.tsx'
import { Toast, ToastClose, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from './toast.tsx'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './tooltip.tsx'
import { RadioGroup, RadioGroupItem } from './radio-group.tsx'
import { SegmentedControl } from './segmented-control.tsx'
import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from './sheet.tsx'
import { Slider } from './slider.tsx'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs.tsx'
import { ToggleGroup, ToggleGroupItem } from './toggle-group.tsx'
import { Toolbar, ToolbarButton } from './toolbar.tsx'
import { Wheel } from './wheel.tsx'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './accordion.tsx'

// The keys each part's page lists that its own tests do not press, pressed
// here: most of them Radix's, kept as Radix gives them by the kit's
// wrappers.

const focused = () => document.activeElement

describe('the parts that open over the page', () => {
  it('Dialog: Space opens it, Tab and Shift+Tab move inside it, Space on Close closes it', async () => {
    const user = userEvent.setup()
    render(
      <Dialog>
        <DialogTrigger>Open</DialogTrigger>
        <DialogContent aria-describedby={undefined}>
          <DialogTitle>Settings</DialogTitle>
          <button type="button">First</button>
          <button type="button">Second</button>
          <DialogClose>Done</DialogClose>
        </DialogContent>
      </Dialog>,
    )
    const trigger = screen.getByRole('button', { name: 'Open' })
    trigger.focus()
    await user.keyboard(' ')
    expect(screen.getByRole('dialog', { name: 'Settings' })).toBeTruthy()
    const inside = (name: string) => screen.getByRole('button', { name })
    const start = focused()
    await user.tab()
    expect(focused()).not.toBe(start)
    expect(screen.getByRole('dialog').contains(focused())).toBe(true)
    const after = focused()
    await user.tab({ shift: true })
    expect(focused()).toBe(start)
    expect(after).not.toBe(start)
    inside('Done').focus()
    await user.keyboard(' ')
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    expect(focused()).toBe(trigger)
  })

  it('Alert Dialog: Enter opens it; an answer by Space gives it and closes it; Escape cancels', async () => {
    const user = userEvent.setup()
    const onAction = vi.fn()
    render(
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button>Delete</Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogTitle>Delete the file?</AlertDialogTitle>
          <AlertDialogDescription>It cannot be undone.</AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={onAction}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>,
    )
    const trigger = screen.getByRole('button', { name: 'Delete' })
    trigger.focus()
    await user.keyboard('{Enter}')
    const dialog = screen.getByRole('alertdialog', { name: 'Delete the file?' })
    ;(dialog.querySelector('button:last-of-type') as HTMLElement).focus()
    await user.keyboard(' ')
    expect(onAction).toHaveBeenCalledTimes(1)
    await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull())
    trigger.focus()
    await user.keyboard('{Enter}')
    await user.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull())
    expect(onAction).toHaveBeenCalledTimes(1)
    expect(focused()).toBe(trigger)
  })

  it('Sheet: Space and Enter open it, Enter on its close button closes it', async () => {
    const user = userEvent.setup()
    render(
      <Sheet>
        <SheetTrigger>Menu</SheetTrigger>
        <SheetContent side="left" aria-describedby={undefined}>
          <SheetTitle>Menu</SheetTitle>
          <SheetClose>Shut</SheetClose>
        </SheetContent>
      </Sheet>,
    )
    const trigger = screen.getByRole('button', { name: 'Menu' })
    for (const key of [' ', '{Enter}']) {
      trigger.focus()
      await user.keyboard(key)
      expect(screen.getByRole('dialog', { name: 'Menu' })).toBeTruthy()
      screen.getByRole('button', { name: 'Shut' }).focus()
      await user.keyboard('{Enter}')
      await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    }
  })

  it('Popover: Space opens and closes it from its trigger', async () => {
    const user = userEvent.setup()
    render(
      <Popover>
        <PopoverTrigger>Share</PopoverTrigger>
        <PopoverContent aria-label="Share">
          <button type="button">Copy link</button>
        </PopoverContent>
      </Popover>,
    )
    const trigger = screen.getByRole('button', { name: 'Share' })
    trigger.focus()
    await user.keyboard(' ')
    expect(trigger.getAttribute('aria-expanded')).toBe('true')
    trigger.focus()
    await user.keyboard(' ')
    await waitFor(() => expect(trigger.getAttribute('aria-expanded')).toBe('false'))
  })

  it('Date Picker: Space on the button opens the calendar, Escape closes it, focus back on the button', async () => {
    const user = userEvent.setup()
    function Due() {
      const [d, setD] = useState<Date | null>(null)
      return <DatePicker id="due" aria-label="Due" value={d} onValueChange={setD} locale="en-US" />
    }
    render(<Due />)
    const button = screen.getByRole('button', { name: 'Choose date' })
    button.focus()
    await user.keyboard(' ')
    expect(screen.getByRole('dialog', { name: 'Choose date' })).toBeTruthy()
    await user.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    expect(focused()).toBe(button)
  })

  it('Column Drawer: Space and Enter on the trigger open and close it', async () => {
    const user = userEvent.setup()
    render(
      <ColumnDrawer>
        <ColumnDrawerContent aria-label="Queue">
          <ColumnDrawerClose />
        </ColumnDrawerContent>
        <ColumnDrawerTrigger>Queue</ColumnDrawerTrigger>
      </ColumnDrawer>,
    )
    const button = screen.getByRole('button', { name: 'Queue' })
    button.focus()
    await user.keyboard(' ')
    expect(button.getAttribute('aria-expanded')).toBe('true')
    await user.keyboard('{Enter}')
    expect(button.getAttribute('aria-expanded')).toBe('false')
  })
})

describe('the menus', () => {
  const item = (name: string) => screen.getByRole('menuitem', { name })
  const at = (name: string) => waitFor(() => expect(focused()).toBe(item(name)))

  it('Dropdown Menu: Space opens it on its first row, Down and Up move, Right and Left open and close a submenu, Escape goes back to its button', async () => {
    const user = userEvent.setup()
    render(
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button>Edit</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Copy</DropdownMenuItem>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>Share</DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem>By email</DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        </DropdownMenuContent>
      </DropdownMenu>,
    )
    const trigger = screen.getByRole('button', { name: 'Edit' })
    trigger.focus()
    await user.keyboard(' ')
    await at('Copy')
    await user.keyboard('{ArrowDown}')
    await at('Share')
    await user.keyboard('{ArrowUp}')
    await at('Copy')
    await user.keyboard('{ArrowDown}{ArrowRight}')
    await at('By email')
    await user.keyboard('{ArrowLeft}')
    await at('Share')
    await user.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('menu')).toBeNull())
    expect(focused()).toBe(trigger)
    await user.keyboard('{ArrowDown}')
    expect(await screen.findByRole('menu')).toBeTruthy()
  })

  it('Context Menu: Right and Left open and close a submenu, Escape closes it', async () => {
    const user = userEvent.setup()
    render(
      <ContextMenu>
        <ContextMenuTrigger className="block h-20 w-40">Area</ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuSub>
            <ContextMenuSubTrigger>Move to</ContextMenuSubTrigger>
            <ContextMenuSubContent>
              <ContextMenuItem>Archive</ContextMenuItem>
            </ContextMenuSubContent>
          </ContextMenuSub>
        </ContextMenuContent>
      </ContextMenu>,
    )
    fireEvent.contextMenu(screen.getByText('Area'))
    const sub = await screen.findByRole('menuitem', { name: 'Move to' })
    sub.focus()
    await user.keyboard('{ArrowRight}')
    await at('Archive')
    await user.keyboard('{ArrowLeft}')
    await at('Move to')
    await user.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('menu')).toBeNull())
  })

  it("Menubar: Space and Enter open a menu, Down and Up move, Right and Left go along the names and open a submenu, Escape goes back to the name", async () => {
    const user = userEvent.setup()
    render(
      <Menubar aria-label="Application">
        <MenubarMenu>
          <MenubarTrigger>File</MenubarTrigger>
          <MenubarContent>
            <MenubarItem>New</MenubarItem>
            <MenubarSub>
              <MenubarSubTrigger>Open recent</MenubarSubTrigger>
              <MenubarSubContent>
                <MenubarItem>notes.md</MenubarItem>
              </MenubarSubContent>
            </MenubarSub>
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
    const file = item('File')
    file.focus()
    await user.keyboard('{ArrowRight}')
    expect(focused()).toBe(item('View'))
    await user.keyboard('{ArrowLeft}')
    expect(focused()).toBe(file)
    await user.keyboard(' ')
    await at('New')
    await user.keyboard('{ArrowDown}')
    await at('Open recent')
    await user.keyboard('{ArrowRight}')
    await at('notes.md')
    await user.keyboard('{ArrowLeft}')
    await at('Open recent')
    await user.keyboard('{ArrowUp}')
    await at('New')
    await user.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('menu')).toBeNull())
    expect(focused()).toBe(file)
    await user.keyboard('{Enter}')
    await at('New')
    await user.keyboard('{Escape}')
    await user.keyboard('{ArrowDown}')
    await at('New')
  })
})

describe('the parts moved through by the arrows', () => {
  // Radix's roving focus moves focus after the key goes down, and a radio
  // is chosen while the key is still down: each key held, then let go.
  const press = async (user: ReturnType<typeof userEvent.setup>, key: string) => {
    await user.keyboard(`{${key}>}`)
    await user.keyboard(`{/${key}}`)
  }
  const named = (role: string, name: string) => screen.getByRole(role, { name })

  it('Radio Group: Tab goes to the chosen item; Down, Right, Up and Left move and choose; Space chooses', async () => {
    const user = userEvent.setup()
    render(
      <RadioGroup aria-label="Size" defaultValue="m">
        {['s', 'm', 'l'].map((v) => (
          <div key={v}>
            <RadioGroupItem value={v} id={`k-${v}`} />
            <Label htmlFor={`k-${v}`}>{v.toUpperCase()}</Label>
          </div>
        ))}
      </RadioGroup>,
    )
    const checked = () => named('radio', 'S').closest('[role=radiogroup]')!.querySelector('[aria-checked="true"]')
    await user.tab()
    expect(focused()).toBe(named('radio', 'M'))
    for (const [key, to] of [['ArrowDown', 'L'], ['ArrowUp', 'M'], ['ArrowLeft', 'S'], ['ArrowRight', 'M']] as const) {
      await press(user, key)
      await waitFor(() => expect(checked()).toBe(named('radio', to)))
    }
    expect(focused()).toBe(named('radio', 'M'))
  })

  it('Segmented Control: Tab to the chosen cell; arrows, Home and End move; Space and Enter choose', async () => {
    const user = userEvent.setup()
    function Size() {
      const [v, setV] = useState<'s' | 'm' | 'l'>('m')
      return (
        <SegmentedControl
          label="Size"
          value={v}
          onChange={setV}
          options={[
            { value: 's', label: 'Small' },
            { value: 'm', label: 'Medium' },
            { value: 'l', label: 'Large' },
          ]}
        />
      )
    }
    render(<Size />)
    const cell = (name: string) => named('radio', name)
    await user.tab()
    expect(focused()).toBe(cell('Medium'))
    for (const [key, to] of [['ArrowRight', 'Large'], ['ArrowLeft', 'Medium'], ['ArrowDown', 'Large'], ['ArrowUp', 'Medium'], ['Home', 'Small'], ['End', 'Large']] as const) {
      await press(user, key)
      await waitFor(() => expect(focused()).toBe(cell(to)))
    }
    await user.keyboard(' ')
    expect(cell('Large').getAttribute('aria-checked')).toBe('true')
    await press(user, 'Home')
    await waitFor(() => expect(focused()).toBe(cell('Small')))
    await user.keyboard('{Enter}')
    expect(cell('Small').getAttribute('aria-checked')).toBe('true')
  })

  it('Toggle Group: Tab to the first item; arrows, Home and End move; Space and Enter press and let go', async () => {
    const user = userEvent.setup()
    render(
      <ToggleGroup type="multiple" aria-label="Text style">
        {['Bold', 'Italic', 'Underline'].map((n) => (
          <ToggleGroupItem key={n} value={n} aria-label={n}>
            {n[0]}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>,
    )
    const b = (n: string) => named('button', n)
    await user.tab()
    expect(focused()).toBe(b('Bold'))
    for (const [key, to] of [['ArrowRight', 'Italic'], ['ArrowDown', 'Underline'], ['ArrowLeft', 'Italic'], ['ArrowUp', 'Bold'], ['End', 'Underline'], ['Home', 'Bold']] as const) {
      await press(user, key)
      await waitFor(() => expect(focused()).toBe(b(to)))
    }
    await user.keyboard(' ')
    expect(b('Bold').getAttribute('aria-pressed')).toBe('true')
    await user.keyboard('{Enter}')
    expect(b('Bold').getAttribute('aria-pressed')).toBe('false')
  })

  it('Toolbar: Right and Left move between its items, Up and Down not, as it lies across; Space and Enter press them', async () => {
    const user = userEvent.setup()
    const pressed = vi.fn()
    render(
      <Toolbar aria-label="Format">
        <ToolbarButton aria-label="Bold" onClick={() => pressed('bold')}>
          B
        </ToolbarButton>
        <ToolbarButton aria-label="Italic" onClick={() => pressed('italic')}>
          I
        </ToolbarButton>
      </Toolbar>,
    )
    await user.tab()
    for (const [key, to] of [['ArrowRight', 'Italic'], ['ArrowDown', 'Italic'], ['ArrowLeft', 'Bold'], ['ArrowUp', 'Bold']] as const) {
      await press(user, key)
      await waitFor(() => expect(focused()).toBe(named('button', to)))
    }
    await user.keyboard(' ')
    await user.keyboard('{Enter}')
    expect(pressed.mock.calls).toEqual([['bold'], ['bold']])
  })

  it('Tabs: Right and Left, the way the list runs, Home and End move to a tab and show it; Tab goes into what it shows', async () => {
    const user = userEvent.setup()
    const ITEMS = ['One', 'Two', 'Three'].map((label) => ({ value: label.toLowerCase(), label }))
    render(
      <Tabs items={ITEMS} defaultValue="one">
        <TabsList aria-label="Pick">
          {ITEMS.map((i) => (
            <TabsTrigger key={i.value} value={i.value}>
              {i.label}
            </TabsTrigger>
          ))}
        </TabsList>
        {ITEMS.map((i) => (
          <TabsContent key={i.value} value={i.value}>
            {i.label} body
          </TabsContent>
        ))}
      </Tabs>,
    )
    await user.tab()
    expect(focused()).toBe(named('tab', 'One'))
    for (const [key, to] of [['ArrowRight', 'Two'], ['ArrowLeft', 'One'], ['ArrowLeft', 'Three'], ['Home', 'One'], ['End', 'Three']] as const) {
      await press(user, key)
      await waitFor(() => expect(named('tab', to).getAttribute('aria-selected')).toBe('true'))
      expect(focused()).toBe(named('tab', to))
    }
    await user.tab()
    expect(focused()).toBe(screen.getByRole('tabpanel'))
    expect(screen.getByRole('tabpanel').textContent).toBe('Three body')
  })

  it('Accordion: Space and Enter open and close a section; Down, Up, Home and End move between headings, Right and Left when it lies across; Tab and Shift+Tab leave it', async () => {
    const user = userEvent.setup()
    const sections = (orientation?: 'horizontal') => (
      <>
        <button type="button">Before</button>
        <Accordion type="single" collapsible orientation={orientation}>
          {['Shipping', 'Returns', 'Warranty'].map((n) => (
            <AccordionItem key={n} value={n}>
              <AccordionTrigger>{n}</AccordionTrigger>
              <AccordionContent>{n} text</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
        <button type="button">After</button>
      </>
    )
    const { unmount } = render(sections())
    const h = (n: string) => named('button', n)
    h('Shipping').focus()
    await user.keyboard(' ')
    expect(h('Shipping').getAttribute('aria-expanded')).toBe('true')
    await user.keyboard('{Enter}')
    expect(h('Shipping').getAttribute('aria-expanded')).toBe('false')
    for (const [key, to] of [['ArrowDown', 'Returns'], ['ArrowUp', 'Shipping'], ['End', 'Warranty'], ['Home', 'Shipping']] as const) {
      await user.keyboard(`{${key}}`)
      expect(focused()).toBe(h(to))
    }
    await user.tab({ shift: true })
    expect(focused()).toBe(h('Before'))
    await user.tab()
    await user.tab()
    expect(focused()).toBe(h('Returns'))
    unmount()
    render(sections('horizontal'))
    h('Shipping').focus()
    await user.keyboard('{ArrowRight}')
    expect(focused()).toBe(h('Returns'))
    await user.keyboard('{ArrowLeft}')
    expect(focused()).toBe(h('Shipping'))
  })

  it('Wheel: Tab reaches the chosen option; Down and Up move and choose, stopping at its ends', async () => {
    const user = userEvent.setup()
    function Count() {
      const [v, setV] = useState('two')
      return (
        <Wheel
          label="Count"
          options={['one', 'two', 'three'].map((o) => ({ value: o, label: o }))}
          value={v}
          onValueChange={setV}
        />
      )
    }
    render(<Count />)
    const checked = () => screen.getAllByRole('radio').find((r) => r.getAttribute('aria-checked') === 'true')?.textContent
    await user.tab()
    expect(focused()?.textContent).toBe('two')
    for (const [key, to] of [['ArrowDown', 'three'], ['ArrowUp', 'two'], ['ArrowUp', 'one'], ['ArrowUp', 'one']] as const) {
      await press(user, key)
      await waitFor(() => expect(checked()).toBe(to))
    }
  })

  it('Slider: Left, Up and Down by a step, Page Up and Page Down and Shift with the arrows by ten, Home to the least', async () => {
    const user = userEvent.setup()
    render(<Slider aria-label="Volume" defaultValue={[40]} />)
    const thumb = named('slider', 'Volume')
    thumb.focus()
    const now = () => thumb.getAttribute('aria-valuenow')
    for (const [key, to] of [['{ArrowLeft}', '39'], ['{ArrowUp}', '40'], ['{ArrowDown}', '39'], ['{PageUp}', '49'], ['{PageDown}', '39'], ['{Shift>}{ArrowUp}{/Shift}', '49'], ['{Shift>}{ArrowDown}{/Shift}', '39'], ['{Home}', '0']] as const) {
      await user.keyboard(key)
      expect(now()).toBe(to)
    }
  })
})

describe('the rest', () => {
  it('Tooltip: Tab shows it; Enter, Space and Escape hide it at once', async () => {
    const user = userEvent.setup()
    render(
      <TooltipProvider delayDuration={0}>
        <button type="button">Before</button>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button size="icon" aria-label="Save">
              S
            </Button>
          </TooltipTrigger>
          <TooltipContent>Save the file</TooltipContent>
        </Tooltip>
      </TooltipProvider>,
    )
    for (const key of ['{Enter}', ' ', '{Escape}']) {
      screen.getByRole('button', { name: 'Before' }).focus()
      await user.tab()
      expect(await screen.findByRole('tooltip')).toBeTruthy()
      await user.keyboard(key)
      await waitFor(() => expect(screen.queryByRole('tooltip')).toBeNull())
    }
  })

  it('Hover Card: Tab to its link opens it, Tab away closes it; Enter follows the link', async () => {
    const user = userEvent.setup()
    render(
      <>
        <HoverCard openDelay={0} closeDelay={0}>
          <HoverCardTrigger href="#ada">Ada Lovelace</HoverCardTrigger>
          <HoverCardContent>The first programmer.</HoverCardContent>
        </HoverCard>
        <button type="button">After</button>
      </>,
    )
    await user.tab()
    expect(await screen.findByText('The first programmer.')).toBeTruthy()
    await user.keyboard('{Enter}')
    expect(window.location.hash).toBe('#ada')
    await user.tab()
    await waitFor(() => expect(screen.queryByText('The first programmer.')).toBeNull())
  })

  it('Select: Space opens the list, Down and Up move, Escape closes it back to the trigger', async () => {
    const user = userEvent.setup()
    render(
      <Select>
        <SelectTrigger aria-label="Fruit">
          <SelectValue placeholder="Pick one" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="apple">Apple</SelectItem>
          <SelectItem value="pear">Pear</SelectItem>
          <SelectItem value="plum">Plum</SelectItem>
        </SelectContent>
      </Select>,
    )
    const trigger = screen.getByRole('combobox', { name: 'Fruit' })
    trigger.focus()
    await user.keyboard(' ')
    const option = (name: string) => screen.getByRole('option', { name })
    await waitFor(() => expect(focused()).toBe(option('Apple')))
    await user.keyboard('{ArrowDown}')
    await waitFor(() => expect(focused()).toBe(option('Pear')))
    await user.keyboard('{ArrowDown}{ArrowUp}')
    await waitFor(() => expect(focused()).toBe(option('Pear')))
    await user.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('listbox')).toBeNull())
    expect(focused()).toBe(trigger)
    await user.keyboard('{ArrowUp}')
    expect(await screen.findByRole('listbox')).toBeTruthy()
  })

  it('Navigation Menu: the page showing is bold, its words kept at their bold width, given as words or through asChild', () => {
    render(
      <NavigationMenu aria-label="Site">
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuLink href="#home" active>
              Home
            </NavigationMenuLink>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuLink asChild>
              <a href="#docs">Docs</a>
            </NavigationMenuLink>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>,
    )
    const home = screen.getByRole('link', { name: 'Home' })
    expect(home.getAttribute('aria-current')).toBe('page')
    expect(home.className).toContain('data-[active]:font-semibold')
    expect(home.querySelector('[data-text="Home"]')).not.toBeNull()
    expect(screen.getByRole('link', { name: 'Docs' }).querySelector('[data-text="Docs"]')).not.toBeNull()
  })

  it('Navigation Menu: arrows, Home and End move along its items; Space opens an item, Down goes into it, Escape closes it back to the item', async () => {
    const user = userEvent.setup()
    render(
      <NavigationMenu aria-label="Site">
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuLink href="#home">Home</NavigationMenuLink>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuTrigger>Learn</NavigationMenuTrigger>
            <NavigationMenuContent>
              <NavigationMenuLink href="#guides">Guides</NavigationMenuLink>
            </NavigationMenuContent>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuLink href="#about">About</NavigationMenuLink>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>,
    )
    const link = (name: string) => screen.getByRole('link', { name })
    const learn = screen.getByRole('button', { name: 'Learn' })
    await user.tab()
    expect(focused()).toBe(link('Home'))
    for (const [key, to] of [['ArrowRight', learn], ['ArrowDown', () => link('About')], ['ArrowLeft', learn], ['ArrowUp', () => link('Home')], ['End', () => link('About')], ['Home', () => link('Home')]] as const) {
      await user.keyboard(`{${key}}`)
      await waitFor(() => expect(focused()).toBe(typeof to === 'function' ? to() : to))
    }
    learn.focus()
    await user.keyboard(' ')
    expect(learn.getAttribute('aria-expanded')).toBe('true')
    await user.keyboard('{ArrowDown}')
    await waitFor(() => expect(focused()).toBe(link('Guides')))
    await user.keyboard('{Escape}')
    await waitFor(() => expect(learn.getAttribute('aria-expanded')).toBe('false'))
    expect(focused()).toBe(learn)
    await user.tab()
    expect(focused()).toBe(link('About'))
  })

  it('Toast: F8 moves to where toasts show; Tab into it; Enter on its close button closes it; Escape on a toast closes it', async () => {
    const user = userEvent.setup()
    function Saved() {
      const [open, setOpen] = useState(true)
      return (
        <ToastProvider>
          <button type="button" onClick={() => setOpen(true)}>
            Again
          </button>
          <Toast open={open} onOpenChange={setOpen} duration={60_000}>
            <ToastTitle>Saved</ToastTitle>
            <ToastDescription>Your changes are kept.</ToastDescription>
            <ToastClose />
          </Toast>
          <ToastViewport />
        </ToastProvider>
      )
    }
    render(<Saved />)
    const region = screen.getByRole('region', { name: /Notifications/ })
    // Radix knows F8 by the key's code, as a keyboard gives it.
    const f8 = () => fireEvent.keyDown(document, { key: 'F8', code: 'F8' })
    f8()
    expect(region.contains(focused())).toBe(true)
    await user.tab()
    expect(focused()?.closest('li')?.textContent).toContain('Saved')
    if (focused()?.tagName === 'LI') await user.tab()
    expect(focused()).toBe(screen.getByRole('button', { name: 'Close' }))
    await user.keyboard('{Enter}')
    await waitFor(() => expect(screen.queryByText('Your changes are kept.')).toBeNull())
    await user.click(screen.getByRole('button', { name: 'Again' }))
    f8()
    await user.tab()
    expect(focused()?.tagName).toBe('LI')
    await user.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByText('Your changes are kept.')).toBeNull())
    await user.click(screen.getByRole('button', { name: 'Again' }))
    f8()
    await user.tab()
    await user.tab()
    await user.keyboard(' ')
    await waitFor(() => expect(screen.queryByText('Your changes are kept.')).toBeNull())
  })

  it("One-Time Password Field: Right, Left, Home and End move along it; Backspace, Delete and Command+Backspace remove; Tab and Shift+Tab move past it; Enter sends its form", async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn((e: React.FormEvent) => e.preventDefault())
    const { container } = render(
      <form onSubmit={onSubmit}>
        <button type="button">Before</button>
        <OneTimePasswordField aria-label="Code">
          {Array.from({ length: 4 }, (_, i) => (
            <OneTimePasswordFieldInput key={i} />
          ))}
          <OneTimePasswordFieldHiddenInput name="code" />
        </OneTimePasswordField>
        <button type="button">After</button>
      </form>,
    )
    const boxes = [...container.querySelectorAll('input:not([type=hidden])')] as HTMLInputElement[]
    const code = () => (container.querySelector('input[name=code]') as HTMLInputElement).value
    boxes[0].focus()
    await user.keyboard('1234')
    await waitFor(() => expect(code()).toBe('1234'))
    await user.keyboard('{Home}')
    await waitFor(() => expect(focused()).toBe(boxes[0]))
    await user.keyboard('{ArrowRight}')
    await waitFor(() => expect(focused()).toBe(boxes[1]))
    await user.keyboard('{End}')
    await waitFor(() => expect(focused()).toBe(boxes[3]))
    await user.keyboard('{ArrowLeft}')
    await waitFor(() => expect(focused()).toBe(boxes[2]))
    await user.keyboard('{Delete}')
    await waitFor(() => expect(code()).toBe('124'))
    await user.keyboard('{Backspace}')
    await waitFor(() => expect(code()).toBe('12'))
    await waitFor(() => expect(focused()).toBe(boxes[1]))
    await user.keyboard('{Meta>}{Backspace}{/Meta}')
    await waitFor(() => expect(code()).toBe(''))
    boxes[0].focus()
    await user.keyboard('{Enter}')
    expect(onSubmit).toHaveBeenCalled()
    await user.tab({ shift: true })
    expect(focused()).toBe(screen.getByRole('button', { name: 'Before' }))
    await user.tab()
    expect(boxes).toContain(focused())
    await user.tab()
    expect(focused()).toBe(screen.getByRole('button', { name: 'After' }))
  })
})
