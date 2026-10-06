import { describe, expect, it } from 'vitest'

import { hhmm, isoDate, minutesBetween, nextWorkingDays } from '@/format'

describe('nextWorkingDays', () => {
  it('skips weekends and includes today when it is a weekday', () => {
    // Venerdì 2 ottobre 2026
    const days = nextWorkingDays(3, new Date(2026, 9, 2, 15, 30))
    expect(days.map(isoDate)).toEqual(['2026-10-02', '2026-10-05', '2026-10-06'])
  })

  it('starts on Monday when asked on a Sunday', () => {
    const days = nextWorkingDays(1, new Date(2026, 9, 4))
    expect(isoDate(days[0]!)).toBe('2026-10-05')
  })
})

describe('isoDate', () => {
  it('pads month and day, using the local date', () => {
    expect(isoDate(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05')
  })
})

describe('shift helpers', () => {
  it('measures a shift in minutes and trims seconds', () => {
    expect(minutesBetween('09:00:00', '12:30:00')).toBe(210)
    expect(hhmm('09:00:00')).toBe('09:00')
  })
})
