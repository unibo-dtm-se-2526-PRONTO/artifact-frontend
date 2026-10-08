import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Router } from 'vue-router'

import type { User } from '@/api/types'

import { detailError, mockApi, type ApiMock } from './helpers/fetch'
import * as fx from './helpers/fixtures'
import { freshPinia } from './helpers/mount'

/**
 * The guard is registered on the app's singleton router, so each test imports
 * a fresh copy of the router module (and the client and store behind it) after
 * setting up storage, exactly as a page load would.
 */
async function loadApp(saved: { user?: User } = {}) {
  vi.resetModules()
  if (saved.user) {
    localStorage.setItem('pronto.token', fx.TOKEN)
    api.on('GET', '/api/auth/me/', { body: saved.user })
  }
  window.history.replaceState(null, '', '/')
  freshPinia()
  const { default: router, homeFor } = await import('@/router')
  const { useAuthStore } = await import('@/stores/auth')
  return { router, homeFor, auth: useAuthStore() }
}

async function go(router: Router, path: string) {
  await router.push(path).catch(() => {})
  return router.currentRoute.value
}

let api: ApiMock
beforeEach(() => {
  api = mockApi()
})

describe('homeFor', () => {
  it('sends employees to their queue and everybody else to ask', async () => {
    const { homeFor } = await loadApp()
    expect(homeFor('EMPLOYEE')).toEqual({ name: 'queue' })
    expect(homeFor('STUDENT')).toEqual({ name: 'ask' })
    expect(homeFor(null)).toEqual({ name: 'ask' })
  })
})

describe('signed out', () => {
  it.each(['/ask', '/book/slots', '/bookings', '/queue', '/availability', '/profile'])(
    'sends %s to the login, remembering where to go next',
    async (path) => {
      const { router } = await loadApp()
      const to = await go(router, path)
      expect(to.name).toBe('login')
      expect(to.query.next).toBe(path)
    },
  )

  it.each(['/', '/no-such-page'])('lands %s on the login', async (path) => {
    const { router } = await loadApp()
    expect((await go(router, path)).name).toBe('login')
  })

  it('opens the registration page', async () => {
    const { router } = await loadApp()
    expect((await go(router, '/register')).name).toBe('register')
    expect(api.requests).toHaveLength(0)
  })
})

describe('signed in as a student', () => {
  it('reloads the user from the saved token, once', async () => {
    const { router, auth } = await loadApp({ user: fx.studentUser() })

    await go(router, '/ask')
    await go(router, '/bookings')

    expect(auth.user).toEqual(fx.studentUser())
    expect(api.calls('GET', '/api/auth/me/')).toHaveLength(1)
    expect(api.last('GET', '/api/auth/me/')?.headers.Authorization).toBe(`Token ${fx.TOKEN}`)
  })

  it.each(['/ask', '/book/slots', '/book/confirm', '/bookings'])('opens %s', async (path) => {
    const { router } = await loadApp({ user: fx.studentUser() })
    expect((await go(router, path)).path).toBe(path)
  })

  it.each(['/queue', '/availability', '/profile'])(
    'turns %s, an employee page, into ask',
    async (path) => {
      const { router } = await loadApp({ user: fx.studentUser() })
      expect((await go(router, path)).name).toBe('ask')
    },
  )

  it.each(['/login', '/register'])('skips %s', async (path) => {
    const { router } = await loadApp({ user: fx.studentUser() })
    expect((await go(router, path)).name).toBe('ask')
  })
})

describe('signed in as an employee', () => {
  it.each(['/queue', '/availability', '/profile'])('opens %s', async (path) => {
    const { router } = await loadApp({ user: fx.employeeUser() })
    expect((await go(router, path)).path).toBe(path)
  })

  it.each(['/ask', '/book/slots', '/book/confirm', '/bookings'])(
    'turns %s, a student page, into the queue',
    async (path) => {
      const { router } = await loadApp({ user: fx.employeeUser() })
      expect((await go(router, path)).name).toBe('queue')
    },
  )

  it('skips the login', async () => {
    const { router } = await loadApp({ user: fx.employeeUser() })
    expect((await go(router, '/login')).name).toBe('queue')
  })
})

describe('signed in as an admin', () => {
  it('leaves the app for the Django admin', async () => {
    const assign = vi.fn<(url: string) => void>()
    vi.stubGlobal('location', { ...window.location, assign })
    const { router } = await loadApp({ user: fx.adminUser() })

    const to = await go(router, '/ask')

    expect(assign).toHaveBeenCalledWith('http://api.test/admin/')
    expect(to.path).toBe('/') // the navigation was cancelled
  })
})

describe('with a revoked token', () => {
  it('drops the token and asks to sign in again', async () => {
    localStorage.setItem('pronto.token', fx.TOKEN)
    api.on('GET', '/api/auth/me/', detailError(401, 'Invalid token.'))
    const { router, auth } = await loadApp()

    const to = await go(router, '/bookings')

    expect(to.name).toBe('login')
    expect(to.query.next).toBe('/bookings')
    expect(auth.isAuthenticated).toBe(false)
    expect(localStorage.getItem('pronto.token')).toBeNull()
  })
})
