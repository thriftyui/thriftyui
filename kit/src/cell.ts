// The kit's bars are rows of evenly spaced cells, nothing drawn round
// them. An icon is gray step 11 (3:1 for an icon), a label the accent's
// step 12 when chosen (4.5:1 for text).

/** A control in a header or footer as a class list: a square cell the
 *  height of its bar, its icon gray step 11, darker on hover, the accent
 *  while it is on or pressed; a focus ring inside it. */
export const CELL =
  'flex aspect-square shrink-0 items-center justify-center self-stretch text-neutral-11 transition-colors hover:text-neutral-12 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus data-[state=open]:text-neutral-12 aria-expanded:text-neutral-12 aria-pressed:text-accent-11 data-[state=on]:text-accent-11 disabled:text-neutral-8 disabled:hover:text-neutral-8'

/** A cell that fills its bar, for a bar holding a single control. */
export const WIDE_CELL =
  'flex flex-1 items-center justify-center gap-2 self-stretch text-sm text-neutral-11 transition-colors hover:text-neutral-12 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus data-[state=open]:text-accent-12'

/** The icon in a cell, white with a black edge when the bar wears a
 *  pattern (theme.css, `pattern-text`). */
export const CELL_ICON = 'size-4 pattern-text'

/** A bar made only of controls -- a tab row, a toolbar, the bottom bar:
 *  equal cells, each allowed to shrink so a long label cannot widen it. */
export const BAR = 'grid grid-flow-col auto-cols-fr'

/** A cell in such a bar: its icon, and its label beside it once the cell
 *  is 7rem wide, cut short if it still does not fit. The control keeps its
 *  aria-label either way. */
export const LABEL_CELL =
  '@container flex min-w-0 items-center justify-center gap-2 self-stretch text-xs text-neutral-11 transition-colors hover:text-neutral-12 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus aria-pressed:text-chosen-text data-[state=on]:text-chosen-text'

/** The label in a LABEL_CELL, white with a black edge when the bar wears
 *  a pattern. */
export const CELL_LABEL = 'hidden truncate @min-[7rem]:inline pattern-text'

/** A tab of an icon and a label in a bar: the chosen one semibold in the
 *  chosen colour. For a TabsTrigger in a BAR. */
export const CELL_TAB = `${LABEL_CELL} data-[state=active]:font-semibold data-[state=active]:text-chosen-text`

/** A tab that is a word: as wide as its text, 0.75rem each side, the chosen
 *  one heavier and in the chosen text's colour. For a TabsTrigger in a
 *  row of tabs or a header. */
export const TEXT_TAB =
  'flex items-center self-stretch px-3 py-2 text-sm text-neutral-11 transition-colors hover:text-neutral-12 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus data-[state=active]:font-semibold data-[state=active]:text-chosen-text'

/** A row in a list: its column's width, the row height tall, its text
 *  darker on hover. The current one (aria-current) semibold in the chosen
 *  colour, no background. */
export const ROW =
  'flex min-h-(--row-height) w-full items-center gap-2 px-3 text-start text-sm text-neutral-11 transition-colors hover:text-neutral-12 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus aria-[current=page]:font-semibold aria-[current=page]:text-chosen-text'

/** A group of controls standing in a page -- choices or actions: a row of
 *  equal cells on a light ground (gray step 2), no lines. */
export const GROUP = `${BAR} rounded-md bg-neutral-2`

/** A cell in a GROUP: its text or icon, cut short if it does not fit; the
 *  chosen one (data-state="on" or aria-pressed) semibold in the chosen
 *  colour, nothing drawn round it. */
export const GROUP_CELL =
  'flex min-h-(--row-height) min-w-0 items-center justify-center gap-2 rounded-md px-3 text-sm text-neutral-11 transition-colors hover:text-neutral-12 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus data-[state=on]:font-semibold data-[state=on]:text-chosen-text aria-pressed:font-semibold aria-pressed:text-chosen-text'
