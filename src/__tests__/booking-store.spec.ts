import { beforeEach, describe, expect, it } from 'vitest'

import { useBookingStore } from '@/stores/booking'

import * as fx from './helpers/fixtures'
import { freshPinia } from './helpers/mount'

describe('booking store', () => {
  beforeEach(() => {
    freshPinia()
  })

  it('starts empty', () => {
    const booking = useBookingStore()
    expect(booking.office).toBeNull()
    expect(booking.question).toBe('')
    expect(booking.inquiry).toBeNull()
    expect(booking.slot).toBeNull()
    expect(booking.booked).toBeNull()
    expect(booking.shownFaq()).toBeNull()
  })

  it('starts a booking from an answered question, keeping the FAQ shown', () => {
    const booking = useBookingStore()
    const asked = fx.inquiry()

    booking.start('INTERNSHIPS', 'Come attivo un tirocinio?', asked)

    expect(booking.office).toBe('INTERNSHIPS')
    expect(booking.question).toBe('Come attivo un tirocinio?')
    expect(booking.inquiry).toEqual(asked)
    expect(booking.shownFaq()).toEqual(fx.faq())
  })

  it('has no FAQ to pass on when the question found none', () => {
    const booking = useBookingStore()
    booking.start('GUIDANCE', 'Domanda senza risposta', fx.inquiry({ match: null }))
    expect(booking.shownFaq()).toBeNull()
  })

  it('starts a booking straight from an office, with no question', () => {
    const booking = useBookingStore()
    booking.start('GUIDANCE')
    expect(booking).toMatchObject({ office: 'GUIDANCE', question: '', inquiry: null })
  })

  it('forgets the slot and the previous booking when a new one starts', () => {
    const booking = useBookingStore()
    booking.start('INTERNSHIPS', 'Prima domanda')
    booking.slot = '2026-10-07T09:00:00+02:00'
    booking.booked = fx.appointment()

    booking.start('GUIDANCE', 'Seconda domanda')

    expect(booking.slot).toBeNull()
    expect(booking.booked).toBeNull()
  })

  it('resets everything', () => {
    const booking = useBookingStore()
    booking.start('INTERNSHIPS', 'Domanda', fx.inquiry())
    booking.slot = '2026-10-07T09:00:00+02:00'
    booking.booked = fx.appointment()

    booking.reset()

    expect(booking).toMatchObject({
      office: null,
      question: '',
      inquiry: null,
      slot: null,
      booked: null,
    })
  })
})
