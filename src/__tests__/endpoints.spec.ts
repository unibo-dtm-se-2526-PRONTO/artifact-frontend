import { beforeEach, describe, expect, it } from 'vitest'

import { setToken } from '@/api/client'
import * as api from '@/api/endpoints'
import { setLang } from '@/i18n'

import { mockApi, type ApiMock } from './helpers/fetch'
import * as fx from './helpers/fixtures'

describe('endpoints', () => {
  let mock: ApiMock
  beforeEach(() => {
    mock = mockApi()
    setToken(fx.TOKEN)
  })

  /** The one request the call sent: method, path with query, body. */
  function sent() {
    expect(mock.requests).toHaveLength(1)
    const [request] = mock.requests
    expect(request!.headers.Authorization).toBe(`Token ${fx.TOKEN}`)
    return { method: request!.method, url: request!.url, body: request!.body }
  }

  describe('accounts', () => {
    it('register posts the payload and returns the new user', async () => {
      const payload = {
        email: 'mario.rossi@studio.unibo.it',
        password: 'una-password-lunga',
        first_name: 'Mario',
        last_name: 'Rossi',
        matricola: '0001012345',
        degree_programme: 'Ingegneria e scienze informatiche',
      }
      mock.on('POST', '/api/auth/register/', { status: 201, body: fx.studentUser() })

      await expect(api.register(payload)).resolves.toEqual(fx.studentUser())
      expect(sent()).toEqual({ method: 'POST', url: '/api/auth/register/', body: payload })
    })

    it('login posts the credentials and returns the token', async () => {
      mock.on('POST', '/api/auth/login/', { body: { token: fx.TOKEN } })

      await expect(api.login('mario.rossi@studio.unibo.it', 'pw')).resolves.toEqual({
        token: fx.TOKEN,
      })
      expect(sent()).toEqual({
        method: 'POST',
        url: '/api/auth/login/',
        body: { email: 'mario.rossi@studio.unibo.it', password: 'pw' },
      })
    })

    it('logout posts without a body', async () => {
      mock.on('POST', '/api/auth/logout/', { status: 204 })
      await expect(api.logout()).resolves.toBeUndefined()
      expect(sent()).toEqual({ method: 'POST', url: '/api/auth/logout/', body: undefined })
    })

    it('me reads the current user', async () => {
      mock.on('GET', '/api/auth/me/', { body: fx.employeeUser() })
      await expect(api.me()).resolves.toEqual(fx.employeeUser())
      expect(sent()).toMatchObject({ method: 'GET', url: '/api/auth/me/' })
    })
  })

  describe('offices and booking', () => {
    it('listOffices asks in the interface language', async () => {
      mock.on('GET', '/api/offices/', { body: fx.offices('en') })
      setLang('en')

      await expect(api.listOffices()).resolves.toEqual(fx.offices('en'))
      expect(sent()).toMatchObject({ method: 'GET', url: '/api/offices/?lang=en' })
    })

    it('availability asks for one office on one date', async () => {
      const day = fx.availability('2026-10-07', ['2026-10-07T09:00:00+02:00'])
      mock.on('GET', '/api/offices/INTERNSHIPS/availability/', { body: day })

      await expect(api.availability('INTERNSHIPS', '2026-10-07')).resolves.toEqual(day)
      expect(sent()).toMatchObject({
        method: 'GET',
        url: '/api/offices/INTERNSHIPS/availability/?date=2026-10-07',
      })
    })

    it('listAppointments reads the caller’s appointments', async () => {
      mock.on('GET', '/api/appointments/', { body: [fx.appointment()] })
      await expect(api.listAppointments()).resolves.toEqual([fx.appointment()])
      expect(sent()).toMatchObject({ method: 'GET', url: '/api/appointments/' })
    })

    it('bookAppointment posts the slot, the question and the FAQ shown', async () => {
      const payload = {
        office: 'INTERNSHIPS' as const,
        slot: '2026-10-07T09:00:00+02:00',
        question_text: 'Come attivo un tirocinio?',
        question_lang: 'it' as const,
        faq_id: 3,
      }
      mock.on('POST', '/api/appointments/', { status: 201, body: fx.appointment() })

      await expect(api.bookAppointment(payload)).resolves.toEqual(fx.appointment())
      expect(sent()).toEqual({ method: 'POST', url: '/api/appointments/', body: payload })
    })

    it('cancelAppointment posts to the appointment’s cancel action', async () => {
      mock.on('POST', '/api/appointments/41/cancel/', { status: 204 })
      await api.cancelAppointment(41)
      expect(sent()).toEqual({
        method: 'POST',
        url: '/api/appointments/41/cancel/',
        body: undefined,
      })
    })

    it('completeAppointment posts to the appointment’s complete action', async () => {
      mock.on('POST', '/api/appointments/41/complete/', { status: 204 })
      await api.completeAppointment(41)
      expect(sent()).toEqual({
        method: 'POST',
        url: '/api/appointments/41/complete/',
        body: undefined,
      })
    })
  })

  describe('employee', () => {
    it('getEmployeeProfile reads the office', async () => {
      mock.on('GET', '/api/employee-profile/', { body: { office: 'GUIDANCE' } })
      await expect(api.getEmployeeProfile()).resolves.toEqual({ office: 'GUIDANCE' })
      expect(sent()).toMatchObject({ method: 'GET', url: '/api/employee-profile/' })
    })

    it('setEmployeeProfile posts the chosen office', async () => {
      mock.on('POST', '/api/employee-profile/', { status: 201, body: { office: 'GUIDANCE' } })
      await expect(api.setEmployeeProfile('GUIDANCE')).resolves.toEqual({ office: 'GUIDANCE' })
      expect(sent()).toEqual({
        method: 'POST',
        url: '/api/employee-profile/',
        body: { office: 'GUIDANCE' },
      })
    })

    it('listShifts reads the weekly shifts', async () => {
      mock.on('GET', '/api/shifts/', { body: [fx.shift()] })
      await expect(api.listShifts()).resolves.toEqual([fx.shift()])
      expect(sent()).toMatchObject({ method: 'GET', url: '/api/shifts/' })
    })

    it('addShift posts the new shift', async () => {
      const shift = { weekday: 2, start_time: '14:00', end_time: '16:30' }
      mock.on('POST', '/api/shifts/', { status: 201, body: fx.shift({ ...shift, id: 9 }) })

      await api.addShift(shift)
      expect(sent()).toEqual({ method: 'POST', url: '/api/shifts/', body: shift })
    })

    it('removeShift deletes the shift', async () => {
      mock.on('DELETE', '/api/shifts/5/', { status: 204 })
      await api.removeShift(5)
      expect(sent()).toMatchObject({ method: 'DELETE', url: '/api/shifts/5/' })
    })
  })

  describe('FAQ', () => {
    it('askQuestion posts the question, tagged with the interface language', async () => {
      mock.on('POST', '/api/questions/', { status: 201, body: fx.inquiry() })

      await expect(api.askQuestion('ADMIN_OFFICE', 'Come attivo un tirocinio?')).resolves.toEqual(
        fx.inquiry(),
      )
      expect(sent()).toEqual({
        method: 'POST',
        url: '/api/questions/?lang=it',
        body: { office: 'ADMIN_OFFICE', question: 'Come attivo un tirocinio?' },
      })
    })

    it('resolveQuestion posts to the inquiry’s resolve action', async () => {
      const id = fx.inquiry().id
      mock.on('POST', `/api/questions/${id}/resolve/`, { body: fx.inquiry({ resolved: true }) })

      await expect(api.resolveQuestion(id)).resolves.toMatchObject({ resolved: true })
      expect(sent()).toMatchObject({ method: 'POST', url: `/api/questions/${id}/resolve/` })
    })

    it('countFaqs counts the published FAQs', async () => {
      mock.on('GET', '/api/faqs/', { body: [fx.faq(), fx.faq({ id: 4 }), fx.faq({ id: 5 })] })
      setLang('en')

      await expect(api.countFaqs()).resolves.toBe(3)
      expect(sent()).toMatchObject({ method: 'GET', url: '/api/faqs/?lang=en' })
    })
  })
})
