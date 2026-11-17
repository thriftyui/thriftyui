import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { StrictMode, useRef, useState } from 'react'
import { expectNoA11yViolations } from './test/a11y.ts'
import { useFocusOnChange } from './use-focus-on-change.ts'
import { Badge } from './badge.tsx'
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage } from './breadcrumb.tsx'
import { Combobox, type ComboboxOption } from './combobox.tsx'
import { Meter } from './meter.tsx'
import { pageRange } from './page-range.ts'
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from './pagination.tsx'
import { SkipLink } from './skip-link.tsx'

describe('Badge', () => {
  it('is text in the text it sits in', async () => {
    const { container } = render(
      <p>
        Inbox <Badge tone="accent">3</Badge>
      </p>,
    )
    expect(screen.getByText('3').tagName).toBe('SPAN')
    await expectNoA11yViolations(container)
  })
})

describe('Breadcrumb', () => {
  it('is a named navigation with an ordered list, the page marked current', async () => {
    const { container } = render(
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbItem>
            <BreadcrumbPage>Settings</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>,
    )
    const nav = screen.getByRole('navigation', { name: 'Breadcrumb' })
    expect(nav.querySelector('ol')).toBeTruthy()
    expect(screen.getByText('Settings').getAttribute('aria-current')).toBe('page')
    // The separators are CSS only: no text between the items.
    expect(nav.textContent).toBe('HomeSettings')
    await expectNoA11yViolations(container)
  })
})

describe('Pagination', () => {
  it('leaves out pages in gaps, a one-page gap shown as the page', () => {
    expect(pageRange(6, 12)).toEqual([1, 'gap', 5, 6, 7, 'gap', 12])
    expect(pageRange(1, 12)).toEqual([1, 2, 3, 4, 5, 'gap', 12])
    expect(pageRange(12, 12)).toEqual([1, 'gap', 8, 9, 10, 11, 12])
    expect(pageRange(6, 12, 2)).toEqual([1, 'gap', 4, 5, 6, 7, 8, 'gap', 12])
    expect(pageRange(1, 5)).toEqual([1, 2, 3, 4, 5])
    expect(pageRange(3, 5)).toEqual([1, 2, 3, 4, 5])
    expect(pageRange(1, 1)).toEqual([1])
    // The same number of items at every page, so the bar keeps one width.
    for (const total of [8, 12, 40]) {
      const counts = new Set(Array.from({ length: total }, (_, i) => pageRange(i + 1, total).length))
      expect([...counts]).toEqual([7])
    }
    // And each page showing is among them, a gap never standing for one.
    for (let c = 1; c <= 40; c++) {
      const r = pageRange(c, 40)
      expect(r).toContain(c)
      r.forEach((p, i) => {
        if (p === 'gap') expect((r[i + 1] as number) - (r[i - 1] as number)).toBeGreaterThan(2)
      })
    }
  })

  it('marks the page showing, and Previous is no link at the first page', async () => {
    const { container } = render(
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious />
          </PaginationItem>
          {pageRange(1, 9).map((p, i) => (
            <PaginationItem key={i}>
              {p === 'gap' ? (
                <PaginationEllipsis />
              ) : (
                <PaginationLink href={`?p=${p}`} current={p === 1}>
                  {p}
                </PaginationLink>
              )}
            </PaginationItem>
          ))}
          <PaginationItem>
            <PaginationNext href="?p=2" />
          </PaginationItem>
        </PaginationContent>
      </Pagination>,
    )
    expect(screen.getByRole('navigation', { name: 'Pagination' })).toBeTruthy()
    expect(screen.getByRole('link', { name: '1' }).getAttribute('aria-current')).toBe('page')
    const previous = screen.getByRole('link', { name: 'Previous page' })
    expect(previous.getAttribute('aria-disabled')).toBe('true')
    expect(previous.hasAttribute('href')).toBe(false)
    expect(screen.getByRole('link', { name: 'Next page' })).toBeTruthy()
    await expectNoA11yViolations(container)
  })
})

