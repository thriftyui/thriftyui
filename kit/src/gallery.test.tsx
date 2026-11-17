import { describe, expect, it } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expectNoA11yViolations } from './test/a11y.ts'
import { Gallery } from './gallery.tsx'

const IMAGES = [
  { src: 'a.png', alt: 'A red square' },
  { src: 'b.png', alt: 'A blue circle' },
]

describe('Gallery', () => {
  it('is a named list of buttons, each named by its image', async () => {
    const { container } = render(<Gallery images={IMAGES} label="Work" />)
    expect(screen.getByRole('list', { name: 'Work' })).toBeTruthy()
    expect(screen.getAllByRole('button').map((b) => b.textContent === '' && b.querySelector('img')?.getAttribute('alt'))).toEqual(['A red square', 'A blue circle'])
    expect(screen.getByRole('button', { name: 'A blue circle' }).querySelector('img')?.getAttribute('loading')).toBe('lazy')
    await expectNoA11yViolations(container)
  })

  it('opens an image as a dialog named by it; Escape closes it and focus goes back', async () => {
    const user = userEvent.setup()
    render(<Gallery images={IMAGES} />)
    const thumb = screen.getByRole('button', { name: 'A blue circle' })
    await user.click(thumb)
    const dialog = screen.getByRole('dialog', { name: 'A blue circle' })
    expect(dialog.querySelector('img')?.getAttribute('src')).toBe('b.png')
    expect(screen.getByRole('button', { name: 'Close' })).toBeTruthy()
    await expectNoA11yViolations(document.body)
    await user.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    expect(document.activeElement).toBe(thumb)
  })

  it('opens an image by Enter and by Space, and Tab reaches Close in the large view', async () => {
    const user = userEvent.setup()
    render(<Gallery images={IMAGES} />)
    const thumb = screen.getByRole('button', { name: 'A red square' })
    thumb.focus()
    await user.keyboard('{Enter}')
    expect(screen.getByRole('dialog', { name: 'A red square' })).toBeTruthy()
    const close = screen.getByRole('button', { name: 'Close' })
    if (document.activeElement !== close) await user.tab()
    expect(document.activeElement).toBe(close)
    await user.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    await user.keyboard(' ')
    expect(screen.getByRole('dialog', { name: 'A red square' })).toBeTruthy()
  })

  it('closes on a press anywhere in it', async () => {
    const user = userEvent.setup()
    render(<Gallery images={IMAGES} />)
    await user.click(screen.getByRole('button', { name: 'A red square' }))
    await user.click(screen.getByRole('dialog').querySelector('img')!)
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
  })

  it('says so when there are no images', () => {
    render(<Gallery images={[]} empty="Nothing here" />)
    expect(screen.getByText('Nothing here')).toBeTruthy()
    expect(screen.queryByRole('list')).toBeNull()
  })
})
