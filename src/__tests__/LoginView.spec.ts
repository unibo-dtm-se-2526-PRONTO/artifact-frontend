import { flushPromises } from '@vue/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'

import { getToken } from '@/api/client'
import LoginView from '@/views/auth/LoginView.vue'

import { alertText, button, fill, link, pageText, submit } from './helpers/dom'
import { deferred, mockApi, type ApiMock, type MockResponse } from './helpers/fetch'
import * as fx from './helpers/fixtures'
import { mountWithPlugins } from './helpers/mount'

const INVALID = { status: 400, body: { non_field_errors: ['Invalid email or password.'] } }

let api: ApiMock
beforeEach(() => {
  api = mockApi().on('GET', '/api/faqs/?lang=it', { body: [fx.faq()] })
})

async function signIn(email: string, password: string, route = '/login') {
  const mounted = await mountWithPlugins(LoginView, { route })
  await fill(mounted.wrapper, 'Email istituzionale', email)
  await fill(mounted.wrapper, 'Password', password)
  await submit(mounted.wrapper)
  return mounted
}

describe('LoginView', () => {
  it('shows the sign-in form and the way to register', async () => {
    const { wrapper } = await mountWithPlugins(LoginView, { route: '/login' })

    expect(pageText(wrapper)).toContain('Accedi a PRONTO')
    expect(button(wrapper, 'Accedi').attributes('type')).toBe('submit')
    expect(link(wrapper, 'Crea account').attributes('href')).toBe('/register')
    expect(alertText(wrapper)).toBeNull()
  })

  it('welcomes back a user who just registered', async () => {
    const { wrapper } = await mountWithPlugins(LoginView, { route: '/login?registered=1' })
    expect(pageText(wrapper)).toContain('Account creato. Puoi accedere subito')
    expect(pageText(wrapper)).not.toContain('verifica')
  })

  it('signs a student in and opens the ask page', async () => {
    api.on('POST', '/api/auth/login/', { body: { token: fx.TOKEN } })
    api.on('GET', '/api/auth/me/', { body: fx.studentUser() })

    const { router } = await signIn('  mario.rossi@studio.unibo.it ', 'una-password-lunga')

    expect(api.last('POST', '/api/auth/login/')?.body).toEqual({
      email: 'mario.rossi@studio.unibo.it',
      password: 'una-password-lunga',
    })
    expect(getToken()).toBe(fx.TOKEN)
    expect(router.currentRoute.value.name).toBe('ask')
  })

  it('signs an employee in and opens the queue', async () => {
    api.on('POST', '/api/auth/login/', { body: { token: fx.TOKEN } })
    api.on('GET', '/api/auth/me/', { body: fx.employeeUser() })

    const { router } = await signIn('giulia.bianchi@unibo.it', 'pw')

    expect(router.currentRoute.value.name).toBe('queue')
  })

  it('goes back to the page that asked for the sign-in', async () => {
    api.on('POST', '/api/auth/login/', { body: { token: fx.TOKEN } })
    api.on('GET', '/api/auth/me/', { body: fx.studentUser() })

    const { router } = await signIn('mario.rossi@studio.unibo.it', 'pw', '/login?next=/bookings')

    expect(router.currentRoute.value.fullPath).toBe('/bookings')
  })

  it('says when the credentials are wrong, and stays put', async () => {
    api.on('POST', '/api/auth/login/', INVALID)

    const { wrapper, router } = await signIn('mario.rossi@studio.unibo.it', 'wrong')

    expect(alertText(wrapper)).toBe('Invalid email or password.')
    expect(router.currentRoute.value.name).toBe('login')
    expect(getToken()).toBeNull()
    expect(button(wrapper, 'Accedi').attributes('disabled')).toBeUndefined()
  })

  it('gives a deactivated account the same generic message', async () => {
    // An administrator can deactivate an account; the backend then refuses its
    // login exactly as a wrong password, without revealing that it exists.
    api.on('POST', '/api/auth/login/', INVALID)

    const { wrapper } = await signIn('nuovo.utente@studio.unibo.it', 'giusta-ma-disattivato')

    expect(alertText(wrapper)).toBe('Invalid email or password.')
  })

  it('shows a generic message when the backend cannot be reached', async () => {
    api.on('POST', '/api/auth/login/', { networkError: true })

    const { wrapper } = await signIn('mario.rossi@studio.unibo.it', 'pw')

    expect(alertText(wrapper)).toBe('Qualcosa è andato storto. Riprova.')
  })

  it('clears the previous error on a new attempt', async () => {
    api.on('POST', '/api/auth/login/', { body: { token: fx.TOKEN } })
    api.on('GET', '/api/auth/me/', { body: fx.studentUser() })
    api.once('POST', '/api/auth/login/', INVALID)
    const { wrapper } = await signIn('mario.rossi@studio.unibo.it', 'wrong')
    expect(alertText(wrapper)).not.toBeNull()

    await submit(wrapper)

    expect(alertText(wrapper)).toBeNull()
  })

  it('disables the button while signing in', async () => {
    const pending = deferred<MockResponse>()
    api.on('POST', '/api/auth/login/', () => pending.promise)
    const { wrapper } = await mountWithPlugins(LoginView, { route: '/login' })
    await fill(wrapper, 'Email istituzionale', 'mario.rossi@studio.unibo.it')
    await fill(wrapper, 'Password', 'pw')

    await submit(wrapper)
    expect(button(wrapper, 'Accedi').attributes('disabled')).toBeDefined()

    pending.resolve(INVALID)
    await flushPromises()
    expect(button(wrapper, 'Accedi').attributes('disabled')).toBeUndefined()
  })
})
