'use client'

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import * as PopoverPrimitive from 'radix-ui/popover'
import { cn } from './cn.ts'

// Tips: short cards, one at a time, each beside the control it is about
// with an arrow at it. Next moves on, Done on the last, Hide tips puts them
// away; using the control a tip points at moves on too.
//
//   const [shown, setShown] = useState(true)
//   <Tips
//     open={shown}
//     onOpenChange={setShown}
//     tips={[
//       { target: () => document.querySelector('[aria-label="Hide left"]'), text: 'Hide a column.' },
//       { target: () => saveRef.current, text: 'Save your work here.', side: 'bottom' },
//     ]}
//   />
//
// Each tip is Radix's Popover, placed by its Anchor's virtualRef so it can
// point at an element the app already has, with Radix's Arrow. A target is
// looked for every 100ms until it is there, so a tip can point at a control
// that appears later.
//
// A tip does not take over: non-modal, focus stays where it is, and a press
// outside it leaves it open. Escape hides the tips; a polite live region
// says each one ("Tip 2 of 6: ..."), as focus does not move to it.
//
// The look is the Tooltip's (gray step 12, step 1 text). Its focus ring is
// step 1, the colour sure of 3:1 on step 12 in every theme (WCAG 1.4.11);
// its buttons 24px tall, WCAG 2.5.8's least target size.

/** What a tip can point at: an element, or anything with
 *  getBoundingClientRect (Radix's Measurable), such as a control inside a
 *  frame. Given addEventListener, using it moves the tips on. */
export type TipTarget =
  | Element
  | {
      getBoundingClientRect(): DOMRect
      /** The element it lies in -- the frame -- whose scrolling moves it. */
      contextElement?: Element
      addEventListener?: (type: string, listener: () => void) => void
      removeEventListener?: (type: string, listener: () => void) => void
    }

/** One tip: what it points at (found when its turn comes), what it says,
 *  how its target is used -- clicked or dragged -- and which side of it the
 *  card sits on. */
export interface Tip {
  /** What the tip points at, found when its turn comes. */
  target: () => TipTarget | null
  text: ReactNode
  /** How the target is used: 'click' (the default), or 'drag' for
   *  something dragged -- pressed, moved and let go, with no click. */
  on?: 'click' | 'drag'
  /** Which side of the target the tip sits on; Radix flips it where there
   *  is no room. */
  side?: 'top' | 'right' | 'bottom' | 'left'
}

const LOOK_AGAIN = 100
/** After a tip's control is used, the wait before the next shows, so it
 *  comes once what was done has settled (a column's slide is 200ms). */
const PAUSE = 400

/** A few short cards, one at a time, each beside the control it is about
 *  with an arrow at it: Next moves on, Done on the last, Hide tips puts
 *  them away, and using the control pointed at moves on too. Shown while
 *  `open`; the step is its own or the app's (`step`, `onStepChange`). */
