import { describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expectNoA11yViolations } from './test/a11y.ts'
import { useState } from 'react'
import { AutoFeed, Feed, FeedArticle } from './feed.tsx'
import { Toolbar, ToolbarButton, ToolbarSeparator } from './toolbar.tsx'

// The W3C's Feed pattern (aria-practices, content/patterns/feed/
// feed-pattern.html) and Radix's Toolbar (toolbar.mdx, Accessibility).

function Posts({ onNearEnd }: { onNearEnd?: () => void }) {
  return (
    <>
      <button type="button">Before</button>
      <Feed aria-label="Posts" onNearEnd={onNearEnd}>
        {['One', 'Two', 'Three'].map((t, i) => (
          <FeedArticle key={t} position={i + 1} size={3} aria-labelledby={`t-${i}`} aria-describedby={`b-${i}`}>
            <h2 id={`t-${i}`}>{t}</h2>
            <p id={`b-${i}`}>Body of {t}</p>
            <button type="button">Like {t}</button>
          </FeedArticle>
        ))}
      </Feed>
      <button type="button">After</button>
    </>
  )
}

describe('Feed', () => {
  it('is a named feed of articles, each placed, named and described, a tab stop', async () => {
    const { container } = render(<Posts />)
    expect(screen.getByRole('feed', { name: 'Posts' }).getAttribute('aria-busy')).toBe('false')
    const articles = screen.getAllByRole('article')
    expect(articles.map((a) => a.getAttribute('aria-posinset'))).toEqual(['1', '2', '3'])
    expect(articles[0].getAttribute('aria-setsize')).toBe('3')
    expect(screen.getByRole('article', { name: 'Two' }).tabIndex).toBe(0)
    await expectNoA11yViolations(container)
  })

  it('moves by Page Down and Page Up, and out with Control + End and Control + Home', async () => {
    const user = userEvent.setup()
    render(<Posts />)
    screen.getByRole('article', { name: 'One' }).focus()
    await user.keyboard('{PageDown}')
    expect(document.activeElement).toBe(screen.getByRole('article', { name: 'Two' }))
    await user.click(screen.getByRole('button', { name: 'Like Two' }))
    await user.keyboard('{PageDown}')
    expect(document.activeElement).toBe(screen.getByRole('article', { name: 'Three' }))
    await user.keyboard('{PageUp}')
    expect(document.activeElement).toBe(screen.getByRole('article', { name: 'Two' }))
    await user.keyboard('{Control>}{End}{/Control}')
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'After' }))
    screen.getByRole('article', { name: 'Three' }).focus()
    await user.keyboard('{Control>}{Home}{/Control}')
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Before' }))
  })

  it('as a wheel, snaps its articles, fades its top only once scrolled, and stays a feed', async () => {
    const { container } = render(
      <Feed aria-label="News" wheel className="h-40">
        {['One', 'Two', 'Three', 'Four'].map((t, i) => (
          <FeedArticle key={t} position={i + 1} size={4} aria-labelledby={`w-${i}`}>
            <h2 id={`w-${i}`}>{t}</h2>
          </FeedArticle>
        ))}
      </Feed>,
    )
    const feed = screen.getByRole('feed', { name: 'News' })
    expect(feed.dataset.wheel).toBe('true')
    // Its own height wins over the wheel's 14rem.
    expect(feed.className).toContain('h-40')
    expect(feed.className).not.toContain('h-56')
    expect(feed.className).toContain('snap-mandatory')
    expect(feed.className).toContain('[&>article]:snap-center')
    expect(feed.className).not.toContain('transparent,#000_18%')
    feed.scrollTop = 120
    fireEvent.scroll(feed)
    expect(feed.className).toContain('transparent,#000_18%')
    feed.scrollTop = 0
    fireEvent.scroll(feed)
    expect(feed.className).not.toContain('transparent,#000_18%')
    await expectNoA11yViolations(container)
  })

  it('is no wheel unless asked', () => {
    render(<Posts />)
    const feed = screen.getByRole('feed', { name: 'Posts' })
    expect(feed.dataset.wheel).toBeUndefined()
    expect(feed.className).not.toContain('snap-mandatory')
  })

  it('asks for more when focus reaches the last articles', () => {
    const more = vi.fn()
    render(<Posts onNearEnd={more} />)
    screen.getByRole('article', { name: 'One' }).focus()
    expect(more).not.toHaveBeenCalled()
    screen.getByRole('article', { name: 'Two' }).focus()
    expect(more).toHaveBeenCalled()
  })
})

