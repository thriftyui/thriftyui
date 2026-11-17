
/** Which pages to show, 1-based: the first, the last, the current and
 *  `around` either side, and a 'gap' for those left out -- always 2 *
 *  around + 5 items once there are more pages, so Previous and Next stay
 *  put. A gap always stands for two pages or more.
 *
 *    pageRange(6, 12)   [1, 'gap', 5, 6, 7, 'gap', 12]
 *    pageRange(1, 12)   [1, 2, 3, 4, 5, 'gap', 12]
 *    pageRange(3, 5)    [1, 2, 3, 4, 5] */
export function pageRange(current: number, total: number, around = 1): (number | 'gap')[] {
  const slots = 2 * around + 5
  const run = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, i) => from + i)
  if (total <= slots) return run(1, total)
  const at = Math.min(total, Math.max(1, current))
  // Near the start: the first pages, one gap, the last.
  if (at - around <= 3) return [...run(1, slots - 2), 'gap', total]
  // Near the end: the first, one gap, the last pages.
  if (at + around >= total - 2) return [1, 'gap', ...run(total - slots + 3, total)]
  return [1, 'gap', ...run(at - around, at + around), 'gap', total]
}
