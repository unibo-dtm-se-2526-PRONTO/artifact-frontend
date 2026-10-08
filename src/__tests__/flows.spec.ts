/**
 * Whole journeys through the real app: App.vue, the real router with its guard
 * and lazy-loaded pages, real stores. Only the backend is mocked.
 */
import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { button, click, fill, pageText, submit } from './helpers/dom'
import { mockApi, type ApiMock } from './helpers/fetch'
import * as fx from './helpers/fixtures'
import { freshPinia } from './helpers/mount'
import { freezeTime } from './helpers/time'

const SLOT = '2026-10-07T09:30:00+02:00'

/** A page load: fresh modules, the app mounted on the real router at `path`. */
async function openApp(path: string) {
  vi.resetModules()
  window.history.replaceState(null, '', path)
  const pinia = freshPinia()
  const { default: router } = await import('@/router')
  const { default: App } = await import('@/App.vue')
  const wrapper = mount(App, { global: { plugins: [pinia, router] } })
  await router.isReady()
  await flushPromises()
  return { wrapper, router }
}

/** Waits for a navigation, lazy-loaded page included, and for its first requests. */
async function arrive(router: Awaited<ReturnType<typeof openApp>>['router'], name: string) {
  await vi.waitFor(() => expect(router.currentRoute.value.name).toBe(name))
  await vi.dynamicImportSettled()
  await flushPromises()
}

let api: ApiMock
beforeEach(() => {
  freezeTime()
  api = mockApi()
  api.on('GET', '/api/faqs/?lang=it', { body: [fx.faq()] })
  api.on('GET', '/api/offices/?lang=it', { body: fx.offices() })
})

describe('a student', () => {
  it('signs in, asks, finds no answer, books a slot and sees it among the bookings', async () => {
    api.on('POST', '/api/auth/login/', { body: { token: fx.TOKEN } })
    api.on('GET', '/api/auth/me/', { body: fx.studentUser() })
    api.on('POST', '/api/questions/?lang=it', {
      status: 201,
      body: fx.inquiry({ office: null, match: null }),
    })
    api.on('GET', /^\/api\/offices\/GUIDANCE\/availability\//, (request) => ({
      body: fx.availability(
        request.query.date!,
        request.query.date === '2026-10-07' ? [SLOT] : [],
        'GUIDANCE',
      ),
    }))
    const booked = fx.appointment({
      office: 'GUIDANCE',
      slot: SLOT,
      question_text: 'Come scelgo la magistrale?',
    })
    api.on('POST', '/api/appointments/', { status: 201, body: booked })
    api.on('GET', '/api/appointments/', { body: [booked] })

    // A bookmarked page, signed out: the guard asks to sign in first.
    const { wrapper, router } = await openApp('/bookings')
    await arrive(router, 'login')
    expect(router.currentRoute.value.query.next).toBe('/bookings')

    await fill(wrapper, 'Email istituzionale', 'mario.rossi@studio.unibo.it')
    await fill(wrapper, 'Password', 'una-password-lunga')
    await submit(wrapper)
    await arrive(router, 'bookings')

    await click(wrapper.get('nav a[href="/ask"]'))
    await arrive(router, 'ask')
    await fill(wrapper, 'Qual è la tua domanda?', 'Come scelgo la magistrale?')
    await submit(wrapper, 'form.searchbar')
    await click(button(wrapper, 'Orientamento'))

    await arrive(router, 'slots')
    await click(button(wrapper, '09:30'))
    await click(button(wrapper, 'Continua'))

    await arrive(router, 'confirm')
    await submit(wrapper)
    expect(api.last('POST', '/api/appointments/')?.body).toEqual({
      office: 'GUIDANCE',
      slot: SLOT,
      question_text: 'Come scelgo la magistrale?',
      question_lang: 'it',
      faq_id: null,
    })
    expect(pageText(wrapper)).toContain('Prenotazione registrata')

    await click(button(wrapper, 'Vai alle mie prenotazioni'))
    await arrive(router, 'bookings')
    expect(pageText(wrapper)).toContain('Come scelgo la magistrale?')
    expect(pageText(wrapper)).toContain('Prenotato')
  })

  it('is kept out of the employee pages', async () => {
    localStorage.setItem('pronto.token', fx.TOKEN)
    api.on('GET', '/api/auth/me/', { body: fx.studentUser() })

    const { wrapper, router } = await openApp('/queue')

    await arrive(router, 'ask')
    expect(pageText(wrapper)).toContain('Qual è la tua domanda?')
  })
})

describe('an employee', () => {
  it('signs in to the queue and signs out again', async () => {
    api.on('POST', '/api/auth/login/', { body: { token: fx.TOKEN } })
    api.on('GET', '/api/auth/me/', { body: fx.employeeUser() })
    api.on('GET', '/api/appointments/', { body: [] })
    api.on('POST', '/api/auth/logout/', { status: 204 })

    const { wrapper, router } = await openApp('/login')
    await arrive(router, 'login')
    await fill(wrapper, 'Email istituzionale', 'giulia.bianchi@unibo.it')
    await fill(wrapper, 'Password', 'una-password-lunga')
    await submit(wrapper)

    await arrive(router, 'queue')
    expect(pageText(wrapper)).toContain('Nessun appuntamento assegnato.')

    await click(wrapper.get('button[aria-haspopup="menu"]'))
    await click(button(wrapper, 'Esci'))
    await arrive(router, 'login')
    expect(api.calls('POST', '/api/auth/logout/')).toHaveLength(1)
    expect(localStorage.getItem('pronto.token')).toBeNull()
  })
})
