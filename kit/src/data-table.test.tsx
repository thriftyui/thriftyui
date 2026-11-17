import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expectNoA11yViolations } from './test/a11y.ts'
import { DataTable, type DataTableColumn } from './data-table.tsx'

// The W3C's Sortable Table example (aria-practices, content/patterns/table/
// examples/sortable-table.html).

type Order = { id: string; customer: string; total: number; note: string }
const ROWS: Order[] = [
  { id: '1042', customer: 'Chen Wu', total: 30, note: 'Gift' },
  { id: '1041', customer: 'Ada Park', total: 120, note: '' },
  { id: '1040', customer: 'Ben Ortiz', total: 64.5, note: 'Rush' },
]
const COLUMNS: DataTableColumn<Order>[] = [
  { id: 'id', header: 'Order', cell: (o) => o.id, rowHeader: true, sortValue: (o) => o.id },
  { id: 'customer', header: 'Customer', cell: (o) => o.customer, sortValue: (o) => o.customer },
  { id: 'total', header: 'Total', cell: (o) => `$${o.total.toFixed(2)}`, sortValue: (o) => o.total, align: 'end' },
  { id: 'note', header: 'Note', cell: (o) => o.note },
]
const column = (n: number) => screen.getAllByRole('row').slice(1).map((r) => r.querySelectorAll('th, td')[n].textContent)

describe('DataTable', () => {
  it('names its sort buttons by the header alone, marks the sorted column, and says which headers sort', async () => {
    const { container } = render(<DataTable rows={ROWS} columns={COLUMNS} rowKey={(o) => o.id} caption="Orders" defaultSort={{ column: 'customer', direction: 'ascending' }} />)
    expect(screen.getByRole('table', { name: /Orders/ })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Customer' })).toBeTruthy()
    expect(screen.getByRole('columnheader', { name: 'Customer' }).getAttribute('aria-sort')).toBe('ascending')
    expect(screen.getByRole('columnheader', { name: 'Note' }).querySelector('button')).toBeNull()
    expect(column(1)).toEqual(['Ada Park', 'Ben Ortiz', 'Chen Wu'])
    expect(screen.getAllByRole('rowheader').map((h) => h.textContent)).toEqual(['1041', '1040', '1042'])
    await expectNoA11yViolations(container)
  })

  it('sorts by a pressed column, ascending, then turns it over; numbers by value', async () => {
    const user = userEvent.setup()
    render(<DataTable rows={ROWS} columns={COLUMNS} rowKey={(o) => o.id} caption="Orders" />)
    await user.click(screen.getByRole('button', { name: 'Total' }))
    expect(column(2)).toEqual(['$30.00', '$64.50', '$120.00'])
    expect(screen.getByRole('columnheader', { name: 'Total' }).getAttribute('aria-sort')).toBe('ascending')
    await user.click(screen.getByRole('button', { name: 'Total' }))
    expect(column(2)).toEqual(['$120.00', '$64.50', '$30.00'])
    expect(screen.getByRole('columnheader', { name: 'Total' }).getAttribute('aria-sort')).toBe('descending')
    await user.click(screen.getByRole('button', { name: 'Order' }))
    expect(screen.getByRole('columnheader', { name: 'Total' }).hasAttribute('aria-sort')).toBe(false)
  })

  it('is reached by Tab at its scroll box, then each sort button, and sorts by Space and Enter', async () => {
    const user = userEvent.setup()
    const { container } = render(<DataTable rows={ROWS} columns={COLUMNS} rowKey={(o) => o.id} caption="Orders" />)
    await user.tab()
    expect(document.activeElement).toBe(container.querySelector('[tabindex="0"]'))
    for (const b of screen.getAllByRole('button')) {
      await user.tab()
      expect(document.activeElement).toBe(b)
    }
    screen.getByRole('button', { name: 'Total' }).focus()
    await user.keyboard(' ')
    expect(screen.getByRole('columnheader', { name: 'Total' }).getAttribute('aria-sort')).toBe('ascending')
    await user.keyboard('{Enter}')
    expect(screen.getByRole('columnheader', { name: 'Total' }).getAttribute('aria-sort')).toBe('descending')
  })
})
