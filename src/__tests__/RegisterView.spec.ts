import { beforeEach, describe, expect, it } from 'vitest'

import RegisterView from '@/views/auth/RegisterView.vue'

import { alertText, button, field, fill, link, pageText, submit } from './helpers/dom'
import { detailError, fieldError, mockApi, type ApiMock } from './helpers/fetch'
import * as fx from './helpers/fixtures'
import { mountWithPlugins } from './helpers/mount'

let api: ApiMock
beforeEach(() => {
  api = mockApi().on('GET', '/api/faqs/?lang=it', { body: [] })
})

const mountRegister = () => mountWithPlugins(RegisterView, { route: '/register' })

type Wrapper = Awaited<ReturnType<typeof mountRegister>>['wrapper']

async function fillStudent(wrapper: Wrapper) {
  await fill(wrapper, 'Nome', ' Mario ')
  await fill(wrapper, 'Cognome', 'Rossi ')
  await fill(wrapper, 'Email istituzionale', 'mario.rossi@studio.unibo.it')
  await fill(wrapper, 'Matricola', ' 0001012345')
  await fill(wrapper, 'Corso di laurea', 'Ingegneria e scienze informatiche')
  await fill(wrapper, 'Password', 'una-password-lunga')
}

/** The message shown under the field labelled `label`, if any. */
function errorUnder(wrapper: Wrapper, label: string): string | null {
  const error = field(wrapper, label).element.parentElement?.querySelector('.field-error')
  return error?.textContent?.trim() ?? null
}

describe('RegisterView', () => {
  it('asks only for the common fields until the email says student', async () => {
    const { wrapper } = await mountRegister()

    expect(pageText(wrapper)).toContain('Crea il tuo account')
    expect(() => field(wrapper, 'Matricola')).toThrow('No field labelled "Matricola"')
    expect(link(wrapper, 'Ho già un account').attributes('href')).toBe('/login')

    await fill(wrapper, 'Email istituzionale', 'Mario.Rossi@STUDIO.unibo.it ')
    expect(field(wrapper, 'Matricola').exists()).toBe(true)
    expect(field(wrapper, 'Corso di laurea').exists()).toBe(true)
  })

  it('registers a student, trimming the fields, then sends them to sign in', async () => {
    api.on('POST', '/api/auth/register/', { status: 201, body: fx.studentUser() })
    const { wrapper, router } = await mountRegister()

    await fillStudent(wrapper)
    await submit(wrapper)

    expect(api.last('POST', '/api/auth/register/')?.body).toEqual({
      first_name: 'Mario',
      last_name: 'Rossi',
      email: 'mario.rossi@studio.unibo.it',
      password: 'una-password-lunga',
      matricola: '0001012345',
      degree_programme: 'Ingegneria e scienze informatiche',
    })
    expect(router.currentRoute.value.fullPath).toBe('/login?registered=1')
  })

  it('registers an employee without any student data', async () => {
    api.on('POST', '/api/auth/register/', { status: 201, body: fx.employeeUser() })
    const { wrapper } = await mountRegister()

    // Typed as a student first, then corrected to a staff address.
    await fillStudent(wrapper)
    await fill(wrapper, 'Email istituzionale', 'giulia.bianchi@unibo.it')
    await submit(wrapper)

    expect(api.last('POST', '/api/auth/register/')?.body).toEqual({
      first_name: 'Mario',
      last_name: 'Rossi',
      email: 'giulia.bianchi@unibo.it',
      password: 'una-password-lunga',
    })
  })

  it('shows each validation error under its field', async () => {
    api.on('POST', '/api/auth/register/', {
      status: 400,
      body: {
        matricola: ['A matricola is a number of 6 to 10 digits.'],
        password: ['This password is too common.', 'This password is entirely numeric.'],
      },
    })
    const { wrapper, router } = await mountRegister()

    await fillStudent(wrapper)
    await submit(wrapper)

    expect(errorUnder(wrapper, 'Matricola')).toBe('A matricola is a number of 6 to 10 digits.')
    expect(errorUnder(wrapper, 'Password')).toBe('This password is too common.')
    expect(errorUnder(wrapper, 'Nome')).toBeNull()
    expect(alertText(wrapper)).toBeNull()
    expect(router.currentRoute.value.name).toBe('register')
  })

  it('shows a refused email domain under the email', async () => {
    api.on(
      'POST',
      '/api/auth/register/',
      fieldError('email', 'Registration is restricted to institutional email addresses.'),
    )
    const { wrapper } = await mountRegister()

    await fill(wrapper, 'Email istituzionale', 'mario@gmail.com')
    await submit(wrapper)

    expect(errorUnder(wrapper, 'Email istituzionale')).toBe(
      'Registration is restricted to institutional email addresses.',
    )
  })

  it('clears old field errors on the next attempt', async () => {
    api.on('POST', '/api/auth/register/', fieldError('last_name', 'This field is required.'))
    api.once('POST', '/api/auth/register/', fieldError('first_name', 'This field is required.'))
    const { wrapper } = await mountRegister()

    await submit(wrapper)
    expect(errorUnder(wrapper, 'Nome')).toBe('This field is required.')

    await submit(wrapper)
    expect(errorUnder(wrapper, 'Nome')).toBeNull()
    expect(errorUnder(wrapper, 'Cognome')).toBe('This field is required.')
  })

  it('shows a non-field error as an alert', async () => {
    api.on('POST', '/api/auth/register/', detailError(429, 'Request was throttled.'))
    const { wrapper } = await mountRegister()

    await fillStudent(wrapper)
    await submit(wrapper)

    expect(alertText(wrapper)).toBe('Request was throttled.')
  })

  it('shows a generic message when the backend cannot be reached', async () => {
    api.on('POST', '/api/auth/register/', { networkError: true })
    const { wrapper } = await mountRegister()

    await fillStudent(wrapper)
    await submit(wrapper)

    expect(alertText(wrapper)).toBe('Qualcosa è andato storto. Riprova.')
    expect(button(wrapper, 'Crea account').attributes('disabled')).toBeUndefined()
  })

  // Doubtful behaviour: an error keyed by a field the form does not render
  // (DRF's non_field_errors, or a student field after switching to a staff
  // address) is stored as a field error, so the alert stays empty and the user
  // sees nothing at all. See RegisterView.vue, submit().
  it.fails('tells the user about an error on a field the form does not show', async () => {
    api.on('POST', '/api/auth/register/', {
      status: 400,
      body: { non_field_errors: ['Unable to register right now.'] },
    })
    const { wrapper } = await mountRegister()

    await fillStudent(wrapper)
    await submit(wrapper)

    expect(pageText(wrapper)).toContain('Unable to register right now.')
  })
})
