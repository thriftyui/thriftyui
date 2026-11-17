// How the person last acted: a pointer or a key. Where the kit moves focus
// for them -- a route changed, a dialog or a sheet opened -- it asks for no
// focus ring after a pointer's press, and leaves the ring to the browser after
// a key's, so a keyboard user still sees where focus went (WCAG 2.4.7). A
// browser may draw the ring on a script's focus after a click; Safari does.

let byPointer = false
let pressed: Element | null = null
/** Each open part's opener, noted as it opened: some of Radix's links to it
 *  are only there while it is open. */
const openers = new WeakMap<HTMLElement, HTMLElement>()
if (typeof document !== 'undefined') {
  document.addEventListener(
    'pointerdown',
    (e) => {
      byPointer = true
      pressed = e.target instanceof Element ? e.target : null
    },
    true,
  )
  document.addEventListener('keydown', () => (byPointer = false), true)
}

/** Whether the last press was a pointer's, not a key's. */
export const pressedByPointer = () => byPointer

/** Focus moved for the person: without a ring after a pointer's press. */
export function focusAfterPress(el: HTMLElement, options: FocusOptions = {}) {
  el.focus(byPointer ? { ...options, focusVisible: false } : options)
}

/** For a Radix dialog's `onOpenAutoFocus`: after a pointer's press, focus
 *  given as Radix gives it -- the first tabbable element, links passed over,
 *  else the dialog itself -- but without a ring. After a key's, Radix's own. */
export function openQuietly(event: Event) {
  const container = event.currentTarget
  if (!(container instanceof HTMLElement)) return
  const opener = openerOf(container)
  if (opener) openers.set(container, opener)
  if (event.defaultPrevented || !byPointer) return
  event.preventDefault()
  const before = document.activeElement
  for (const el of tabbable(container)) {
    el.focus({ preventScroll: true, focusVisible: false })
    if (document.activeElement !== before) {
      if (el instanceof HTMLInputElement && typeof el.select === 'function') el.select()
      return
    }
  }
  container.focus({ preventScroll: true, focusVisible: false })
}

/** The elements Tab reaches in `container`, in order, as Radix finds them. */
function tabbable(container: HTMLElement): HTMLElement[] {
  const found: HTMLElement[] = []
  const walker = container.ownerDocument.createTreeWalker(container, NodeFilter.SHOW_ELEMENT, {
    acceptNode: (node) => {
      const el = node as HTMLElement & { disabled?: boolean; type?: string }
      if (el.disabled || el.hidden || (el.tagName === 'INPUT' && el.type === 'hidden')) return NodeFilter.FILTER_SKIP
      return el.tabIndex >= 0 ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP
    },
  })
  while (walker.nextNode()) found.push(walker.currentNode as HTMLElement)
  return found.filter((el) => el.tagName !== 'A' && !hidden(el, container))
}

/** Hidden by its own style or a parent's, up to the container, as Radix
 *  checks where checkVisibility is missing. */
function hidden(el: HTMLElement, container: HTMLElement) {
  if (typeof el.checkVisibility === 'function') return !el.checkVisibility({ checkVisibilityCSS: true })
  if (getComputedStyle(el).visibility === 'hidden') return true
  for (let node: HTMLElement | null = el; node && node !== container; node = node.parentElement) if (getComputedStyle(node).display === 'none') return true
  return false
}

/** For a Radix part's `onCloseAutoFocus` (a dialog, sheet, popover, select
 *  or menu): after a pointer's press, focus goes back to the button that
 *  opened it, as Radix sends it, but without a ring. Not when the press
 *  that closed it was outside it and its button: focus stays there, as
 *  Radix leaves it. After a key's, Radix's own. */
export function closeQuietly(event: Event) {
  if (event.defaultPrevented || !byPointer) return
  const container = event.currentTarget
  if (!(container instanceof HTMLElement)) return
  const opener = openers.get(container) ?? openerOf(container)
  if (!opener?.isConnected) return
  if (pressed && pressed.isConnected && !container.contains(pressed) && !opener.contains(pressed)) return
  event.preventDefault()
  opener.focus({ preventScroll: true, focusVisible: false })
}

/** The button that opened a Radix part: the one whose aria-controls names
 *  it, or, for a menu, the one that labels it. */
function openerOf(container: HTMLElement): HTMLElement | null {
  const doc = container.ownerDocument
  if (container.id) {
    const byControls = [...doc.querySelectorAll<HTMLElement>('[aria-controls]')].find((el) => el.getAttribute('aria-controls') === container.id)
    if (byControls) return byControls
  }
  const label = container.getAttribute('aria-labelledby')
  const labelled = label ? doc.getElementById(label) : null
  return labelled && labelled.matches('button, [role=menuitem], [role=combobox]') ? labelled : null
}
