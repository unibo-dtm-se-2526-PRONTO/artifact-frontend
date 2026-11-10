/**
 * Runs before every test file: `fetch` is mocked, and storage, token,
 * language and clock start clean.
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
  // Stop the watchers first, so the offices store does not reload.
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
