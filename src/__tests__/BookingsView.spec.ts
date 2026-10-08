import { flushPromises } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import BookingsView from '@/views/student/BookingsView.vue'

import { alertText, button, click, pageText, queryButtons, texts } from './helpers/dom'
import { deferred, detailError, mockApi, type ApiMock, type MockResponse } from './helpers/fetch'
import * as fx from './helpers/fixtures'
import { mountWithPlugins } from './helpers/mount'
import { freezeTime } from './helpers/time'

const LIST = '/api/appointments/'

const upcoming = fx.appointment({ id: 41, slot: '2026-10-07T09:00:00+02:00' })
const past = fx.appointment({
  id: 40,
  office: 'GUIDANCE',
  slot: '2026-10-01T15:30:00+02:00',
  status: 'COMPLETED',
  question_text: 'Come scelgo la magistrale?',
})
const cancelled = fx.appointment({ id: 39, status: 'CANCELLED', question_text: 'Annullata' })
// Booked but already started: too late to cancel.
const started = fx.appointment({ id: 42, slot: '2026-10-05T09:30:00+02:00' })

let api: ApiMock
beforeEach(() => {
  freezeTime()
  api = mockApi().on('GET', '/api/offices/?lang=it', { body: fx.offices() })
})

const mountBookings = () =>
  mountWithPlugins(BookingsView, { user: fx.studentUser(), route: '/bookings' })

const rows = (wrapper: Awaited<ReturnType<typeof mountBookings>>['wrapper']) =>
  wrapper.findAll('.list-item')

describe('BookingsView', () => {
  it('shows a loading state, then the empty state', async () => {
    const pending = deferred<MockResponse>()
    api.on('GET', LIST, () => pending.promise)
    const { wrapper } = await mountBookings()
    expect(pageText(wrapper)).toContain('Caricamento…')

    pending.resolve({ body: [] })
    await flushPromises()

    expect(pageText(wrapper)).not.toContain('Caricamento…')
    expect(pageText(wrapper)).toContain('Non hai ancora prenotazioni.')
  })

  it('lists every appointment with office, date, time, question and status', async () => {
    api.on('GET', LIST, { body: [upcoming, past, cancelled] })
    const { wrapper } = await mountBookings()

    const [first, second, third] = rows(wrapper)
    expect(texts(first!)).toEqual([
      '07 ott',
      '09:00',
      'Tirocini',
      'Come attivo un tirocinio curriculare?',
      'Prenotato',
      'Annulla',
    ])
    expect(texts(second!)).toEqual([
      '01 ott',
      '15:30',
      'Orientamento',
      'Come scelgo la magistrale?',
      'Completato',
    ])
    expect(pageText(third!)).toContain('Annullato')
  })

  it('offers to cancel only booked appointments that have not started', async () => {
    api.on('GET', LIST, { body: [upcoming, past, cancelled, started] })
    const { wrapper } = await mountBookings()

    expect(rows(wrapper).map((r) => queryButtons(r, 'Annulla').length)).toEqual([1, 0, 0, 0])
  })

  it('cancels after confirmation, then reloads the list', async () => {
    api.on('GET', LIST, { body: [upcoming] })
    api.on('POST', '/api/appointments/41/cancel/', { status: 204 })
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true)
    const { wrapper } = await mountBookings()
    api.on('GET', LIST, { body: [{ ...upcoming, status: 'CANCELLED' }] })

    await click(button(wrapper, 'Annulla'))

    expect(confirm).toHaveBeenCalledWith('Annullare l’appuntamento? Lo slot tornerà disponibile.')
    expect(api.calls('POST', '/api/appointments/41/cancel/')).toHaveLength(1)
    expect(api.calls('GET', LIST)).toHaveLength(2)
    expect(pageText(rows(wrapper)[0]!)).toContain('Annullato')
    expect(queryButtons(wrapper, 'Annulla')).toHaveLength(0)
  })

  it('does nothing when the student changes their mind', async () => {
    api.on('GET', LIST, { body: [upcoming] })
    vi.spyOn(window, 'confirm').mockReturnValue(false)
    const { wrapper } = await mountBookings()

    await click(button(wrapper, 'Annulla'))

    expect(api.calls('POST', '/api/appointments/41/cancel/')).toHaveLength(0)
  })

  it('shows why a cancellation was refused', async () => {
    api.on('GET', LIST, { body: [upcoming] })
    api.on(
      'POST',
      '/api/appointments/41/cancel/',
      detailError(400, 'Only a booked appointment can be cancelled.'),
    )
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    const { wrapper } = await mountBookings()

    await click(button(wrapper, 'Annulla'))

    expect(alertText(wrapper)).toBe('Only a booked appointment can be cancelled.')
  })

  it('shows a generic message when a cancellation cannot be sent', async () => {
    api.on('GET', LIST, { body: [upcoming] })
    api.on('POST', '/api/appointments/41/cancel/', { networkError: true })
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    const { wrapper } = await mountBookings()

    await click(button(wrapper, 'Annulla'))

    expect(alertText(wrapper)).toBe('Qualcosa è andato storto. Riprova.')
  })

  it('says when the list cannot be loaded', async () => {
    api.on('GET', LIST, { status: 500, text: 'Server Error' })
    const { wrapper } = await mountBookings()

    expect(alertText(wrapper)).toBe('Qualcosa è andato storto. Riprova.')
    expect(pageText(wrapper)).not.toContain('Caricamento…')
  })

  it('still shows the bookings when the office names cannot be loaded', async () => {
    api.on('GET', '/api/offices/?lang=it', { networkError: true })
    api.on('GET', LIST, { body: [upcoming] })
    const { wrapper } = await mountBookings()

    expect(alertText(wrapper)).toBeNull()
    expect(pageText(rows(wrapper)[0]!)).toContain('INTERNSHIPS')
  })
})
