/**
 * Runs first (vitest.config.ts → setupFiles), before any app module reads
 * storage at import time.
 *
 * Node 25 ships its own `localStorage`, which without `--localstorage-file` is
 * an empty object, and it shadows the jsdom one Vitest installs. Hand the
 * globals back to jsdom so tests see a real Web Storage on every Node version.
 */
import type { JSDOM } from 'jsdom'

const dom = (globalThis as { jsdom?: JSDOM }).jsdom

for (const name of ['localStorage', 'sessionStorage'] as const) {
  if (dom && typeof globalThis[name]?.clear !== 'function') {
    Object.defineProperty(globalThis, name, {
      value: dom.window[name],
      configurable: true,
      writable: true,
    })
  }
}