describe('Meter', () => {
  it('is a meter named by its label, with its range and value text', async () => {
    const { container } = render(<Meter label="Storage" value={30} max={64} valueText="30 of 64 GB" />)
    const meter = screen.getByRole('meter', { name: 'Storage' })
    expect(meter.getAttribute('aria-valuenow')).toBe('30')
    expect(meter.getAttribute('aria-valuemax')).toBe('64')
    expect(meter.getAttribute('aria-valuetext')).toBe('30 of 64 GB')
    expect((meter.firstChild as HTMLElement).style.width).toBe(`${(30 / 64) * 100}%`)
    await expectNoA11yViolations(container)
  })

  it('takes aria-label with no label shown, and keeps the value in range', () => {
    render(<Meter aria-label="Battery" value={140} />)
    expect(screen.getByRole('meter', { name: 'Battery' }).getAttribute('aria-valuenow')).toBe('100')
  })
})

describe('SkipLink', () => {
  it('is the first stop, and moves focus to the content', async () => {
    const user = userEvent.setup()
    render(
      <>
        <SkipLink>Skip to content</SkipLink>
        <header>
          <button type="button">Menu</button>
        </header>
        <main id="main" tabIndex={-1}>
          Content
        </main>
      </>,
    )
    await user.tab()
    const link = screen.getByRole('link', { name: 'Skip to content' })
    expect(document.activeElement).toBe(link)
    await user.keyboard('{Enter}')
    expect(document.activeElement).toBe(screen.getByRole('main'))
  })
})

describe('useFocusOnChange', () => {
  function Pages() {
    const [page, setPage] = useState('a')
    const ref = useRef<HTMLElement>(null)
    useFocusOnChange(page, ref)
    return (
      <>
        <button type="button" onClick={() => setPage('b')}>
          Go
        </button>
        <main ref={ref} tabIndex={-1}>
          <h1>Page {page}</h1>
        </main>
      </>
    )
  }

  it('leaves focus alone at first, then moves it to the new page heading', async () => {
    const user = userEvent.setup()
    render(
      <StrictMode>
        <Pages />
      </StrictMode>,
    )
    expect(document.activeElement).toBe(document.body)
    await user.click(screen.getByRole('button', { name: 'Go' }))
    const heading = screen.getByRole('heading', { name: 'Page b' })
    expect(document.activeElement).toBe(heading)
    expect(heading.getAttribute('tabindex')).toBe('-1')
  })

  it('starts the new page at its top', async () => {
    const user = userEvent.setup()
    render(<Pages />)
    const main = screen.getByRole('main')
    main.scrollTop = 500
    await user.click(screen.getByRole('button', { name: 'Go' }))
    expect(main.scrollTop).toBe(0)
  })
})

const STATES: ComboboxOption[] = [
  { value: 'al', label: 'Alabama' },
  { value: 'ak', label: 'Alaska' },
  { value: 'as', label: 'American Samoa', disabled: true },
  { value: 'az', label: 'Arizona' },
  { value: 'ca', label: 'California' },
]

