import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderToString } from 'react-dom/server'
import { MemoryRouter, NavLink, Route, Routes } from 'react-router'
import { expectNoA11yViolations } from './test/a11y.ts'
import { NavBar, NavBarItem } from './nav-bar.tsx'

function App({ at = '/accounts' }: { at?: string }) {
  return (
    <MemoryRouter initialEntries={[at]}>
      <NavBar aria-label="Sections">
        {['Accounts', 'Transfers', 'Deposit'].map((s) => (
          <NavBarItem key={s} asChild>
            <NavLink to={`/${s.toLowerCase()}`}>
              <svg aria-hidden />
              {s}
            </NavLink>
          </NavBarItem>
        ))}
      </NavBar>
      <Routes>
        <Route path="*" element={<main>Page</main>} />
      </Routes>
    </MemoryRouter>
  )
}

describe('NavBar', () => {
  it('is a named navigation landmark of links, the one showing marked current', async () => {
    const { container } = render(<App />)
    const nav = screen.getByRole('navigation', { name: 'Sections' })
    expect(nav.hasAttribute('data-nav-bar')).toBe(true)
    expect(screen.getAllByRole('link').map((a) => a.textContent)).toEqual(['Accounts', 'Transfers', 'Deposit'])
    expect(screen.getByRole('link', { name: 'Accounts' }).getAttribute('aria-current')).toBe('page')
    expect(screen.getByRole('link', { name: 'Transfers' }).getAttribute('aria-current')).toBeNull()
    await expectNoA11yViolations(container)
  })

  it('moves the current mark with the page', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('link', { name: 'Deposit' }))
    expect(screen.getByRole('link', { name: 'Deposit' }).getAttribute('aria-current')).toBe('page')
    expect(screen.getByRole('link', { name: 'Accounts' }).getAttribute('aria-current')).toBeNull()
  })

  it('is hidden by CSS from the breakpoint up, so a server draws it right at any width', () => {
    const box = document.createElement('div')
    box.innerHTML = renderToString(<App />)
    expect(box.querySelector('nav')?.classList.contains('lg:hidden')).toBe(true)
    expect(box.querySelector('nav')?.hasAttribute('data-nav-bar')).toBe(true)
  })
})
