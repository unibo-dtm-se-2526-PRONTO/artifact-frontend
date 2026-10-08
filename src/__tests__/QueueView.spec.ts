import { flushPromises } from '@vue/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'

import QueueView from '@/views/employee/QueueView.vue'

import { alertText, button, click, pageText, queryButtons, texts } from './helpers/dom'
import { deferred, detailError, mockApi, type ApiMock, type MockResponse } from './helpers/fetch'
import * as fx from './helpers/fixtures'
import { mountWithPlugins } from './helpers/mount'
import { freezeTime } from './helpers/time'

const LIST = '/api/appointments/'

// Now is Monday 5 October, 10:00. The backend sends the newest first.
const later = fx.appointment({
  id: 44,
  slot: '2026-10-08T11:00:00+02:00',
  student: 'Lucia Verdi',
  question_text: 'Posso anticipare il tirocinio?',
})
const startedEarlier = fx.appointment({
  id: 43,
  slot: '2026-10-05T09:30:00+02:00',
  faq_id: 3,
})
const done = fx.appointment({ id: 40, slot: '2026-10-01T15:30:00+02:00', status: 'COMPLETED' })
const cancelled = fx.appointment({ id: 39, slot: '2026-10-02T10:00:00+02:00', status: 'CANCELLED' })

let api: ApiMock
beforeEach(() => {
  freezeTime()
  api = mockApi()
})

const mountQueue = () => mountWithPlugins(QueueView, { user: fx.employeeUser(), route: '/queue' })

const bodyRows = (wrapper: Awaited<ReturnType<typeof mountQueue>>['wrapper']) =>
  wrapper.findAll('tbody tr')

describe('QueueView', () => {
  it('shows who is on duty, a loading state, then the empty state', async () => {
    const pending = deferred<MockResponse>()
    api.on('GET', LIST, () => pending.promise)
    const { wrapper } = await mountQueue()
    expect(pageText(wrapper)).toContain('Giulia Bianchi')
    expect(pageText(wrapper)).toContain('Caricamento…')

    pending.resolve({ body: [] })
    await flushPromises()

    expect(pageText(wrapper)).toContain('Nessun appuntamento assegnato.')
    expect(wrapper.find('table').exists()).toBe(false)
  })

  it('lists the upcoming appointments, the next one first', async () => {
    api.on('GET', LIST, { body: [later, startedEarlier, done, cancelled] })
    const { wrapper } = await mountQueue()

    expect(wrapper.findAll('th').map((th) => th.text())).toEqual([
      'Quando',
      'Studente',
      'Domanda',
      'Stato',
      '',
    ])
    const [first, second] = bodyRows(wrapper)
    expect(bodyRows(wrapper)).toHaveLength(2)
    expect(texts(first!)).toEqual([
      '05 ott',
      '09:30',
      'Mario Rossi',
      'FAQ #3',
      'Prenotato',
      'Completa',
    ])
    expect(pageText(first!)).toContain('Come attivo un tirocinio curriculare?')
    expect(texts(second!)).toEqual([
      '08 ott',
      '11:00',
      'Lucia Verdi',
      'Posso anticipare il tirocinio?',
      'Prenotato',
    ])
  })

  it('shows every appointment on request, oldest first', async () => {
    api.on('GET', LIST, { body: [later, startedEarlier, done, cancelled] })
    const { wrapper } = await mountQueue()

    await click(button(wrapper, 'Tutti'))

    expect(button(wrapper, 'Tutti').attributes('aria-pressed')).toBe('true')
    expect(button(wrapper, 'Prossimi').attributes('aria-pressed')).toBe('false')
    expect(bodyRows(wrapper).map((row) => row.find('.status').text())).toEqual([
      'Completato',
      'Annullato',
      'Prenotato',
      'Prenotato',
    ])

    await click(button(wrapper, 'Prossimi'))
    expect(bodyRows(wrapper)).toHaveLength(2)
  })

  it('says the queue is empty when nothing is still booked', async () => {
    api.on('GET', LIST, { body: [done, cancelled] })
    const { wrapper } = await mountQueue()
    expect(pageText(wrapper)).toContain('Nessun appuntamento assegnato.')
  })

  it('completes an appointment that has started, then reloads', async () => {
    api.on('GET', LIST, { body: [later, startedEarlier] })
    api.on('POST', '/api/appointments/43/complete/', { status: 204 })
    const { wrapper } = await mountQueue()
    expect(queryButtons(wrapper, 'Completa')).toHaveLength(1)
    api.on('GET', LIST, { body: [later, { ...startedEarlier, status: 'COMPLETED' }] })

    await click(button(wrapper, 'Completa'))

    expect(api.calls('POST', '/api/appointments/43/complete/')).toHaveLength(1)
    expect(api.calls('GET', LIST)).toHaveLength(2)
    expect(bodyRows(wrapper)).toHaveLength(1)
    expect(queryButtons(wrapper, 'Completa')).toHaveLength(0)
  })

  it('shows why a completion was refused', async () => {
    api.on('GET', LIST, { body: [startedEarlier] })
    api.on(
      'POST',
      '/api/appointments/43/complete/',
      detailError(400, 'Only a booked appointment can be completed.'),
    )
    const { wrapper } = await mountQueue()

    await click(button(wrapper, 'Completa'))

    expect(alertText(wrapper)).toBe('Only a booked appointment can be completed.')
  })

  it('shows a generic message when a completion cannot be sent', async () => {
    api.on('GET', LIST, { body: [startedEarlier] })
    api.on('POST', '/api/appointments/43/complete/', { networkError: true })
    const { wrapper } = await mountQueue()

    await click(button(wrapper, 'Completa'))

    expect(alertText(wrapper)).toBe('Qualcosa è andato storto. Riprova.')
  })

  it('says when the queue cannot be loaded', async () => {
    api.on('GET', LIST, { networkError: true })
    const { wrapper } = await mountQueue()
    expect(alertText(wrapper)).toBe('Qualcosa è andato storto. Riprova.')
  })
})
