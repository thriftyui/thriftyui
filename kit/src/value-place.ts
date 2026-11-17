// The arithmetic of a value box (value-box.tsx): the place of a digit in a number's text, and a
// number kept to a range and a step.

/** How many places after the point a number has, so steps of 0.1 stay 0.3, not 0.30000000000000004. */
const decimals = (n: number) => (String(n).split('.')[1] ?? '').length

/** The place of the character at `index` in a number's `text`: 10 for the tens digit of "-12.3",
 *  1 for the ones, 0.1 for the tenths; `step` for anything not a digit -- a sign, a unit, a space. */
export function placeAt(text: string, index: number, step: number): number {
  if (!/[0-9]/.test(text[index] ?? '')) return step
  let point = text.indexOf('.')
  if (point === -1) {
    // No point: it stands just after the last digit.
    point = text.length
    while (point > 0 && !/[0-9]/.test(text[point - 1])) point--
  }
  const between = (from: number, to: number) => [...text.slice(from, to)].filter((c) => /[0-9]/.test(c)).length
  return index < point ? 10 ** between(index + 1, point) : 10 ** -between(point + 1, index + 1)
}

/** `n` on the step's grid, as many places after the point as the step has, between `min` and `max`. */
export function fitTo(n: number, min: number, max: number, step: number): number {
  const on = Number((Math.round(n / step) * step).toFixed(decimals(step)))
  return Math.min(max, Math.max(min, on))
}
