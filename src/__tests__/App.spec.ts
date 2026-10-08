import { beforeEach, describe, expect, it } from 'vitest'

import App from '@/App.vue'
import type { User } from '@/api/types'
import { getToken } from '@/api/client'
import { useBookingStore } from '@/stores/booking'

import { button, click, link, pageText, queryButtons } from './helpers/dom'
import { mockApi, type ApiMock } from './helpers/fetch'
import * as fx from './helpers/fixtures'
import { mountWithPlugins } from './helpers/mount'

/** The shell alone: the page inside it is stubbed. */
const mountApp = (user?: User, route = '/login') =>
  mountWithPlugins(App, { user, route, stubs: { RouterView: true } })

const navLinks = (wrapper: Awaited<ReturnType<typeof mountApp>>['wrapper']) =>
  wrapper.findAll('nav a').map((a) => a.text())

let api: ApiMock
beforeEach(() => {
  api = mockApi()
})

describe('the application shell', () => {
  it('signed out, shows the brand and the language switch only', async () => {
    const { wrapper } = await mountApp()

    expect(wrapper.find('nav').exists()).toBe(false)
    expect(wrapper.find('[aria-haspopup="menu"]').exists()).toBe(false)
    expect(link(wrapper, 'PRONTO').attributes('href')).toBe('/login')
  })

  it('gives a student the ask and bookings pages', async () => {
    const { wrapper } = await mountApp(fx.studentUser(), '/ask')

    expect(navLinks(wrapper)).toEqual(['Chiedi', 'Prenotazioni'])
    expect(link(wrapper, 'PRONTO').attributes('href')).toBe('/ask')
  })

  it('gives an employee the queue, availability and profile pages', async () => {
    const { wrapper } = await mountApp(fx.employeeUser(), '/queue')

    expect(navLinks(wrapper)).toEqual(['Appuntamenti', 'Disponibilità', 'Profilo'])
    expect(link(wrapper, 'PRONTO').attributes('href')).toBe('/queue')
  })

  it('switches language from the top bar', async () => {
    const { wrapper } = await mountApp(fx.studentUser(), '/ask')

    await click(button(wrapper, 'EN'))

    expect(navLinks(wrapper)).toEqual(['Ask', 'Bookings'])
    expect(button(wrapper, 'EN').attributes('aria-pressed')).toBe('true')
    expect(button(wrapper, 'IT').attributes('aria-pressed')).toBe('false')
    expect(localStorage.getItem('pronto.lang')).toBe('en')
  })

  describe('the account menu', () => {
    it('opens on the initials and shows who is signed in', async () => {
      const { wrapper } = await mountApp(fx.studentUser(), '/ask')
      const avatar = wrapper.get('button[aria-haspopup="menu"]')
      expect(avatar.text()).toBe('MR')
      expect(avatar.attributes('aria-label')).toBe('Mario Rossi')
      expect(wrapper.find('[role="menu"]').exists()).toBe(false)

      await click(avatar)

      const menu = wrapper.get('[role="menu"]')
      expect(avatar.attributes('aria-expanded')).toBe('true')
      expect(pageText(menu)).toContain('mario.rossi@studio.unibo.it')
      expect(pageText(menu)).toContain('Studente · 0001012345')
      expect(menu.findAll('[role="menuitem"]').map((i) => i.text())).toEqual([
        'Chiedi',
        'Prenotazioni',
        'Esci',
      ])
    })

    it.each([
      [fx.employeeUser(), 'Dipendente'],
      [fx.adminUser(), 'Admin'],
    ])('names the role of %s.email', async (user, role) => {
      const { wrapper } = await mountApp(user, '/queue')
      await click(wrapper.get('button[aria-haspopup="menu"]'))
      expect(pageText(wrapper.get('[role="menu"]'))).toContain(role)
    })

    it('closes when an entry is picked', async () => {
      const { wrapper } = await mountApp(fx.studentUser(), '/ask')
      await click(wrapper.get('button[aria-haspopup="menu"]'))

      await click(wrapper.get('[role="menu"]'))

      expect(wrapper.find('[role="menu"]').exists()).toBe(false)
    })

    it('signs out: revokes the token, drops the booking in progress, back to the login', async () => {
      api.on('POST', '/api/auth/logout/', { status: 204 })
      const { wrapper, router } = await mountApp(fx.studentUser(), '/bookings')
      useBookingStore().start('GUIDANCE', 'Una domanda a metà')

      await click(wrapper.get('button[aria-haspopup="menu"]'))
      await click(button(wrapper, 'Esci'))

      expect(api.calls('POST', '/api/auth/logout/')).toHaveLength(1)
      expect(getToken()).toBeNull()
      expect(useBookingStore().office).toBeNull()
      expect(router.currentRoute.value.name).toBe('login')
      expect(queryButtons(wrapper, 'MR')).toHaveLength(0)
      expect(wrapper.find('nav').exists()).toBe(false)
    })

    // Known bug: App.vue signOut() awaits auth.logout(), which rethrows a failed
    // request after clearing the session, so router.push() is never reached.
    // The user is left on a protected page, signed out, with an unhandled error.
    it.fails('signs out to the login even when the logout request fails', async () => {
      api.on('POST', '/api/auth/logout/', { networkError: true })
      const { wrapper, router } = await mountApp(fx.studentUser(), '/bookings')
      const errors: unknown[] = []
      wrapper.vm.$.appContext.config.errorHandler = (e: unknown) => errors.push(e)

      await click(wrapper.get('button[aria-haspopup="menu"]'))
      await click(button(wrapper, 'Esci'))

      expect(getToken()).toBeNull()
      expect(router.currentRoute.value.name).toBe('login')
      expect(errors).toEqual([])
    })
  })
})
