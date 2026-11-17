'use client'

import { useEffect, useId, useLayoutEffect, useRef, useState, type ComponentProps, type ElementType, type KeyboardEvent, type ReactNode } from 'react'
import { ArrowUp, Square } from 'lucide-react'
import { buttonClass } from './button-class.ts'
import { cn } from './cn.ts'
import { matchCommands, type ComposerCommand } from './command-match.ts'
import { MENU_CONTENT, MENU_ITEM } from './menu-class.ts'
import { Popover, PopoverAnchor, PopoverContent } from './popover.tsx'

// A conversation with an assistant: the parts a chat is made of, drawn
// from what the app gives them, handing back what the person does -- send,
// stop, pick a suggestion. Nothing here calls a model; the app's server
// does, so the key stays on a server.
//
//   <Conversation busy={streaming}>
//     <AiNotice />
//     <Message from="user">How do I ...?</Message>
//     <Message from="assistant">
//       <Markdown>{reply}</Markdown>          (thriftyui/markdown)
//       <Sources sources={[{ title, href }]} />
//     </Message>
//   </Conversation>
//   <Composer busy={streaming} onSend={send} onStop={stop} />
//
// The conversation is a log role, a polite live region; while a reply
// streams in it is aria-busy, so a screen reader reads the reply once,
// whole, rather than each piece. AiNotice is the line a consumer chatbot
// shows to say it is an AI, as Anthropic's Usage Policy asks.

/** Who said a message: the person (`user`) or the assistant. */
export type ChatRole = 'user' | 'assistant'

/** How near its end, in px, the conversation counts as at its end. */
const AT_END = 32

/** The messages of a conversation: a log, which a screen reader reads as
 *  messages are added, aria-busy while `busy` (a reply coming), so a reply
 *  is read once, whole. A tab stop, it follows what is added while scrolled
 *  to its end. Named "Conversation" unless given `aria-label`. */
export function Conversation({
  busy = false,
  className,
  children,
  'aria-label': label = 'Conversation',
  ...props
}: ComponentProps<'div'> & {
  /** @defaultValue `false` */
  busy?: boolean
}) {
  const ref = useRef<HTMLDivElement>(null)
  const content = useRef<HTMLDivElement>(null)
  const atEnd = useRef(true)
  useEffect(() => {
    const el = ref.current
    const inner = content.current
    if (!el || !inner) return
    const onScroll = () => {
      atEnd.current = el.scrollHeight - el.scrollTop - el.clientHeight < AT_END
    }
    el.addEventListener('scroll', onScroll, { passive: true })
    // What is added grows the content: follow it if the person was at the
    // end. jsdom, for one, has no ResizeObserver; there is nothing to
    // follow without layout.
    const ro = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(() => atEnd.current && el.scrollTo({ top: el.scrollHeight }))
    ro?.observe(inner)
    return () => {
      el.removeEventListener('scroll', onScroll)
      ro?.disconnect()
    }
  }, [])
  return (
    <div
      ref={ref}
      role="log"
      aria-label={label}
      aria-busy={busy}
      tabIndex={0}
      className={cn(
        'min-h-0 flex-1 overflow-y-auto focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus',
        className,
      )}
      {...props}
    >
      <div ref={content} className="flex flex-col gap-4 p-3">
        {children}
      </div>
    </div>
  )
}

/** One message. The person's sit at the end in a bubble (--message-own,
 *  a solid button's colours unless set); the assistant's run the
 *  conversation's width, as text. `name` is what a screen reader hears
 *  first: "You" and "Assistant" unless given. */
export function Message({
  from,
  name,
  className,
  children,
  ...props
}: ComponentProps<'div'> & { from: ChatRole; name?: string }) {
  return (
    <div
      data-from={from}
      className={cn(
        'min-w-0 text-sm text-neutral-12',
        from === 'user' ? 'max-w-[85%] self-end rounded-lg bg-message-own px-3 py-2 break-words whitespace-pre-wrap text-message-own-text' : 'self-stretch',
        className,
      )}
      {...props}
    >
      <span className="sr-only">{name ?? (from === 'user' ? 'You' : 'Assistant')}: </span>
      {children}
    </div>
  )
}

/** Three dots while the assistant has begun but written nothing yet. Seen
 *  only: the conversation is busy, so a screen reader waits for the reply
 *  itself. Still with reduced motion. */
export function Pending({ className }: { className?: string }) {
  return (
    <span aria-hidden className={cn('flex gap-1 py-1', className)}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="size-1.5 animate-pulse rounded-full bg-neutral-9 motion-reduce:animate-none"
          style={{ animationDelay: `${i * 150}ms` }}
        />
      ))}
    </span>
  )
}

