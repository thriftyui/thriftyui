'use client'

import { memo, useMemo, useRef, useState, type FocusEvent, type KeyboardEvent, type MouseEvent, type ReactNode } from 'react'
import { ChevronRight } from 'lucide-react'
import { cn } from './cn.ts'

// The W3C's Tree View pattern (Radix has none): single select, selection
// not following focus. Keys as the pattern lists them: Down and Up move;
// Right opens or goes into an item; Left closes or goes out; Home and End;
// Enter picks an end item or opens and closes; a letter jumps by
// type-ahead. Its optional * and multiple selection are left out.

/** An item of a Tree: its id, its name, an icon for the eye, and its
 *  children -- with them, it opens and closes; without, it is an end item,
 *  picked. */
export interface TreeItem {
  /** Unique in the tree; what `selected` and `onSelect` carry. */
  id: string
  /** The name shown, read, and matched by type-ahead. */
  label: string
  /** An icon before the label, for the eye (hidden from a screen reader). */
  icon?: ReactNode
  /** Shown at the row's end, after the label, and read as part of the
   *  item's name: hide what is for the eye alone, and say it in words. */
  end?: ReactNode
  /** An item with children opens and closes; one without is an end item,
   *  picked. An empty array is an item with children, none yet. */
  children?: TreeItem[]
}

/** Typed letters run together within this long. */
const TYPE_AHEAD_MS = 500
/** Each level's step in, in pixels. */
const STEP = 12

/** A tree of items that open and close, and end items that are picked: the
 *  W3C's Tree View, named by `aria-label`, one item the tab stop and the
 *  arrows, Home and End and typed letters to move. Enter or a press picks
 *  an end item (`onSelect`); `selected` is the one picked. */
export function Tree({
  items,
  selected,
  onSelect,
  defaultOpen = [],
  className,
  'aria-label': label,
}: {
  items: TreeItem[]
  selected: string | null
  onSelect: (id: string) => void
  /** The items open to begin with, by id.
   *  @defaultValue `[]` */
  defaultOpen?: string[]
  className?: string
  'aria-label': string
}) {
  const [open, setOpen] = useState<Set<string>>(() => new Set(defaultOpen))
  const [focused, setFocused] = useState<string | null>(null)
  const [rows] = useState(() => new Map<string, HTMLLIElement>())
  const typed = useRef({ text: '', at: 0 })

  // The items shown, in order, with the item each is in.
  const shown = useMemo(() => {
    const out: { item: TreeItem; parent: string | null }[] = []
    const walk = (item: TreeItem, parent: string | null) => {
      out.push({ item, parent })
      if (item.children && open.has(item.id)) item.children.forEach((c) => walk(c, item.id))
    }
    items.forEach((i) => walk(i, null))
    return out
  }, [items, open])

  const isShown = (id: string | null) => id !== null && shown.some((r) => r.item.id === id)
  const stop = isShown(focused) ? focused : isShown(selected) ? selected : (shown[0]?.item.id ?? null)
  const go = (id: string) => {
    setFocused(id)
    rows.get(id)?.focus()
  }
  const toggle = (id: string, to?: boolean) =>
    setOpen((o) => {
      const next = new Set(o)
      if (to ?? !o.has(id)) next.add(id)
      else next.delete(id)
      return next
    })

  const onKeyDown = (e: KeyboardEvent) => {
    const at = shown.findIndex((r) => r.item.id === stop)
    if (at < 0) return
    const { item, parent } = shown[at]
    const branch = !!item.children
    const isOpen = open.has(item.id)
    if (e.key === 'ArrowDown') {
      if (at < shown.length - 1) go(shown[at + 1].item.id)
    } else if (e.key === 'ArrowUp') {
      if (at > 0) go(shown[at - 1].item.id)
    } else if (e.key === 'Home') go(shown[0].item.id)
    else if (e.key === 'End') go(shown[shown.length - 1].item.id)
    else if (e.key === 'ArrowRight') {
      if (branch && !isOpen) toggle(item.id, true)
      else if (branch && item.children!.length) go(item.children![0].id)
    } else if (e.key === 'ArrowLeft') {
      if (branch && isOpen) toggle(item.id, false)
      else if (parent !== null) go(parent)
    } else if (e.key === 'Enter') {
      if (branch) toggle(item.id)
      else onSelect(item.id)
    } else if (e.key.length === 1 && /\S/.test(e.key) && !e.metaKey && !e.ctrlKey && !e.altKey) {
      // The key's own time (MDN, Event.timeStamp).
      const now = e.timeStamp
      const t = typed.current
      t.text = now - t.at < TYPE_AHEAD_MS ? t.text + e.key.toLowerCase() : e.key.toLowerCase()
      t.at = now
      // From the row after this one, round to the start; a run of one
      // letter repeated steps through the labels it starts.
      const order = [...shown.slice(at + 1), ...shown.slice(0, at + 1)]
      const repeated = [...t.text].every((ch) => ch === t.text[0])
      const hit = order.find((r) => r.item.label.toLowerCase().startsWith(t.text)) ?? (repeated ? order.find((r) => r.item.label.toLowerCase().startsWith(t.text[0])) : undefined)
      if (hit) go(hit.item.id)
    } else return
    e.preventDefault()
  }

  // Focus coming back into the tree comes to the selected item.
  const onBlur = (e: FocusEvent<HTMLUListElement>) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocused(null)
  }

  // One handler on the tree, not one per row, so a row's props change only
  // when what it shows does.
  const onClick = (e: MouseEvent<HTMLUListElement>) => {
    const id = (e.target as Element).closest('[data-tree-row]')?.getAttribute('data-tree-row')
    const item = shown.find((r) => r.item.id === id)?.item
    if (!item) return
    e.stopPropagation()
    go(item.id)
    if (item.children) toggle(item.id)
    else onSelect(item.id)
  }
  const onFocus = (e: FocusEvent<HTMLUListElement>) => {
    const id = e.target.getAttribute('data-tree-item')
    if (id !== null) setFocused(id)
  }

  const now = useMemo(() => ({ open, selected, stop, rows }), [open, selected, stop, rows])

  return (
    <ul role="tree" aria-label={label} onKeyDown={onKeyDown} onBlur={onBlur} onClick={onClick} onFocus={onFocus} className={cn('py-1', className)}>
      {items.map((i) => rowOf(i, 0, now))}
    </ul>
  )
}

