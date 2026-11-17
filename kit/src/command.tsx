'use client'

import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { Search } from 'lucide-react'
import { cn } from './cn.ts'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from './dialog.tsx'
import { MENU_ITEM, MENU_LABEL, MENU_SHORTCUT } from './menu-class.ts'
import { focusAfterPress } from './input-modality.ts'

// A command menu: a field filtering a list of grouped commands, on the
// W3C's Combobox pattern with its list always shown. Focus stays in the
// field; the highlighted command is its aria-activedescendant. Typing keeps
// the commands whose label or keywords match, the first highlighted; Down
// and Up move, wrapping; Enter runs; Escape clears (in CommandDialog,
// closes). Disabled commands are skipped; nothing matching is announced.

/** A command: its label, the other words it is found by, an icon, the key
 *  that runs it elsewhere, whether it is disabled, and what it does when
 *  run. */
export interface CommandItem {
  id: string
  label: string
  /** Other words it is found by. */
  keywords?: string[]
  icon?: ReactNode
  /** A key's name shown at the end: what runs it elsewhere. */
  shortcut?: string
  disabled?: boolean
  onSelect: () => void
}

/** A group of commands under a heading, which names the group for a screen
 *  reader. */
export interface CommandGroup {
  heading: string
  items: CommandItem[]
}

/** What a Command takes: its groups, the label that names its field, a
 *  placeholder, what shows when nothing matches. */
export interface CommandProps {
  groups: CommandGroup[]
  /** Names the field. */
  label: string
  /** @defaultValue `'Search'` */
  placeholder?: string
  /** What shows when nothing matches.
   *  @defaultValue `'No results.'` */
  empty?: string
  className?: string
  autoFocus?: boolean
}

const matches = (item: CommandItem, query: string) => {
  const q = query.trim().toLowerCase()
  return q === '' || [item.label, ...(item.keywords ?? [])].some((w) => w.toLowerCase().includes(q))
}

/** A command menu: a field that filters a list of grouped commands; Down
 *  and Up move, Enter runs the one highlighted. Focus stays in the field. */
