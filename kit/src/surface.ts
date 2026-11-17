
/** What floats over the page, as a class list -- a popover, a hover card,
 *  a menu, a select's list: the page's ground with a border, no shadow
 *  unless the theme asks, fading in and out, kept to the room Radix
 *  reports. */
export const SURFACE =
  'z-[80] rounded-lg border border-popover-line bg-popover text-popover-text shadow-(--surface-shadow) data-[state=closed]:motion-safe:animate-fade-out data-[state=open]:motion-safe:animate-fade-in'
