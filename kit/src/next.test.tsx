import { useState } from 'react'
import { describe, expect, it } from 'vitest'
import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Search } from 'lucide-react'
import { expectNoA11yViolations } from './test/a11y.ts'
import { Button } from './button.tsx'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from './empty.tsx'
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput, InputGroupText } from './input-group.tsx'
import { Label } from './label.tsx'
import { NumberField } from './number-field.tsx'
import { Resizable, ResizableArea, ResizableHandle } from './resizable.tsx'

// Empty, Input Group, Number Field and Resizable: what each is to a
// screen reader and the keyboard, and axe over each.

describe('Empty', () => {
  it('has a heading, hides its icon, and holds what to do', async () => {
    const { container } = render(
      <Empty>
        <EmptyHeader>
          <EmptyMedia>
            <Search />
          </EmptyMedia>
          <EmptyTitle>No orders yet</EmptyTitle>
          <EmptyDescription>Orders show here once someone buys.</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button>Share the shop</Button>
        </EmptyContent>
      </Empty>,
    )
    expect(screen.getByRole('heading', { level: 3, name: 'No orders yet' })).toBeTruthy()
    expect(container.querySelector('svg')?.closest('[aria-hidden]')).toBeTruthy()
    await expectNoA11yViolations(container)
  })
})

describe('InputGroup', () => {
  it('keeps the field named by its label, a button in it named, and a press on the addon focusing the field', async () => {
    const user = userEvent.setup()
    const { container } = render(
      <>
        <Label htmlFor="price">Price, in dollars</Label>
        <InputGroup>
          <InputGroupAddon>
            <InputGroupText>$</InputGroupText>
          </InputGroupAddon>
          <InputGroupInput id="price" />
          <InputGroupAddon align="inline-end">
            <InputGroupButton>Apply</InputGroupButton>
          </InputGroupAddon>
        </InputGroup>
      </>,
    )
    const field = screen.getByRole('textbox', { name: 'Price, in dollars' })
    await user.click(screen.getByText('$'))
    expect(document.activeElement).toBe(field)
    await user.click(screen.getByRole('button', { name: 'Apply' }))
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Apply' }))
    await expectNoA11yViolations(container)
  })
})

describe('NumberField', () => {
  function Guests() {
    const [n, setN] = useState<number | null>(2)
    return (
      <>
        <Label htmlFor="guests">Guests</Label>
        <NumberField id="guests" value={n} onValueChange={setN} min={1} max={8} largeStep={5} decrementLabel="Remove guest" incrementLabel="Add guest" />
        <span data-testid="value">{String(n)}</span>
      </>
    )
  }

  it('is a named spinbutton with its range, stepped by the keys and kept in range', async () => {
    const user = userEvent.setup()
    const { container } = render(<Guests />)
    const spin = screen.getByRole('spinbutton', { name: 'Guests' })
    expect(spin.getAttribute('aria-valuenow')).toBe('2')
    expect(spin.getAttribute('aria-valuemin')).toBe('1')
    expect(spin.getAttribute('aria-valuemax')).toBe('8')
    await user.click(spin)
    await user.keyboard('{ArrowUp}')
    expect(spin.getAttribute('aria-valuenow')).toBe('3')
    await user.keyboard('{PageUp}')
    expect(spin.getAttribute('aria-valuenow')).toBe('8')
    await user.keyboard('{ArrowUp}')
    expect(spin.getAttribute('aria-valuenow')).toBe('8')
    await user.keyboard('{Home}')
    expect(spin.getAttribute('aria-valuenow')).toBe('1')
    await user.keyboard('{End}')
    expect(spin.getAttribute('aria-valuenow')).toBe('8')
    await user.keyboard('{ArrowDown}')
    expect(spin.getAttribute('aria-valuenow')).toBe('7')
    await user.keyboard('{PageDown}')
    expect(spin.getAttribute('aria-valuenow')).toBe('2')
    await user.keyboard('{PageDown}')
    expect(spin.getAttribute('aria-valuenow')).toBe('1')
    await expectNoA11yViolations(container)
  })

  it('takes a typed value as typed, marked invalid out of range', async () => {
    const user = userEvent.setup()
    render(<Guests />)
    const spin = screen.getByRole('spinbutton', { name: 'Guests' })
    await user.tripleClick(spin)
    await user.keyboard('12')
    expect(screen.getByTestId('value').textContent).toBe('12')
    expect(spin.getAttribute('aria-invalid')).toBe('true')
    await user.clear(spin)
    await user.tab()
    expect(screen.getByTestId('value').textContent).toBe('1')
  })

  it('has its buttons out of the tab order, named, disabled at the ends, and says a pressed value', async () => {
    const user = userEvent.setup()
    render(<Guests />)
    const less = screen.getByRole('button', { name: 'Remove guest' })
    const more = screen.getByRole('button', { name: 'Add guest' })
    expect(less.tabIndex).toBe(-1)
    expect(more.getAttribute('aria-controls')).toBe('guests')
    await user.click(less)
    expect(screen.getByTestId('value').textContent).toBe('1')
    expect(less.getAttribute('aria-disabled')).toBe('true')
    expect(document.querySelector('output')?.textContent).toBe('1')
    await user.click(less)
    expect(screen.getByTestId('value').textContent).toBe('1')
  })
})