/** What a row reads from its tree. */
interface TreeNow {
  open: Set<string>
  selected: string | null
  stop: string | null
  rows: Map<string, HTMLLIElement>
}

/** A row, given only what it shows. An open item also takes `now`, for the
 *  rows inside it; the rest stay as they are when another row is picked. */
const rowOf = (item: TreeItem, depth: number, now: TreeNow) => {
  const isOpen = now.open.has(item.id)
  return (
    <Row
      key={item.id}
      item={item}
      depth={depth}
      isOpen={isOpen}
      isSelected={now.selected === item.id}
      isStop={now.stop === item.id}
      rows={now.rows}
      now={item.children && isOpen ? now : undefined}
    />
  )
}

const Row = memo(function Row({
  item,
  depth,
  isOpen,
  isSelected,
  isStop,
  rows,
  now,
}: {
  item: TreeItem
  depth: number
  isOpen: boolean
  isSelected: boolean
  isStop: boolean
  rows: Map<string, HTMLLIElement>
  now?: TreeNow
}) {
  const branch = !!item.children
  return (
    <li
      role="treeitem"
      data-tree-item={item.id}
      aria-expanded={branch ? isOpen : undefined}
      aria-selected={branch ? undefined : isSelected}
      tabIndex={isStop ? 0 : -1}
      ref={(el) => {
        if (el) rows.set(item.id, el)
        else rows.delete(item.id)
      }}
      className="outline-none [&:focus-visible>div]:outline-2 [&:focus-visible>div]:-outline-offset-2 [&:focus-visible>div]:outline-focus [&[aria-selected=true]>div]:font-semibold [&[aria-selected=true]>div]:text-chosen-text"
    >
      {/* The row; a press on it is a press on the item. */}
      <div
        data-tree-row={item.id}
        className="flex h-6 cursor-default items-center gap-1.5 pe-2 text-xs text-neutral-11 transition-colors select-none hover:text-neutral-12"
        style={{ paddingInlineStart: 8 + depth * STEP }}
      >
        {branch ? (
          <ChevronRight aria-hidden className={cn('size-3 shrink-0 motion-safe:transition-transform rtl:-scale-x-100', isOpen && 'rotate-90')} strokeWidth={2} />
        ) : (
          <span aria-hidden className="size-3 shrink-0" />
        )}
        {item.icon && (
          <span aria-hidden className="flex shrink-0 [&_svg]:size-3.5">
            {item.icon}
          </span>
        )}
        <span className="min-w-0 truncate">{item.label}</span>
        {item.end && <span className="ms-auto flex shrink-0 items-center [&_svg]:size-3">{item.end}</span>}
      </div>
      {now && <ul role="group">{item.children!.map((c) => rowOf(c, depth + 1, now))}</ul>}
    </li>
  )
})
