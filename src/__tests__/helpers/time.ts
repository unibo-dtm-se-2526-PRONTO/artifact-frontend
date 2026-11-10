/** Freezing "now": only `Date` is faked. The suite runs in Europe/Rome. */
import { vi } from 'vitest'

/** Monday 5 October 2026, 10:00 in Cesena. */
export const MONDAY_MORNING = '2026-10-05T10:00:00+02:00'

export function freezeTime(iso: string = MONDAY_MORNING) {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date(iso))
}
