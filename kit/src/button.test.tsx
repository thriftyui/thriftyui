import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expectNoA11yViolations } from './test/a11y.ts'
import { Button } from './button.tsx'

describe('Button', () => {
  it('is a button named by its text, which does not submit a form', async () => {
    const onSubmit = vi.fn((e: Event) => e.preventDefault())
    const { container } = render(
      <form onSubmit={(e) => onSubmit(e.nativeEvent)}>
        <Button>Save</Button>
      </form>,
    )
    const button = screen.getByRole('button', { name: 'Save' })
    expect(button.getAttribute('type')).toBe('button')
    await userEvent.click(button)
    expect(onSubmit).not.toHaveBeenCalled()
    await expectNoA11yViolations(container)
  })

  it('is reached by the keyboard and pressed with Enter and Space', async () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Save</Button>)
    await userEvent.tab()
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Save' }))
    await userEvent.keyboard('{Enter}')
    await userEvent.keyboard(' ')
    expect(onClick).toHaveBeenCalledTimes(2)
  })

  it('takes its look from the variant', () => {
    render(
      <>
        <Button>Default</Button>
        <Button variant="solid">Solid</Button>
        <Button variant="ghost">Ghost</Button>
      </>,
    )
    expect(screen.getByRole('button', { name: 'Default' }).className).toContain('bg-button')
    expect(screen.getByRole('button', { name: 'Solid' }).className).toContain('bg-button-solid')
    // No ground of its own: no background class that applies while enabled.
    const ghost = screen.getByRole('button', { name: 'Ghost' }).className.split(' ')
    expect(ghost.filter((c) => c.startsWith('bg-'))).toEqual([])
  })

  it("is small and round as a pill, narrower than a row's button, a square for an icon", () => {
    render(
      <>
        <Button variant="pill">Manual</Button>
        <Button variant="pill" size="icon" aria-label="Talk">
          <svg aria-hidden="true" />
        </Button>
      </>,
    )
    const pill = screen.getByRole('button', { name: 'Manual' }).className.split(' ')
    expect(pill).toEqual(expect.arrayContaining(['h-7', 'min-h-7', 'rounded-full', 'border', 'px-2.5', 'text-xs']))
    expect(pill).not.toContain('px-3')
    expect(pill).not.toContain('rounded-md')
    expect(pill).not.toContain('min-h-(--row-height)')
    const icon = screen.getByRole('button', { name: 'Talk' }).className.split(' ')
    expect(icon).toEqual(expect.arrayContaining(['aspect-square', 'px-0', 'rounded-full']))
  })

  it("lets a className override its own (cn)", () => {
    render(<Button className="px-0 bg-accent-9">Save</Button>)
    const classes = screen.getByRole('button', { name: 'Save' }).className.split(' ')
    expect(classes).toContain('px-0')
    expect(classes).not.toContain('px-3')
    expect(classes).toContain('bg-accent-9')
    expect(classes).not.toContain('bg-button')
  })

  it('is an icon alone, named by its label, as size="icon"', async () => {
    const { container } = render(
      <Button size="icon" aria-label="Close">
        <svg aria-hidden="true" />
      </Button>,
    )
    expect(screen.getByRole('button', { name: 'Close' }).className).toContain('aspect-square')
    await expectNoA11yViolations(container)
  })

  it('puts its look on the element given, with asChild, adding no type', async () => {
    const { container } = render(
      <Button asChild variant="solid">
        <a href="/columns">Columns</a>
      </Button>,
    )
    const link = screen.getByRole('link', { name: 'Columns' })
    expect(link.className).toContain('bg-button-solid')
    expect(link.hasAttribute('type')).toBe(false)
    expect(screen.queryByRole('button')).toBeNull()
    await expectNoA11yViolations(container)
  })

  it('cannot be pressed while disabled', async () => {
    const onClick = vi.fn()
    render(
      <Button disabled onClick={onClick}>
        Save
      </Button>,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(onClick).not.toHaveBeenCalled()
  })
})
