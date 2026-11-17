'use client'

import { useCallback, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'

// Internal (not exported): a bottom sheet's drag, shared by Sheet and a
// column's bottom sheet. vaul's rules and numbers, and two of the kit's: a
// press is a drag only after 4px, and not if it moves more across than up
// or down. Not from a field or a selection, not upward, not while the
// content has scrolled. Let go: closed if flicked down past 0.4px/ms or
// dragged past a quarter, else back; with heights, a fast flick to the top
// or lowest, a slower one a height on, else the nearest. Moving back: 0.5s,
// cubic-bezier(0.32, 0.72, 0, 1).
//
// The drag is the sheet's `translate`, apart from `transform`, so the rise
// and sink animations carry it from where it rests; closed by a drag, its
// sink is skipped and translate takes it the rest of the way. The keyboard
// uses the close button, Escape and the handle (WCAG 2.5.7).

const SLOP = 4
const VELOCITY = 0.4
const FLICK = 2
const CLOSE_PART = 0.25
const EASE = 'translate 0.5s cubic-bezier(0.32, 0.72, 0, 1)'
const NO_DRAG = 'input, textarea, select, [contenteditable=""], [contenteditable="true"], [data-sheet-no-drag]'

const reduced = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches

/** Whether a press at `target` in `sheet`, moving by dx, dy, is the
 *  sheet's to drag rather than a scroll's or a field's. */
function draggable(target: Element, sheet: HTMLElement, dx: number, dy: number, canGoUp: boolean) {
  if (Math.abs(dx) > Math.abs(dy)) return false
  if (target.closest(NO_DRAG)) return false
  if (window.getSelection()?.toString()) return false
  if (dy < 0 && !canGoUp) return false
  for (let el: Element | null = target; el && el !== sheet.parentElement; el = el.parentElement) {
    if (el instanceof HTMLElement && el.scrollHeight > el.clientHeight && el.scrollTop > 0) return false
  }
  return true
}

/** A bottom sheet's drag. `heights`: the parts of its full height it rests
 *  at, lowest first (none: it rests open, whole); `at`, the index it rests
 *  at now, and `onAt` to move it; `onClose` closes it, unless
 *  `dismissible` is false. Returns the handlers and style for the sheet,
 *  and the one move the handle makes. */
export function useSheetDrag({
  enabled = true,
  heights,
  at = heights ? heights.length - 1 : 0,
  onAt,
  onClose,
  dismissible = true,
}: {
  enabled?: boolean
  heights?: number[]
  at?: number
  onAt?: (index: number) => void
  onClose: () => void
  dismissible?: boolean
}) {
  const ref = useRef<HTMLElement | null>(null)
  const press = useRef<{ id: number; x: number; y: number; t: number; target: Element; dragging: boolean; height: number } | null>(null)
  const [offset, setOffset] = useState<number | null>(null)
  // Following a finger: no easing then; at any other move -- let go, a
  // change of height from the handle or the app -- it eases.
  const [dragging, setDragging] = useState(false)
  const [dragged, setDragged] = useState(false)
  const rest = useCallback((index: number, height: number) => (heights ? (1 - heights[index]) * height : 0), [heights])
  // Once a press is a drag, the page is kept from scrolling under it, by a
  // non-passive listener (a passive one's preventDefault does nothing).
  const attach = useCallback((el: HTMLElement | null) => {
    ref.current = el
    if (!el) return
    const hold = (e: TouchEvent) => {
      if (press.current?.dragging && e.cancelable) e.preventDefault()
    }
    el.addEventListener('touchmove', hold, { passive: false })
    return () => el.removeEventListener('touchmove', hold)
  }, [])

  const onPointerDown = (e: ReactPointerEvent<HTMLElement>) => {
    if (!enabled || e.button !== 0 || !ref.current) return
    press.current = { id: e.pointerId, x: e.clientX, y: e.clientY, t: performance.now(), target: e.target as Element, dragging: false, height: ref.current.getBoundingClientRect().height }
  }

  const onPointerMove = (e: ReactPointerEvent<HTMLElement>) => {
    const p = press.current
    const sheet = ref.current
    if (!p || p.id !== e.pointerId || !sheet) return
    const dx = e.clientX - p.x
    const dy = e.clientY - p.y
    if (!p.dragging) {
      if (Math.hypot(dx, dy) < SLOP) return
      const canGoUp = Boolean(heights) && at < (heights?.length ?? 1) - 1
      if (!draggable(p.target, sheet, dx, dy, canGoUp)) {
        press.current = null
        return
      }
      p.dragging = true
      sheet.setPointerCapture?.(e.pointerId)
      setDragging(true)
    }
    // Never above its full height; down as far as the finger goes.
    setOffset(Math.max(0, rest(at, p.height) + dy))
  }

  const settle = (index: number) => {
    setDragging(false)
    setOffset(null)
    if (index !== at) onAt?.(index)
  }

  const close = (height: number) => {
    if (reduced()) {
      setDragging(false)
      setOffset(null)
      onClose()
      return
    }
    setDragged(true)
    setDragging(false)
    setOffset(height)
    window.setTimeout(() => {
      onClose()
      setOffset(null)
      setDragged(false)
    }, 300)
  }

  const onPointerUp = (e: ReactPointerEvent<HTMLElement>) => {
    const p = press.current
    press.current = null
    if (!p?.dragging) return
    const dy = e.clientY - p.y
    const speed = Math.abs(dy) / Math.max(1, performance.now() - p.t)
    if (!heights) {
      if (dy > 0 && dismissible && (speed > VELOCITY || dy >= p.height * CLOSE_PART)) close(p.height)
      else settle(at)
      return
    }
    const down = dy > 0
    if (speed > FLICK) {
      if (down) {
        if (dismissible) close(p.height)
        else settle(0)
      } else settle(heights.length - 1)
      return
    }
    if (speed > VELOCITY && Math.abs(dy) < window.innerHeight * 0.4) {
      if (down && at === 0) {
        if (dismissible) close(p.height)
        else settle(0)
      } else settle(Math.min(heights.length - 1, Math.max(0, at + (down ? -1 : 1))))
      return
    }
    const now = rest(at, p.height) + dy
    const nearest = heights.reduce((best, _, i) => (Math.abs(rest(i, p.height) - now) < Math.abs(rest(best, p.height) - now) ? i : best), 0)
    settle(nearest)
  }

  const onPointerCancel = () => {
    if (press.current?.dragging) settle(at)
    press.current = null
  }

  // Where it rests: its height's offset, as a part of its own height.
  const resting = heights ? `0 ${(1 - heights[at]) * 100}%` : undefined
  const style = {
    translate: offset !== null ? `0 ${offset}px` : resting,
    transition: dragging || reduced() ? 'none' : EASE,
    touchAction: 'pan-y' as const,
  }
  return { attach, style, dragged, handlers: { onPointerDown, onPointerMove, onPointerUp, onPointerCancel } }
}
