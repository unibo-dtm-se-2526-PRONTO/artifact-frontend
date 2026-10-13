import { flushPromises } from '@vue/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'

import type { Inquiry } from '@/api/types'
import { setLang } from '@/i18n'
import { useBookingStore } from '@/stores/booking'
import ConfirmView from '@/views/student/ConfirmView.vue'

import { alertText, button, click, field, pageText, queryButtons, submit } from './helpers/dom'
import { deferred, fieldError, mockApi, type ApiMock, type MockResponse } from './helpers/fetch'
import * as fx from './helpers/fixtures'
import { mountWithPlugins } from './helpers/mount'
import { freezeTime } from './helpers/time'

const SLOT = '2026-10-07T09:00:00+02:00'
const QUESTION = 'Come attivo un tirocinio?'

let api: ApiMock
beforeEach(() => {
  freezeTime()
  api = mockApi().on('GET', '/api/offices/?lang=it', { body: fx.offices() })
})

interface Progress {
  office?: 'INTERNSHIPS' | null
  slot?: string | null
  question?: string
  inquiry?: Inquiry | null
}

function mountConfirm({
  office = 'INTERNSHIPS',
  slot = SLOT,
  question = QUESTION,
  inquiry = fx.inquiry(),
}: Progress = {}) {
  return mountWithPlugins(ConfirmView, {
    user: fx.studentUser(),
    route: '/book/confirm',
    setup: () => {
      const booking = useBookingStore()
      if (office) booking.start(office, question, inquiry)
      booking.slot = slot
    },
  })
}

describe('ConfirmView', () => {
  it('sends a student with no booking in progress back to ask', async () => {
    const { router } = await mountConfirm({ office: null })
    expect(router.currentRoute.value.name).toBe('ask')
  })

  it('sends a student with no slot back to the slots', async () => {
    const { router } = await mountConfirm({ slot: null })
    expect(router.currentRoute.value.name).toBe('slots')
  })

  it('shows the office, the slot, the question and the FAQ already shown', async () => {
    const { wrapper } = await mountConfirm()

    const text = pageText(wrapper)
    expect(text).toContain('Tirocini · mer 7 ott · 09:00')
    expect(text).toContain('Rivedi e conferma')
    expect(field<HTMLTextAreaElement>(wrapper, 'La tua domanda').element.value).toBe(QUESTION)
    expect(text).toContain(`${QUESTION.length}/1000`)
    expect(text).toContain('Risposta già proposta')
    expect(text).toContain(fx.faq().answer)
  })

  it('has no FAQ panel when none was shown', async () => {
    const { wrapper } = await mountConfirm({ inquiry: null })
    expect(pageText(wrapper)).not.toContain('Risposta già proposta')
  })

  it('needs a question before confirming', async () => {
    const { wrapper } = await mountConfirm({ question: '', inquiry: null })
    expect(button(wrapper, 'Conferma prenotazione').attributes('disabled')).toBeDefined()

    await submit(wrapper)
    expect(api.calls('POST', '/api/appointments/')).toHaveLength(0)

    await field(wrapper, 'La tua domanda').setValue('Posso cambiare tutor?')
    expect(button(wrapper, 'Conferma prenotazione').attributes('disabled')).toBeUndefined()
  })

  it('books the slot with the question, its language and the FAQ shown', async () => {
    api.on('POST', '/api/appointments/', { status: 201, body: fx.appointment({ slot: SLOT }) })
    const { wrapper } = await mountConfirm({
      inquiry: fx.inquiry({ language: 'en' }),
      question: `  ${QUESTION}  `,
    })

    await submit(wrapper)

    expect(api.last('POST', '/api/appointments/')?.body).toEqual({
      office: 'INTERNSHIPS',
      slot: SLOT,
      question_text: QUESTION,
      question_lang: 'en',
      faq_id: 3,
    })
    const text = pageText(wrapper)
    expect(text).toContain('Prenotazione registrata')
    expect(text).toContain('Tirocini')
    expect(text).toContain('mer 7 ott · 09:00')
    expect(text).toContain('Giulia Bianchi')
    expect(text).toContain('Come attivo un tirocinio curriculare?')
    expect(text).toContain('Ti abbiamo inviato un’email di conferma.')
  })

  it('books in the interface language, with no FAQ, when booking straight from an office', async () => {
    setLang('en')
    api.on('GET', '/api/offices/?lang=en', { body: fx.offices('en') })
    api.on('POST', '/api/appointments/', { status: 201, body: fx.appointment() })
    const { wrapper } = await mountConfirm({ question: 'Can I change tutor?', inquiry: null })

    await submit(wrapper)

    expect(api.last('POST', '/api/appointments/')?.body).toMatchObject({
      question_text: 'Can I change tutor?',
      question_lang: 'en',
      faq_id: null,
    })
  })

  it('says when the slot was taken in the meantime, keeping the question', async () => {
    api.on('POST', '/api/appointments/', fieldError('slot', 'This slot has just been taken.'))
    const { wrapper } = await mountConfirm()

    await submit(wrapper)

    expect(alertText(wrapper)).toBe('This slot has just been taken.')
    expect(pageText(wrapper)).not.toContain('Prenotazione registrata')
    expect(field<HTMLTextAreaElement>(wrapper, 'La tua domanda').element.value).toBe(QUESTION)
    expect(button(wrapper, 'Conferma prenotazione').attributes('disabled')).toBeUndefined()
  })

  it('shows a generic message when the backend cannot be reached', async () => {
    api.on('POST', '/api/appointments/', { networkError: true })
    const { wrapper } = await mountConfirm()

    await submit(wrapper)

    expect(alertText(wrapper)).toBe('Qualcosa è andato storto. Riprova.')
  })

  it('cannot be confirmed twice while the first request is on its way', async () => {
    const pending = deferred<MockResponse>()
    api.on('POST', '/api/appointments/', () => pending.promise)
    const { wrapper } = await mountConfirm()

    await submit(wrapper)
    expect(button(wrapper, 'Conferma prenotazione').attributes('disabled')).toBeDefined()

    pending.resolve({ status: 201, body: fx.appointment() })
    await flushPromises()
    expect(api.calls('POST', '/api/appointments/')).toHaveLength(1)
  })

  it('ends on the bookings, with the booking in progress cleared', async () => {
    api.on('POST', '/api/appointments/', { status: 201, body: fx.appointment() })
    const { wrapper, router } = await mountConfirm()
    await submit(wrapper)

    await click(button(wrapper, 'Vai alle mie prenotazioni'))

    expect(router.currentRoute.value.name).toBe('bookings')
    expect(useBookingStore().office).toBeNull()
    expect(useBookingStore().booked).toBeNull()
  })

  it('goes back to the slots', async () => {
    const { wrapper, router } = await mountConfirm()
    await click(button(wrapper, 'Indietro'))
    expect(router.currentRoute.value.name).toBe('slots')
    expect(queryButtons(wrapper, 'Conferma prenotazione')).toHaveLength(1)
  })
})
