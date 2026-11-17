import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PageContent, PageSection } from './page.tsx'

describe('PageContent snap', () => {
  it('snaps when near a section by default, always with mandatory', () => {
    const { rerender } = render(<PageContent snap>Body</PageContent>)
    expect(screen.getByRole('main').className).toMatch(/\bsnap-y\b.*\bsnap-proximity\b/)
    rerender(<PageContent snap="mandatory">Body</PageContent>)
    expect(screen.getByRole('main').className).toContain('snap-mandatory')
    expect(screen.getByRole('main').className).not.toContain('snap-proximity')
    rerender(<PageContent>Body</PageContent>)
    expect(screen.getByRole('main').className).not.toContain('snap-')
  })

  it('makes each section a place to rest at', () => {
    render(<PageSection>One</PageSection>)
    expect(screen.getByText('One').className).toContain('snap-start')
  })
})

describe('PageContent focus', () => {
  it('is a tab stop with a ring, so the keyboard can scroll it', () => {
    const { rerender } = render(<PageContent>Body</PageContent>)
    const main = screen.getByRole('main')
    expect(main.tabIndex).toBe(0)
    expect(main.className).toContain('focus-visible:outline-focus')
    rerender(<PageContent tabIndex={-1}>Body</PageContent>)
    expect(screen.getByRole('main').tabIndex).toBe(-1)
  })
})
