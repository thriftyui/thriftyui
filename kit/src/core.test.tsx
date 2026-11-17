import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expectNoA11yViolations } from './test/a11y.ts'
import { Callout, CalloutIcon, CalloutText } from './callout.tsx'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './card.tsx'
import { Field, FieldControl, FieldDescription, FieldError, FieldLabel } from './field.tsx'
import { Input } from './input.tsx'
import { Kbd } from './kbd.tsx'
import { Skeleton } from './skeleton.tsx'
import { Spinner } from './spinner.tsx'
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from './table.tsx'
import { ToggleGroup, ToggleGroupItem } from './toggle-group.tsx'
import { Blockquote, Code, CodeBlock, Heading, Link, Text } from './typography.tsx'

// The core parts -- Card, Table, Skeleton, Spinner, Kbd, Callout, Field,
// Toggle Group, typography: what each is to a screen reader and the
// keyboard, and axe over each.

describe('Card', () => {
  it('groups its title, description, content and footer; asChild gives another element', async () => {
    const { container } = render(
      <Card asChild>
        <article>
          <CardHeader>
            <CardTitle>Plan</CardTitle>
            <CardDescription>Billed monthly.</CardDescription>
          </CardHeader>
          <CardContent>Three seats.</CardContent>
          <CardFooter>
            <button type="button">Change</button>
          </CardFooter>
        </article>
      </Card>,
    )
    expect(container.firstElementChild?.tagName).toBe('ARTICLE')
    expect(screen.getByRole('heading', { level: 3, name: 'Plan' })).toBeTruthy()
    await expectNoA11yViolations(container)
  })
})

describe('Table', () => {
  const people = (
    <Table aria-label="People">
      <TableCaption>Who is on the team.</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Role</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableHead scope="row">Ada</TableHead>
          <TableCell>Owner</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  )
  it('is a native table, its column and row headers marked; its scroll box a named, focusable region', async () => {
    const { container } = render(people)
    expect(screen.getByRole('table', { name: 'People' }).tagName).toBe('TABLE')
    expect(screen.getAllByRole('columnheader').map((h) => h.textContent)).toEqual(['Name', 'Role'])
    expect(screen.getByRole('rowheader', { name: 'Ada' })).toBeTruthy()
    const region = screen.getByRole('region', { name: 'People' })
    expect(region.tabIndex).toBe(0)
    await expectNoA11yViolations(container)
  })
})

describe('Skeleton', () => {
  it('is hidden from a screen reader and the keyboard while loading, and shows its children once loaded', async () => {
    const { container, rerender } = render(
      <Skeleton>
        <button type="button">Save</button>
      </Skeleton>,
    )
    const placeholder = container.firstElementChild as HTMLElement
    expect(placeholder.getAttribute('aria-hidden')).toBe('true')
    expect(placeholder.hasAttribute('inert')).toBe(true)
    expect(screen.queryByRole('button', { name: 'Save' })).toBeNull()
    rerender(
      <Skeleton loading={false}>
        <button type="button">Save</button>
      </Skeleton>,
    )
    expect(screen.getByRole('button', { name: 'Save' })).toBeTruthy()
    await expectNoA11yViolations(container)
  })
})

describe('Spinner', () => {
  it('is a status saying what is loading', async () => {
    const { container } = render(<Spinner label="Loading orders" />)
    expect(screen.getByRole('status').textContent).toBe('Loading orders')
    await expectNoA11yViolations(container)
  })
})

describe('Kbd', () => {
  it('is keyboard input', async () => {
    const { container } = render(
      <p>
        Press <Kbd>⌘</Kbd> <Kbd>K</Kbd>
      </p>,
    )
    expect(screen.getByText('K').tagName).toBe('KBD')
    await expectNoA11yViolations(container)
  })
})

describe('Callout', () => {
  it('is read where it stands, or interrupts as an alert when told', async () => {
    const { container } = render(
      <>
        <Callout tone="warning">
          <CalloutIcon>!</CalloutIcon>
          <CalloutText>Your trial ends in three days.</CalloutText>
        </Callout>
        <Callout tone="danger" role="alert">
          <CalloutText>Access denied.</CalloutText>
        </Callout>
      </>,
    )
    expect(screen.getByRole('alert').textContent).toBe('Access denied.')
    expect(screen.getByText('!').getAttribute('aria-hidden')).toBe('true')
    await expectNoA11yViolations(container)
  })
})

describe('Field', () => {
  it('names its control by its label and describes it; failing, adds the error and marks it invalid', async () => {
    const { container, rerender } = render(
      <Field>
        <FieldLabel>Email</FieldLabel>
        <FieldControl>
          <Input />
        </FieldControl>
        <FieldDescription>We send the receipt here.</FieldDescription>
        <FieldError>Enter an email address.</FieldError>
      </Field>,
    )
    const box = screen.getByRole('textbox', { name: 'Email' })
    expect(box.getAttribute('aria-describedby')).toBeTruthy()
    expect(screen.queryByText('Enter an email address.')).toBeNull()
    await expectNoA11yViolations(container)
    rerender(
      <Field invalid>
        <FieldLabel>Email</FieldLabel>
        <FieldControl>
          <Input />
        </FieldControl>
        <FieldDescription>We send the receipt here.</FieldDescription>
        <FieldError>Enter an email address.</FieldError>
      </Field>,
    )
    const failing = screen.getByRole('textbox', { name: 'Email' })
    expect(failing.getAttribute('aria-invalid')).toBe('true')
    const described = failing.getAttribute('aria-describedby')!.split(' ').map((id) => document.getElementById(id)?.textContent)
    expect(described).toEqual(['We send the receipt here.', 'Enter an email address.'])
    await expectNoA11yViolations(container)
  })
})

describe('ToggleGroup', () => {
  it('turns several on, one tab stop, the arrows between them', async () => {
    const user = userEvent.setup()
    const { container } = render(
      <ToggleGroup type="multiple" aria-label="Text style">
        <ToggleGroupItem value="bold" aria-label="Bold">
          B
        </ToggleGroupItem>
        <ToggleGroupItem value="italic" aria-label="Italic">
          I
        </ToggleGroupItem>
      </ToggleGroup>,
    )
    const bold = screen.getByRole('button', { name: 'Bold' })
    await user.click(bold)
    expect(bold.getAttribute('aria-pressed')).toBe('true')
    await user.keyboard('{ArrowRight}')
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Italic' }))
    await expectNoA11yViolations(container)
  })
})

describe('Typography', () => {
  it('puts each on its element: a heading at its level, sized apart; text, links, code and quotes', async () => {
    const { container } = render(
      <article>
        <Heading level={2} size={4}>
          Billing
        </Heading>
        <Text quiet>
          Paid with <Code>card</Code>, see <Link href="/help">help</Link>.
        </Text>
        <Text asChild size="sm">
          <span>Updated today</span>
        </Text>
        <CodeBlock aria-label="Install">npm install thriftyui</CodeBlock>
        <Blockquote cite="https://example.com">Small parts, well made.</Blockquote>
      </article>,
    )
    const heading = screen.getByRole('heading', { level: 2, name: 'Billing' })
    expect(heading.className).toContain('text-lg')
    expect(screen.getByRole('link', { name: 'help' }).tagName).toBe('A')
    expect(screen.getByText('card').tagName).toBe('CODE')
    expect(screen.getByText('Updated today').tagName).toBe('SPAN')
    expect(screen.getByText('npm install thriftyui').tabIndex).toBe(0)
    expect(screen.getByText('Small parts, well made.').tagName).toBe('BLOCKQUOTE')
    await expectNoA11yViolations(container)
  })
})