describe('Combobox', () => {
  const field = () => screen.getByRole('combobox', { name: 'State' })
  const active = () => {
    const id = field().getAttribute('aria-activedescendant')
    return id ? document.getElementById(id)?.textContent : null
  }

  it('narrows the list as you type, picking none for you', async () => {
    const user = userEvent.setup()
    render(<Combobox label="State" options={STATES} />)
    expect(field().getAttribute('aria-expanded')).toBe('false')
    await user.type(field(), 'al')
    expect(field().getAttribute('aria-expanded')).toBe('true')
    const list = screen.getByRole('listbox', { name: 'State' })
    expect(field().getAttribute('aria-controls')).toBe(list.id)
    expect(screen.getAllByRole('option').map((o) => o.textContent)).toEqual(['Alabama', 'Alaska'])
    expect(field().hasAttribute('aria-activedescendant')).toBe(false)
    await expectNoA11yViolations(document.body)
  })

  it('moves with the arrows, focus staying in the field, past disabled options, wrapping', async () => {
    const user = userEvent.setup()
    render(<Combobox label="State" options={STATES} />)
    await user.click(field())
    await user.keyboard('{ArrowDown}')
    expect(active()).toBe('Alabama')
    expect(document.activeElement).toBe(field())
    await user.keyboard('{ArrowDown}{ArrowDown}')
    expect(active()).toBe('Arizona')
    expect(screen.getByRole('option', { name: 'Arizona' }).getAttribute('aria-selected')).toBe('true')
    await user.keyboard('{ArrowDown}{ArrowDown}')
    expect(active()).toBe('Alabama')
    await user.keyboard('{ArrowUp}')
    expect(active()).toBe('California')
  })

  it('opens on the last option by Up; by Alt with Down opens without moving, with Up closes; Home, End, Left and Right leave the list for the field', async () => {
    const user = userEvent.setup()
    render(<Combobox label="State" options={STATES} />)
    await user.click(field())
    await user.keyboard('{ArrowUp}')
    expect(field().getAttribute('aria-expanded')).toBe('true')
    expect(active()).toBe('California')
    await user.keyboard('{Alt>}{ArrowUp}{/Alt}')
    expect(field().getAttribute('aria-expanded')).toBe('false')
    await user.keyboard('{Alt>}{ArrowDown}{/Alt}')
    expect(field().getAttribute('aria-expanded')).toBe('true')
    expect(active()).toBe(null)
    for (const key of ['{Home}', '{End}', '{ArrowLeft}', '{ArrowRight}']) {
      await user.keyboard('{ArrowDown}')
      expect(active()).not.toBe(null)
      await user.keyboard(key)
      expect(active()).toBe(null)
      expect(document.activeElement).toBe(field())
    }
  })

  it('chooses with Enter as with a click, calling onValueChange', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<Combobox label="State" options={STATES} onValueChange={onValueChange} />)
    await user.type(field(), 'ar{ArrowDown}{Enter}')
    expect(onValueChange).toHaveBeenLastCalledWith('az')
    expect((field() as HTMLInputElement).value).toBe('Arizona')
    expect(field().getAttribute('aria-expanded')).toBe('false')
    await user.keyboard('{ArrowDown}')
    // Reopened after a choice, every option shows.
    expect(screen.getAllByRole('option')).toHaveLength(5)
    await user.click(screen.getByRole('option', { name: 'California' }))
    expect(onValueChange).toHaveBeenLastCalledWith('ca')
    expect(document.activeElement).toBe(field())
  })

  it('cannot choose a disabled option by click', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<Combobox label="State" options={STATES} onValueChange={onValueChange} />)
    await user.type(field(), 'am')
    const samoa = screen.getByRole('option', { name: 'American Samoa' })
    expect(samoa.getAttribute('aria-disabled')).toBe('true')
    await user.click(samoa)
    expect(onValueChange).not.toHaveBeenCalled()
    // Down finds nothing to move to.
    await user.keyboard('{ArrowDown}')
    expect(active()).toBe(null)
  })

  it('closes on Escape, then clears on a second', async () => {
    const user = userEvent.setup()
    render(<Combobox label="State" options={STATES} defaultValue="ak" />)
    expect((field() as HTMLInputElement).value).toBe('Alaska')
    await user.click(field())
    await user.keyboard('{ArrowDown}')
    expect(field().getAttribute('aria-expanded')).toBe('true')
    await user.keyboard('{Escape}')
    expect(field().getAttribute('aria-expanded')).toBe('false')
    expect((field() as HTMLInputElement).value).toBe('Alaska')
    await user.keyboard('{Escape}')
    expect((field() as HTMLInputElement).value).toBe('')
    expect(field().getAttribute('aria-expanded')).toBe('false')
  })

  it('keeps focus in the field when a disabled option is pressed', async () => {
    const user = userEvent.setup()
    render(<Combobox label="State" options={STATES} />)
    await user.type(field(), 'am')
    await user.pointer({ keys: '[MouseLeft]', target: screen.getByRole('listbox') })
    expect(document.activeElement).toBe(field())
  })

  it('held by its owner: typing over the choice unsets it and keeps the text', async () => {
    const user = userEvent.setup()
    function Owned() {
      const [v, setV] = useState<string | null>('ca')
      return (
        <>
          <Combobox label="State" options={STATES} value={v} onValueChange={setV} />
          <output>{v ?? 'none'}</output>
          <button type="button" onClick={() => setV('al')}>
            Set
          </button>
        </>
      )
    }
    render(<Owned />)
    expect((field() as HTMLInputElement).value).toBe('California')
    await user.type(field(), 'x')
    expect(screen.getByText('none')).toBeTruthy()
    expect((field() as HTMLInputElement).value).toBe('Californiax')
    await user.click(screen.getByRole('button', { name: 'Set' }))
    expect((field() as HTMLInputElement).value).toBe('Alabama')
  })
})
