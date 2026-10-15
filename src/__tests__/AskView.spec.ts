import { flushPromises } from '@vue/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'

import { useBookingStore } from '@/stores/booking'
import AskView from '@/views/student/AskView.vue'

import {
  alertText,
  button,
  click,
  field,
  fill,
  pageText,
  queryButtons,
  submit,
} from './helpers/dom'
import {
  deferred,
  detailError,
  fieldError,
  mockApi,
  type ApiMock,
  type MockResponse,
} from './helpers/fetch'
import * as fx from './helpers/fixtures'
import { mountWithPlugins } from './helpers/mount'

const QUESTION = 'Come attivo un tirocinio?'
const ASK = '/api/questions/?lang=it'

let api: ApiMock
beforeEach(() => {
  api = mockApi().on('GET', '/api/offices/?lang=it', { body: fx.offices() })
})

const mountAsk = () => mountWithPlugins(AskView, { user: fx.studentUser(), route: '/ask' })

async function ask(answer: MockResponse) {
  api.on('POST', ASK, answer)
  const mounted = await mountAsk()
  await fill(mounted.wrapper, 'Qual è la tua domanda?', `  ${QUESTION} `)
  await submit(mounted.wrapper)
  return mounted
}

describe('AskView', () => {
  it('loads the offices with the student’s token, without asking to choose one', async () => {
    const { wrapper } = await mountAsk()

    expect(api.last('GET', '/api/offices/')?.headers.Authorization).toBe(`Token ${fx.TOKEN}`)
    expect(wrapper.findAll('select')).toHaveLength(0)
  })

  it('cannot search until something is typed', async () => {
    const { wrapper } = await mountAsk()
    expect(button(wrapper, 'Cerca').attributes('disabled')).toBeDefined()

    await fill(wrapper, 'Qual è la tua domanda?', '   ')
    expect(button(wrapper, 'Cerca').attributes('disabled')).toBeDefined()

    await submit(wrapper)
    expect(api.calls('POST', ASK)).toHaveLength(0)
  })

  it('says when the offices cannot be loaded', async () => {
    api.on('GET', '/api/offices/?lang=it', { status: 500, text: 'Server Error' })
    const { wrapper } = await mountAsk()
    expect(alertText(wrapper)).toBe('Qualcosa è andato storto. Riprova.')
  })

  describe('with a matching FAQ', () => {
    it('asks every office and shows only the answer, with its office', async () => {
      const { wrapper } = await ask({ status: 201, body: fx.inquiry() })

      expect(api.last('POST', ASK)?.body).toEqual({ question: QUESTION })
      const text = pageText(wrapper)
      expect(text).toContain('Tirocini')
      expect(text).toContain(fx.faq().answer)
      expect(text).toContain('Questa risposta ti soddisfa?')
      // the FAQ's own question and the score are internals of the search
      expect(text).not.toContain(fx.faq().question)
      expect(text).not.toContain('61%')
      expect(text).not.toContain('La risposta è di un altro ufficio')
    })

    it('flags an answer that belongs to another office', async () => {
      const reassigned = fx.inquiry({ office: 'ADMIN_OFFICE', office_reassigned: true })
      const { wrapper } = await ask({ status: 201, body: reassigned })

      expect(pageText(wrapper)).toContain('La risposta è di un altro ufficio: Tirocini.')
    })

    it('closes the question when the answer is enough', async () => {
      const id = fx.inquiry().id
      api.on('POST', `/api/questions/${id}/resolve/`, { body: fx.inquiry({ resolved: true }) })
      const { wrapper } = await ask({ status: 201, body: fx.inquiry() })

      await click(button(wrapper, 'Sì, risolto'))

      expect(api.calls('POST', `/api/questions/${id}/resolve/`)).toHaveLength(1)
      expect(pageText(wrapper)).toContain('Chiuso senza appuntamento.')
      expect(queryButtons(wrapper, 'Sì, risolto')).toHaveLength(0)

      await click(button(wrapper, 'Fai un’altra domanda'))

      expect(pageText(wrapper)).not.toContain('Questa risposta ti soddisfa?')
      expect(field<HTMLInputElement>(wrapper, 'Qual è la tua domanda?').element.value).toBe('')
    })

    it('reports a failed resolve', async () => {
      api.on(
        'POST',
        `/api/questions/${fx.inquiry().id}/resolve/`,
        detailError(400, 'No answer was suggested for this question, so none can resolve it.'),
      )
      const { wrapper } = await ask({ status: 201, body: fx.inquiry() })

      await click(button(wrapper, 'Sì, risolto'))

      expect(alertText(wrapper)).toBe(
        'No answer was suggested for this question, so none can resolve it.',
      )
      expect(pageText(wrapper)).not.toContain('Chiuso senza appuntamento.')
    })

    it('books with the answer’s office, carrying the question and the FAQ', async () => {
      const reassigned = fx.inquiry({ office: 'ADMIN_OFFICE', office_reassigned: true })
      const { wrapper, router } = await ask({ status: 201, body: reassigned })

      await click(button(wrapper, 'No, voglio un appuntamento'))

      const booking = useBookingStore()
      expect(booking.office).toBe('INTERNSHIPS')
      expect(booking.question).toBe(QUESTION)
      expect(booking.shownFaq()).toEqual(fx.faq())
      expect(router.currentRoute.value.name).toBe('slots')
    })
  })

  describe('without a matching FAQ', () => {
    it('lets the student choose the office to book with', async () => {
      const none = fx.inquiry({ office: null, match: null })
      const { wrapper, router } = await ask({ status: 201, body: none })

      const text = pageText(wrapper)
      expect(text).toContain('Nessuna risposta in archivio')
      expect(text).toContain('Scegli l’ufficio con cui prenotare')
      expect(text).toContain('slot da 30 min')
      await click(button(wrapper, 'Orientamento'))

      const booking = useBookingStore()
      expect(booking.office).toBe('GUIDANCE')
      expect(booking.question).toBe(QUESTION)
      expect(booking.shownFaq()).toBeNull()
      expect(router.currentRoute.value.name).toBe('slots')
    })
  })

  it('shows the backend’s reason when the question is refused', async () => {
    const { wrapper } = await ask(
      fieldError('question', 'Ensure this field has no more than 1000 characters.'),
    )
    expect(alertText(wrapper)).toBe('Ensure this field has no more than 1000 characters.')
  })

  it('shows a generic message when the backend cannot be reached', async () => {
    const { wrapper } = await ask({ networkError: true })
    expect(alertText(wrapper)).toBe('Qualcosa è andato storto. Riprova.')
  })

  it('disables the search while waiting for the answer', async () => {
    const pending = deferred<MockResponse>()
    api.on('POST', ASK, () => pending.promise)
    const { wrapper } = await mountAsk()
    await fill(wrapper, 'Qual è la tua domanda?', QUESTION)

    await submit(wrapper)
    expect(button(wrapper, 'Cerca').attributes('disabled')).toBeDefined()

    pending.resolve({ status: 201, body: fx.inquiry() })
    await flushPromises()
    expect(button(wrapper, 'Cerca').attributes('disabled')).toBeUndefined()
    expect(pageText(wrapper)).toContain('Questa risposta ti soddisfa?')
  })
})
