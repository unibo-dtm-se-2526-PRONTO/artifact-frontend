import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import PosterPanel from '@/components/PosterPanel.vue'
import StatusTag from '@/components/StatusTag.vue'
import { setLang } from '@/i18n'

import { mockApi } from './helpers/fetch'
import * as fx from './helpers/fixtures'

describe('StatusTag', () => {
  it.each([
    ['BOOKED', 'Prenotato'],
    ['COMPLETED', 'Completato'],
    ['CANCELLED', 'Annullato'],
  ] as const)('labels %s as “%s”', (status, label) => {
    const wrapper = mount(StatusTag, { props: { status } })
    expect(wrapper.text()).toBe(label)
    expect(wrapper.classes()).toContain(`status-${status}`)
  })

  it('follows the interface language', async () => {
    const wrapper = mount(StatusTag, { props: { status: 'BOOKED' } })
    setLang('en')
    await flushPromises()
    expect(wrapper.text()).toBe('Booked')
  })
})

describe('PosterPanel', () => {
  /** Each figure with its caption, e.g. "2 domande nel database FAQ". */
  const stats = (wrapper: ReturnType<typeof mount>) =>
    wrapper.findAll('.poster-stat').map((s) => `${s.get('strong').text()} ${s.get('span').text()}`)

  it('shows how many FAQs the archive holds', async () => {
    const api = mockApi().on('GET', '/api/faqs/?lang=it', {
      body: [fx.faq(), fx.faq({ id: 4 })],
    })

    const wrapper = mount(PosterPanel)
    await flushPromises()

    expect(stats(wrapper)).toEqual(['2 domande nel database FAQ', '4 uffici del Campus di Cesena'])
    expect(api.calls('GET', '/api/faqs/')).toHaveLength(1)
  })

  it('leaves the count out when the backend does not answer', async () => {
    mockApi().on('GET', '/api/faqs/?lang=it', { networkError: true })

    const wrapper = mount(PosterPanel)
    await flushPromises()

    expect(stats(wrapper)).toEqual(['4 uffici del Campus di Cesena'])
    expect(wrapper.get('h1').text()).toBe('Le tue risposte.A portata di click.')
  })

  it('leaves the count out when the archive is empty', async () => {
    mockApi().on('GET', '/api/faqs/?lang=it', { body: [] })

    const wrapper = mount(PosterPanel)
    await flushPromises()

    expect(stats(wrapper)).toEqual(['4 uffici del Campus di Cesena'])
  })
})
