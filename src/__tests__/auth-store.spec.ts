import { beforeEach, describe, expect, it } from 'vitest'

import { ApiError, getToken, setToken } from '@/api/client'
import { useAuthStore } from '@/stores/auth'

import { detailError, mockApi, type ApiMock } from './helpers/fetch'
import * as fx from './helpers/fixtures'
import { freshPinia } from './helpers/mount'

const EMAIL = 'mario.rossi@studio.unibo.it'

describe('auth store', () => {
  let api: ApiMock
  beforeEach(() => {
    api = mockApi()
    freshPinia()
  })

  it('starts signed out', () => {
    const auth = useAuthStore()
    expect(auth.isAuthenticated).toBe(false)
    expect(auth.user).toBeNull()
    expect(auth.role).toBeNull()
    expect(auth.initials).toBe('')
  })

  it('picks up a token saved by a previous visit', () => {
    setToken(fx.TOKEN)
    const auth = useAuthStore()
    expect(auth.isAuthenticated).toBe(true)
    expect(auth.user).toBeNull()
  })

  describe('login', () => {
    it('stores the token, then loads the user with it', async () => {
      api.on('POST', '/api/auth/login/', { body: { token: fx.TOKEN } })
      api.on('GET', '/api/auth/me/', { body: fx.studentUser() })
      const auth = useAuthStore()

      await auth.login(EMAIL, 'pw')

      expect(api.last('POST', '/api/auth/login/')?.body).toEqual({ email: EMAIL, password: 'pw' })
      expect(api.last('GET', '/api/auth/me/')?.headers.Authorization).toBe(`Token ${fx.TOKEN}`)
      expect(localStorage.getItem('pronto.token')).toBe(fx.TOKEN)
      expect(auth.isAuthenticated).toBe(true)
      expect(auth.user).toEqual(fx.studentUser())
      expect(auth.role).toBe('STUDENT')
      expect(auth.initials).toBe('MR')
    })

    it('rejects wrong credentials and stays signed out', async () => {
      api.on('POST', '/api/auth/login/', {
        status: 400,
        body: { non_field_errors: ['Invalid email or password.'] },
      })
      const auth = useAuthStore()

      const error = await auth.login(EMAIL, 'wrong').catch((e) => e)

      expect(error).toBeInstanceOf(ApiError)
      expect((error as ApiError).detail).toBe('Invalid email or password.')
      expect(api.calls('GET', '/api/auth/me/')).toHaveLength(0)
      expect(auth.isAuthenticated).toBe(false)
      expect(getToken()).toBeNull()
    })

    it('forgets a token the backend will not accept on /me/', async () => {
      api.on('POST', '/api/auth/login/', { body: { token: fx.TOKEN } })
      api.on('GET', '/api/auth/me/', detailError(401, 'Invalid token.'))
      const auth = useAuthStore()

      await auth.login(EMAIL, 'pw')

      expect(auth.isAuthenticated).toBe(false)
      expect(auth.user).toBeNull()
      expect(localStorage.getItem('pronto.token')).toBeNull()
    })
  })

  describe('fetchMe', () => {
    it('does nothing without a token', async () => {
      await useAuthStore().fetchMe()
      expect(api.requests).toHaveLength(0)
    })

    it('reloads the user behind a saved token', async () => {
      setToken(fx.TOKEN)
      api.on('GET', '/api/auth/me/', { body: fx.employeeUser() })
      const auth = useAuthStore()

      await auth.fetchMe()

      expect(auth.role).toBe('EMPLOYEE')
      expect(auth.initials).toBe('GB')
    })

    it('signs out when the saved token was revoked', async () => {
      setToken(fx.TOKEN)
      api.on('GET', '/api/auth/me/', detailError(401, 'Invalid token.'))
      const auth = useAuthStore()

      await auth.fetchMe()

      expect(auth.isAuthenticated).toBe(false)
      expect(getToken()).toBeNull()
    })

    it('also signs out when the network is down', async () => {
      // Any failure, not only a 401, drops the token: see the report.
      setToken(fx.TOKEN)
      api.on('GET', '/api/auth/me/', { networkError: true })
      const auth = useAuthStore()

      await auth.fetchMe()

      expect(auth.isAuthenticated).toBe(false)
    })
  })

  describe('logout', () => {
    beforeEach(() => {
      api.on('POST', '/api/auth/login/', { body: { token: fx.TOKEN } })
      api.on('GET', '/api/auth/me/', { body: fx.studentUser() })
    })

    it('revokes the token on the backend and clears the session', async () => {
      api.on('POST', '/api/auth/logout/', { status: 204 })
      const auth = useAuthStore()
      await auth.login(EMAIL, 'pw')

      await auth.logout()

      expect(api.last('POST', '/api/auth/logout/')?.headers.Authorization).toBe(`Token ${fx.TOKEN}`)
      expect(auth.isAuthenticated).toBe(false)
      expect(auth.user).toBeNull()
      expect(auth.initials).toBe('')
      expect(localStorage.getItem('pronto.token')).toBeNull()
    })

    it('clears the session even when the backend fails, then reports the failure', async () => {
      api.on('POST', '/api/auth/logout/', { networkError: true })
      const auth = useAuthStore()
      await auth.login(EMAIL, 'pw')

      await expect(auth.logout()).rejects.toThrow(TypeError)

      expect(auth.isAuthenticated).toBe(false)
      expect(getToken()).toBeNull()
    })
  })

  it('builds initials from whatever names there are', () => {
    const auth = useAuthStore()
    auth.user = fx.studentUser({ first_name: 'élodie', last_name: '' })
    expect(auth.initials).toBe('É')
  })
})
