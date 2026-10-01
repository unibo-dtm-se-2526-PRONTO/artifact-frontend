import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ApiError, apiFetch, setToken } from '@/api/client'

function respond(status: number, body: unknown) {
  return vi.fn<typeof fetch>().mockResolvedValue(
    new Response(body === null ? null : JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    }),
  )
}

describe('apiFetch', () => {
  beforeEach(() => setToken(null))
  afterEach(() => vi.unstubAllGlobals())

  it('sends the DRF token once one is set', async () => {
    const fetchMock = respond(200, { ok: true })
    vi.stubGlobal('fetch', fetchMock)
    setToken('abc123')

    await apiFetch('/api/auth/me/')

    const init = fetchMock.mock.calls[0]![1] as RequestInit
    expect((init.headers as Record<string, string>).Authorization).toBe('Token abc123')
  })

  it('omits the header when signed out', async () => {
    const fetchMock = respond(200, [])
    vi.stubGlobal('fetch', fetchMock)

    await apiFetch('/api/faqs/')

    const init = fetchMock.mock.calls[0]![1] as RequestInit
    expect((init.headers as Record<string, string>).Authorization).toBeUndefined()
  })

  it('resolves to undefined on 204', async () => {
    vi.stubGlobal('fetch', respond(204, null))
    await expect(
      apiFetch('/api/appointments/1/cancel/', { method: 'POST' }),
    ).resolves.toBeUndefined()
  })

  it('exposes DRF field errors and detail on failure', async () => {
    vi.stubGlobal(
      'fetch',
      respond(400, { email: ['Registration is restricted to institutional email addresses.'] }),
    )

    const error = (await apiFetch('/api/auth/register/', { method: 'POST' }).catch(
      (e) => e,
    )) as ApiError

    expect(error).toBeInstanceOf(ApiError)
    expect(error.status).toBe(400)
    expect(error.fieldErrors).toEqual({
      email: 'Registration is restricted to institutional email addresses.',
    })
    expect(error.detail).toBe('Registration is restricted to institutional email addresses.')
  })
})