export function Command({ groups, label, placeholder = 'Search', empty = 'No results.', className, autoFocus }: CommandProps) {
  const id = useId()
  const [query, setQuery] = useState('')
  const shownGroups = useMemo(
    () => groups.map((g) => ({ ...g, items: g.items.filter((i) => matches(i, query)) })).filter((g) => g.items.length > 0),
    [groups, query],
  )
  const flat = shownGroups.flatMap((g) => g.items)
  const firstEnabled = flat.findIndex((i) => !i.disabled)
  const [moved, setMoved] = useState<number | null>(null)
  const active = moved !== null && moved < flat.length ? moved : firstEnabled
  const optionId = (i: number) => `${id}-option-${i}`
  const list = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (active >= 0) list.current?.querySelector(`[id="${optionId(active)}"]`)?.scrollIntoView({ block: 'nearest' })
  }, [active]) // eslint-disable-line react-hooks/exhaustive-deps

  const step = (by: 1 | -1) => {
    if (firstEnabled < 0) return
    let i = active
    do i = (i + by + flat.length) % flat.length
    while (flat[i].disabled)
    setMoved(i)
  }
  const run = (i: number) => {
    const item = flat[i]
    if (item && !item.disabled) item.onSelect()
  }

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.nativeEvent.isComposing) return
    if (e.key === 'ArrowDown') step(1)
    else if (e.key === 'ArrowUp') step(-1)
    else if (e.key === 'Enter' && active >= 0) run(active)
    else if (e.key === 'Escape' && query !== '') {
      setQuery('')
      setMoved(null)
      e.stopPropagation()
    } else return
    e.preventDefault()
  }

  let n = -1
  return (
    <div className={cn('flex min-h-0 flex-col', className)}>
      <div className="flex items-center gap-2 border-b border-neutral-6 px-3">
        <Search aria-hidden className="size-4 shrink-0 text-neutral-11" />
        <input
          role="combobox"
          aria-label={label}
          aria-autocomplete="list"
          aria-expanded={flat.length > 0}
          aria-controls={`${id}-list`}
          aria-activedescendant={active >= 0 ? optionId(active) : undefined}
          autoComplete="off"
          spellCheck={false}
          autoFocus={autoFocus}
          placeholder={placeholder}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setMoved(null)
          }}
          onKeyDown={onKeyDown}
          className="min-h-(--row-height) w-full min-w-0 bg-transparent text-sm text-neutral-12 outline-none placeholder:text-neutral-11"
        />
      </div>
      <div ref={list} id={`${id}-list`} role="listbox" aria-label={label} className="max-h-75 min-h-0 overflow-y-auto overscroll-contain p-1 scroll-py-1">
        {shownGroups.map((g, gi) => (
          <div key={g.heading} role="group" aria-labelledby={`${id}-group-${gi}`}>
            <div role="presentation" id={`${id}-group-${gi}`} className={MENU_LABEL}>
              {g.heading}
            </div>
            {g.items.map((item) => {
              const i = ++n
              return (
                <div
                  key={item.id}
                  id={optionId(i)}
                  role="option"
                  aria-selected={i === active}
                  aria-disabled={item.disabled || undefined}
                  data-highlighted={i === active ? '' : undefined}
                  data-disabled={item.disabled ? '' : undefined}
                  onPointerMove={() => !item.disabled && setMoved(i)}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => run(i)}
                  className={MENU_ITEM}
                >
                  {item.icon && (
                    <span aria-hidden className="flex shrink-0 text-neutral-11">
                      {item.icon}
                    </span>
                  )}
                  <span className="min-w-0 flex-1 truncate">{item.label}</span>
                  {item.shortcut && <span className={MENU_SHORTCUT}>{item.shortcut}</span>}
                </div>
              )
            })}
          </div>
        ))}
      </div>
      <p role="status" className={cn('px-3 text-center text-sm text-neutral-11', flat.length === 0 ? 'py-6' : 'sr-only')}>
        {flat.length === 0 ? empty : ''}
      </p>
    </div>
  )
}

/** The Command in the kit's Dialog, which closes once a command runs and
 *  puts focus back where it was. `title` names it for a screen reader;
 *  opening it by a shortcut is the app's. */
export function CommandDialog({
  open,
  onOpenChange,
  title = 'Command menu',
  description,
  groups,
  ...props
}: CommandProps & {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** The dialog's name, for a screen reader; not shown.
   *  @defaultValue `'Command menu'` */
  title?: string
  /** What the dialog is for, read after its name; none unless given. */
  description?: string
}) {
    // What had focus as it opened, for focus to go back to as it closes:
    // Radix does that only for its Trigger, and this dialog is opened by the
    // app's own button or keys. Read before Radix moves focus in.
  const opener = useRef<HTMLElement | null>(null)
  useLayoutEffect(() => {
    if (open) opener.current = document.activeElement instanceof HTMLElement && document.activeElement !== document.body ? document.activeElement : null
  }, [open])
  // A command run closes the dialog, then does its work.
  const closing = useMemo(
    () =>
      groups.map((g) => ({
        ...g,
        items: g.items.map((i) => ({
          ...i,
          onSelect: () => {
            onOpenChange(false)
            i.onSelect()
          },
        })),
      })),
    [groups, onOpenChange],
  )
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        size="lg"
        {...(description ? {} : { 'aria-describedby': undefined })}
        onCloseAutoFocus={(e) => {
          if (!opener.current?.isConnected) return
          e.preventDefault()
          focusAfterPress(opener.current)
        }}
        className="lg:top-[15%] lg:h-auto lg:max-h-[min(440px,calc(100dvh-2rem))] lg:translate-y-0">
        <DialogTitle className="sr-only">{title}</DialogTitle>
        {description && <DialogDescription className="sr-only">{description}</DialogDescription>}
        <Command groups={closing} autoFocus {...props} />
      </DialogContent>
    </Dialog>
  )
}
