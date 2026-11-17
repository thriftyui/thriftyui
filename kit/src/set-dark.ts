// Every part whose colours ease on hover would also ease when the theme
// changes, each on its own clock, so the page would switch unevenly. For
// the one moment of the switch, every transition is turned off: the page
// switches at once, and the parts ease as before afterwards.

const HOLD = '*,*::before,*::after{transition:none!important}'

/** Switches the page to dark (`true`) or light at once: the `dark` class on
 *  `root` (the `html` element unless another is given), with every CSS
 *  transition held off while the colours change. Use it wherever light or
 *  dark is switched while the page is open; a theme set before the first
 *  paint needs only the class. */
export function setDark(dark: boolean, root: HTMLElement = document.documentElement) {
  if (root.classList.contains('dark') === dark) return
  const doc = root.ownerDocument
  const hold = doc.createElement('style')
  hold.textContent = HOLD
  doc.head.append(hold)
  root.classList.toggle('dark', dark)
  // Reading a style makes the browser work the new colours out now, with
  // the transitions still off; the next task lets them back.
  void doc.defaultView?.getComputedStyle(root).color
  setTimeout(() => hold.remove(), 1)
}
