import { flushPromises } from '@vue/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'

import AvailabilityView from '@/views/employee/AvailabilityView.vue'

import { alertText, button, click, field, fill, link, pageText, submit, texts } from './helpers/dom'
import { deferred, detailError, mockApi, type ApiMock, type MockResponse } from './helpers/fetch'
import * as fx from './helpers/fixtures'
import { mountWithPlugins } from './helpers/mount'

const PROFILE = '/api/employee-profile/'
const SHIFTS = '/api/shifts/'

const monday = fx.shift({ id: 5, weekday: 0, start_time: '09:00:00', end_time: '12:00:00' })
const mondayAfternoon = fx.shift({
  id: 6,
  weekday: 0,
  start_time: '14:00:00',
  end_time: '15:30:00',
})
const thursday = fx.shift({ id: 7, weekday: 3, start_time: '10:00:00', end_time: '11:00:00' })

let api: ApiMock
beforeEach(() => {
  api = mockApi()
  api.on('GET', '/api/offices/?lang=it', {
    body: fx
      .offices()
      .map((o) => (o.code === 'GUIDANCE' ? { ...o, slot_duration_minutes: 20 } : o)),
  })
  api.on('GET', PROFILE, { body: { office: 'INTERNSHIPS' } })
  api.on('GET', SHIFTS, { body: [monday, mondayAfternoon, thursday] })
})

const mountAvailability = () =>
  mountWithPlugins(AvailabilityView, { user: fx.employeeUser(), route: '/availability' })

type Wrapper = Awaited<ReturnType<typeof mountAvailability>>['wrapper']
const rows = (wrapper: Wrapper) => wrapper.findAll('.shift-row').map((row) => texts(row))

