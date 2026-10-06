import { afterEach, describe, expect, it, vi } from 'vitest'

import { dayName, lang, locale, setLang, t } from '@/i18n'

describe('i18n', () => {
  afterEach(() => setLang('it'))

  it('fills placeholders', () => {
    setLang('it')
    expect(t('bookWith', { office: 'Tirocini' })).toBe('Prenota con Tirocini')
  })

  it('switches language', () => {
    setLang('en')
    expect(t('signOut')).toBe('Sign out')
    expect(dayName(0)).toBe('Monday')
  })

  it('remembers the choice for the next visit', () => {
    setLang('en')
    expect(lang.value).toBe('en')
    expect(localStorage.getItem('pronto.lang')).toBe('en')
  })

  it('leaves a placeholder visible when its value is missing', () => {
    expect(t('freeN')).toBe('{n} liberi')
    expect(t('freeN', { n: 0 })).toBe('0 liberi')
  })

  it('names weekdays from Monday, as Python does, and copes with an unknown one', () => {
    expect(dayName(0)).toBe('Lunedì')
    expect(dayName(6)).toBe('Domenica')
    expect(dayName(7)).toBe('7')
  })

  it('maps the language to an Intl locale', () => {
    expect(locale()).toBe('it-IT')
    setLang('en')
    expect(locale()).toBe('en-GB')
  })

  it('still switches when localStorage refuses to save', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('QuotaExceededError')
    })
    setLang('en')
    expect(t('signOut')).toBe('Sign out')
  })
})

describe('the starting language', () => {
  afterEach(() => vi.resetModules())

  async function load() {
    vi.resetModules()
    return import('@/i18n')
  }

  it('is Italian on a first visit', async () => {
    expect((await load()).lang.value).toBe('it')
  })

  it('is the one saved by a previous visit', async () => {
    localStorage.setItem('pronto.lang', 'en')
    expect((await load()).lang.value).toBe('en')
  })

  it('ignores a saved value it does not know', async () => {
    localStorage.setItem('pronto.lang', 'fr')
    expect((await load()).lang.value).toBe('it')
  })

  it('is Italian when localStorage is unavailable', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('SecurityError')
    })
    expect((await load()).lang.value).toBe('it')
  })
})
