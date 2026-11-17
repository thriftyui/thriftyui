import { vi } from 'vitest'

// jsdom has no window size and no layout, so a test says what it needs:
// whether the window is wide (the media queries useMediaQuery watches),
// and how wide each laid-out element is (getBoundingClientRect). Each
// returns a function that puts things back.

/** The window wide (1024px up) or not; `roomy`, wider than 320px, the Reflow width, unless given. */
export function setWide(wide: boolean, roomy = true) {
  const original = window.matchMedia
  window.matchMedia = ((query: string) => ({
    matches: query.includes('64rem') ? wide : query.includes('20rem') ? roomy : false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia
  return () => {
    window.matchMedia = original
  }
}

/** Widths by what an element is: its tag, or a data-side attribute. */
export function setWidths(width: (el: Element) => number) {
  const spy = vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (this: Element) {
    const w = width(this)
    return { x: 0, y: 0, top: 0, left: 0, right: w, bottom: 0, width: w, height: 0, toJSON: () => ({}) } as DOMRect
  })
  return () => spy.mockRestore()
}
