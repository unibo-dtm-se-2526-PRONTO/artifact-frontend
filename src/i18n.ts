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
  inSub: 'Con le credenziali che hai scelto in registrazione.',
  inCta: 'Accedi',
  noAccount: 'Non hai un account?',
  inNote:
    'Il dominio dell’email decide il ruolo: @studio.unibo.it entra come studente, @unibo.it come dipendente.',
  regTitle: 'Crea il tuo account',
  regSub:
    'L’indirizzo istituzionale verifica automaticamente il ruolo: @studio.unibo.it per gli studenti, @unibo.it per i dipendenti.',
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
  regDone: 'Account creato. Puoi accedere subito con la tua email e la tua password.',
  posterA: 'Meno telefonate.',
  posterB: 'Più risposte.',
  statOffices: 'uffici del Campus di Cesena',
  statFaq: 'domande nel database FAQ',
  statSlot: 'minuti per slot, configurabili per ufficio',

  // ask
  homeK: 'Chiedi',
  homeT: 'Qual è la tua domanda?',
  homeSub:
    'Scrivila come la diresti al telefono. Cerchiamo prima nell’archivio delle domande già ricevute; se non basta, prenoti un appuntamento con l’ufficio giusto.',
  officeK: 'Ufficio',
  search: 'Es. Non riesco a recuperare la password del SOL…',
  ask: 'Cerca',
  answerK: 'Risposta trovata',
  answerNoneK: 'Nessuna risposta in archivio',
  engine: 'ricerca testuale · PostgreSQL full-text',
  reassigned: 'La risposta è di un altro ufficio: {office}.',
  satK: 'Questa risposta ti soddisfa?',
  answerOk: 'Sì, risolto',
  answerNo: 'No, voglio un appuntamento',
  noAnswer:
    'Nessuna risposta in archivio è abbastanza pertinente. Serve un appuntamento con l’ufficio competente.',
  bookWith: 'Prenota con {office}',
  solvedNote:
    'Chiuso senza appuntamento. La domanda resta nell’archivio: contribuisce a migliorare le risposte future.',
  askAgain: 'Fai un’altra domanda',
  browseK: 'Oppure sfoglia gli uffici',
  browseShow: 'Mostra',
  browseHide: 'Nascondi',
  book: 'Prenota',
  slotMinutes: 'slot da {n} min',

  // slots
  slotsT: 'Scegli giorno e orario',
  routedNote: 'La domanda viene allegata alla richiesta: non devi riscriverla.',
  noSlotsDay: 'Nessuno slot libero in questo giorno.',
  free: 'libero',
  freeN: '{n} liberi',
  selK: 'Slot selezionato',
  noSlot: 'Nessuno slot',
  whoK: 'Assegnazione',
  whoNote:
    'La distribuzione equa assegna la richiesta al dipendente dell’ufficio con meno appuntamenti attivi.',
  next: 'Continua',

  // confirm
  qT: 'Rivedi e conferma',
  qSub: 'La domanda serve al dipendente per prepararsi.',
  qLabel: 'La tua domanda',
  qPh: 'Scrivi qui la tua domanda…',
  privacy: 'Il testo è visibile solo all’ufficio competente.',
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
  availNote:
    'Gli slot sono calcolati dai turni alla durata dell’ufficio. Un turno con appuntamenti prenotati non può essere rimosso.',
  closed: 'Chiuso',
  addShift: 'Aggiungi turno',
  remove: 'Rimuovi',
  weekday: 'Giorno',
  start: 'Inizio',
  end: 'Fine',
  save: 'Salva',
  genTotal: 'Totale: {n} slot a settimana',
  needOffice: 'Prima scegli il tuo ufficio nel profilo.',
  empT: 'Il mio profilo',
  empSub: 'L’ufficio si sceglie una volta sola: per cambiarlo serve un amministratore.',
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
  inSub: 'With the credentials you set at registration.',
  inCta: 'Sign in',
  noAccount: 'No account yet?',
  inNote:
    'The email domain decides the role: @studio.unibo.it signs in as a student, @unibo.it as staff.',
  regTitle: 'Create your account',
  regSub:
    'Your institutional address sets the role automatically: @studio.unibo.it for students, @unibo.it for staff.',
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
  regDone: 'Account created. You can sign in right away with your email and password.',
  posterA: 'Fewer calls.',
  posterB: 'More answers.',
  statOffices: 'Cesena Campus offices',
  statFaq: 'questions in the FAQ database',
  statSlot: 'minutes per slot, set per office',

  homeK: 'Ask',
  homeT: 'What is your question?',
  homeSub:
    'Write it as you would say it on the phone. We search the archive of questions already received first; if that is not enough, you book an appointment with the right office.',
  officeK: 'Office',
  search: 'E.g. I can’t recover my SOL password…',
  ask: 'Search',
  answerK: 'Answer found',
  answerNoneK: 'No archived answer',
  engine: 'text search · PostgreSQL full-text',
  reassigned: 'The answer belongs to another office: {office}.',
  satK: 'Does this answer satisfy you?',
  answerOk: 'Yes, solved',
  answerNo: 'No, I want an appointment',
  noAnswer:
    'No archived answer is relevant enough. This needs an appointment with the relevant office.',
  bookWith: 'Book with {office}',
  solvedNote:
    'Closed without an appointment. The question stays in the archive and helps improve future answers.',
  askAgain: 'Ask another question',
  browseK: 'Or browse the offices',
  browseShow: 'Show',
  browseHide: 'Hide',
  book: 'Book',
  slotMinutes: '{n}-min slots',

  slotsT: 'Pick a day and a time',
  routedNote: 'Your question is attached to the request: no need to retype it.',
  noSlotsDay: 'No free slots on this day.',
  free: 'free',
  freeN: '{n} free',
  selK: 'Selected slot',
  noSlot: 'No slot',
  whoK: 'Assignment',
  whoNote:
    'Fair distribution assigns the request to the office member with the fewest active appointments.',
  next: 'Continue',

  qT: 'Review and confirm',
  qSub: 'Your question lets the officer prepare.',
  qLabel: 'Your question',
  qPh: 'Type your question…',
  privacy: 'Only the relevant office can read this text.',
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
  availNote:
    'Slots are computed from shifts at the office’s slot length. A shift with booked appointments cannot be removed.',
  closed: 'Closed',
  addShift: 'Add shift',
  remove: 'Remove',
  weekday: 'Day',
  start: 'Start',
  end: 'End',
  save: 'Save',
  genTotal: 'Total: {n} slots per week',
  needOffice: 'Choose your office in your profile first.',
  empT: 'My profile',
  empSub: 'The office is chosen once: changing it needs an administrator.',
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
