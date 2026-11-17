'use client'

import type { ComponentProps } from 'react'
import * as TogglePrimitive from 'radix-ui/toggle'
import { cn } from './cn.ts'

// A pad: a control's surface that lights. Two kinds, as the W3C's Button pattern has them: a
// button pressed and let go, lit while the app says (`lit`: while it is held, while what it
// starts is playing), its name changed where its action changes ("Play", "Pause"); and a toggle,
// on or off (Radix's Toggle, aria-pressed), its name the same either way ("Mute"). Lit is a fill,
// the accent's step 12 under the neutral's step 1, so it shows by its lightness as well as its
// colour. Its layout -- what is in it and where -- is the app's, by className, as are other
// colours: the app's className wins.

/** A pad's look, unlit and lit (data-lit, or a toggle's data-state="on"), without its layout. */
export const PAD =
  'relative overflow-hidden rounded-lg border border-neutral-7 bg-neutral-3 text-neutral-12 shadow-[inset_0_-2px_0_var(--black-a3)] select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:bg-neutral-2 disabled:text-neutral-8 data-[lit]:border-accent-12 data-[lit]:bg-accent-12 data-[lit]:text-neutral-1 data-[state=on]:border-accent-12 data-[state=on]:bg-accent-12 data-[state=on]:text-neutral-1'

/** A pad pressed and let go: a button, lit while `lit`. Name it by what it does now. */
export function Pad({
  lit = false,
  type = 'button',
  className,
  ...props
}: ComponentProps<'button'> & {
  /** Shown lit: while held, or while what it starts is on.
   *  @defaultValue `false` */
  lit?: boolean
}) {
  return <button type={type} data-lit={lit || undefined} className={cn(PAD, className)} {...props} />
}

/** A pad that stays on or off (Radix's Toggle): lit while on, its name the same either way. */
export function TogglePad({ className, ...props }: ComponentProps<typeof TogglePrimitive.Root>) {
  return <TogglePrimitive.Root className={cn(PAD, className)} {...props} />
}