describe('Resizable', () => {
  it('is a separator naming and controlling the primary area, moved by the keys and collapsed by Enter', async () => {
    const user = userEvent.setup()
    const { container } = render(
      <Resizable defaultSize={40} min={20} max={80}>
        <ResizableArea id="contents" aria-label="Contents">
          Contents
        </ResizableArea>
        <ResizableHandle aria-label="Contents" />
        <ResizableArea>Page</ResizableArea>
      </Resizable>,
    )
    const handle = screen.getByRole('separator', { name: 'Contents' })
    expect(handle.getAttribute('aria-orientation')).toBe('vertical')
    expect(handle.getAttribute('aria-controls')).toBe('contents')
    expect(handle.getAttribute('aria-valuenow')).toBe('40')
    await act(async () => handle.focus())
    await user.keyboard('{ArrowRight}')
    expect(handle.getAttribute('aria-valuenow')).toBe('45')
    await user.keyboard('{Shift>}{ArrowLeft}{/Shift}')
    expect(handle.getAttribute('aria-valuenow')).toBe('25')
    await user.keyboard('{Home}')
    expect(handle.getAttribute('aria-valuenow')).toBe('20')
    await user.keyboard('{End}')
    expect(handle.getAttribute('aria-valuenow')).toBe('80')
    await user.keyboard('{Enter}')
    expect(handle.getAttribute('aria-valuenow')).toBe('0')
    await user.keyboard('{Enter}')
    expect(handle.getAttribute('aria-valuenow')).toBe('80')
    await expectNoA11yViolations(container)
  })

  it('between areas one above the other, is moved by Up and Down', async () => {
    const user = userEvent.setup()
    render(
      <Resizable orientation="vertical" defaultSize={40} min={20} max={80}>
        <ResizableArea id="top" aria-label="Top">
          Top
        </ResizableArea>
        <ResizableHandle aria-label="Top" />
        <ResizableArea>Bottom</ResizableArea>
      </Resizable>,
    )
    const handle = screen.getByRole('separator', { name: 'Top' })
    expect(handle.getAttribute('aria-orientation')).toBe('horizontal')
    await act(async () => handle.focus())
    await user.keyboard('{ArrowDown}')
    expect(handle.getAttribute('aria-valuenow')).toBe('45')
    await user.keyboard('{ArrowUp}{ArrowUp}')
    expect(handle.getAttribute('aria-valuenow')).toBe('35')
    await user.keyboard('{Shift>}{ArrowDown}{/Shift}')
    expect(handle.getAttribute('aria-valuenow')).toBe('55')
  })
})
