'use client'

import { useEffect, useRef, type RefObject } from 'react'
import { focusAfterPress } from './input-modality.ts'

// Focus to the new page's heading, so a screen reader starts there (the
// best of the approaches user-tested for client-side routing); the page
// scrolled to its top, as its content is one scrolling element kept across
// routes. Not on the first render, where the skip link waits. Moved
// without a ring after a pointer's press (input-modality.ts).

/** After a route change, focus goes to the new page: when `key` changes
 *  (the route's path, say), the element given is scrolled to its start and
 *  its first <h1> takes focus, else the element itself. Not on the first
 *  render. */
export function useFocusOnChange(key: unknown, ref: RefObject<HTMLElement | null>) {
  // The key last focused for, not a "first render" flag: Strict Mode runs
  // each effect twice in development, which would move focus on load.
  const last = useRef(key)
  useEffect(() => {
    if (Object.is(last.current, key)) return
    last.current = key
    const root = ref.current
    if (!root) return
    root.scrollTop = 0
    const heading = root.querySelector<HTMLElement>('h1')
    if (heading && !heading.hasAttribute('tabindex')) heading.tabIndex = -1
    focusAfterPress(heading ?? root, { preventScroll: true })
  }, [key, ref])
}
