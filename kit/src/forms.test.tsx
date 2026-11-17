import { describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expectNoA11yViolations } from './test/a11y.ts'
import { Form, FormControl, FormField, FormLabel, FormMessage, FormSubmit } from './form.tsx'
import { Label } from './label.tsx'
import { OneTimePasswordField, OneTimePasswordFieldHiddenInput, OneTimePasswordFieldInput } from './one-time-password-field.tsx'
import { PasswordToggleField, PasswordToggleFieldInput, PasswordToggleFieldToggle } from './password-toggle-field.tsx'

describe('Form', () => {
  function SignUp({ onSubmit }: { onSubmit: () => void }) {
    return (
      <Form
        onSubmit={(e) => {
          e.preventDefault()
          onSubmit()
        }}
      >
        <FormField name="email">
          <FormLabel>Email</FormLabel>
          <FormControl type="email" required />
          <FormMessage match="valueMissing">Enter your email.</FormMessage>
          <FormMessage match="typeMismatch">That is not an email address.</FormMessage>
        </FormField>
        <FormSubmit>Sign up</FormSubmit>
      </Form>
    )
  }

  it('stops an empty submit with its message, tied to the field, focus on the field', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    const { container } = render(<SignUp onSubmit={onSubmit} />)
    await user.click(screen.getByRole('button', { name: 'Sign up' }))
    expect(onSubmit).not.toHaveBeenCalled()
    const field = screen.getByLabelText('Email')
    expect(await screen.findByText('Enter your email.')).toBeTruthy()
    // Radix marks a field that fails the browser's checks with data-invalid,
    // and sets aria-invalid only for an error from the server (its source,
    // form.tsx: aria-invalid={serverInvalid || undefined}).
    expect(field.hasAttribute('data-invalid')).toBe(true)
    expect(field.getAttribute('aria-describedby')).toContain(screen.getByText('Enter your email.').id)
    await waitFor(() => expect(document.activeElement).toBe(field))
    await expectNoA11yViolations(container)
  })

  it('says when what is typed is not an email, and submits when it is', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<SignUp onSubmit={onSubmit} />)
    const field = screen.getByLabelText('Email')
    await user.type(field, 'ada')
    await user.click(screen.getByRole('button', { name: 'Sign up' }))
    expect(await screen.findByText('That is not an email address.')).toBeTruthy()
    await user.clear(field)
    await user.type(field, 'ada@example.com')
    await user.click(screen.getByRole('button', { name: 'Sign up' }))
    await waitFor(() => expect(onSubmit).toHaveBeenCalled())
  })
})

describe('OneTimePasswordField', () => {
  it('moves along its boxes as a code is typed, and keeps the whole code in one hidden input', async () => {
    const user = userEvent.setup()
    const { container } = render(
      <OneTimePasswordField aria-label="Code">
        {Array.from({ length: 4 }, (_, i) => (
          <OneTimePasswordFieldInput key={i} />
        ))}
        <OneTimePasswordFieldHiddenInput name="code" />
      </OneTimePasswordField>,
    )
    const boxes = container.querySelectorAll('input:not([type=hidden])')
    expect(boxes.length).toBe(4)
    ;(boxes[0] as HTMLInputElement).focus()
    await user.keyboard('1234')
    await waitFor(() => expect((container.querySelector('input[name=code]') as HTMLInputElement).value).toBe('1234'))
    await expectNoA11yViolations(container)
  })
})

describe('PasswordToggleField', () => {
  it('hides the password, and its named button shows it', async () => {
    const user = userEvent.setup()
    const { container } = render(
      <>
        <Label htmlFor="pw">Password</Label>
        <PasswordToggleField>
          <PasswordToggleFieldInput id="pw" />
          <PasswordToggleFieldToggle />
        </PasswordToggleField>
      </>,
    )
    const input = screen.getByLabelText('Password') as HTMLInputElement
    expect(input.type).toBe('password')
    const toggle = screen.getByRole('button')
    expect(toggle.getAttribute('aria-label') || toggle.textContent).toBeTruthy()
    await user.click(toggle)
    expect(input.type).toBe('text')
    await expectNoA11yViolations(container)
  })
})
