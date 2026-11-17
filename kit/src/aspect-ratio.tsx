'use client'

import * as AspectRatioPrimitive from 'radix-ui/aspect-ratio'
import * as AccessibleIconPrimitive from 'radix-ui/accessible-icon'

// Two of Radix's utilities, as they are.

/** Keeps what it holds at a `ratio` (16 / 9, say) as its width changes. */
export const AspectRatio = AspectRatioPrimitive.Root
/** Gives the icon it holds a `label` a screen reader hears, hiding the
 *  icon itself. */
export const AccessibleIcon = AccessibleIconPrimitive.Root
