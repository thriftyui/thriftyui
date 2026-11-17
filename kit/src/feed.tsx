'use client'

import { Children, createContext, useContext, useEffect, useLayoutEffect, useRef, useState, type ComponentProps, type KeyboardEvent, type ReactNode } from 'react'
import { Pause, Play } from 'lucide-react'
import { buttonClass } from './button-class.ts'
import { cn } from './cn.ts'

// A list of articles that grows as it is read -- a social feed, news: the
// W3C's Feed pattern, a structure rather than a widget, so a screen reader
// stays in its reading mode. The feed is role feed, named, aria-busy while
// articles are added; each article a tab stop with aria-posinset and
// aria-setsize (-1 while unknown), named by its title. Page Down and Up
// move between articles; Control + End and Home leave the feed, as the
// pattern's text says (its example differs). Loading more is the app's:
// `onNearEnd` is called as the end nears.
//
// `wheel`: the feed in a box a few articles tall, in place of "Show more",
// each article snapping to the middle, the box fading at its edges, and,
// where the browser has scroll-driven animations and motion is not reduced,
// each article turning back near an edge as a picker wheel's do. 14rem
// tall unless the className sets another height.

const TABBABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

/** The first focusable element after (1) or before (-1) the feed. */
function beyond(feed: HTMLElement, way: 1 | -1) {
  const all = [...document.querySelectorAll<HTMLElement>(TABBABLE)].filter((el) => !feed.contains(el) && !el.closest('[hidden], [inert], [aria-hidden="true"]'))
  const after = (el: HTMLElement) => feed.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING
  return way === 1 ? all.find((el) => after(el)) : all.filter((el) => !after(el)).at(-1)
}

const WHEEL = 'h-56 snap-y snap-mandatory overflow-y-auto pt-1 pb-16 [&>article]:shrink-0 [&>article]:snap-center'
const FADE_END = '[mask-image:linear-gradient(to_bottom,#000_78%,transparent)]'
const FADE_BOTH = '[mask-image:linear-gradient(to_bottom,transparent,#000_18%,#000_78%,transparent)]'

/** A list of articles that grows as it is read: the W3C's Feed pattern, of
 *  FeedArticles, aria-busy while `busy`, Page Down and Up from article to
 *  article. `onNearEnd` is called when the end nears, to load more. `wheel`
 *  puts it in a box a few articles tall, each snapping to the middle. */
export function Feed({
  busy = false,
  onNearEnd,
  wheel = false,
  className,
  onKeyDown,
  onScroll,
  children,
  ...props
}: ComponentProps<'div'> & {
  /** @defaultValue `false` */
  busy?: boolean
  onNearEnd?: () => void
  /** @defaultValue `false` */
  wheel?: boolean
}) {
  const ref = useRef<HTMLDivElement>(null)
  const end = useRef<HTMLDivElement>(null)
  // A wheel at its top: no fade over its first article.
  const [atTop, setAtTop] = useState(true)

  useEffect(() => {
    if (!onNearEnd || !end.current || typeof IntersectionObserver === 'undefined') return
    const seen = new IntersectionObserver((entries) => entries.some((e) => e.isIntersecting) && onNearEnd())
    seen.observe(end.current)
    return () => seen.disconnect()
  }, [onNearEnd])

  const articles = () => [...(ref.current?.querySelectorAll<HTMLElement>(':scope > article, :scope > * > article') ?? [])]

  const keyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(e)
    if (e.defaultPrevented || !ref.current) return
    const list = articles()
    const at = list.findIndex((a) => a.contains(e.target as Node))
    if (at < 0) return
    let to: HTMLElement | undefined
    if (e.key === 'PageDown') to = list[at + 1]
    else if (e.key === 'PageUp') to = list[at - 1]
    else if (e.key === 'End' && e.ctrlKey) to = beyond(ref.current, 1)
    else if (e.key === 'Home' && e.ctrlKey) to = beyond(ref.current, -1)
    else return
    e.preventDefault()
    to?.focus()
  }

  return (
    <div
      ref={ref}
      role="feed"
      aria-busy={busy}
      data-wheel={wheel || undefined}
      onKeyDown={keyDown}
      onScroll={(e) => {
        onScroll?.(e)
        if (wheel) setAtTop(e.currentTarget.scrollTop < 4)
      }}
      onFocus={(e) => {
        const list = articles()
        const at = list.findIndex((a) => a.contains(e.target as Node))
        if (onNearEnd && at >= 0 && at >= list.length - 2) onNearEnd()
      }}
      className={cn('flex flex-col', wheel && WHEEL, wheel && (atTop ? FADE_END : FADE_BOTH), className)}
      {...props}
    >
      {children}
      <div ref={end} aria-hidden className="h-px" />
    </div>
  )
}

/** An article in a Feed: a tab stop, with its `position` from 1 and the
 *  feed's `size` (-1 while not known), named by its title and described by
 *  its main content. */
