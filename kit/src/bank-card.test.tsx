import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { expectNoA11yViolations } from './test/a11y.ts'
import { BANK_CARD_TARGET, BankCard, Guilloche } from './bank-card.tsx'

describe('BankCard', () => {
  it('is a named region the shape of a bank card, its printing hidden from screen readers', async () => {
    const { container } = render(
      <BankCard aria-label="Checking" microprint="SAMPLE BANK" art={<Guilloche />}>
        <p>Checking</p>
        <p>$1,240.50</p>
        <button type="button" aria-label="Hide amounts" className={BANK_CARD_TARGET} />
      </BankCard>,
    )
    const card = screen.getByRole('region', { name: 'Checking' })
    expect(card.className).toContain('aspect-[85.6/53.98]')
    expect(card.className).toContain('[border-radius:3.715%/5.891%]')
    // The microprint: two lines, along the top and bottom, hidden.
    const printed = [...card.querySelectorAll('[aria-hidden]')].filter((e) => e.textContent?.includes('SAMPLE BANK'))
    expect(printed).toHaveLength(2)
    expect(printed[0].textContent?.startsWith('SAMPLE BANK · SAMPLE BANK · ')).toBe(true)
    expect(card.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true')
    expect(screen.getByText('$1,240.50')).toBeTruthy()
    await expectNoA11yViolations(container)
  })

  it('draws no microprint without words, and its art behind the face', () => {
    render(
      <BankCard aria-label="Card" art={<img alt="" src="data:," />}>
        <p>Face</p>
      </BankCard>,
    )
    const card = screen.getByRole('region', { name: 'Card' })
    expect(card.firstElementChild?.tagName).toBe('IMG')
    expect([...card.querySelectorAll('[aria-hidden]')]).toHaveLength(0)
  })

  it("keeps a face button's target 24px however small the face is drawn", () => {
    expect(BANK_CARD_TARGET).toBe('size-[max(1.5rem,calc((1.5rem+0.5px)/var(--bank-card-scale,1)))]')
  })
})
