import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import PosterPanel from '@/components/PosterPanel.vue'
import StatusTag from '@/components/StatusTag.vue'
import { setLang } from '@/i18n'

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
  it('shows only the headline', () => {
    const wrapper = mount(PosterPanel)

    expect(wrapper.get('h1').text()).toBe('Le tue risposte.A portata di click.')
    expect(wrapper.text()).toBe('Le tue risposte.A portata di click.')
  })
})
