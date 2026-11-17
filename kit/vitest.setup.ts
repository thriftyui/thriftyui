import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

// What jsdom lacks that Radix and the kit touch -- size measurement,
// pointer capture, scrolling, media queries -- stubbed so components mount
// in tests; none of it changes what axe-core inspects. And each test's
// render removed after it, so tests do not see each other's.

afterEach(cleanup)

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver = globalThis.ResizeObserver ?? (ResizeObserverStub as unknown as typeof ResizeObserver)

const elementProto = Element.prototype as unknown as Record<string, unknown>
elementProto.hasPointerCapture = () => false
elementProto.setPointerCapture = () => {}
elementProto.releasePointerCapture = () => {}
elementProto.scrollIntoView = () => {}

window.matchMedia =
  window.matchMedia ||
  (((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia)
