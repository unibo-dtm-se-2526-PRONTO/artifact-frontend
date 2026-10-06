<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

import { ApiError } from '@/api/client'
import { askQuestion, resolveQuestion } from '@/api/endpoints'
import type { Inquiry, OfficeCode } from '@/api/types'
import { t } from '@/i18n'
import { useBookingStore } from '@/stores/booking'
import { useOfficesStore } from '@/stores/offices'

const offices = useOfficesStore()
const booking = useBookingStore()
const router = useRouter()

const question = ref('')
const inquiry = ref<Inquiry | null>(null)
const solved = ref(false)
const busy = ref(false)
const error = ref('')

onMounted(async () => {
  try {
    await offices.load()
  } catch {
    error.value = t('genericError')
  }
})

/**
 * US2a + US2b: la domanda è registrata e confrontata con le FAQ di tutti gli
 * uffici. Lo studente non sceglie l'ufficio: di solito non sa quale sia.
 */
async function ask() {
  if (!question.value.trim()) return
  error.value = ''
  busy.value = true
  solved.value = false
  try {
    inquiry.value = await askQuestion(question.value.trim())
  } catch (e) {
    error.value = e instanceof ApiError ? e.detail : t('genericError')
  } finally {
    busy.value = false
  }
}

/** US2c: la risposta basta, nessun appuntamento. */
async function markSolved() {
  if (!inquiry.value) return
  try {
    inquiry.value = await resolveQuestion(inquiry.value.id)
    solved.value = true
  } catch (e) {
    error.value = e instanceof ApiError ? e.detail : t('genericError')
  }
}

/**
 * US2d: si prenota con `code`, portando con sé la domanda e la FAQ proposta.
 * È l'ufficio della risposta trovata o, se non ce n'è una, quello che lo
 * studente sceglie dall'elenco.
 */
function bookWith(code: OfficeCode) {
  booking.start(code, question.value.trim(), inquiry.value)
  router.push({ name: 'slots' })
}

function reset() {
  inquiry.value = null
  solved.value = false
  question.value = ''
}

const officeNumber = (i: number) => String(i + 1).padStart(2, '0')
</script>

<template>
  <div class="screen" data-screen-label="Chiedi">
    <div>
      <div class="kicker">{{ t('homeK') }}</div>
      <h2 style="margin: 0 0 6px">{{ t('homeT') }}</h2>
      <p class="lead">{{ t('homeSub') }}</p>
    </div>

    <form class="searchbar" @submit.prevent="ask">
      <input
        v-model="question"
        class="input"
        :placeholder="t('search')"
        :aria-label="t('homeT')"
        maxlength="1000"
      />
      <button type="submit" class="btn btn-primary" :disabled="busy || !question.trim()">
        {{ t('ask') }}
      </button>
    </form>

    <div v-if="error" class="error" role="alert">{{ error }}</div>

    <section v-if="inquiry" class="result" aria-live="polite">
      <!-- Solo la risposta: la domanda della FAQ e il punteggio sono dettagli
           interni della ricerca, non servono allo studente. -->
      <template v-if="inquiry.match">
        <div class="answer">
          <div class="kicker" style="font-size: 10px; margin: 0 0 9px">
            {{ offices.nameOf(inquiry.match.office) }}
          </div>
          <div class="answer-a">{{ inquiry.match.faq.answer }}</div>
        </div>
        <p v-if="inquiry.office_reassigned" class="small" style="margin: 0">
          {{ t('reassigned', { office: offices.nameOf(inquiry.match.office) }) }}
        </p>

        <div v-if="solved" class="box box-accent">
          <div style="font-size: 13.5px; line-height: 1.5">{{ t('solvedNote') }}</div>
          <button type="button" class="btn btn-ghost" style="align-self: flex-start" @click="reset">
            {{ t('askAgain') }}
          </button>
        </div>
        <div
          v-else
          style="
            border-top: 2px solid var(--color-text);
            padding-top: 14px;
            display: flex;
            flex-direction: column;
            gap: 11px;
          "
        >
          <div class="heading" style="font-size: 17px">{{ t('satK') }}</div>
          <div class="row" style="gap: 10px">
            <button type="button" class="btn btn-secondary" @click="markSolved">
              {{ t('answerOk') }}
            </button>
            <button type="button" class="btn btn-primary" @click="bookWith(inquiry.match.office)">
              {{ t('answerNo') }}
            </button>
          </div>
        </div>
      </template>

      <template v-else>
        <div class="rule-head">
          <span class="label">{{ t('answerNoneK') }}</span>
        </div>
        <div class="box">
          <div style="font-size: 14px; line-height: 1.5">{{ t('noAnswer') }}</div>
        </div>
        <span class="label">{{ t('pickOfficeK') }}</span>
        <div class="office-grid">
          <button
            v-for="(o, i) in offices.offices"
            :key="o.code"
            type="button"
            class="office-cell"
            @click="bookWith(o.code)"
          >
            <span class="row" style="justify-content: space-between; width: 100%">
              <span class="office-n">{{ officeNumber(i) }}</span>
              <span style="font-size: 11px; color: var(--color-neutral-600)">
                {{ t('slotMinutes', { n: o.slot_duration_minutes }) }}
              </span>
            </span>
            <span class="office-name">{{ o.name }}</span>
            <span class="office-cta">{{ t('book') }} →</span>
          </button>
        </div>
      </template>
    </section>
  </div>
</template>
