import { twMerge } from 'tailwind-merge'

/** Joins class names, leaving out false or empty ones; where two set the
 *  same thing the later wins (tailwind-merge), so a className given to a
 *  part overrides its own. */
export function cn(...classes: (string | false | null | undefined)[]) {
  return twMerge(classes.filter(Boolean).join(' '))
}