describe('AvailabilityView', () => {
  it('shows a loading state while it reads the profile and the shifts', async () => {
    const pending = deferred<MockResponse>()
    api.on('GET', SHIFTS, () => pending.promise)
    const { wrapper } = await mountAvailability()
    expect(pageText(wrapper)).toContain('Caricamento…')

    pending.resolve({ body: [] })
    await flushPromises()
    expect(pageText(wrapper)).not.toContain('Caricamento…')
  })

  it('lays out the working week, with the slots each shift opens', async () => {
    const { wrapper } = await mountAvailability()

    expect(pageText(wrapper)).toContain('Tirocini')
    expect(rows(wrapper)).toEqual([
      ['Lunedì', '09:00 – 12:00', '6 slot × 30 min', 'Rimuovi'],
      ['Lunedì', '14:00 – 15:30', '3 slot × 30 min', 'Rimuovi'],
      ['Martedì', 'Chiuso'],
      ['Mercoledì', 'Chiuso'],
      ['Giovedì', '10:00 – 11:00', '2 slot × 30 min', 'Rimuovi'],
      ['Venerdì', 'Chiuso'],
    ])
  })

  it('lists a weekend day only when it has a shift', async () => {
    api.on('GET', SHIFTS, { body: [fx.shift({ id: 8, weekday: 5 })] })
    const { wrapper } = await mountAvailability()

    expect(rows(wrapper).map((r) => r[0])).toEqual([
      'Lunedì',
      'Martedì',
      'Mercoledì',
      'Giovedì',
      'Venerdì',
      'Sabato',
    ])
  })

  it('counts slots at the office’s own length', async () => {
    api.on('GET', PROFILE, { body: { office: 'GUIDANCE' } })
    const { wrapper } = await mountAvailability()

    expect(rows(wrapper)[0]).toContain('9 slot × 20 min')
    expect(field(wrapper, 'Inizio').attributes('step')).toBe('1200')
  })

  it('adds a shift, then reloads the week', async () => {
    api.on('POST', SHIFTS, { status: 201, body: fx.shift({ id: 9, weekday: 2 }) })
    const { wrapper } = await mountAvailability()
    expect(field(wrapper, 'Inizio').attributes('step')).toBe('1800')

    await field(wrapper, 'Giorno').setValue('2')
    await fill(wrapper, 'Inizio', '14:00')
    await fill(wrapper, 'Fine', '16:30')
    api.on('GET', SHIFTS, {
      body: [monday, fx.shift({ id: 9, weekday: 2, start_time: '14:00:00', end_time: '16:30:00' })],
    })
    await submit(wrapper, 'form')

    expect(api.last('POST', SHIFTS)?.body).toEqual({
      weekday: 2,
      start_time: '14:00',
      end_time: '16:30',
    })
    expect(rows(wrapper)).toContainEqual([
      'Mercoledì',
      '14:00 – 16:30',
      '5 slot × 30 min',
      'Rimuovi',
    ])
  })

  it('offers Monday to Sunday, 9 to 12 by default', async () => {
    const { wrapper } = await mountAvailability()

    const days = field<HTMLSelectElement>(wrapper, 'Giorno')
    expect(days.findAll('option').map((o) => o.text())).toEqual([
      'Lunedì',
      'Martedì',
      'Mercoledì',
      'Giovedì',
      'Venerdì',
      'Sabato',
      'Domenica',
    ])
    expect(days.element.value).toBe('0')
    expect(field<HTMLInputElement>(wrapper, 'Inizio').element.value).toBe('09:00')
    expect(field<HTMLInputElement>(wrapper, 'Fine').element.value).toBe('12:00')
  })

  it('shows why a shift was refused', async () => {
    api.on('POST', SHIFTS, detailError(400, 'This shift overlaps another of your shifts.'))
    const { wrapper } = await mountAvailability()

    await submit(wrapper, 'form')

    expect(alertText(wrapper)).toBe('This shift overlaps another of your shifts.')
    expect(api.calls('GET', SHIFTS)).toHaveLength(1)
  })

  it('shows a generic message when a shift cannot be sent', async () => {
    api.on('POST', SHIFTS, { networkError: true })
    const { wrapper } = await mountAvailability()

    await submit(wrapper, 'form')

    expect(alertText(wrapper)).toBe('Qualcosa è andato storto. Riprova.')
  })

  it('removes a shift, then reloads the week', async () => {
    api.on('DELETE', '/api/shifts/7/', { status: 204 })
    const { wrapper } = await mountAvailability()
    api.on('GET', SHIFTS, { body: [monday, mondayAfternoon] })

    await click(wrapper.findAll('.shift-row')[4]!.get('button'))

    expect(api.calls('DELETE', '/api/shifts/7/')).toHaveLength(1)
    expect(rows(wrapper)[4]).toEqual(['Giovedì', 'Chiuso'])
  })

  it('explains why a shift with bookings cannot be removed', async () => {
    api.on('DELETE', '/api/shifts/5/', {
      status: 400,
      body: {
        detail: 'This shift still covers booked appointments: cancel them first.',
        appointments: [41],
      },
    })
    const { wrapper } = await mountAvailability()

    await click(button(wrapper, 'Rimuovi'))

    expect(alertText(wrapper)).toBe(
      'This shift still covers booked appointments: cancel them first.',
    )
    expect(rows(wrapper)).toHaveLength(6)
  })

  it('shows a generic message when a removal cannot be sent', async () => {
    api.on('DELETE', '/api/shifts/5/', { networkError: true })
    const { wrapper } = await mountAvailability()

    await click(button(wrapper, 'Rimuovi'))

    expect(alertText(wrapper)).toBe('Qualcosa è andato storto. Riprova.')
  })

  it('asks to choose an office first when there is no profile yet', async () => {
    api.on('GET', PROFILE, detailError(404, 'No EmployeeProfile matches the given query.'))
    api.on('GET', SHIFTS, { body: [] })
    const { wrapper } = await mountAvailability()

    expect(pageText(wrapper)).toContain('Prima scegli il tuo ufficio nel profilo.')
    expect(link(wrapper, 'Profilo').attributes('href')).toBe('/profile')
    expect(wrapper.find('form').exists()).toBe(false)
    expect(pageText(wrapper)).toContain('Dipendente') // no office name to show
  })

  it('says when the page cannot be loaded', async () => {
    api.on('GET', PROFILE, { status: 500, text: 'Server Error' })
    const { wrapper } = await mountAvailability()

    expect(alertText(wrapper)).toBe('Qualcosa è andato storto. Riprova.')
    expect(api.calls('GET', SHIFTS)).toHaveLength(0)
  })
})
