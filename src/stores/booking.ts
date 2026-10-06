import { ref } from 'vue'
import { defineStore } from 'pinia'

import type { Appointment, Inquiry, OfficeCode, SuggestedFaq } from '@/api/types'

/**
 * La prenotazione in corso, dalla domanda alla conferma (US2a–US2d).
 *
 * Vive in uno store e non nell'URL perché attraversa tre schermate (domanda,
 * slot, conferma) e porta con sé il testo della domanda e la FAQ già proposta,
 * che il dipendente riceve insieme all'appuntamento.
 */
export const useBookingStore = defineStore('booking', () => {
  const office = ref<OfficeCode | null>(null)
  const question = ref('')
  const inquiry = ref<Inquiry | null>(null)
  const slot = ref<string | null>(null)
  const booked = ref<Appointment | null>(null)

  /** La FAQ mostrata allo studente e da lui ritenuta insufficiente, se c'era. */
  function shownFaq(): SuggestedFaq | null {
    return inquiry.value?.match?.faq ?? null
  }

  /** Inizia una prenotazione verso `code`, con o senza una domanda già posta. */
  function start(code: OfficeCode, text = '', asked: Inquiry | null = null) {
    office.value = code
    question.value = text
    inquiry.value = asked
    slot.value = null
    booked.value = null
  }

  function reset() {
    office.value = null
    question.value = ''
    inquiry.value = null
    slot.value = null
    booked.value = null
  }

  return { office, question, inquiry, slot, booked, shownFaq, start, reset }
})
