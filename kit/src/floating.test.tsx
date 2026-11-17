import { describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expectNoA11yViolations } from './test/a11y.ts'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogTrigger,
} from './alert-dialog.tsx'
import { Button } from './button.tsx'
import { HoverCard, HoverCardContent, HoverCardTrigger } from './hover-card.tsx'
import { Popover, PopoverClose, PopoverContent, PopoverTrigger } from './popover.tsx'
import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from './sheet.tsx'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './tooltip.tsx'

describe('Popover', () => {
  it('opens from its button, takes focus, and Escape gives it back', async () => {
    const user = userEvent.setup()
    render(
      <Popover>
        <PopoverTrigger asChild>
          <Button>Filters</Button>
        </PopoverTrigger>
        <PopoverContent aria-label="Filters">
          <p>Choose some</p>
          <PopoverClose asChild>
            <Button>Done</Button>
          </PopoverClose>
        </PopoverContent>
      </Popover>,
    )
    const trigger = screen.getByRole('button', { name: 'Filters' })
    expect(trigger.getAttribute('aria-expanded')).toBe('false')
    await user.click(trigger)
    const content = await screen.findByRole('dialog', { name: 'Filters' })
    expect(trigger.getAttribute('aria-expanded')).toBe('true')
    await waitFor(() => expect(content.contains(document.activeElement)).toBe(true))
    await expectNoA11yViolations(document.body)
    await user.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    expect(document.activeElement).toBe(trigger)
  })
})

describe('HoverCard', () => {
  it('opens when the pointer rests on its link', async () => {
    const user = userEvent.setup()
    render(
      <HoverCard openDelay={0}>
        <HoverCardTrigger href="/ada">Ada</HoverCardTrigger>
        <HoverCardContent>Ada Lovelace, the first programmer.</HoverCardContent>
      </HoverCard>,
    )
    await user.hover(screen.getByRole('link', { name: 'Ada' }))
    expect(await screen.findByText('Ada Lovelace, the first programmer.')).toBeTruthy()
  })
})

describe('Tooltip', () => {
  it('describes its trigger on keyboard focus', async () => {
    const user = userEvent.setup()
    render(
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button size="icon" aria-label="Save">
              S
            </Button>
          </TooltipTrigger>
          <TooltipContent>Save the file</TooltipContent>
        </Tooltip>
      </TooltipProvider>,
    )
    await user.tab()
    const tip = await screen.findByRole('tooltip')
    expect(tip.textContent).toContain('Save the file')
    const trigger = screen.getByRole('button', { name: 'Save' })
    expect(trigger.getAttribute('aria-describedby')).toBe(tip.id)
  })
})

describe('AlertDialog', () => {
  it('is an alert dialog named by its title and described by its description; Cancel closes it', async () => {
    const user = userEvent.setup()
    const onAction = vi.fn()
    render(
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="danger">Delete</Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogTitle>Delete the file?</AlertDialogTitle>
          <AlertDialogDescription>It cannot be brought back.</AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="danger" onClick={onAction}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>,
    )
    await user.click(screen.getByRole('button', { name: 'Delete' }))
    const dialog = await screen.findByRole('alertdialog', { name: 'Delete the file?' })
    expect(dialog.getAttribute('aria-describedby')).toBe(screen.getByText('It cannot be brought back.').id)
    expect(screen.getByRole('button', { name: 'Cancel' }).className).not.toBe(
      screen.getAllByRole('button', { name: 'Delete' }).at(-1)!.className,
    )
    await expectNoA11yViolations(document.body)
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull())
    expect(onAction).not.toHaveBeenCalled()
  })
})

describe('Sheet', () => {
  it('is a dialog named by its title, and Escape closes it', async () => {
    const user = userEvent.setup()
    render(
      <Sheet>
        <SheetTrigger asChild>
          <Button>Settings</Button>
        </SheetTrigger>
        <SheetContent side="left" aria-describedby={undefined}>
          <SheetTitle>Settings</SheetTitle>
          <SheetClose asChild>
            <Button>Close</Button>
          </SheetClose>
        </SheetContent>
      </Sheet>,
    )
    await user.click(screen.getByRole('button', { name: 'Settings' }))
    const sheet = await screen.findByRole('dialog', { name: 'Settings' })
    expect(sheet.className).toContain('left-0')
    await expectNoA11yViolations(document.body)
    await user.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
  })
})
