import { afterEach, describe, expect, it } from 'vitest'

import { dayName, setLang, t } from '@/i18n'

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
})