/** A source a reply rests on: its title, and where it is, if it has a link. */
export type Source = { title: string; href?: string }

/** What draws a link: the browser's <a> unless an app gives its router's
 *  (React Router's Link takes `to`, so it is wrapped:
 *  `({ href, ...p }) => <Link to={href} {...p} />`), so following a source
 *  inside the app keeps the conversation. */
export type LinkAs = ElementType<{ href: string; className?: string; children?: ReactNode }>

/** Where an answer comes from, numbered in the order given -- each with a
 *  `title`, as Claude's citations carry. The same source cited twice is
 *  listed once. `linkAs`: LinkAs, above. */
export function Sources({
  sources,
  label = 'Sources',
  linkAs: A = 'a',
  className,
}: {
  sources: Source[]
  /** @defaultValue `'Sources'` */
  label?: string
  /** @defaultValue `'a'` */
  linkAs?: LinkAs
  className?: string
}) {
  const id = useId()
  const seen = new Set<string>()
  const list = sources.filter((s) => {
    const key = s.href ?? s.title
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
  if (list.length === 0) return null
  return (
    <div className={cn('mt-3', className)}>
      <p id={id} className="text-xs font-medium text-neutral-11">
        {label}
      </p>
      {/* Each link 24px tall, WCAG 2.2's least target size (2.5.8). */}
      <ol aria-labelledby={id} className="flex list-decimal flex-col ps-5 text-xs text-neutral-11 marker:text-neutral-11">
        {list.map((s) => (
          <li key={s.href ?? s.title}>
            {s.href ? (
              <A
                href={s.href}
                className="inline-block rounded-sm py-1 text-accent-12 underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
              >
                {s.title}
              </A>
            ) : (
              s.title
            )}
          </li>
        ))}
      </ol>
    </div>
  )
}

/** Prompts to start from, each a button that hands its text back. Drawn
 *  with an edge on the page's ground, as the default button's ground is a
 *  column's, where a conversation usually sits. */
export function Suggestions({
  items,
  onPick,
  label = 'Suggestions',
  className,
}: {
  items: string[]
  onPick: (text: string) => void
  /** @defaultValue `'Suggestions'` */
  label?: string
  className?: string
}) {
  return (
    <div role="group" aria-label={label} className={cn('flex flex-wrap gap-2', className)}>
      {items.map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onPick(s)}
          className={buttonClass('default', 'default', 'h-auto border border-neutral-6 bg-neutral-1 py-1.5 text-start whitespace-normal hover:border-neutral-8')}
        >
          {s}
        </button>
      ))}
    </div>
  )
}

/** The line that says an AI is answering. Its words are the app's to
 *  change; it need not name the model. */
export function AiNotice({ children = 'You are talking with an AI assistant. Its answers can be wrong.', className }: {
  /** @defaultValue `'You are talking with an AI assistant. Its answers can be wrong.'` */
  children?: ReactNode
  className?: string
}) {
  return <p className={cn('text-center text-xs text-neutral-11', className)}>{children}</p>
}

/** The message box: a labelled field that grows with what is typed (up to
 *  12rem), and Send -- Stop while a reply is coming. Enter sends,
 *  Shift+Enter starts a line; not while an input method is composing.
 *  Typing goes on while a reply comes, and waits in the box.
 *
 *  `commands` gives it a "/" menu, on the W3C's Combobox pattern as the
 *  kit's Combobox is: focus stays in the box, Up and Down move, Enter runs
 *  the highlighted command (with none, sends the text as typed), Tab puts
 *  it in the box for its arguments, Escape closes the menu. The box is a
 *  <textarea>, which may only be a textbox, so it has no combobox role.
 *  `onCommand` may take a chosen command instead of its being sent, and
 *  returns true when it did.
 *
 *  `value` and `onValueChange` hold its text in the app; `onKeyDown` sees
 *  each key first, and a key it prevents is not handled here; `fieldProps`
 *  go on the field itself; `tools` are controls in a row under the field,
 *  Send at its end. */
