import { flushPromises } from '@vue/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'

import { useBookingStore } from '@/stores/booking'
import SlotsView from '@/views/student/SlotsView.vue'

import { alertText, button, click, pageText, queryButtons } from './helpers/dom'
import { deferred, mockApi, type ApiMock, type MockResponse } from './helpers/fetch'
import * as fx from './helpers/fixtures'
import { mountWithPlugins } from './helpers/mount'
import { freezeTime } from './helpers/time'

const AVAILABILITY = '/api/offices/INTERNSHIPS/availability/'

/** Ten working days from Monday 5 October 2026, weekends skipped. */
const DAYS = [
  '2026-10-05',
  '2026-10-06',
  '2026-10-07',
  '2026-10-08',
  '2026-10-09',
  '2026-10-12',
  '2026-10-13',
  '2026-10-14',
  '2026-10-15',
  '2026-10-16',
]

let api: ApiMock
beforeEach(() => {
  freezeTime()
  api = mockApi()
  api.on('GET', '/api/offices/?lang=it', { body: fx.offices() })
})

/** Free slots per date; any other day of the ten is fully booked. */
function serve(free: Record<string, string[]>) {
  api.on('GET', AVAILABILITY, (request) => ({
    body: fx.availability(request.query.date!, free[request.query.date!] ?? []),
  }))
}

const mountSlots = (question = 'Come attivo un tirocinio?') =>
  mountWithPlugins(SlotsView, {
    user: fx.studentUser(),
    route: '/book/slots',
    setup: () => useBookingStore().start('INTERNSHIPS', question),
  })

const dayButtons = (wrapper: Awaited<ReturnType<typeof mountSlots>>['wrapper']) =>
  wrapper.findAll('[role="group"] button')

describe('SlotsView', () => {
  it('sends a student with no booking in progress back to ask', async () => {
    const { router } = await mountWithPlugins(SlotsView, {
      user: fx.studentUser(),
      route: '/book/slots',
    })
    expect(router.currentRoute.value.name).toBe('ask')
    expect(api.calls('GET', AVAILABILITY)).toHaveLength(0)
  })

  it('asks for the next ten working days, today included', async () => {
    serve({})
    await mountSlots()

    expect(api.calls('GET', AVAILABILITY).map((r) => r.query.date)).toEqual(DAYS)
  })

  it('opens on the first day with free slots and lists them in local time', async () => {
    serve({
      '2026-10-07': ['2026-10-07T09:00:00+02:00', '2026-10-07T09:30:00+02:00'],
      '2026-10-08': ['2026-10-08T14:00:00+02:00'],
    })
    const { wrapper } = await mountSlots()

    const days = dayButtons(wrapper)
    expect(days.map((d) => d.findAll('span').map((span) => span.text()))).toEqual([
      ['lun 5', '0 liberi'],
      ['mar 6', '0 liberi'],
      ['mer 7', '2 liberi'],
      ['gio 8', '1 liberi'],
      ['ven 9', '0 liberi'],
      ['lun 12', '0 liberi'],
      ['mar 13', '0 liberi'],
      ['mer 14', '0 liberi'],
      ['gio 15', '0 liberi'],
      ['ven 16', '0 liberi'],
    ])
    expect(days[2]!.attributes('aria-pressed')).toBe('true')
    expect(queryButtons(wrapper, 'libero').map((b) => b.get('.slot-time').text())).toEqual([
      '09:00',
      '09:30',
    ])
  })

  it('switches day, and says when a day has nothing free', async () => {
    serve({ '2026-10-07': ['2026-10-07T09:00:00+02:00'] })
    const { wrapper } = await mountSlots()

    await click(dayButtons(wrapper)[0]!)

    expect(dayButtons(wrapper)[0]!.attributes('aria-pressed')).toBe('true')
    expect(queryButtons(wrapper, 'libero')).toHaveLength(0)
    expect(pageText(wrapper)).toContain('Nessuno slot libero in questo giorno.')
  })

  it('stays on today when the whole fortnight is full', async () => {
    serve({})
    const { wrapper } = await mountSlots()
    expect(dayButtons(wrapper)[0]!.attributes('aria-pressed')).toBe('true')
    expect(pageText(wrapper)).toContain('Nessuno slot libero in questo giorno.')
  })

  it('picks a slot and continues to the confirmation', async () => {
    serve({ '2026-10-07': ['2026-10-07T09:00:00+02:00', '2026-10-07T09:30:00+02:00'] })
    const { wrapper, router } = await mountSlots()
    expect(button(wrapper, 'Continua').attributes('disabled')).toBeDefined()
    expect(pageText(wrapper)).toContain('Nessuno slot')

    await click(button(wrapper, '09:30'))

    expect(useBookingStore().slot).toBe('2026-10-07T09:30:00+02:00')
    expect(button(wrapper, '09:30').attributes('aria-pressed')).toBe('true')
    expect(pageText(wrapper)).toContain('mer 7 ott · 09:30')

    await click(button(wrapper, 'Continua'))
    expect(router.currentRoute.value.name).toBe('confirm')
  })

  it('shows a loading state, then an error if any day fails', async () => {
    const pending = deferred<MockResponse>()
    serve({})
    api.on('GET', `${AVAILABILITY}?date=2026-10-09`, () => pending.promise)
    const { wrapper } = await mountSlots()
    expect(pageText(wrapper)).toContain('Caricamento…')

    pending.resolve({ status: 500, text: 'Server Error' })
    await flushPromises()

    expect(pageText(wrapper)).not.toContain('Caricamento…')
    expect(alertText(wrapper)).toBe('Qualcosa è andato storto. Riprova.')
    expect(queryButtons(wrapper, 'Continua')).toHaveLength(0)
  })

  it('goes back to the question', async () => {
    serve({})
    const { wrapper, router } = await mountSlots()
    await click(button(wrapper, 'Indietro'))
    expect(router.currentRoute.value.name).toBe('ask')
  })
})
