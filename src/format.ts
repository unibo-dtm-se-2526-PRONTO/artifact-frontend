/** Formattazione di date, orari e punteggi, nella lingua dell'interfaccia. */
import { locale } from './i18n'

/** "2026-10-05": la data locale, nel formato che `?date=` del backend si aspetta. */
export function isoDate(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** I prossimi `count` giorni feriali, a partire da oggi incluso. */
export function nextWorkingDays(count: number, from = new Date()): Date[] {
  const days: Date[] = []
  const d = new Date(from.getFullYear(), from.getMonth(), from.getDate())
  while (days.length < count) {
    const wd = d.getDay()
    if (wd !== 0 && wd !== 6) days.push(new Date(d))
    d.setDate(d.getDate() + 1)
  }
  return days
}

export function time(iso: string): string {
  return new Date(iso).toLocaleTimeString(locale(), { hour: '2-digit', minute: '2-digit' })
}

export function shortDate(value: string | Date): string {
  return new Date(value).toLocaleDateString(locale(), { day: '2-digit', month: 'short' })
}

export function dayLabel(d: Date): string {
  return d.toLocaleDateString(locale(), { weekday: 'short', day: 'numeric' })
}

export function longSlot(iso: string): string {
  const d = new Date(iso)
  return `${d.toLocaleDateString(locale(), { weekday: 'short', day: 'numeric', month: 'short' })} · ${time(iso)}`
}

/** "09:00:00" → "09:00" */
export function hhmm(t: string): string {
  return t.slice(0, 5)
}

/**
 * Il punteggio di pertinenza del backend (rank full-text, normalizzato sulla
 * lunghezza della domanda) come percentuale da mostrare, tra 0 e 99.
 */
export function scorePct(score: number): number {
  return Math.max(0, Math.min(99, Math.round(score * 100)))
}

/** Minuti tra due orari "HH:MM[:SS]". */
export function minutesBetween(start: string, end: string): number {
  const toMin = (t: string) => {
    const [h = 0, m = 0] = t.split(':').map(Number)
    return h * 60 + m
  }
  return toMin(end) - toMin(start)
}
