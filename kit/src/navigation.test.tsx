import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import * as Direction from 'radix-ui/direction'
import { MemoryRouter, NavLink } from 'react-router'
import { expectNoA11yViolations } from './test/a11y.ts'
import { ButtonGroup, ButtonGroupItem } from './button-group.tsx'
import { ListDetail, ListDetailBack, ListDetailContent, ListDetailItem, ListDetailList, ListDetailTitle } from './list-detail.tsx'
import { NavGroup, NavItem, NavList } from './nav-list.tsx'
import { SegmentedControl } from './segmented-control.tsx'
import { Tabs, TabsContent, TabsCurrent, TabsList, TabsNext, TabsPrevious, TabsSlide, TabsSlides, TabsTrigger } from './tabs.tsx'

const ITEMS = [
  { value: 'one', label: 'First' },
  { value: 'two', label: 'Second' },
  { value: 'three', label: 'Third' },
]

describe('Tabs', () => {
  it('steps with Previous and Next, named for where they go, disabled at the ends', async () => {
    const user = userEvent.setup()
    const { container } = render(
      <Tabs items={ITEMS}>
        <TabsPrevious />
        <TabsCurrent />
        <TabsNext />
        {ITEMS.map((i) => (
          <TabsContent key={i.value} value={i.value}>
            {i.label} body
          </TabsContent>
        ))}
      </Tabs>,
    )
    const previous = screen.getByRole('button', { name: 'Previous' })
    expect((previous as HTMLButtonElement).disabled).toBe(true)
    await user.click(screen.getByRole('button', { name: 'Next: Second' }))
    expect(screen.getByText('Second body')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Previous: First' })).toBeTruthy()
    await user.click(screen.getByRole('button', { name: 'Next: Third' }))
    expect((screen.getByRole('button', { name: 'Next' }) as HTMLButtonElement).disabled).toBe(true)
    await expectNoA11yViolations(container)
  })

  it('announces the tab arrived at', async () => {
    const user = userEvent.setup()
    render(
      <Tabs items={ITEMS}>
        <TabsCurrent />
        <TabsNext />
      </Tabs>,
    )
    const current = screen.getByText('First')
    expect(current.getAttribute('aria-live')).toBe('polite')
    await user.click(screen.getByRole('button', { name: 'Next: Second' }))
    expect(current.textContent).toBe('Second')
  })

  it('keeps the slides not showing inert, and moves the strip to the one showing', async () => {
    const user = userEvent.setup()
    render(
      <Tabs items={ITEMS}>
        <TabsList aria-label="Parts">
          {ITEMS.map((i) => (
            <TabsTrigger key={i.value} value={i.value}>
              {i.label}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsSlides>
          {ITEMS.map((i) => (
            <TabsSlide key={i.value} value={i.value}>
              <button type="button">{i.label} button</button>
            </TabsSlide>
          ))}
        </TabsSlides>
      </Tabs>,
    )
    const slide = (name: string) => screen.getByText(`${name} button`).parentElement!
    expect(slide('First').hasAttribute('inert')).toBe(false)
    expect(slide('Second').hasAttribute('inert')).toBe(true)
    await user.click(screen.getByRole('tab', { name: 'Third' }))
    expect(slide('First').hasAttribute('inert')).toBe(true)
    expect(slide('Third').hasAttribute('inert')).toBe(false)
    expect((slide('Third').parentElement as HTMLElement).style.transform).toBe('translateX(-200%)')
  })
})

describe('TabsSlides right to left', () => {
  it('moves the strip the other way, as it runs from the right', async () => {
    const user = userEvent.setup()
    render(
      <Direction.Provider dir="rtl">
        <Tabs items={ITEMS}>
          <TabsNext />
          <TabsSlides>
            {ITEMS.map((i) => (
              <TabsSlide key={i.value} value={i.value}>
                {i.label} body
              </TabsSlide>
            ))}
          </TabsSlides>
        </Tabs>
      </Direction.Provider>,
    )
    await user.click(screen.getByRole('button', { name: 'Next: Second' }))
    expect((screen.getByText('Second body').parentElement as HTMLElement).style.transform).toBe('translateX(100%)')
  })
})

describe('ListDetail', () => {
  function Example() {
    return (
      <ListDetail>
        <ListDetailBack />
        <ListDetailTitle>Settings</ListDetailTitle>
        <ListDetailList>
          <ListDetailItem value="sound">Sound</ListDetailItem>
          <ListDetailItem value="screen">Screen</ListDetailItem>
        </ListDetailList>
        <ListDetailContent value="sound">Sound detail</ListDetailContent>
        <ListDetailContent value="screen">Screen detail</ListDetailContent>
      </ListDetail>
    )
  }

  it('opens a detail with focus on Back, and returns focus to the item', async () => {
    const user = userEvent.setup()
    const { container } = render(<Example />)
    expect(screen.queryByRole('button', { name: 'Back to the list' })).toBeNull()
    await user.click(screen.getByRole('button', { name: 'Screen' }))
    expect(screen.getByText('Screen detail')).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Sound' })).toBeNull()
    expect(screen.getByText('Screen', { selector: 'span' })).toBeTruthy()
    const back = screen.getByRole('button', { name: 'Back to the list' })
    expect(document.activeElement).toBe(back)
    await expectNoA11yViolations(container)
    await user.click(back)
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Screen' }))
    expect(screen.getByText('Settings')).toBeTruthy()
  })

  it('opens by Enter and goes back by Space, as by a press', async () => {
    const user = userEvent.setup()
    render(<Example />)
    screen.getByRole('button', { name: 'Sound' }).focus()
    await user.keyboard('{Enter}')
    expect(screen.getByText('Sound detail')).toBeTruthy()
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Back to the list' }))
    await user.keyboard(' ')
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Sound' }))
    await user.keyboard(' ')
    expect(screen.getByText('Sound detail')).toBeTruthy()
  })
})

describe('ListDetail, held by the app, a home view and whole rows', () => {
  function Example() {
    const [value, setValue] = useState<string | null>(null)
    return (
      <ListDetail value={value} onValueChange={setValue}>
        <ListDetailBack />
        <ListDetailTitle>Wallet</ListDetailTitle>
        <ListDetailList asChild>
          <div>
            <p>Balance</p>
            <ul>
              <ListDetailItem value="eth" label="Ether">
                <span>ETH</span> <span>2.4</span>
              </ListDetailItem>
              <ListDetailItem value="send" label="Send">
                Send
              </ListDetailItem>
            </ul>
          </div>
        </ListDetailList>
        <ListDetailContent value="eth">
          Ether detail
          <button type="button" onClick={() => setValue('send')}>
            Send Ether
          </button>
        </ListDetailContent>
        <ListDetailContent value="send">Send detail</ListDetailContent>
      </ListDetail>
    )
  }

  it('hides the whole home view, names a whole row by its label, and opens a detail the app chooses', async () => {
    const user = userEvent.setup()
    const { container } = render(<Example />)
    await user.click(screen.getByRole('button', { name: 'ETH 2.4' }))
    expect(screen.queryByText('Balance')).toBeNull()
    expect(screen.getByText('Ether', { selector: 'span' })).toBeTruthy()
    // Opened by the app, from inside a detail: titled with the item's name,
    // focus on Back.
    await user.click(screen.getByRole('button', { name: 'Send Ether' }))
    expect(screen.getByText('Send detail')).toBeTruthy()
    expect(screen.getByText('Send', { selector: 'span' })).toBeTruthy()
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Back to the list' }))
    await expectNoA11yViolations(container)
    await user.click(screen.getByRole('button', { name: 'Back to the list' }))
    expect(screen.getByText('Balance')).toBeTruthy()
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Send' }))
  })
})

describe('NavList', () => {
  it('is a named navigation, the page showing marked current, through a router link', async () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/b']}>
        <NavList aria-label="Pages">
          <NavItem asChild>
            <NavLink to="/a">A</NavLink>
          </NavItem>
          <NavItem asChild>
            <NavLink to="/b">B</NavLink>
          </NavItem>
        </NavList>
      </MemoryRouter>,
    )
    expect(screen.getByRole('navigation', { name: 'Pages' })).toBeTruthy()
    expect(screen.getByRole('link', { name: 'B' }).getAttribute('aria-current')).toBe('page')
    expect(screen.getByRole('link', { name: 'A' }).hasAttribute('aria-current')).toBe(false)
    // The row's class lands on the link itself, not a wrapper.
    expect(screen.getByRole('link', { name: 'A' }).className).toContain('w-full')
    await expectNoA11yViolations(container)
  })
})

describe('NavGroup', () => {
  it('is a button that shows and hides its places, open where the page showing is', async () => {
    const user = userEvent.setup()
    const { container } = render(
      <MemoryRouter initialEntries={['/layouts/page']}>
        <NavList aria-label="Pages">
          <NavItem asChild>
            <NavLink to="/about">About</NavLink>
          </NavItem>
          <NavGroup label="Layouts" defaultOpen>
            <NavItem asChild>
              <NavLink to="/layouts/page">Page</NavLink>
            </NavItem>
          </NavGroup>
          <NavGroup label="Components">
            <NavItem asChild>
              <NavLink to="/components/button">Button</NavLink>
            </NavItem>
          </NavGroup>
        </NavList>
      </MemoryRouter>,
    )
    const layouts = screen.getByRole('button', { name: 'Layouts' })
    const components = screen.getByRole('button', { name: 'Components' })
    expect(layouts.getAttribute('aria-expanded')).toBe('true')
    expect(screen.getByRole('link', { name: 'Page' }).getAttribute('aria-current')).toBe('page')
    expect(components.getAttribute('aria-expanded')).toBe('false')
    expect(screen.queryByRole('link', { name: 'Button' })).toBeNull()
    await user.click(components)
    expect(components.getAttribute('aria-expanded')).toBe('true')
    expect(screen.getByRole('link', { name: 'Button' })).toBeTruthy()
    // Each opens on its own: Layouts stayed open.
    expect(layouts.getAttribute('aria-expanded')).toBe('true')
    // Pressing it goes nowhere: still the same page.
    expect(screen.getByRole('link', { name: 'Page' }).getAttribute('aria-current')).toBe('page')
    await expectNoA11yViolations(container)
  })
})

describe('SegmentedControl', () => {
  function Example() {
    const [v, setV] = useState<'a' | 'b'>('a')
    return (
      <SegmentedControl
        label="Size"
        value={v}
        onChange={setV}
        options={[
          { value: 'a', label: 'Small' },
          { value: 'b', label: 'Large' },
        ]}
      />
    )
  }

  it('is a named radiogroup, one always chosen', async () => {
    const user = userEvent.setup()
    const { container } = render(<Example />)
    expect(screen.getByRole('radiogroup', { name: 'Size' })).toBeTruthy()
    const small = screen.getByRole('radio', { name: 'Small' })
    expect(small.getAttribute('aria-checked')).toBe('true')
    await user.click(screen.getByRole('radio', { name: 'Large' }))
    expect(small.getAttribute('aria-checked')).toBe('false')
    // Pressing the chosen one again does not leave none chosen.
    await user.click(screen.getByRole('radio', { name: 'Large' }))
    expect(screen.getByRole('radio', { name: 'Large' }).getAttribute('aria-checked')).toBe('true')
    await expectNoA11yViolations(container)
  })
})

describe('ButtonGroup', () => {
  it('is a named group of buttons, each its own tab stop', async () => {
    const user = userEvent.setup()
    const { container } = render(
      <ButtonGroup aria-label="Edit">
        <ButtonGroupItem>Cut</ButtonGroupItem>
        <ButtonGroupItem>Copy</ButtonGroupItem>
      </ButtonGroup>,
    )
    expect(screen.getByRole('group', { name: 'Edit' })).toBeTruthy()
    await user.tab()
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Cut' }))
    await user.tab()
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Copy' }))
    await expectNoA11yViolations(container)
  })
})

describe('Tabs, pressed with the mouse', () => {
  it('choose the tab pressed and focus it, the arrow keys moving on from there', async () => {
    const user = userEvent.setup()
    render(
      <Tabs defaultValue="one">
        <TabsList aria-label="Views">
          <TabsTrigger value="one">One</TabsTrigger>
          <TabsTrigger value="two">Two</TabsTrigger>
          <TabsTrigger value="three">Three</TabsTrigger>
        </TabsList>
        <TabsContent value="one">First</TabsContent>
        <TabsContent value="two">Second</TabsContent>
        <TabsContent value="three">Third</TabsContent>
      </Tabs>,
    )
    const two = screen.getByRole('tab', { name: 'Two' })
    await user.click(two)
    expect(two.getAttribute('aria-selected')).toBe('true')
    expect(document.activeElement).toBe(two)
    expect(screen.getByRole('tabpanel').textContent).toBe('Second')
    await user.keyboard('{ArrowRight}')
    expect(screen.getByRole('tab', { name: 'Three' }).getAttribute('aria-selected')).toBe('true')
  })
})

describe('ListDetail, an item with its summary', () => {
  it('shows the current setting after the name, read with it, the detail titled by the name alone', async () => {
    const user = userEvent.setup()
    render(
      <ListDetail>
        <ListDetailBack />
        <ListDetailTitle>Account</ListDetailTitle>
        <ListDetailList>
          <ListDetailItem value="plan" summary="Yearly">
            Plan and billing
          </ListDetailItem>
        </ListDetailList>
        <ListDetailContent value="plan">The plan.</ListDetailContent>
      </ListDetail>,
    )
    const item = screen.getByRole('button', { name: 'Plan and billing Yearly' })
    await user.click(item)
    expect(screen.getByText('Plan and billing').textContent).toBe('Plan and billing')
    expect(screen.getByText('The plan.')).toBeTruthy()
  })
})

