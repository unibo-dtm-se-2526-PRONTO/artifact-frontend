/** Le forme delle risposte del backend, come le producono i serializer DRF. */

export type Role = 'STUDENT' | 'EMPLOYEE' | 'ADMIN'

export type OfficeCode = 'GUIDANCE' | 'ADMIN_OFFICE' | 'INTERNATIONAL' | 'INTERNSHIPS'

export type AppointmentStatus = 'BOOKED' | 'CANCELLED' | 'COMPLETED'

export interface User {
  id: number
  email: string
  role: Role
  first_name: string
  last_name: string
  matricola: string
  degree_programme: string
}

export interface RegisterPayload {
  email: string
  password: string
  first_name: string
  last_name: string
  matricola?: string
  degree_programme?: string
}

export interface Office {
  code: OfficeCode
  name: string
  contact_email: string
  slot_duration_minutes: number
}

export interface Availability {
  office: OfficeCode
  date: string
  /** Inizi degli slot liberi, ISO 8601 con fuso. */
  slots: string[]
}

export interface Appointment {
  id: number
  office: OfficeCode
  student: string
  employee: string
  slot: string
  status: AppointmentStatus
  question_text: string
  question_lang: 'it' | 'en'
  faq_id: number | null
  created_at: string
}

export interface SuggestedFaq {
  id: number
  question: string
  answer: string
}

export interface Inquiry {
  id: string
  /** L'ufficio della risposta trovata; `null` se non ce n'è una. */
  office: OfficeCode | null
  language: 'it' | 'en'
  match: { faq: SuggestedFaq; office: OfficeCode; score: number } | null
  office_reassigned: boolean
  resolved: boolean
}

export interface Shift {
  id: number
  weekday: number
  /** "HH:MM:SS" */
  start_time: string
  end_time: string
}
