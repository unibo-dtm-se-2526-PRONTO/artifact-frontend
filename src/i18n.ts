/**
 * Testi dell'interfaccia in italiano e inglese.
 *
 * Volutamente minimale invece di vue-i18n: due lingue, nessuna pluralizzazione
 * complessa. La lingua scelta viene anche passata al backend (`?lang=`), che
 * risponde con nomi degli uffici e FAQ nella stessa lingua.
 */
import { ref } from 'vue'

export type Lang = 'it' | 'en'

const STORAGE_KEY = 'pronto.lang'

function initialLang(): Lang {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'it' || saved === 'en') return saved
  } catch {
    // localStorage non disponibile (es. navigazione privata): si usa il default.
  }
  return 'it'
}

export const lang = ref<Lang>(initialLang())

export function setLang(value: Lang) {
  lang.value = value
  try {
    localStorage.setItem(STORAGE_KEY, value)
  } catch {
    // vedi initialLang
  }
}

const it = {
  // shell
  navAsk: 'Chiedi',
  navBookings: 'Prenotazioni',
  navQueue: 'Appuntamenti',
  navAvail: 'Disponibilità',
  navProfile: 'Profilo',
  signOut: 'Esci',
  roleStudent: 'Studente',
  roleEmployee: 'Dipendente',
  roleAdmin: 'Admin',
  back: 'Indietro',
  loading: 'Caricamento…',
  genericError: 'Qualcosa è andato storto. Riprova.',

  // auth
  sub: 'Sportello digitale · Campus di Cesena',
  inTitle: 'Accedi a PRONTO',
  inSub: 'Con le tue credenziali di ateneo.',
  inCta: 'Accedi',
  noAccount: 'Non hai un account?',
  regTitle: 'Crea il tuo account',
  fn: 'Nome',
  ln: 'Cognome',
  mat: 'Matricola',
  cdl: 'Corso di laurea',
  mail: 'Email istituzionale',
  pwd: 'Password',
  create: 'Crea account',
  signin: 'Ho già un account',
  idpNote:
    'Esemplificazione per il progetto: in produzione l’accesso passerebbe dall’IdP di Ateneo (Shibboleth/SAML).',
  regDone:
    'Account creato. Ti abbiamo inviato un’email con il link di verifica: aprilo, poi accedi.',
  posterA: 'Le tue risposte.',
  posterB: 'A portata di click.',
  statOffices: 'uffici del Campus di Cesena',
  statFaq: 'domande nel database FAQ',
  statSlot: 'minuti per slot, configurabili per ufficio',

  // ask
  homeK: 'Chiedi',
  homeT: 'Qual è la tua domanda?',
  search: 'Es. Non riesco a recuperare la password del SOL…',
  ask: 'Cerca',
  answerNoneK: 'Nessuna risposta in archivio',
  reassigned: 'La risposta è di un altro ufficio: {office}.',
  satK: 'Questa risposta ti soddisfa?',
  answerOk: 'Sì, risolto',
  answerNo: 'No, voglio un appuntamento',
  noAnswer:
    'Nessuna risposta in archivio è abbastanza pertinente. Serve un appuntamento con l’ufficio competente.',
  pickOfficeK: 'Scegli l’ufficio con cui prenotare',
  solvedNote:
    'Chiuso senza appuntamento. La domanda resta nell’archivio: contribuisce a migliorare le risposte future.',
  askAgain: 'Fai un’altra domanda',
  book: 'Prenota',
  slotMinutes: 'slot da {n} min',

  // slots
  slotsT: 'Scegli giorno e orario',
  noSlotsDay: 'Nessuno slot libero in questo giorno.',
  free: 'libero',
  freeN: '{n} liberi',
  selK: 'Slot selezionato',
  noSlot: 'Nessuno slot',
  next: 'Continua',

  // confirm
  qT: 'Rivedi e conferma',
  qLabel: 'La tua domanda',
  qPh: 'Scrivi qui la tua domanda…',
  shownFaq: 'Risposta già proposta',
  shownFaqNote: 'Il dipendente vedrà anche la FAQ che ti è stata proposta.',
  confirmBtn: 'Conferma prenotazione',
  cK: 'Fatto',
  cT: 'Prenotazione registrata',
  emailSent: 'Ti abbiamo inviato un’email di conferma.',
  toDash: 'Vai alle mie prenotazioni',
  office: 'Ufficio',
  when: 'Quando',
  assignedTo: 'Assegnato a',
  question: 'Domanda',

  // bookings
  dashT: 'Le mie prenotazioni',
  dashEmpty: 'Non hai ancora prenotazioni.',
  cancel: 'Annulla',
  cancelConfirm: 'Annullare l’appuntamento? Lo slot tornerà disponibile.',
  stBooked: 'Prenotato',
  stCancelled: 'Annullato',
  stCompleted: 'Completato',

  // employee
  queueT: 'Appuntamenti assegnati',
  queueEmpty: 'Nessun appuntamento assegnato.',
  thWhen: 'Quando',
  thStudent: 'Studente',
  thQ: 'Domanda',
  thStatus: 'Stato',
  complete: 'Completa',
  filterUpcoming: 'Prossimi',
  filterAll: 'Tutti',
  availT: 'Turni e disponibilità',
  closed: 'Chiuso',
  addShift: 'Aggiungi turno',
  remove: 'Rimuovi',
  weekday: 'Giorno',
  start: 'Inizio',
  end: 'Fine',
  save: 'Salva',
  needOffice: 'Prima scegli il tuo ufficio nel profilo.',
  empT: 'Il mio profilo',
  officeSet: 'Ufficio assegnato',
  setOffice: 'Salva ufficio',
  days: ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'],
}

