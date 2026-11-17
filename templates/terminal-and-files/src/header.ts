import { cn } from 'thriftyui/cn'
import { CELL, TEXT_TAB as KIT_TEXT_TAB } from 'thriftyui/cell'

// The page's header: Code, App and Kit as text, the column toggles and the
// preview's reload as icons. Everything in it is 0.75rem in from either side
// -- the file's path and "Read only" too (FileView.tsx), the preview's
// address (Preview.tsx) -- so text from text and an icon from text are the
// same 24px apart. The words white with a black edge on a pattern finish
// (kit/src/theme.css, `pattern-text`); the icons' are the kit's (CELL_ICON).

/** A tab sized by its word: the kit's TEXT_TAB (cell.ts) at the header's
 *  smaller size. */
export const TEXT_TAB = cn(KIT_TEXT_TAB, 'py-0 text-xs')

/** An icon in the header: the kit's CELL with the text's 0.75rem each side
 *  in place of its square, whose 43px around a 16px icon left 13.5px. */
export const ICON_CELL = cn(CELL, 'aspect-auto px-3')