export function FeedArticle({
  position,
  size = -1,
  className,
  ...props
}: ComponentProps<'article'> & {
  /** Its place in the feed, from 1. */
  position: number
  /** How many articles there are, or -1 while that is not known.
   *  @defaultValue `-1` */
  size?: number
}) {
  return (
    <article
      tabIndex={0}
      aria-posinset={position}
      aria-setsize={size}
      className={cn('focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus', className)}
      {...props}
    />
  )
}

// AutoFeed: a feed that updates by itself -- an ad, a post, a score coming
// in at the top every few seconds. It moves unasked, so it follows the
// W3C's rotating carousel rules and WCAG 2.2.2 Pause, Stop, Hide: a button
// before it to stop and start it, named for what it will do; focus inside
// stops it until the button starts it again; the mouse over it holds it;
// stopped to begin with where less motion is asked for; aria-live off while
// it runs, polite while stopped. Also held while scrolled from its top, so
// what is being read does not move. Each tick calls `onTick`; adding the
// article is the app's.

/** Whether the feed has rendered: an article mounted after that arrives. */
const Arrived = createContext<{ current: boolean }>({ current: false })

const OPENING = ['overflow-hidden', 'motion-safe:animate-open-height']

function Arrival({ children }: { children: ReactNode }) {
  const after = useContext(Arrived)
  const ref = useRef<HTMLDivElement>(null)
  // Opened to its height, measured before it is painted.
  useLayoutEffect(() => {
    const el = ref.current
    if (!after.current || !el) return
    el.style.setProperty('--open-height', `${el.scrollHeight}px`)
    el.classList.add(...OPENING)
    const done = (e: AnimationEvent) => e.target === el && el.classList.remove(...OPENING)
    el.addEventListener('animationend', done)
    return () => el.removeEventListener('animationend', done)
  }, [after])
  return (
    <div ref={ref} className="shrink-0">
      {children}
    </div>
  )
}

/** A Feed that updates by itself, `onTick` called each `interval` ms to add
 *  the next article: with a button to stop and start it before the feed,
 *  held while the mouse is over it or it is scrolled from its top, stopped
 *  by focus inside it until started again, and stopped to begin with where
 *  less motion is asked for. */
export function AutoFeed({
  interval = 5000,
  onTick,
  title,
  stopLabel = 'Pause updates',
  startLabel = 'Resume updates',
  className,
  headClassName,
  feedClassName,
  children,
  ...props
}: Omit<ComponentProps<typeof Feed>, 'title'> & {
  /** How often it ticks, in ms.
   *  @defaultValue `5000` */
  interval?: number
  /** Called each tick while it runs: add the next article here. */
  onTick: () => void
  /** Shown before the button, at the start of the row above the feed. */
  title?: ReactNode
  /** The button's names, for what it will do.
   *  @defaultValue `'Pause updates'` */
  stopLabel?: string
  /** @defaultValue `'Resume updates'` */
  startLabel?: string
  /** The classes of the row above the feed, and of the feed itself;
   *  className is the whole's. */
  headClassName?: string
  feedClassName?: string
}) {
  const [stopped, setStopped] = useState(() => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true)
  const [hovered, setHovered] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const running = !stopped && !hovered && !scrolled

  const tick = useRef(onTick)
  useEffect(() => {
    tick.current = onTick
  })
  useEffect(() => {
    if (!running) return
    const timer = window.setInterval(() => tick.current(), interval)
    return () => window.clearInterval(timer)
  }, [running, interval])

  const after = useRef(false)
  useEffect(() => {
    after.current = true
  }, [])

  return (
    <div
      // Focus inside the feed, not on the button, stops it.
      onFocus={(e) => (e.target as HTMLElement).closest('[role=feed]') && setStopped(true)}
      onPointerEnter={(e) => e.pointerType === 'mouse' && setHovered(true)}
      onPointerLeave={(e) => e.pointerType === 'mouse' && setHovered(false)}
      className={cn('flex min-h-0 flex-col', className)}
    >
      <div className={cn('flex shrink-0 items-center gap-2', headClassName)}>
        {title && <div className="min-w-0 flex-1">{title}</div>}
        <button
          type="button"
          onClick={() => setStopped((s) => !s)}
          className={buttonClass('pill', 'default', 'ms-auto shrink-0')}
        >
          {stopped ? <Play aria-hidden /> : <Pause aria-hidden />}
          {stopped ? startLabel : stopLabel}
        </button>
      </div>
      <Feed
        aria-live={running ? 'off' : 'polite'}
        aria-atomic={false}
        onScroll={(e) => setScrolled(e.currentTarget.scrollTop > 4)}
        className={cn('min-h-0 flex-1 overflow-y-auto', feedClassName)}
        {...props}
      >
        <Arrived.Provider value={after}>
          {Children.map(children, (child) => (
            <Arrival>{child}</Arrival>
          ))}
        </Arrived.Provider>
      </Feed>
    </div>
  )
}
