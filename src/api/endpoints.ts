/** Una funzione per endpoint del backend: le viste non costruiscono URL a mano. */
import { lang } from '@/i18n'

import { apiFetch } from './client'
import type {
  Appointment,
  Availability,
  Inquiry,
  Office,
  OfficeCode,
  RegisterPayload,
  Shift,
  User,
} from './types'

const json = (body: unknown): RequestInit => ({ method: 'POST', body: JSON.stringify(body) })

// — accounts —
export const register = (payload: RegisterPayload) =>
  apiFetch<User>('/api/auth/register/', json(payload))
export const login = (email: string, password: string) =>
  apiFetch<{ token: string }>('/api/auth/login/', json({ email, password }))
export const logout = () => apiFetch<void>('/api/auth/logout/', { method: 'POST' })
export const me = () => apiFetch<User>('/api/auth/me/')

// — offices and booking —
export const listOffices = () => apiFetch<Office[]>(`/api/offices/?lang=${lang.value}`)
export const availability = (code: OfficeCode, date: string) =>
  apiFetch<Availability>(`/api/offices/${code}/availability/?date=${date}`)

export const listAppointments = () => apiFetch<Appointment[]>('/api/appointments/')
export const bookAppointment = (payload: {
  office: OfficeCode
  slot: string
  question_text: string
  question_lang: 'it' | 'en'
  faq_id?: number | null
}) => apiFetch<Appointment>('/api/appointments/', json(payload))
export const cancelAppointment = (id: number) =>
  apiFetch<void>(`/api/appointments/${id}/cancel/`, { method: 'POST' })
export const completeAppointment = (id: number) =>
  apiFetch<void>(`/api/appointments/${id}/complete/`, { method: 'POST' })

// — employee —
export const getEmployeeProfile = () => apiFetch<{ office: OfficeCode }>('/api/employee-profile/')
export const setEmployeeProfile = (office: OfficeCode) =>
  apiFetch<{ office: OfficeCode }>('/api/employee-profile/', json({ office }))
export const listShifts = () => apiFetch<Shift[]>('/api/shifts/')
export const addShift = (shift: Omit<Shift, 'id'>) => apiFetch<Shift>('/api/shifts/', json(shift))
export const removeShift = (id: number) =>
  apiFetch<void>(`/api/shifts/${id}/`, { method: 'DELETE' })

// — FAQ —
export const askQuestion = (question: string) =>
  apiFetch<Inquiry>(`/api/questions/?lang=${lang.value}`, json({ question }))
export const resolveQuestion = (id: string) =>
  apiFetch<Inquiry>(`/api/questions/${id}/resolve/`, { method: 'POST' })
export const countFaqs = () =>
  apiFetch<unknown[]>(`/api/faqs/?lang=${lang.value}`).then((faqs) => faqs.length)
