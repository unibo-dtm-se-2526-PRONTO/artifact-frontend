/**
 * Backend payloads, shaped by `src/api/types.ts` and filled with the values the
 * backend README documents. Each builder takes overrides for the one field a
 * test cares about.
 */
import type {
  Appointment,
  Availability,
  Inquiry,
  Office,
  OfficeCode,
  Shift,
  SuggestedFaq,
  User,
} from '@/api/types'

export const TOKEN = '9944b09199c62bcf9418ad846dd0e4bbdfc6ee4b'

export const studentUser = (over: Partial<User> = {}): User => ({
  id: 7,
  email: 'mario.rossi@studio.unibo.it',
  role: 'STUDENT',
  first_name: 'Mario',
  last_name: 'Rossi',
  matricola: '0001012345',
  degree_programme: 'Ingegneria e scienze informatiche',
  ...over,
})

export const employeeUser = (over: Partial<User> = {}): User => ({
  id: 12,
  email: 'giulia.bianchi@unibo.it',
  role: 'EMPLOYEE',
  first_name: 'Giulia',
  last_name: 'Bianchi',
  matricola: '',
  degree_programme: '',
  ...over,
})

export const adminUser = (over: Partial<User> = {}): User => ({
  id: 1,
  email: 'admin@unibo.it',
  role: 'ADMIN',
  first_name: 'Ada',
  last_name: 'Admin',
  matricola: '',
  degree_programme: '',
  ...over,
})

const OFFICE_NAMES: Record<OfficeCode, { it: string; en: string; email: string }> = {
  GUIDANCE: { it: 'Orientamento', en: 'Guidance', email: 'orientamento@unibo.it' },
  ADMIN_OFFICE: {
    it: 'Segreteria studenti',
    en: 'Student administration',
    email: 'segreteria@unibo.it',
  },
  INTERNATIONAL: {
    it: 'Relazioni internazionali',
    en: 'International relations',
    email: 'international@unibo.it',
  },
  INTERNSHIPS: { it: 'Tirocini', en: 'Internships', email: 'tirocini@unibo.it' },
}

export const office = (code: OfficeCode, over: Partial<Office> = {}, lang: 'it' | 'en' = 'it') => ({
  code,
  name: OFFICE_NAMES[code][lang],
  contact_email: OFFICE_NAMES[code].email,
  slot_duration_minutes: 30,
  ...over,
})

/** The four offices `seed_offices` creates, in the language asked. */
export const offices = (lang: 'it' | 'en' = 'it'): Office[] =>
  (Object.keys(OFFICE_NAMES) as OfficeCode[]).map((code) => office(code, {}, lang))

export const faq = (over: Partial<SuggestedFaq> = {}): SuggestedFaq => ({
  id: 3,
  question: 'Come attivo un tirocinio?',
  answer: 'Compila il progetto formativo su AlmaLaurea e attendi l’approvazione del tutor.',
  ...over,
})

/** `POST /api/questions/` with a match; pass `{ match: null }` for none. */
export const inquiry = (over: Partial<Inquiry> = {}): Inquiry => ({
  id: '5b0e6a0e-3f0c-4d7e-9d3a-0c5e8f1b2a47',
  office: 'INTERNSHIPS',
  language: 'it',
  match: { faq: faq(), office: 'INTERNSHIPS', score: 0.61 },
  office_reassigned: false,
  resolved: false,
  ...over,
})

export const availability = (
  date: string,
  slots: string[] = [],
  code: OfficeCode = 'INTERNSHIPS',
): Availability => ({
  office: code,
  date,
  slots,
})

export const appointment = (over: Partial<Appointment> = {}): Appointment => ({
  id: 41,
  office: 'INTERNSHIPS',
  student: 'Mario Rossi',
  employee: 'Giulia Bianchi',
  slot: '2026-10-07T09:00:00+02:00',
  status: 'BOOKED',
  question_text: 'Come attivo un tirocinio curriculare?',
  question_lang: 'it',
  faq_id: null,
  created_at: '2026-10-05T08:12:00+02:00',
  ...over,
})

export const shift = (over: Partial<Shift> = {}): Shift => ({
  id: 5,
  weekday: 0,
  start_time: '09:00:00',
  end_time: '12:00:00',
  ...over,
})