export function Composer<C extends ComposerCommand = ComposerCommand>({
  onSend,
  onStop,
  busy = false,
  disabled = false,
  label = 'Message',
  placeholder = 'Ask a question',
  value: given,
  onValueChange,
  onKeyDown: onKey,
  fieldProps,
  tools,
  commands,
  onCommand,
  className,
}: {
  onSend: (text: string) => void
  onStop?: () => void
  /** @defaultValue `false` */
  busy?: boolean
  /** @defaultValue `false` */
  disabled?: boolean
  /** @defaultValue `'Message'` */
  label?: string
  /** @defaultValue `'Ask a question'` */
  placeholder?: string
  value?: string
  onValueChange?: (text: string) => void
  onKeyDown?: (event: KeyboardEvent<HTMLTextAreaElement>) => void
  fieldProps?: Omit<ComponentProps<'textarea'>, 'id' | 'value' | 'onChange' | 'onKeyDown' | 'disabled' | 'placeholder' | 'rows'>
  tools?: ReactNode
  /** The "/" menu's commands. */
  commands?: C[]
  /** Takes a chosen command instead of its being sent; true when it did. */
  onCommand?: (command: C) => boolean
  className?: string
}) {
  const id = useId()
  const [own, setOwn] = useState('')
  const text = given ?? own
  // The menu: open while the box holds a "/" and a name, no space yet,
  // unless Escape closed it; `moved` is where the arrows went, else the
  // rule's highlight.
  const [dismissed, setDismissed] = useState(false)
  const [moved, setMoved] = useState<number | null>(null)
  const setText = (t: string) => {
    if (given === undefined) setOwn(t)
    onValueChange?.(t)
    setDismissed(false)
    setMoved(null)
  }
  const listId = `${id}-commands`
  const typing = commands !== undefined && text.startsWith('/') && !/\s/.test(text)
  const { shown, highlight } = typing ? matchCommands(commands, text.slice(1)) : { shown: [] as C[], highlight: -1 }
  const open = typing && !dismissed && !disabled
  const active = moved ?? highlight
  const optionId = (i: number) => `${id}-command-${i}`
  const list = useRef<HTMLDivElement>(null)
  useEffect(() => {
        // Scrolls only the list to the option: scrollIntoView would scroll
        // every box around it too, the page and a page that frames it.
    const box = list.current
    const option = open && active >= 0 ? box?.querySelector<HTMLElement>(`[id="${optionId(active)}"]`) : null
    if (!box || !option) return
    const above = option.getBoundingClientRect().top - box.getBoundingClientRect().top
    const below = above + option.offsetHeight - box.clientHeight
    if (above < 0) box.scrollTop += above
    else if (below > 0) box.scrollTop += below
  }, [open, active]) // eslint-disable-line react-hooks/exhaustive-deps
    // The field grows by CSS's field-sizing: content; where a browser lacks
    // it (Safari before 26.2), it is given its content's height each time the
    // text or the field's width changes, so a second line never runs under
    // the controls.
  const fieldRef = useRef<HTMLTextAreaElement | null>(null)
  const sizes = typeof CSS !== 'undefined' && typeof CSS.supports === 'function' && CSS.supports('field-sizing', 'content')
  useLayoutEffect(() => {
    const el = fieldRef.current
    if (!el || sizes) return
    const fit = () => {
      el.style.height = 'auto'
      el.style.height = `${el.scrollHeight}px`
    }
    fit()
    if (typeof ResizeObserver === 'undefined') return
    let width = el.clientWidth
    const watch = new ResizeObserver(() => {
      if (el.clientWidth === width) return
      width = el.clientWidth
      fit()
    })
    watch.observe(el)
    return () => watch.disconnect()
  }, [text, sizes])
  const canSend = !busy && !disabled && text.trim() !== ''
  const send = () => {
    if (!canSend) return
    onSend(text.trim())
    setText('')
  }
  const choose = (c: C) => {
    if (onCommand?.(c)) setText('')
    else if (!busy) {
      onSend(`/${c.name}`)
      setText('')
    }
  }
  const onMenuKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      if (shown.length === 0) return
      const by = e.key === 'ArrowDown' ? 1 : -1
      setMoved(active < 0 ? (by === 1 ? 0 : shown.length - 1) : (active + by + shown.length) % shown.length)
    } else if (e.key === 'Enter' && !e.shiftKey && active >= 0 && !busy) {
      e.preventDefault()
      choose(shown[active])
    } else if (e.key === 'Tab' && !e.shiftKey && shown.length > 0) {
      e.preventDefault()
      setText(`/${shown[Math.max(active, 0)].name} `)
    } else if (e.key === 'Escape') {
      e.preventDefault()
      setDismissed(true)
    }
  }
  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    onKey?.(e)
    if (e.defaultPrevented) return
    if (open && !e.nativeEvent.isComposing) onMenuKey(e)
    if (e.defaultPrevented) return
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault()
      send()
    }
  }
  const field = (
    <textarea
      {...fieldProps}
      {...(commands && {
        'aria-autocomplete': 'list' as const,
        'aria-haspopup': 'listbox' as const,
        'aria-controls': open ? listId : undefined,
        'aria-activedescendant': open && active >= 0 ? optionId(active) : undefined,
      })}
      ref={fieldRef}
      id={id}
      rows={1}
      value={text}
      disabled={disabled}
      placeholder={placeholder}
      onChange={(e) => setText(e.target.value)}
      onKeyDown={onKeyDown}
            // The field fills the whole box, its padding the room the controls
            // are drawn over: a browser bringing a focused field into view above
            // an on-screen keyboard brings that field, so the controls come too.
      className={cn(
        'block max-h-48 w-full resize-none rounded-[inherit] bg-transparent px-3 py-2 text-sm text-neutral-12 outline-hidden [field-sizing:content] placeholder:text-neutral-11 disabled:cursor-not-allowed disabled:text-neutral-8',
        tools
          ? 'min-h-[calc(2*var(--row-height)+0.5rem)] pb-[calc(var(--row-height)+0.5rem)]'
          : 'min-h-[calc(var(--row-height)+0.5rem)] pe-[calc(var(--row-height)+0.5rem)]',
        fieldProps?.className,
      )}
    />
  )
  const action = busy ? (
    <button type="button" aria-label="Stop" onClick={onStop} className={buttonClass('solid', 'icon')}>
      <Square aria-hidden fill="currentColor" strokeWidth={1.75} />
    </button>
  ) : (
    <button type="submit" aria-label="Send" disabled={!canSend} className={buttonClass('solid', 'icon')}>
      <ArrowUp aria-hidden strokeWidth={1.75} />
    </button>
  )
  const form = (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        send()
      }}
      className={cn(
        'relative rounded-lg border border-field-border bg-field transition-colors focus-within:outline-2 focus-within:-outline-offset-1 focus-within:outline-focus hover:border-neutral-10',
        className,
      )}
    >
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      {field}
      {/* Over the field's padding: a press between the controls falls
          through to the field. */}
      {tools ? (
        <div className="pointer-events-none absolute inset-x-1 bottom-1 flex items-center gap-1 rounded-md bg-field [&>*]:pointer-events-auto">
          <div className="pointer-events-none flex min-w-0 flex-1 items-center gap-1 [&>*]:pointer-events-auto">{tools}</div>
          {action}
        </div>
      ) : (
        <div className="absolute end-1 bottom-1 flex">{action}</div>
      )}
      {/* What the listbox cannot say: that nothing matches. The command
          highlighted is heard through aria-activedescendant. */}
      {commands && (
        <p role="status" className="sr-only">
          {open && shown.length === 0 ? `No commands match ${text}` : ''}
        </p>
      )}
    </form>
  )
  if (!commands) return form
  return (
    <Popover open={open}>
      <PopoverAnchor asChild>{form}</PopoverAnchor>
      <PopoverContent
        role="listbox"
        id={listId}
        aria-label="Commands"
        side="top"
        align="start"
        sideOffset={8}
        // Focus stays in the box: the list neither takes it nor gives it
        // back, a press on it does not take it, and a press elsewhere does
        // not close it -- the box's text does.
        onOpenAutoFocus={(e) => e.preventDefault()}
        onCloseAutoFocus={(e) => e.preventDefault()}
        onMouseDown={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={() => setDismissed(true)}
        className={cn(MENU_CONTENT, 'w-(--radix-popover-trigger-width) overflow-hidden p-0')}
      >
        {/* Five rows: each 2.75rem (two lines of 1rem, 0.375rem above and
            below), and the list's padding. */}
        <div ref={list} className="max-h-[calc(5*2.75rem+0.5rem)] scroll-py-1 overflow-y-auto overscroll-contain p-1">
          {shown.length === 0 ? (
            <p className="px-2 py-1.5 text-sm text-neutral-11">No commands match "{text}"</p>
          ) : (
            shown.map((c, i) => (
              <div
                key={c.name}
                id={optionId(i)}
                role="option"
                aria-selected={i === active}
                data-highlighted={i === active ? '' : undefined}
                onPointerMove={() => setMoved(i)}
                onClick={() => choose(c)}
                className={cn(MENU_ITEM, 'h-11 min-h-0 flex-col items-stretch justify-center gap-0 py-0')}
              >
                <span className="truncate font-mono text-xs">
                  /{c.name}
                  {c.hint && <span className="text-neutral-11"> {c.hint}</span>}
                </span>
                <span className="truncate text-xs text-neutral-11">{c.description}</span>
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
