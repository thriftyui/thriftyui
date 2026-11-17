'use client'

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'

// Zoom and move something bigger than its box -- a map, a picture -- by
// the wheel (about the pointer), a drag, two fingers (about their middle),
// and, while the box has focus, the arrows, + and -, and 0. At zoom 1 the
// content fits: covering the box (`fit: 'cover'`) or inside it
// (`'contain'`). It never shows past an edge; smaller than the box, it
// stays centred. The box takes touch-action: none, never the page, so the
// page itself can still be zoomed. The box and content are the app's.

/** Where the content is: its zoom (1 is the fit) and its offset in the
 *  box, in pixels. */
export interface PanZoomView {
  scale: number
  x: number
  y: number
}

type Size = { width: number; height: number }

/** The view zoomed to `scale` about the point (px, py) of the box: that
 *  point of the content stays under it. */
export function zoomAbout(v: PanZoomView, scale: number, px: number, py: number): PanZoomView {
  const k = scale / v.scale
  return { scale, x: px - (px - v.x) * k, y: py - (py - v.y) * k }
}

/** The view kept inside its bounds: zoom from `min` to `max`, and the
 *  content, `fitScale` times its natural size at zoom 1, never pulled in
 *  from an edge where it is larger than the box, and centred where it is
 *  smaller. */
export function keepInside(v: PanZoomView, content: Size, box: Size, fitScale: number, min = 1, max = 4): PanZoomView {
  const scale = Math.min(max, Math.max(min, v.scale))
  const axis = (at: number, length: number, room: number) => {
    const span = length * fitScale * scale
    return span <= room ? (room - span) / 2 : Math.min(0, Math.max(room - span, at))
  }
  return { scale, x: axis(v.x, content.width, box.width), y: axis(v.y, content.height, box.height) }
}

/** The scale at which the content fits its box: covering it, or wholly
 *  inside it. */
export const fitScale = (content: Size, box: Size, fit: 'cover' | 'contain') =>
  (fit === 'cover' ? Math.max : Math.min)(box.width / content.width, box.height / content.height)

/** Zoom and move content bigger than its box: the wheel, a drag, two
 *  fingers, and the arrows, + and - while the box has focus. `width` and
 *  `height` are the content's natural size; `fit` how it sits at zoom 1;
 *  `max` the most zoom. Spread `boxProps` on the box (it takes its size
 *  from the page) and give the content `contentStyle`. */
