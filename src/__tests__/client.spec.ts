import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { API_BASE_URL, ApiError, apiFetch, getToken, setToken } from '@/api/client'

import { mockApi, type ApiMock } from './helpers/fetch'

describe('apiFetch', () => {
  let api: ApiMock
  beforeEach(() => {
    setToken(null)
    api = mockApi()
  })

  it('resolves paths against VITE_API_URL', async () => {
    api.on('GET', '/api/offices/', { body: [] })

    await apiFetch('/api/offices/')
    await apiFetch('api/offices/')

    expect(API_BASE_URL).toBe('http://api.test')
    expect(api.fetch.mock.calls.map(([url]) => url)).toEqual([
      'http://api.test/api/offices/',
      'http://api.test/api/offices/',
    ])
  })

  it('sends the DRF token once one is set', async () => {
    api.on('GET', '/api/auth/me/', { body: { ok: true } })
    setToken('abc123')

    await apiFetch('/api/auth/me/')

    expect(api.last('GET', '/api/auth/me/')?.headers.Authorization).toBe('Token abc123')
  })

  it('omits the header when signed out', async () => {
    api.on('GET', '/api/faqs/', { body: [] })

    await apiFetch('/api/faqs/')

    expect(api.last('GET', '/api/faqs/')?.headers.Authorization).toBeUndefined()
  })

  it('sends JSON, keeping the method, the body and any extra header', async () => {
    api.on('POST', '/api/shifts/', { status: 201, body: { id: 1 } })

    const created = await apiFetch('/api/shifts/', {
      method: 'POST',
      body: JSON.stringify({ weekday: 0 }),
      headers: { 'X-Test': 'yes' },
    })

    const sent = api.last('POST', '/api/shifts/')!
    expect(created).toEqual({ id: 1 })
    expect(sent.body).toEqual({ weekday: 0 })
    expect(sent.headers).toMatchObject({ 'Content-Type': 'application/json', 'X-Test': 'yes' })
  })

  it('resolves to undefined on 204', async () => {
    api.on('POST', '/api/appointments/1/cancel/', { status: 204 })
    await expect(
      apiFetch('/api/appointments/1/cancel/', { method: 'POST' }),
    ).resolves.toBeUndefined()
  })

  it('exposes DRF field errors and detail on failure', async () => {
    api.on('POST', '/api/auth/register/', {
      status: 400,
      body: { email: ['Registration is restricted to institutional email addresses.'] },
    })

    const error = (await apiFetch('/api/auth/register/', { method: 'POST' }).catch(
      (e) => e,
    )) as ApiError

    expect(error).toBeInstanceOf(ApiError)
    expect(error.name).toBe('ApiError')
    expect(error.status).toBe(400)
    expect(error.fieldErrors).toEqual({
      email: 'Registration is restricted to institutional email addresses.',
    })
    expect(error.detail).toBe('Registration is restricted to institutional email addresses.')
  })

  it('reads the generic login failure from non_field_errors', async () => {
    api.on('POST', '/api/auth/login/', {
      status: 400,
      body: { non_field_errors: ['Invalid email or password.'] },
    })

    const error = (await apiFetch('/api/auth/login/', { method: 'POST' }).catch(
      (e) => e,
    )) as ApiError

    expect(error.detail).toBe('Invalid email or password.')
  })

  it('prefers detail and leaves it out of the field errors', async () => {
    api.on('DELETE', '/api/shifts/5/', {
      status: 400,
      body: {
        detail: 'This shift still covers booked appointments: cancel them first.',
        appointments: [41, 42],
      },
    })

    const error = (await apiFetch('/api/shifts/5/', { method: 'DELETE' }).catch(
      (e) => e,
    )) as ApiError

    expect(error.detail).toBe('This shift still covers booked appointments: cancel them first.')
    expect(error.fieldErrors).toEqual({ appointments: '41' })
  })

  it('accepts a field error given as a plain string', async () => {
    api.on('POST', '/api/appointments/', {
      status: 400,
      body: { slot: 'This slot is in the past.' },
    })

    const error = (await apiFetch('/api/appointments/', { method: 'POST' }).catch(
      (e) => e,
    )) as ApiError

    expect(error.fieldErrors).toEqual({ slot: 'This slot is in the past.' })
  })

  it('falls back to its own message when the error body is not JSON', async () => {
    api.on('GET', '/api/offices/', { status: 502, text: '<html>Bad Gateway</html>' })

    const error = (await apiFetch('/api/offices/').catch((e) => e)) as ApiError

    expect(error).toBeInstanceOf(ApiError)
    expect(error.status).toBe(502)
    expect(error.body).toBeNull()
    expect(error.fieldErrors).toEqual({})
    expect(error.detail).toBe('GET /api/offices/ ha risposto 502')
  })

  it('falls back to its own message when the error body is empty', async () => {
    api.on('POST', '/api/auth/logout/', { status: 401, body: {} })

    const error = (await apiFetch('/api/auth/logout/', { method: 'POST' }).catch(
      (e) => e,
    )) as ApiError

    expect(error.detail).toBe('POST /api/auth/logout/ ha risposto 401')
  })

  it('lets a network failure through as it is, not as an ApiError', async () => {
    api.on('GET', '/api/offices/', { networkError: true })

    const error = await apiFetch('/api/offices/').catch((e) => e)

    expect(error).toBeInstanceOf(TypeError)
    expect(error).not.toBeInstanceOf(ApiError)
  })
})

describe('the session token', () => {
  afterEach(() => setToken(null))

  it('is kept in localStorage across reloads', () => {
    setToken('abc123')
    expect(getToken()).toBe('abc123')
    expect(localStorage.getItem('pronto.token')).toBe('abc123')

    setToken(null)
    expect(getToken()).toBeNull()
    expect(localStorage.getItem('pronto.token')).toBeNull()
  })

  it('lives in memory when localStorage refuses it', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('QuotaExceededError')
    })

    setToken('abc123')

    expect(getToken()).toBe('abc123')
  })
})

describe('the client module', () => {
  // Each test imports a fresh copy, to observe what it does at load time.
  afterEach(() => vi.resetModules())

  async function load() {
    vi.resetModules()
    return import('@/api/client')
  }

  it('reads back the token saved by a previous visit', async () => {
    localStorage.setItem('pronto.token', 'saved')
    expect((await load()).getToken()).toBe('saved')
  })

  it('starts signed out when localStorage is unavailable', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('SecurityError')
    })
    expect((await load()).getToken()).toBeNull()
  })

  it('drops trailing slashes from VITE_API_URL', async () => {
    vi.stubEnv('VITE_API_URL', 'http://api.test///')
    expect((await load()).API_BASE_URL).toBe('http://api.test')
  })

  it('refuses to start without VITE_API_URL', async () => {
    vi.stubEnv('VITE_API_URL', '')
    await expect(load()).rejects.toThrow('VITE_API_URL non è definita')
  })
})
