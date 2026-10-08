import { afterEach, describe, expect, it } from 'vitest'

import {
  dayLabel,
  hhmm,
  isoDate,
  longSlot,
  minutesBetween,
  nextWorkingDays,
  scorePct,
  shortDate,
  time,
} from '@/format'
import { setLang } from '@/i18n'

import { freezeTime } from './helpers/time'

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

describe('scorePct', () => {
  it('turns the backend rank into a capped percentage', () => {
    expect(scorePct(0.734)).toBe(73)
    expect(scorePct(1.4)).toBe(99)
    expect(scorePct(-0.2)).toBe(0)
  })
})

describe('shift helpers', () => {
  it('measures a shift in minutes and trims seconds', () => {
    expect(minutesBetween('09:00:00', '12:30:00')).toBe(210)
    expect(hhmm('09:00:00')).toBe('09:00')
  })
})

describe('nextWorkingDays from today', () => {
  it('counts from the current date when none is given', () => {
    freezeTime('2026-10-10T18:00:00+02:00') // a Saturday
    expect(nextWorkingDays(2).map(isoDate)).toEqual(['2026-10-12', '2026-10-13'])
  })
})

describe('the timezone', () => {
  it('is the office’s, Europe/Rome, whatever the machine says', () => {
    // 1 July is CEST (+2), 1 December CET (+1).
    expect(new Date('2026-07-01T10:00:00Z').getHours()).toBe(12)
    expect(new Date('2026-12-01T10:00:00Z').getHours()).toBe(11)
  })
})

describe('dates and times in the interface language', () => {
  afterEach(() => setLang('it'))

  it('shows slot times in the office’s local time', () => {
    expect(time('2026-10-05T07:00:00Z')).toBe('09:00')
    // After the switch back to CET on 25 October, 9:00 is 08:00 UTC.
    expect(time('2026-10-26T08:00:00Z')).toBe('09:00')
  })

  it('dates a late-evening UTC instant on the local day', () => {
    expect(shortDate('2026-10-05T22:30:00Z')).toBe('06 ott')
    setLang('en')
    expect(shortDate(new Date('2026-10-05T22:30:00Z'))).toBe('06 Oct')
  })

  it('labels a day and a slot in Italian', () => {
    expect(dayLabel(new Date(2026, 9, 5))).toBe('lun 5')
    expect(longSlot('2026-10-07T09:30:00+02:00')).toBe('mer 7 ott · 09:30')
  })

  it('labels a day and a slot in English', () => {
    setLang('en')
    expect(dayLabel(new Date(2026, 9, 5))).toBe('Mon 5')
    expect(longSlot('2026-10-07T14:00:00+02:00')).toBe('Wed 7 Oct · 14:00')
  })
})

describe('minutesBetween', () => {
  it('accepts times without seconds or minutes', () => {
    expect(minutesBetween('09:00', '09:30')).toBe(30)
    expect(minutesBetween('9', '10')).toBe(60)
  })
})
