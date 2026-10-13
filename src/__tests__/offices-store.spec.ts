import { flushPromises } from '@vue/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'

import { setLang } from '@/i18n'
import { useOfficesStore } from '@/stores/offices'

import { mockApi, type ApiMock } from './helpers/fetch'
import * as fx from './helpers/fixtures'
import { freshPinia } from './helpers/mount'

describe('offices store', () => {
  let api: ApiMock
  beforeEach(() => {
    api = mockApi()
    api.on('GET', '/api/offices/?lang=it', { body: fx.offices('it') })
    api.on('GET', '/api/offices/?lang=en', { body: fx.offices('en') })
    freshPinia()
  })

  it('loads the offices once, however many screens ask', async () => {
    const offices = useOfficesStore()

    await Promise.all([offices.load(), offices.load()])
    await offices.load()

    expect(api.calls('GET', '/api/offices/')).toHaveLength(1)
    expect(offices.offices).toEqual(fx.offices('it'))
  })

  it('reloads when forced', async () => {
    const offices = useOfficesStore()
    await offices.load()
    await offices.load(true)
    expect(api.calls('GET', '/api/offices/')).toHaveLength(2)
  })

  it('tries again after a failed load', async () => {
    api.once('GET', '/api/offices/?lang=it', { status: 500, text: 'Server Error' })
    const offices = useOfficesStore()

    await expect(offices.load()).rejects.toThrow('/api/offices/?lang=it ha risposto 500')
    expect(offices.offices).toEqual([])

    await offices.load()
    expect(offices.offices).toHaveLength(4)
  })

  it('finds an office and its name by code', async () => {
    const offices = useOfficesStore()
    await offices.load()

    expect(offices.byCode('GUIDANCE')?.contact_email).toBe('orientamento@unibo.it')
    expect(offices.byCode(null)).toBeUndefined()
    expect(offices.nameOf('INTERNSHIPS')).toBe('Tirocini')
  })

  it('falls back to the code, then to a dash, before the list arrives', () => {
    const offices = useOfficesStore()
    expect(offices.nameOf('INTERNSHIPS')).toBe('INTERNSHIPS')
    expect(offices.nameOf(null)).toBe('—')
    expect(offices.nameOf(undefined)).toBe('—')
  })

  it('reloads in the new language when the interface switches', async () => {
    const offices = useOfficesStore()
    await offices.load()

    setLang('en')
    await flushPromises()

    expect(api.last('GET', '/api/offices/')?.url).toBe('/api/offices/?lang=en')
    expect(offices.nameOf('INTERNSHIPS')).toBe('Internships')
  })

  it('does not load anything on a language switch if nobody asked yet', async () => {
    useOfficesStore()
    setLang('en')
    await flushPromises()
    expect(api.requests).toHaveLength(0)
  })
})
