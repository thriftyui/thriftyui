'use client'

import { createContext, useContext, useEffect, useRef, useState, type ComponentProps, type CSSProperties, type KeyboardEvent, type PointerEvent } from 'react'
import { cn } from './cn.ts'

// The W3C's Window Splitter pattern: two areas, the first the primary one,
// which the splitter is named for and controls; its value the primary
// area's share, 0 to 100. Right to left, side by side, the arrows move the
// splitter the way they point.

interface ResizableState {
  orientation: 'horizontal' | 'vertical'
  size: number
  setSize: (n: number) => void
  min: number
  max: number
}

const ResizableContext = createContext<ResizableState | null>(null)

const useResizable = () => {
  const c = useContext(ResizableContext)
  if (!c) throw new Error('A Resizable part must be inside a Resizable.')
  return c
}

/** Two areas side by side (`orientation="horizontal"`, the default) or one
 *  above the other, sharing the room: the first area's share, 0 to 100, its
 *  own or the app's (`size`, `defaultSize` 50, `onSizeChange`), between
 *  `min` and `max` (10 and 90). */
export function Resizable({
  orientation = 'horizontal',
  defaultSize = 50,
  size: sizeProp,
  onSizeChange,
  min = 10,
  max = 90,
  className,
  style,
  ...props
}: ComponentProps<'div'> & {
  /** `horizontal`: the areas side by side; `vertical`: one above the other.
   *  @defaultValue `'horizontal'` */
  orientation?: 'horizontal' | 'vertical'
  /** The primary area's share, 0 to 100, to begin with.
   *  @defaultValue `50` */
  defaultSize?: number
  size?: number
  onSizeChange?: (size: number) => void
  /** The primary area's least and most share, by the splitter. Enter still
   *  collapses it to 0.
   *  @defaultValue `10` */
  min?: number
  /** @defaultValue `90` */
  max?: number
}) {
  const [own, setOwn] = useState(defaultSize)
  const size = sizeProp ?? own
  const setSize = (n: number) => {
    if (sizeProp === undefined) setOwn(n)
    onSizeChange?.(n)
  }
  // The primary area -- the first child -- takes the share; the other the
  // rest. Collapsed, the primary area is hidden.
  return (
    <ResizableContext.Provider value={{ orientation, size, setSize, min, max }}>
      <div
        data-orientation={orientation}
        data-collapsed={size === 0 || undefined}
        className={cn(
          'flex h-full w-full min-h-0 min-w-0 *:first:shrink-0 *:first:grow-0 *:first:basis-(--resizable-size) *:last:flex-1 data-collapsed:*:first:hidden',
          orientation === 'vertical' && 'flex-col',
          className,
        )}
        style={{ '--resizable-size': `${size}%`, ...style } as CSSProperties}
        {...props}
      />
    </ResizableContext.Provider>
  )
}

/** An area. The first is the primary one, which the handle is named for
 *  and controls: give it an id (the handle finds it), and the handle an
 *  aria-label saying what it holds. */
export function ResizableArea({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('min-h-0 min-w-0 overflow-auto', className)} {...props} />
}

/** The splitter between the two areas: the W3C's Window Splitter, named by
 *  `aria-label` for the first area and controlling it. Between them, or as
 *  the first thing in the second area, as a part of what is there. Dragged, or arrows 5
 *  points (Shift 20), Home and End to the least and most, Enter to collapse
 *  the first area and again to restore it. */
export function ResizableHandle({ className, 'aria-label': label, ...props }: ComponentProps<'div'>) {
  const { orientation, size, setSize, min, max } = useResizable()
  const ref = useRef<HTMLDivElement>(null)
  // Its Resizable: the nearest one around it, so the handle may sit between
  // the areas or at the start of the second, inside a landmark of its own.
  const root = () => ref.current?.closest<HTMLElement>('[data-orientation]')
  // The primary area is the Resizable's first; its id, for aria-controls.
  const [primary, setPrimary] = useState<string | undefined>()
  useEffect(() => setPrimary(root()?.firstElementChild?.id || undefined), [])
  const restore = useRef(size || 50)
  const [dragging, setDragging] = useState(false)
  const across = orientation === 'horizontal'
  const fit = (n: number) => Math.round(Math.min(max, Math.max(min, n)))
  const rtl = () => across && !!ref.current && getComputedStyle(ref.current).direction === 'rtl'

  const at = (e: PointerEvent<HTMLDivElement>) => {
    const box = root()?.getBoundingClientRect()
    if (!box) return size
    const share = across ? (e.clientX - box.left) / box.width : (e.clientY - box.top) / box.height
    return (rtl() ? 1 - share : share) * 100
  }

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const step = e.shiftKey ? 20 : 5
    const flip = rtl() ? -1 : 1
    const grow = across ? (e.key === 'ArrowRight' ? flip : e.key === 'ArrowLeft' ? -flip : 0) : e.key === 'ArrowDown' ? 1 : e.key === 'ArrowUp' ? -1 : 0
    if (grow) setSize(fit((size === 0 ? min : size) + grow * step))
    else if (e.key === 'Home') setSize(min)
    else if (e.key === 'End') setSize(max)
    else if (e.key === 'Enter') {
      if (size === 0) setSize(restore.current)
      else {
        restore.current = size
        setSize(0)
      }
    } else return
    e.preventDefault()
  }

  return (
    <div
      ref={ref}
      role="separator"
      tabIndex={0}
      aria-orientation={across ? 'vertical' : 'horizontal'}
      aria-controls={primary}
      aria-valuenow={size}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      data-dragging={dragging || undefined}
      onKeyDown={onKeyDown}
      onPointerDown={(e) => {
        if (e.button !== 0) return
        e.preventDefault()
        e.currentTarget.setPointerCapture(e.pointerId)
        setDragging(true)
      }}
      onPointerMove={(e) => {
        if (dragging) setSize(fit(at(e)))
      }}
      onPointerUp={(e) => {
        setDragging(false)
        if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId)
      }}
      onPointerCancel={() => setDragging(false)}
      className={cn(
        'group relative z-10 flex shrink-0 touch-none items-center justify-center outline-none',
        across ? '-mx-1 w-2 cursor-col-resize self-stretch' : '-my-1 h-2 cursor-row-resize',
        className,
      )}
      {...props}
    >
      <span
        aria-hidden
        className={cn(
          'bg-neutral-6 transition-colors group-hover:bg-focus group-focus-visible:bg-focus group-data-dragging:bg-focus',
          across ? 'h-full w-px group-hover:w-0.5 group-focus-visible:w-0.5 group-data-dragging:w-0.5' : 'h-px w-full group-hover:h-0.5 group-focus-visible:h-0.5 group-data-dragging:h-0.5',
        )}
      />
    </div>
  )
}
