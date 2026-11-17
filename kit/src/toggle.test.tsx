import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expectNoA11yViolations } from './test/a11y.ts'
import { Toggle } from './toggle.tsx'

describe('Toggle', () => {
  it('is a button that stays pressed, its name the same pressed or not', async () => {
    const user = userEvent.setup()
    const { container } = render(<Toggle aria-label="Mute">M</Toggle>)
    const b = screen.getByRole('button', { name: 'Mute' })
    expect(b.getAttribute('aria-pressed')).toBe('false')
    await user.click(b)
    expect(b.getAttribute('aria-pressed')).toBe('true')
    expect(b.getAttribute('data-state')).toBe('on')
    expect(screen.getByRole('button', { name: 'Mute' })).toBe(b)
    await user.keyboard(' ')
    expect(b.getAttribute('aria-pressed')).toBe('false')
    await expectNoA11yViolations(container)
  })
})
