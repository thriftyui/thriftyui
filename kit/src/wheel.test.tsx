import { describe, expect, it, vi } from 'vitest'
import { useState } from 'react'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expectNoA11yViolations } from './test/a11y.ts'
import { Wheel } from './wheel.tsx'

const OPTIONS = [
  { value: 'one', label: 'One' },
  { value: 'two', label: 'Two', detail: '2' },
  { value: 'three', label: 'Three', disabled: true },
  { value: 'four', label: 'Four' },
]

function Held({ onChange }: { onChange?: (v: string) => void }) {
  const [value, setValue] = useState('one')
  return (
    <Wheel
      label="Count"
      options={OPTIONS}
      value={value}
      onValueChange={(v) => {
        setValue(v)
        onChange?.(v)
      }}
    />
  )
}

describe('Wheel', () => {
  it('is a named radio group, one option chosen, one Tab stop', async () => {
    const { container } = render(<Held />)
    expect(screen.getByRole('radiogroup', { name: 'Count' })).toBeTruthy()
    expect(screen.getAllByRole('radio').map((r) => r.getAttribute('aria-checked'))).toEqual(['true', 'false', 'false', 'false'])
    await expectNoA11yViolations(container)
    await userEvent.setup().tab()
    expect(document.activeElement).toBe(screen.getByRole('radio', { name: 'One' }))
  })

  it('moves and chooses with Up and Down, passing a disabled option, stopping at its ends', async () => {
    const user = userEvent.setup()
    render(<Held />)
    await user.tab()
    const checked = () => screen.getAllByRole('radio').find((r) => r.getAttribute('aria-checked') === 'true')?.textContent
    // Radix chooses the radio an arrow focuses while the key is down.
    const press = async (key: string) => {
      await user.keyboard(`{${key}>}`)
      await user.keyboard(`{/${key}}`)
    }
    await press('ArrowDown')
    await waitFor(() => expect(checked()).toBe('Two2'))
    await press('ArrowDown')
    await waitFor(() => expect(checked()).toBe('Four'))
    await press('ArrowDown')
    expect(checked()).toBe('Four')
    await press('ArrowUp')
    await press('ArrowUp')
    await waitFor(() => expect(checked()).toBe('One'))
  })

  it('chooses the row a turn by hand comes to rest on', () => {
    vi.useFakeTimers()
    const onChange = vi.fn()
    render(<Held onChange={onChange} />)
    const group = screen.getByRole('radiogroup')
    for (const r of screen.getAllByRole('radio')) Object.defineProperty(r, 'offsetHeight', { value: 36 })
    group.scrollTop = 36
    fireEvent.scroll(group)
    fireEvent(group, new Event('scrollend'))
    act(() => vi.advanceTimersByTime(200))
    expect(onChange).toHaveBeenCalledWith('two')
    vi.useRealTimers()
  })

  it('chooses nothing while disabled', () => {
    render(<Wheel label="Count" options={OPTIONS} value="one" onValueChange={() => {}} disabled />)
    expect(screen.getAllByRole('radio').every((r) => r.hasAttribute('disabled') || r.getAttribute('data-disabled') !== null)).toBe(true)
  })
})
