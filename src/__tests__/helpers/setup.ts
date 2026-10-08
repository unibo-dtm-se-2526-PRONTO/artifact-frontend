/**
 * Runs before every test file (vitest.config.ts → setupFiles).
 *
 * - no test can reach the network: `fetch` is always the mock of ./fetch.ts, and
 *   a request the test did not mock fails it, even if the app caught the error
 * - storage, the session token, the language and the clock start clean
 */
import { enableAutoUnmount } from '@vue/test-utils'
import { getActivePinia } from 'pinia'
import { afterEach, beforeEach, vi } from 'vitest'

import { setToken } from '@/api/client'
import { lang } from '@/i18n'

import { mockApi, takeUnhandledRequests } from './fetch'

enableAutoUnmount(afterEach)

beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
  // An empty mock: until a test sets up its own, every request is unhandled.
  mockApi()
})

afterEach(() => {
  // Stop the stores' watchers before resetting the language, so the offices
  // store does not reload in the background once the mocks are gone.
  const pinia = getActivePinia() as { _s?: Map<string, { $dispose(): void }> } | undefined
  pinia?._s?.forEach((store) => store.$dispose())

  lang.value = 'it'
  setToken(null)
  localStorage.clear()
  sessionStorage.clear()
  vi.useRealTimers()
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
  vi.restoreAllMocks()

  const unhandled = takeUnhandledRequests()
  if (unhandled.length) {
    const list = unhandled.map((r) => `${r.method} ${r.url}`).join(', ')
    throw new Error(`The test sent requests it did not mock: ${list}`)
  }
})
