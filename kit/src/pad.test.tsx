import { useState } from 'react'
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expectNoA11yViolations } from './test/a11y.ts'
import { Pad, TogglePad } from './pad.tsx'

// The W3C's Button pattern (aria-practices, content/patterns/button/button-pattern.html): a
// button named by what it does, and a toggle button whose name stays and whose state is
// aria-pressed; Radix's Toggle for the second.

describe('Pad', () => {
  it('is a button, lit while the app says, its name what it does now', async () => {
    const user = userEvent.setup()
    function Player() {
      const [playing, setPlaying] = useState(false)
      return (
        <Pad lit={playing} aria-label={playing ? 'Pause' : 'Play'} onClick={() => setPlaying((p) => !p)}>
          P
        </Pad>
      )
    }
    const { container } = render(<Player />)
    const pad = screen.getByRole('button', { name: 'Play' })
    expect(pad.getAttribute('type')).toBe('button')
    expect(pad.hasAttribute('data-lit')).toBe(false)
    expect(pad.hasAttribute('aria-pressed')).toBe(false)
    await user.click(pad)
    expect(screen.getByRole('button', { name: 'Pause' }).hasAttribute('data-lit')).toBe(true)
    await expectNoA11yViolations(container)
  })

  it('takes the app’s classes over its own', () => {
    render(<Pad className="bg-neutral-12 rounded-none">X</Pad>)
    const cls = screen.getByRole('button').className.split(' ')
    expect(cls).toContain('bg-neutral-12')
    expect(cls).not.toContain('bg-neutral-3')
    expect(cls).toContain('rounded-none')
    expect(cls).not.toContain('rounded-lg')
  })
})

describe('TogglePad', () => {
  it('is a toggle button, its name the same, pressed by a press, Space and Enter', async () => {
    const user = userEvent.setup()
    const { container } = render(<TogglePad aria-label="Mute">M</TogglePad>)
    const pad = screen.getByRole('button', { name: 'Mute' })
    expect(pad.getAttribute('aria-pressed')).toBe('false')
    await user.click(pad)
    expect(pad.getAttribute('aria-pressed')).toBe('true')
    expect(pad.getAttribute('data-state')).toBe('on')
    pad.focus()
    await user.keyboard(' ')
    expect(pad.getAttribute('aria-pressed')).toBe('false')
    await user.keyboard('{Enter}')
    expect(pad.getAttribute('aria-pressed')).toBe('true')
    await expectNoA11yViolations(container)
  })
})
