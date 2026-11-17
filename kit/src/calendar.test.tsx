import { useState } from 'react'
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expectNoA11yViolations } from './test/a11y.ts'
import { Calendar } from './calendar.tsx'
import { DatePicker } from './date-picker.tsx'
import { Label } from './label.tsx'

// The W3C's Date Picker Dialog example (aria-practices, content/patterns/
// dialog-modal/examples/datepicker-dialog.html): the grid's roles, its keys,
// and the dialog's opening and closing.

const focusedDay = () => document.activeElement?.getAttribute('data-day')

function Pick({ start = new Date(2026, 1, 15), min }: { start?: Date | null; min?: Date }) {
  const [d, setD] = useState<Date | null>(start)
  return (
    <>
      <Calendar value={d} onValueChange={setD} min={min} locale="en-US" />
      <output data-testid="value">{d ? d.toDateString() : 'none'}</output>
    </>
  )
}

describe('Calendar', () => {
  it('is a grid named by its month, weekdays with full names, the chosen day selected and the one tab stop', async () => {
    const { container } = render(<Pick />)
    const grid = screen.getByRole('grid', { name: 'February 2026' })
    expect(grid.querySelectorAll('th')[0].getAttribute('abbr')).toBe('Sunday')
    const chosen = grid.querySelector('[aria-selected="true"]')
    expect(chosen?.textContent).toBe('15')
    expect(grid.querySelectorAll('[tabindex="0"]')).toHaveLength(1)
    expect(chosen?.getAttribute('tabindex')).toBe('0')
    for (const name of ['Previous year', 'Previous month', 'Next month', 'Next year']) expect(screen.getByRole('button', { name })).toBeTruthy()
    await expectNoA11yViolations(container)
  })

  it('moves by day, week, month and year, showing the month it moves into, and chooses with Enter', async () => {
    const user = userEvent.setup()
    render(<Pick />)
    await user.click(screen.getByText('15'))
    await user.keyboard('{ArrowRight}')
    expect(focusedDay()).toBe('2026-2-16')
    await user.keyboard('{ArrowDown}')
    expect(focusedDay()).toBe('2026-2-23')
    await user.keyboard('{Home}')
    expect(focusedDay()).toBe('2026-2-22')
    await user.keyboard('{End}')
    expect(focusedDay()).toBe('2026-2-28')
    await user.keyboard('{ArrowRight}')
    expect(focusedDay()).toBe('2026-3-1')
    expect(screen.getByRole('grid', { name: 'March 2026' })).toBeTruthy()
    await user.keyboard('{PageUp}')
    expect(focusedDay()).toBe('2026-2-1')
    await user.keyboard('{Shift>}{PageDown}{/Shift}')
    expect(focusedDay()).toBe('2027-2-1')
    await user.keyboard('{Enter}')
    expect(screen.getByTestId('value').textContent).toBe('Mon Feb 01 2027')
  })

  it('moves back by day, week and year, and chooses with Space', async () => {
    const user = userEvent.setup()
    render(<Pick />)
    await user.click(screen.getByText('15'))
    await user.keyboard('{ArrowLeft}')
    expect(focusedDay()).toBe('2026-2-14')
    await user.keyboard('{ArrowUp}')
    expect(focusedDay()).toBe('2026-2-7')
    await user.keyboard('{Shift>}{PageUp}{/Shift}')
    expect(focusedDay()).toBe('2025-2-7')
    await user.keyboard(' ')
    expect(screen.getByTestId('value').textContent).toBe('Fri Feb 07 2025')
  })

  it('keeps the same day a month on, or the last day of a shorter month', async () => {
    const user = userEvent.setup()
    render(<Pick start={new Date(2026, 0, 31)} />)
    await user.click(screen.getByText('31'))
    await user.keyboard('{PageDown}')
    expect(focusedDay()).toBe('2026-2-28')
  })

  it('does not choose a day before min', async () => {
    const user = userEvent.setup()
    render(<Pick min={new Date(2026, 1, 10)} />)
    expect(screen.getByText('9').getAttribute('aria-disabled')).toBe('true')
    await user.click(screen.getByText('9'))
    expect(screen.getByTestId('value').textContent).toBe('Sun Feb 15 2026')
  })
})

describe('DatePicker', () => {
  function Due() {
    const [d, setD] = useState<Date | null>(null)
    return (
      <>
        <Label htmlFor="due">Due</Label>
        <DatePicker id="due" value={d} onValueChange={setD} locale="en-US" />
        <output data-testid="value">{d ? d.toDateString() : 'none'}</output>
      </>
    )
  }

  it('has a field described by its format and a named button; the calendar opens on today, a day chosen closes it', async () => {
    const user = userEvent.setup()
    const { container } = render(<Due />)
    const field = screen.getByRole('textbox', { name: 'Due' })
    expect(document.getElementById(field.getAttribute('aria-describedby')!)?.textContent).toBe('Date format: yyyy-mm-dd')
    await expectNoA11yViolations(container)
    await user.click(screen.getByRole('button', { name: 'Choose date' }))
    expect(screen.getByRole('dialog', { name: 'Choose date' })).toBeTruthy()
    const t = new Date()
    expect(focusedDay()).toBe(`${t.getFullYear()}-${t.getMonth() + 1}-${t.getDate()}`)
    await user.keyboard('{ArrowRight}{Enter}')
    expect(screen.queryByRole('dialog')).toBeNull()
    const next = new Date(t.getFullYear(), t.getMonth(), t.getDate() + 1)
    expect(screen.getByTestId('value').textContent).toBe(next.toDateString())
    expect(document.activeElement?.getAttribute('aria-label')).toMatch(/^Change date, /)
  })

  it('takes a typed date, and not an impossible one', async () => {
    const user = userEvent.setup()
    render(<Due />)
    const field = screen.getByRole('textbox', { name: 'Due' })
    await user.type(field, '2026-02-30')
    expect(screen.getByTestId('value').textContent).toBe('none')
    await user.tab()
    expect(field.getAttribute('aria-invalid')).toBe('true')
    await user.clear(field)
    await user.type(field, '2026-02-14')
    expect(screen.getByTestId('value').textContent).toBe('Sat Feb 14 2026')
  })
})
