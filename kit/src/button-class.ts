import { cn } from './cn.ts'

// The looks, and why their colours:
//
//   default   on the groups' light ground (gray step 2)
//   solid     the accent's step 12 with neutral 1 text: step 9 with white
//             falls under 4.5:1 (white on blue 9 is 3.26:1), and step 11
//             under it with some accents; step 12 holds 10.7:1 or more
//             over every accent and neutral, light and dark
//   danger    red step 11 with neutral 1 text (red 9 with white is 3.91:1)
//   ghost     the text alone, edged where it stands on a pattern
//   pill      small and round, for a control inside another -- a message
//             box's model menu; its edge need not reach 3:1, as its words
//             say what it is (WCAG 1.4.11)
//
// `icon` is a square the row's height; with pill, the pill's.

/** The class list of each of a button's looks: default, solid, danger,
 *  ghost and pill. */
export const VARIANTS = {
  default: 'bg-button text-button-text hover:text-neutral-12',
  solid: 'bg-button-solid text-button-solid-text hover:bg-button-solid/90',
  danger: 'bg-button-danger text-button-danger-text hover:bg-button-danger/90',
  ghost: 'pattern-text text-neutral-11 hover:text-neutral-12',
  pill: 'h-7 min-h-7 gap-1 rounded-full border border-neutral-6 text-xs font-normal text-neutral-11 hover:text-neutral-12 data-[state=open]:text-neutral-12 disabled:border-neutral-6 disabled:bg-transparent [&_svg]:size-3.5',
} as const

/** The class list of each of a button's sizes: default, and icon, a square
 *  for an icon alone. */
export const SIZES = {
  default: 'px-3',
  icon: 'aspect-square px-0',
} as const

/** The pill's padding: narrower than a row's button. */
const PILL_SIZES = {
  default: 'px-2.5',
  icon: 'aspect-square px-0',
} as const

/** A button's look: one of VARIANTS' names. */
export type ButtonVariant = keyof typeof VARIANTS
/** A button's size: one of SIZES' names. */
export type ButtonSize = keyof typeof SIZES

/** A button's whole class list for a look and a size, with `className` last
 *  so it wins: for an element that must look like a Button without being
 *  one, a link or another library's button. */
export function buttonClass(variant: ButtonVariant = 'default', size: ButtonSize = 'default', className?: string) {
  return cn(
    'inline-flex min-h-(--row-height) items-center justify-center gap-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:pointer-events-none disabled:bg-neutral-2 disabled:text-neutral-8 [&_svg]:size-4 [&_svg]:shrink-0',
    VARIANTS[variant],
    variant === 'pill' ? PILL_SIZES[size] : SIZES[size],
    className,
  )
}

/** A toggle's pressed look, shared by Toggle and Toggle Group's items: the
 *  chosen colour, text semibold, icon stroke heavier -- not colour alone
 *  (WCAG 1.4.1) -- nothing drawn round it. */
export const TOGGLE_ON = 'data-[state=on]:font-semibold data-[state=on]:text-chosen-text [&[data-state=on]_svg]:stroke-[2.5]'
