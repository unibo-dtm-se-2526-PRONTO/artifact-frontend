/**
 * Runs first. Node 25's own `localStorage` shadows jsdom's: give it back to
 * jsdom so every Node version sees a real Web Storage.
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
