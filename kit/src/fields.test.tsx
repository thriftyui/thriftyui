import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expectNoA11yViolations } from './test/a11y.ts'
import { Input } from './input.tsx'
import { Label } from './label.tsx'
import { Textarea } from './textarea.tsx'

describe('Label, Input and Textarea', () => {
  it('names its input, and a press on the label reaches the input', async () => {
    const { container } = render(
      <>
        <Label htmlFor="name">Name</Label>
        <Input id="name" />
      </>,
    )
    const input = screen.getByLabelText('Name')
    expect(input.tagName).toBe('INPUT')
    await userEvent.click(screen.getByText('Name'))
    expect(document.activeElement).toBe(input)
    await userEvent.type(input, 'Ada')
    expect((input as HTMLInputElement).value).toBe('Ada')
    await expectNoA11yViolations(container)
  })

  it('names its textarea the same way, and keeps several lines', async () => {
    const { container } = render(
      <>
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" />
      </>,
    )
    const area = screen.getByLabelText('Notes')
    expect(area.tagName).toBe('TEXTAREA')
    await userEvent.type(area, 'one{Enter}two')
    expect((area as HTMLTextAreaElement).value).toBe('one\ntwo')
    await expectNoA11yViolations(container)
  })

  it('takes no typing while disabled', async () => {
    render(
      <>
        <Label htmlFor="off">Off</Label>
        <Input id="off" disabled />
      </>,
    )
    const input = screen.getByLabelText('Off') as HTMLInputElement
    await userEvent.type(input, 'x')
    expect(input.value).toBe('')
  })

  it("lets a className override the field's own", () => {
    render(<Input aria-label="Wide" className="px-0" />)
    const classes = screen.getByLabelText('Wide').className.split(' ')
    expect(classes).toContain('px-0')
    expect(classes).not.toContain('px-3')
  })
})
