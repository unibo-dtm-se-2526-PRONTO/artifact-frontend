import { beforeEach, describe, expect, it } from 'vitest'

import ProfileView from '@/views/employee/ProfileView.vue'

import { alertText, button, field, pageText, submit, texts } from './helpers/dom'
import { detailError, mockApi, type ApiMock } from './helpers/fetch'
import * as fx from './helpers/fixtures'
import { mountWithPlugins } from './helpers/mount'

const PROFILE = '/api/employee-profile/'

let api: ApiMock
beforeEach(() => {
  api = mockApi()
  api.on('GET', '/api/offices/?lang=it', { body: fx.offices() })
  api.on('GET', PROFILE, detailError(404, 'No EmployeeProfile matches the given query.'))
})

const mountProfile = () =>
  mountWithPlugins(ProfileView, { user: fx.employeeUser(), route: '/profile' })

describe('ProfileView', () => {
  it('shows the employee’s data', async () => {
    const { wrapper } = await mountProfile()

    expect(texts(wrapper.get('.summary'))).toEqual([
      'Nome',
      'Giulia',
      'Cognome',
      'Bianchi',
      'Email',
      'giulia.bianchi@unibo.it',
    ])
  })

  it('lets an employee without an office choose one', async () => {
    api.on('POST', PROFILE, { status: 201, body: { office: 'INTERNATIONAL' } })
    const { wrapper } = await mountProfile()
    expect(alertText(wrapper)).toBeNull()
    expect(button(wrapper, 'Salva ufficio').attributes('disabled')).toBeDefined()

    const select = field<HTMLSelectElement>(wrapper, 'Ufficio')
    expect(select.findAll('option')).toHaveLength(4)
    await select.setValue('INTERNATIONAL')
    expect(button(wrapper, 'Salva ufficio').attributes('disabled')).toBeUndefined()
    await submit(wrapper)

    expect(api.last('POST', PROFILE)?.body).toEqual({ office: 'INTERNATIONAL' })
    expect(pageText(wrapper)).toContain('Ufficio assegnato')
    expect(pageText(wrapper)).toContain('Relazioni internazionali')
    expect(wrapper.find('form').exists()).toBe(false)
  })

  it('does not send anything until an office is chosen', async () => {
    const { wrapper } = await mountProfile()
    await submit(wrapper)
    expect(api.calls('POST', PROFILE)).toHaveLength(0)
  })

  it('shows the office already chosen, with no way to change it', async () => {
    api.on('GET', PROFILE, { body: { office: 'GUIDANCE' } })
    const { wrapper } = await mountProfile()

    expect(texts(wrapper.get('.summary')).slice(-2)).toEqual(['Ufficio assegnato', 'Orientamento'])
    expect(wrapper.find('form').exists()).toBe(false)
  })

  it('shows why the choice was refused', async () => {
    api.on(
      'POST',
      PROFILE,
      detailError(400, 'Your office is already set; ask an administrator to change it.'),
    )
    const { wrapper } = await mountProfile()

    await field(wrapper, 'Ufficio').setValue('GUIDANCE')
    await submit(wrapper)

    expect(alertText(wrapper)).toBe(
      'Your office is already set; ask an administrator to change it.',
    )
    expect(wrapper.find('form').exists()).toBe(true)
  })

  it('shows a generic message when the choice cannot be sent', async () => {
    api.on('POST', PROFILE, { networkError: true })
    const { wrapper } = await mountProfile()

    await field(wrapper, 'Ufficio').setValue('GUIDANCE')
    await submit(wrapper)

    expect(alertText(wrapper)).toBe('Qualcosa è andato storto. Riprova.')
  })

  it('says when the profile cannot be loaded', async () => {
    api.on('GET', PROFILE, { status: 500, text: 'Server Error' })
    const { wrapper } = await mountProfile()

    expect(alertText(wrapper)).toBe('Qualcosa è andato storto. Riprova.')
  })
})
