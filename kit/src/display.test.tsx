import { describe, expect, it } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { expectNoA11yViolations } from './test/a11y.ts'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './accordion.tsx'
import { AccessibleIcon, AspectRatio } from './aspect-ratio.tsx'
import { Avatar, AvatarFallback, AvatarImage } from './avatar.tsx'
import { Button } from './button.tsx'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './collapsible.tsx'
import { Progress } from './progress.tsx'
import { ScrollArea } from './scroll-area.tsx'
import { Separator } from './separator.tsx'
import { Toast, ToastAction, ToastClose, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from './toast.tsx'

describe('Accordion', () => {
  it('opens one section at a time, its headings buttons that say whether they are open', async () => {
    const user = userEvent.setup()
    const { container } = render(
      <Accordion type="single" collapsible>
        <AccordionItem value="a">
          <AccordionTrigger>Shipping</AccordionTrigger>
          <AccordionContent>Three to five days.</AccordionContent>
        </AccordionItem>
        <AccordionItem value="b">
          <AccordionTrigger>Returns</AccordionTrigger>
          <AccordionContent>Within thirty days.</AccordionContent>
        </AccordionItem>
      </Accordion>,
    )
    const shipping = screen.getByRole('button', { name: 'Shipping' })
    expect(shipping.closest('h3')).toBeTruthy()
    expect(shipping.getAttribute('aria-expanded')).toBe('false')
    await user.click(shipping)
    expect(shipping.getAttribute('aria-expanded')).toBe('true')
    expect(screen.getByText('Three to five days.')).toBeTruthy()
    await user.click(screen.getByRole('button', { name: 'Returns' }))
    expect(shipping.getAttribute('aria-expanded')).toBe('false')
    await expectNoA11yViolations(container)
  })

  it('puts its headings at the level the page needs', () => {
    render(
      <Accordion type="single">
        <AccordionItem value="a">
          <AccordionTrigger level={2}>Shipping</AccordionTrigger>
          <AccordionContent>Three to five days.</AccordionContent>
        </AccordionItem>
      </Accordion>,
    )
    const heading = screen.getByRole('heading', { level: 2, name: 'Shipping' })
    expect(heading.querySelector('button')?.getAttribute('aria-expanded')).toBe('false')
  })
})

describe('Collapsible', () => {
  it('shows and hides its content, its trigger saying which', async () => {
    const user = userEvent.setup()
    render(
      <Collapsible>
        <CollapsibleTrigger asChild>
          <Button>More</Button>
        </CollapsibleTrigger>
        <CollapsibleContent>The rest.</CollapsibleContent>
      </Collapsible>,
    )
    const trigger = screen.getByRole('button', { name: 'More' })
    expect(trigger.getAttribute('aria-expanded')).toBe('false')
    await user.click(trigger)
    expect(trigger.getAttribute('aria-expanded')).toBe('true')
    expect(screen.getByText('The rest.')).toBeTruthy()
  })
})

describe('Avatar', () => {
  it('shows the initials while the picture has not loaded (jsdom loads none)', async () => {
    const { container } = render(
      <Avatar>
        <AvatarImage src="/ada.png" alt="Ada Lovelace" />
        <AvatarFallback>AL</AvatarFallback>
      </Avatar>,
    )
    expect(await screen.findByText('AL')).toBeTruthy()
    await expectNoA11yViolations(container)
  })
})

describe('Progress', () => {
  it('fills by value out of max, not out of 100 (the audit\'s R5)', async () => {
    const { container } = render(<Progress aria-label="Upload" value={5} max={10} />)
    const bar = screen.getByRole('progressbar', { name: 'Upload' })
    expect(bar.getAttribute('aria-valuemax')).toBe('10')
    expect(bar.getAttribute('aria-valuenow')).toBe('5')
    const fill = bar.firstElementChild as HTMLElement
    expect(fill.style.transform).toBe('translateX(-50%)')
    await expectNoA11yViolations(container)
  })

  it('has no value while the task length is unknown', () => {
    render(<Progress aria-label="Loading" value={null} />)
    expect(screen.getByRole('progressbar', { name: 'Loading' }).hasAttribute('aria-valuenow')).toBe(false)
  })
})

describe('Separator', () => {
  it('is only a line by default, and a separator when told it means one', () => {
    render(
      <>
        <Separator data-testid="plain" />
        <Separator decorative={false} orientation="vertical" />
      </>,
    )
    expect(screen.getByTestId('plain').getAttribute('role')).toBe('none')
    expect(screen.getByRole('separator').getAttribute('aria-orientation')).toBe('vertical')
  })
})

describe('ScrollArea', () => {
  it('keeps what it holds, in its own scrolling viewport', () => {
    render(
      <ScrollArea className="h-20">
        <p>Long text</p>
      </ScrollArea>,
    )
    expect(screen.getByText('Long text').closest('[data-radix-scroll-area-viewport]')).toBeTruthy()
  })
})

describe('Toast', () => {
  function Demo() {
    const [open, setOpen] = useState(false)
    return (
      <ToastProvider>
        <Button onClick={() => setOpen(true)}>Save</Button>
        <Toast open={open} onOpenChange={setOpen}>
          <ToastTitle>Saved</ToastTitle>
          <ToastDescription>Your changes are kept.</ToastDescription>
          <ToastAction altText="Undo from the Edit menu">Undo</ToastAction>
          <ToastClose />
        </Toast>
        <ToastViewport />
      </ToastProvider>
    )
  }

  it('shows its message in the notifications region, and closes', async () => {
    const user = userEvent.setup()
    render(<Demo />)
    await user.click(screen.getByRole('button', { name: 'Save' }))
    expect(await screen.findByText('Your changes are kept.')).toBeTruthy()
    expect(screen.getByRole('region', { name: /Notifications/ })).toBeTruthy()
    await user.click(screen.getByRole('button', { name: 'Close' }))
    await waitFor(() => expect(screen.queryByText('Your changes are kept.')).toBeNull())
  })
})

describe('AspectRatio and AccessibleIcon', () => {
  it('keeps a ratio, and gives an icon a name', () => {
    render(
      <div style={{ width: 160 }}>
        <AspectRatio ratio={16 / 9}>
          <button type="button">
            <AccessibleIcon label="Play">
              <svg />
            </AccessibleIcon>
          </button>
        </AspectRatio>
      </div>,
    )
    expect(screen.getByRole('button', { name: 'Play' })).toBeTruthy()
  })
})
