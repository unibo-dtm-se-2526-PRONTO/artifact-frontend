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

async function ask(answer: MockResponse, office?: string) {
  api.on('POST', ASK, answer)
  const mounted = await mountAsk()
  if (office) await field(mounted.wrapper, 'Ufficio').setValue(office)
  await fill(mounted.wrapper, 'Qual è la tua domanda?', `  ${QUESTION} `)
  await submit(mounted.wrapper)
  return mounted
}

describe('AskView', () => {
  it('loads the offices and preselects the first', async () => {
    const { wrapper } = await mountAsk()

    const select = field<HTMLSelectElement>(wrapper, 'Ufficio')
    expect(select.findAll('option').map((o) => o.text())).toEqual([
      'Orientamento',
      'Segreteria studenti',
      'Relazioni internazionali',
      'Tirocini',
    ])
    expect(select.element.value).toBe('GUIDANCE')
    expect(api.last('GET', '/api/offices/')?.headers.Authorization).toBe(`Token ${fx.TOKEN}`)
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
    it('asks the chosen office and shows the answer with its score', async () => {
      const { wrapper } = await ask({ status: 201, body: fx.inquiry() }, 'INTERNSHIPS')

      expect(api.last('POST', ASK)?.body).toEqual({ office: 'INTERNSHIPS', question: QUESTION })
      const text = pageText(wrapper)
      expect(text).toContain('Risposta trovata')
      expect(text).toContain('61%')
      expect(text).toContain(fx.faq().question)
      expect(text).toContain(fx.faq().answer)
      expect(text).toContain('Questa risposta ti soddisfa?')
      expect(text).not.toContain('La risposta è di un altro ufficio')
    })

    it('flags an answer that belongs to another office', async () => {
      const reassigned = fx.inquiry({ office: 'ADMIN_OFFICE', office_reassigned: true })
      const { wrapper } = await ask({ status: 201, body: reassigned }, 'ADMIN_OFFICE')

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

      expect(pageText(wrapper)).not.toContain('Risposta trovata')
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
      const { wrapper, router } = await ask({ status: 201, body: reassigned }, 'ADMIN_OFFICE')

      await click(button(wrapper, 'No, voglio un appuntamento'))

      const booking = useBookingStore()
      expect(booking.office).toBe('INTERNSHIPS')
      expect(booking.question).toBe(QUESTION)
      expect(booking.shownFaq()).toEqual(fx.faq())
      expect(router.currentRoute.value.name).toBe('slots')
    })
  })

  describe('without a matching FAQ', () => {
    it('offers to book with the office asked', async () => {
      const none = fx.inquiry({ office: 'GUIDANCE', match: null })
      const { wrapper, router } = await ask({ status: 201, body: none }, 'GUIDANCE')

      expect(pageText(wrapper)).toContain('Nessuna risposta in archivio')
      await click(button(wrapper, 'Prenota con Orientamento'))

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
    expect(pageText(wrapper)).toContain('Risposta trovata')
  })

  describe('browsing the offices', () => {
    it('lists them on request and books one without a question', async () => {
      const { wrapper, router } = await mountAsk()
      const toggle = button(wrapper, 'Mostra')
      expect(toggle.attributes('aria-expanded')).toBe('false')

      await click(toggle)

      expect(button(wrapper, 'Nascondi').attributes('aria-expanded')).toBe('true')
      expect(pageText(wrapper)).toContain('slot da 30 min')
      await click(button(wrapper, 'Relazioni internazionali'))

      expect(useBookingStore().office).toBe('INTERNATIONAL')
      expect(useBookingStore().question).toBe('')
      expect(router.currentRoute.value.name).toBe('slots')
    })

    it('hides them again', async () => {
      const { wrapper } = await mountAsk()
      await click(button(wrapper, 'Mostra'))
      await click(button(wrapper, 'Nascondi'))
      expect(queryButtons(wrapper, 'Relazioni internazionali')).toHaveLength(0)
    })
  })
})