describe('Toolbar', () => {
  it('is one tab stop, the arrows between its named buttons', async () => {
    const user = userEvent.setup()
    const { container } = render(
      <Toolbar aria-label="Add to post">
        <ToolbarButton aria-label="Image">I</ToolbarButton>
        <ToolbarButton aria-label="Poll">P</ToolbarButton>
        <ToolbarSeparator />
        <ToolbarButton aria-label="Schedule">S</ToolbarButton>
      </Toolbar>,
    )
    expect(screen.getByRole('toolbar', { name: 'Add to post' })).toBeTruthy()
    await user.tab()
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Image' }))
    await user.keyboard('{ArrowRight}')
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Poll' }))
    await user.keyboard('{End}')
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Schedule' }))
    await user.tab()
    expect(container.contains(document.activeElement)).toBe(false)
    await expectNoA11yViolations(container)
  })
})

/** An auto feed adding a numbered article at the top each tick. */
function Ticker() {
  const [items, setItems] = useState([1])
  return (
    <AutoFeed aria-label="News" interval={1000} onTick={() => setItems((i) => [i[0] + 1, ...i])}>
      {items.map((n, i) => (
        <FeedArticle key={n} position={i + 1} aria-label={`Item ${n}`}>
          Item {n}
        </FeedArticle>
      ))}
    </AutoFeed>
  )
}

describe('AutoFeed', () => {
  const count = () => screen.getAllByRole('article').length

  it('adds by itself while it runs, quiet to a screen reader, its button first and named for what it will do', async () => {
    vi.useFakeTimers()
    const { container } = render(<Ticker />)
    const feed = screen.getByRole('feed', { name: 'News' })
    expect(feed.getAttribute('aria-live')).toBe('off')
    expect(container.querySelector('button')?.compareDocumentPosition(feed)).toBe(Node.DOCUMENT_POSITION_FOLLOWING)
    act(() => vi.advanceTimersByTime(2000))
    expect(count()).toBe(3)
    expect(screen.getAllByRole('article')[0].textContent).toBe('Item 3')
    vi.useRealTimers()
    await expectNoA11yViolations(container)
  })

  it('stops and starts by its button; stopped, it is polite', () => {
    vi.useFakeTimers()
    render(<Ticker />)
    fireEvent.click(screen.getByRole('button', { name: 'Pause updates' }))
    act(() => vi.advanceTimersByTime(3000))
    expect(count()).toBe(1)
    expect(screen.getByRole('feed').getAttribute('aria-live')).toBe('polite')
    fireEvent.click(screen.getByRole('button', { name: 'Resume updates' }))
    act(() => vi.advanceTimersByTime(1000))
    expect(count()).toBe(2)
    vi.useRealTimers()
  })

  it('holds while the mouse is over it, and stops for good when focus enters the feed', () => {
    vi.useFakeTimers()
    const { container } = render(<Ticker />)
    const whole = container.firstElementChild!
    fireEvent.pointerEnter(whole, { pointerType: 'mouse' })
    act(() => vi.advanceTimersByTime(3000))
    expect(count()).toBe(1)
    fireEvent.pointerLeave(whole, { pointerType: 'mouse' })
    act(() => vi.advanceTimersByTime(1000))
    expect(count()).toBe(2)
    // Focus on the button does not stop it; focus on an article does.
    act(() => screen.getByRole('button').focus())
    act(() => vi.advanceTimersByTime(1000))
    expect(count()).toBe(3)
    act(() => screen.getAllByRole('article')[0].focus())
    act(() => screen.getAllByRole('article')[0].blur())
    act(() => vi.advanceTimersByTime(3000))
    expect(count()).toBe(3)
    expect(screen.getByRole('button', { name: 'Resume updates' })).toBeTruthy()
    vi.useRealTimers()
  })

  it('starts stopped where less motion is asked for', () => {
    const original = window.matchMedia
    window.matchMedia = ((q: string) => ({ matches: q.includes('reduce'), media: q, addEventListener() {}, removeEventListener() {} })) as unknown as typeof window.matchMedia
    vi.useFakeTimers()
    render(<Ticker />)
    act(() => vi.advanceTimersByTime(3000))
    expect(count()).toBe(1)
    expect(screen.getByRole('button', { name: 'Resume updates' })).toBeTruthy()
    vi.useRealTimers()
    window.matchMedia = original
  })
})