type Messages = typeof it

const en: Messages = {
  navAsk: 'Ask',
  navBookings: 'Bookings',
  navQueue: 'Appointments',
  navAvail: 'Availability',
  navProfile: 'Profile',
  signOut: 'Sign out',
  roleStudent: 'Student',
  roleEmployee: 'Staff',
  roleAdmin: 'Admin',
  back: 'Back',
  loading: 'Loading…',
  genericError: 'Something went wrong. Please try again.',

  sub: 'Digital front desk · Cesena Campus',
  inTitle: 'Sign in to PRONTO',
  inSub: 'With your university credentials.',
  inCta: 'Sign in',
  noAccount: 'No account yet?',
  regTitle: 'Create your account',
  fn: 'First name',
  ln: 'Last name',
  mat: 'Student ID',
  cdl: 'Degree programme',
  mail: 'Institutional email',
  pwd: 'Password',
  create: 'Create account',
  signin: 'I already have an account',
  idpNote:
    'Project simplification: in production sign-in would go through the university IdP (Shibboleth/SAML).',
  regDone: 'Account created. We sent you an email with a verification link: open it, then sign in.',
  posterA: 'Your answers.',
  posterB: 'Just a click away.',
  statOffices: 'Cesena Campus offices',
  statFaq: 'questions in the FAQ database',
  statSlot: 'minutes per slot, set per office',

  homeK: 'Ask',
  homeT: 'What is your question?',
  search: 'E.g. I can’t recover my SOL password…',
  ask: 'Search',
  answerNoneK: 'No archived answer',
  reassigned: 'The answer belongs to another office: {office}.',
  satK: 'Does this answer satisfy you?',
  answerOk: 'Yes, solved',
  answerNo: 'No, I want an appointment',
  noAnswer:
    'No archived answer is relevant enough. This needs an appointment with the relevant office.',
  pickOfficeK: 'Choose the office to book with',
  solvedNote:
    'Closed without an appointment. The question stays in the archive and helps improve future answers.',
  askAgain: 'Ask another question',
  book: 'Book',
  slotMinutes: '{n}-min slots',

  slotsT: 'Pick a day and a time',
  noSlotsDay: 'No free slots on this day.',
  free: 'free',
  freeN: '{n} free',
  selK: 'Selected slot',
  noSlot: 'No slot',
  next: 'Continue',

  qT: 'Review and confirm',
  qLabel: 'Your question',
  qPh: 'Type your question…',
  shownFaq: 'Answer already suggested',
  shownFaqNote: 'The officer will also see the FAQ you were shown.',
  confirmBtn: 'Confirm booking',
  cK: 'Done',
  cT: 'Booking registered',
  emailSent: 'We sent you a confirmation email.',
  toDash: 'Go to my bookings',
  office: 'Office',
  when: 'When',
  assignedTo: 'Assigned to',
  question: 'Question',

  dashT: 'My bookings',
  dashEmpty: 'You have no bookings yet.',
  cancel: 'Cancel',
  cancelConfirm: 'Cancel this appointment? The slot will be released.',
  stBooked: 'Booked',
  stCancelled: 'Cancelled',
  stCompleted: 'Completed',

  queueT: 'Assigned appointments',
  queueEmpty: 'No appointments assigned.',
  thWhen: 'When',
  thStudent: 'Student',
  thQ: 'Question',
  thStatus: 'Status',
  complete: 'Complete',
  filterUpcoming: 'Upcoming',
  filterAll: 'All',
  availT: 'Shifts and availability',
  closed: 'Closed',
  addShift: 'Add shift',
  remove: 'Remove',
  weekday: 'Day',
  start: 'Start',
  end: 'End',
  save: 'Save',
  needOffice: 'Choose your office in your profile first.',
  empT: 'My profile',
  officeSet: 'Assigned office',
  setOffice: 'Save office',
  days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
}

const messages: Record<Lang, Messages> = { it, en }

type TextKey = { [K in keyof Messages]: Messages[K] extends string ? K : never }[keyof Messages]

/** Testo tradotto, con sostituzione dei segnaposto `{nome}`. */
export function t(key: TextKey, params: Record<string, string | number> = {}): string {
  return messages[lang.value][key].replace(/\{(\w+)\}/g, (_, name: string) =>
    String(params[name] ?? `{${name}}`),
  )
}

/** Nome del giorno della settimana, 0 = lunedì come in `date.weekday()` di Python. */
export function dayName(weekday: number): string {
  return messages[lang.value].days[weekday] ?? String(weekday)
}

/** Locale per Intl, derivato dalla lingua dell'interfaccia. */
export function locale(): string {
  return lang.value === 'it' ? 'it-IT' : 'en-GB'
}
