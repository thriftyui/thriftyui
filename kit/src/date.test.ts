import { describe, expect, it } from 'vitest'
import { listDate, sameDay, startOfDay } from './date.ts'

// Spaces as one kind: the time's words may carry a narrow no-break space
// before AM or PM, as the browser's own formatting writes it.
const plain = (s: string) => s.replace(/\s/g, ' ')
const at = (y: number, m: number, d: number, h = 12, min = 0) => new Date(y, m - 1, d, h, min)

describe('startOfDay and sameDay', () => {
  it('count days in local time', () => {
    expect(startOfDay(at(2026, 10, 27, 15, 30)).getTime()).toBe(at(2026, 10, 27, 0, 0).getTime())
    expect(sameDay(at(2026, 10, 27, 0, 1), at(2026, 10, 27, 23, 59))).toBe(true)
    expect(sameDay(at(2026, 10, 27), null)).toBe(false)
  })
})

describe('listDate', () => {
  const now = at(2026, 10, 27, 15) // a Tuesday

  it('gives the time today, however early', () => {
    expect(plain(listDate(at(2026, 10, 27, 0, 5), now, 'en-US'))).toBe('12:05 AM')
  })

  it('says Yesterday for the day before, by the calendar, not by 24 hours', () => {
    expect(listDate(at(2026, 10, 26, 23, 59), now, 'en-US')).toBe('Yesterday')
    expect(listDate(at(2026, 10, 26, 0, 1), at(2026, 10, 27, 0, 2), 'en-US')).toBe('Yesterday')
  })

  it('gives the weekday up to six days back, and the date from seven', () => {
    expect(listDate(at(2026, 10, 21), now, 'en-US')).toBe('Wed')
    expect(listDate(at(2026, 10, 20), now, 'en-US')).toBe('Oct 20')
  })

  it('adds the year across the turn of a year, but not to a weekday or Yesterday', () => {
    const newYear = at(2027, 1, 1, 10)
    expect(listDate(at(2026, 12, 31, 23), newYear, 'en-US')).toBe('Yesterday')
    expect(listDate(at(2026, 12, 26), newYear, 'en-US')).toBe('Sat')
    expect(listDate(at(2026, 12, 25), newYear, 'en-US')).toBe('Dec 25, 2026')
  })

  it("speaks the locale's language", () => {
    expect(listDate(at(2026, 10, 26), now, 'fr-FR')).toBe('Hier')
    expect(listDate(at(2026, 10, 21), now, 'de-DE')).toBe(at(2026, 10, 21).toLocaleDateString('de-DE', { weekday: 'short' }))
  })

  it('shows a date after now as a date', () => {
    expect(listDate(at(2026, 11, 2), now, 'en-US')).toBe('Nov 2')
  })
})