export function usePanZoom({ width, height, fit = 'cover', max = 4, step = 1.5 }: { width: number; height: number; fit?: 'cover' | 'contain'; max?: number; step?: number }) {
  const [box, setBox] = useState<HTMLElement | null>(null)
  const [size, setSize] = useState<Size>({ width, height })
  const [view, setView] = useState<PanZoomView>({ scale: 1, x: 0, y: 0 })
  const content = { width, height }
  const fitted = fitScale(content, size, fit)
  const pointers = useRef(new Map<number, { x: number; y: number }>())
  const pinch = useRef<{ distance: number; scale: number } | null>(null)

  // The latest bounds, for listeners set up once: brought up to date after
  // each render.
  const bounds = useRef({ content, size, fitted, max })
  useLayoutEffect(() => {
    bounds.current = { content, size, fitted, max }
  })
  const settle = useCallback((v: PanZoomView) => {
    const b = bounds.current
    return keepInside(v, b.content, b.size, b.fitted, 1, b.max)
  }, [])

  // The box's size, kept as it changes; the view is kept inside its bounds
  // as it renders, so a box that resizes never shows past an edge.
  useEffect(() => {
    if (!box || typeof ResizeObserver === 'undefined') return
    const watch = new ResizeObserver(() => setSize({ width: box.clientWidth, height: box.clientHeight }))
    watch.observe(box)
    return () => watch.disconnect()
  }, [box])

  // The wheel, not passive, so the page does not scroll with it.
  useEffect(() => {
    if (!box) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const r = box.getBoundingClientRect()
      setView((v) => settle(zoomAbout(v, Math.min(bounds.current.max, Math.max(1, v.scale * Math.exp(-e.deltaY / 300))), e.clientX - r.left, e.clientY - r.top)))
    }
    box.addEventListener('wheel', onWheel, { passive: false })
    return () => box.removeEventListener('wheel', onWheel)
  }, [box, settle])

  const zoomTo = useCallback(
    (scale: number, px = bounds.current.size.width / 2, py = bounds.current.size.height / 2) =>
      setView((v) => settle(zoomAbout(v, Math.min(bounds.current.max, Math.max(1, scale)), px, py))),
    [settle],
  )

  const onPointerDown = (e: PointerEvent<HTMLElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()]
      pinch.current = { distance: Math.hypot(a.x - b.x, a.y - b.y), scale: view.scale }
    }
  }
  const onPointerMove = (e: PointerEvent<HTMLElement>) => {
    const last = pointers.current.get(e.pointerId)
    if (!last) return
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    if (pointers.current.size === 2 && pinch.current) {
      const [a, b] = [...pointers.current.values()]
      const r = e.currentTarget.getBoundingClientRect()
      zoomTo((pinch.current.scale * Math.hypot(a.x - b.x, a.y - b.y)) / pinch.current.distance, (a.x + b.x) / 2 - r.left, (a.y + b.y) / 2 - r.top)
    } else if (pointers.current.size === 1) {
      const dx = e.clientX - last.x
      const dy = e.clientY - last.y
      setView((v) => settle({ ...v, x: v.x + dx, y: v.y + dy }))
    }
  }
  const onPointerUp = (e: PointerEvent<HTMLElement>) => {
    pointers.current.delete(e.pointerId)
    if (pointers.current.size < 2) pinch.current = null
  }
  const onKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    const move: Record<string, [number, number]> = { ArrowLeft: [60, 0], ArrowRight: [-60, 0], ArrowUp: [0, 60], ArrowDown: [0, -60] }
    if (e.key in move) {
      e.preventDefault()
      const [dx, dy] = move[e.key]
      setView((v) => settle({ ...v, x: v.x + dx, y: v.y + dy }))
    } else if (e.key === '+' || e.key === '=') zoomTo(view.scale * step)
    else if (e.key === '-') zoomTo(view.scale / step)
    else if (e.key === '0') setView(settle({ scale: 1, x: 0, y: 0 }))
  }

  const shown = keepInside(view, content, size, fitted, 1, max)

  return {
    view: shown,
    /** The zoom, 1 at the fit. */
    scale: shown.scale,
    canZoomIn: shown.scale < max,
    canZoomOut: shown.scale > 1,
    zoomIn: () => zoomTo(view.scale * step),
    zoomOut: () => zoomTo(view.scale / step),
    reset: () => setView(settle({ scale: 1, x: 0, y: 0 })),
    /** The point (x, y) of the content in the middle of the box, at
     *  `scale` (or the zoom as it is). */
    centerOn: (x: number, y: number, scale = view.scale) => {
      const s = Math.min(max, Math.max(1, scale))
      setView(settle({ scale: s, x: size.width / 2 - x * fitted * s, y: size.height / 2 - y * fitted * s }))
    },
    /** For the box. */
    boxProps: {
      ref: setBox,
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel: onPointerUp,
      onKeyDown,
      style: { touchAction: 'none' as const, position: 'relative' as const, overflow: 'hidden' as const },
    },
    /** For the content: its natural size, moved and scaled from its top
     *  left corner. */
    contentStyle: {
      position: 'absolute' as const,
      top: 0,
      left: 0,
      width,
      height,
      transformOrigin: '0 0',
      transform: `translate(${shown.x}px, ${shown.y}px) scale(${fitted * shown.scale})`,
    },
  }
}
