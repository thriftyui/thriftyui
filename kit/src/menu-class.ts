import { SURFACE } from './surface.ts'

// The parts every menu shares -- Dropdown, Context, Menubar, Select's list
// -- so they look alike. The highlighted item's outline is hidden, not
// removed, so Windows' contrast themes still mark it.

/** A menu's floating box: the kit's surface, a little padding, scrolling
 *  when taller than its room. */
export const MENU_CONTENT = `${SURFACE} min-w-48 overflow-y-auto p-1`

/** A menu's row, the row height tall; the item the keyboard or pointer is
 *  on with gray step 4 behind it; disabled, gray 8. */
export const MENU_ITEM =
  'relative flex min-h-(--row-height) cursor-default items-center gap-2 rounded-md px-2 text-sm text-popover-text outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:text-neutral-8 data-[highlighted]:bg-menu-highlight data-[state=open]:bg-menu-highlight [&_svg]:size-4 [&_svg]:shrink-0'

/** Room at an item's start for a tick or a dot, or to line it up with items
 *  that have one. */
export const MENU_INSET = 'ps-8'

/** Where a CheckboxItem's tick or a RadioItem's dot sits, in the room
 *  MENU_INSET leaves. */
export const MENU_INDICATOR = 'absolute inset-s-2 flex size-4 items-center justify-center'

/** A group's name in a menu: small, gray 11. */
export const MENU_LABEL = 'px-2 py-1.5 text-xs font-medium text-neutral-11'

/** A line between a menu's groups: gray step 6. */
export const MENU_SEPARATOR = '-mx-1 my-1 h-px bg-neutral-6'

/** A key's name at an item's end: small, gray 11. */
export const MENU_SHORTCUT = 'ms-auto ps-4 text-xs tracking-widest text-neutral-11'
