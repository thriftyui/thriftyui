
/** A date at the start of its day, local time. */
export const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate())

/** Whether two dates fall on the same day. */
export const sameDay = (a: Date | null | undefined, b: Date | null | undefined) =>
  !!a && !!b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()

const DAY_MS = 24 * 60 * 60 * 1000

/** How many calendar days `a` is before `b`, local time: 0 on the same
 *  day, 1 the day before, whatever the hours; rounded, so a day of 23 or
 *  25 hours, where the clocks change, still counts as one. */
const daysBefore = (a: Date, b: Date) => Math.round((startOfDay(b).getTime() - startOfDay(a).getTime()) / DAY_MS)

/** A date as a list of messages shows it: the time today, "Yesterday",
 *  the weekday this week, else the day and month (and the year when not
 *  this year). Calendar days, local time, in `locale`'s words. A date after
 *  `now` is shown as a date. */
export function listDate(at: Date | number, now: Date | number = Date.now(), locale?: string): string {
  const d = new Date(at)
  const today = new Date(now)
  const days = daysBefore(d, today)
  if (days === 0) return d.toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit' })
  if (days === 1) {
    const word = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }).format(-1, 'day')
    return word.charAt(0).toLocaleUpperCase(locale) + word.slice(1)
  }
  if (days > 1 && days < 7) return d.toLocaleDateString(locale, { weekday: 'short' })
  return d.toLocaleDateString(locale, d.getFullYear() === today.getFullYear() ? { month: 'short', day: 'numeric' } : { month: 'short', day: 'numeric', year: 'numeric' })
}