export function Tips({
  tips,
  open,
  onOpenChange,
  step: given,
  onStepChange,
  label = 'Tip',
  className,
}: {
  tips: Tip[]
  open: boolean
  onOpenChange: (open: boolean) => void
  /** The tip showing, from 0, for an app that moves the tips on itself --
   *  when something has been done, not only pressed. Next, and using a
   *  tip's control, then ask for the next through onStepChange. */
  step?: number
  onStepChange?: (step: number) => void
  /** What each card is called to a screen reader, before "2 of 6".
   *  @defaultValue `'Tip'` */
  label?: string
  className?: string
}) {
  const [own, setOwn] = useState(0)
  const step = given ?? own
    // Opened again, they start from the first: set during render, not in an
    // effect.
  const [wasOpen, setWasOpen] = useState(open)
  if (open !== wasOpen) {
    setWasOpen(open)
    if (open) setOwn(0)
  }
  const tip = tips[step] as Tip | undefined

  // The target, kept with the tip it was found for, so a tip never shows
  // by the last one's control while its own is looked for.
  const [found, setFound] = useState<{ tip: Tip; el: TipTarget | null } | null>(null)
  const target = found && found.tip === tip ? found.el : null

  // Find the target when its turn comes -- after the page has drawn it --
  // and keep looking until it is there.
  useEffect(() => {
    if (!open || !tip) return
    let timer = 0
    const look = () => {
      const el = tip.target()
      setFound({ tip, el })
      if (!el) timer = window.setTimeout(look, LOOK_AGAIN)
    }
    const frame = requestAnimationFrame(look)
    return () => {
      cancelAnimationFrame(frame)
      window.clearTimeout(timer)
    }
  }, [open, tip])

  const last = step === tips.length - 1
  const next = () => {
    if (last) onOpenChange(false)
    else if (onStepChange) onStepChange(step + 1)
    else setOwn(step + 1)
  }

    // Using the control a tip points at moves on (or, with `step`, asks to):
    // the tip fades as its control is pressed, and the next comes PAUSE after
    // the press ends -- a click, or a drag let go. The kit's splitters capture
    // the pointer, so a drag ends on the control wherever it is let go. Where
    // the app moves the tips itself and has not, the same tip shows again.
  const latest = useRef(next)
  useEffect(() => {
    latest.current = next
  })
  const [resting, setResting] = useState<Tip | null>(null)
  useEffect(() => {
    if (!open || !tip || !target?.addEventListener) return
    // Called on the target, not taken off it: an element's addEventListener
    // called bare listens on the window instead, and any click anywhere
    // would move the tips on.
    const add = (type: string, listener: () => void) => target.addEventListener?.(type, listener)
    const remove = (type: string, listener: () => void) => target.removeEventListener?.(type, listener)
    let timer = 0
    let pressed = false
    const moveOn = () => {
      timer = window.setTimeout(() => {
        setResting(null)
        latest.current()
      }, PAUSE)
    }
    const press = () => {
      pressed = true
      setResting(tip)
    }
    const release = () => {
      if (!pressed) return
      pressed = false
      moveOn()
    }
    const clicked = () => {
      setResting(tip)
      moveOn()
    }
    const drag = tip.on === 'drag'
    if (drag) {
      add('pointerdown', press)
      add('pointerup', release)
      add('pointercancel', release)
    } else add('click', clicked)
    return () => {
      window.clearTimeout(timer)
      if (drag) {
        remove('pointerdown', press)
        remove('pointerup', release)
        remove('pointercancel', release)
      } else remove('click', clicked)
    }
  }, [open, tip, target])

  const anchor = useMemo(() => ({ current: target }), [target])
  const shown = open && Boolean(tip) && Boolean(target) && resting !== tip
  const count = `${step + 1} of ${tips.length}`
  const button = 'min-h-6 rounded-sm px-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-1'

  return (
    <>
      <PopoverPrimitive.Root open={shown} onOpenChange={(o) => !o && onOpenChange(false)}>
        <PopoverPrimitive.Anchor virtualRef={anchor} />
        <PopoverPrimitive.Portal>
          <PopoverPrimitive.Content
            side={tip?.side ?? 'top'}
                        // Followed every frame, so a tip stays by a control that moves,
                        // and hidden while its control is out of view.
            updatePositionStrategy="always"
            hideWhenDetached
            sideOffset={8}
            collisionPadding={8}
            aria-label={`${label} ${count}`}
            onOpenAutoFocus={(e) => e.preventDefault()}
            onCloseAutoFocus={(e) => e.preventDefault()}
            onInteractOutside={(e) => e.preventDefault()}
            className={cn(
              'z-[85] w-60 max-w-(--radix-popover-content-available-width) rounded-md bg-neutral-12 px-3 py-2.5 text-neutral-1 shadow-(--surface-shadow) data-[state=closed]:motion-safe:animate-fade-out data-[state=open]:motion-safe:animate-fade-in',
              className,
            )}
          >
            <p className="text-xs leading-snug">{tip?.text}</p>
            <div className="mt-2 flex items-center justify-between gap-2 text-[11px]">
              <span className="text-neutral-7 tabular-nums">{count}</span>
              <span className="flex gap-1">
                <button type="button" onClick={() => onOpenChange(false)} className={cn(button, 'text-neutral-7 hover:text-neutral-1')}>
                  Hide tips
                </button>
                <button type="button" onClick={next} className={cn(button, 'bg-neutral-1 font-medium text-neutral-12')}>
                  {last ? 'Done' : 'Next'}
                </button>
              </span>
            </div>
            <PopoverPrimitive.Arrow width={12} height={6} className="fill-neutral-12" />
          </PopoverPrimitive.Content>
        </PopoverPrimitive.Portal>
      </PopoverPrimitive.Root>
      <p role="status" className="sr-only">
        {shown && (
          <>
            {label} {count}: {tip?.text}
          </>
        )}
      </p>
    </>
  )
}
