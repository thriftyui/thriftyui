'use client'

import { useSyncExternalStore } from 'react'

/** Whether a media query matches ("(min-width: 1024px)"), kept current;
 *  false on a server. */
export function useMediaQuery(query: string) {
  return useSyncExternalStore(
    (onChange) => {
      const list = window.matchMedia(query)
      list.addEventListener('change', onChange)
      return () => list.removeEventListener('change', onChange)
    },
    () => window.matchMedia(query).matches,
    // Rendered on a server there is no window: narrow, as a phone would be.
    () => false,
  )
}

/** Tailwind's `lg`, 64rem: from here up the columns sit beside the page;
 *  below, they open as sheets. */
export const WIDE = '(width >= 64rem)'
