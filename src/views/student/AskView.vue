<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

import { ApiError } from '@/api/client'
import { askQuestion, resolveQuestion } from '@/api/endpoints'
import type { Inquiry, OfficeCode } from '@/api/types'
import { scorePct } from '@/format'
import { t } from '@/i18n'
import { useBookingStore } from '@/stores/booking'
import { useOfficesStore } from '@/stores/offices'

const offices = useOfficesStore()
const booking = useBookingStore()
const router = useRouter()

const office = ref<OfficeCode | ''>('')
const question = ref('')
const inquiry = ref<Inquiry | null>(null)
const solved = ref(false)
const showOffices = ref(false)
const busy = ref(false)
const error = ref('')

onMounted(async () => {
  try {
    await offices.load()
  } catch {
    error.value = t('genericError')
  }
})
watch(
  () => offices.offices,
  (list) => {
    if (!office.value && list[0]) office.value = list[0].code
  },
  { immediate: true },
)

/** US2a + US2b: la domanda è registrata e confrontata con le FAQ. */
async function ask() {
  if (!question.value.trim() || !office.value) return
  error.value = ''
  busy.value = true
  solved.value = false
  try {
    inquiry.value = await askQuestion(office.value, question.value.trim())
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
 * US2d: si prenota. Con l'ufficio della risposta trovata, se c'è (può essere
 * diverso da quello scelto: il backend lo segnala con `office_reassigned`),
 * altrimenti con l'ufficio scelto.
 */
function bookFromAnswer() {
  const asked = inquiry.value
  if (!asked) return
  booking.start(asked.match?.office ?? asked.office, question.value.trim(), asked)
  router.push({ name: 'slots' })
}

function bookOffice(code: OfficeCode) {
  booking.start(code)
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
      <select v-model="office" class="input" :aria-label="t('officeK')">
        <option v-for="o in offices.offices" :key="o.code" :value="o.code">{{ o.name }}</option>
      </select>
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
      <div class="rule-head">
        <span class="label">{{ inquiry.match ? t('answerK') : t('answerNoneK') }}</span>
        <span style="font-size: 11px; color: var(--color-neutral-600)">{{ t('engine') }}</span>
      </div>

      <template v-if="inquiry.match">
        <div class="answer">
          <div class="row" style="gap: 10px; margin-bottom: 9px; align-items: flex-start">
            <span class="pct" :class="{ 'pct-high': scorePct(inquiry.match.score) >= 70 }">
              {{ scorePct(inquiry.match.score) }}%
            </span>
            <span class="kicker" style="font-size: 10px; margin: 4px 0 0">
              {{ offices.nameOf(inquiry.match.office) }}
            </span>
          </div>
          <div class="answer-q">{{ inquiry.match.faq.question }}</div>
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
            <button type="button" class="btn btn-primary" @click="bookFromAnswer">
              {{ t('answerNo') }}
            </button>
          </div>
        </div>
      </template>

      <div v-else class="box">
        <div style="font-size: 14px; line-height: 1.5">{{ t('noAnswer') }}</div>
        <button
          type="button"
          class="btn btn-primary"
          style="align-self: flex-start"
          @click="bookFromAnswer"
        >
          {{ t('bookWith', { office: offices.nameOf(inquiry.office) }) }}
        </button>
      </div>
    </section>

    <hr class="hr" style="margin: 0" />
    <div class="row" style="justify-content: space-between; align-items: baseline">
      <span class="label">{{ t('browseK') }}</span>
      <button
        type="button"
        class="btn btn-ghost"
        style="padding: 0; font-size: 12.5px"
        :aria-expanded="showOffices"
        @click="showOffices = !showOffices"
      >
        {{ showOffices ? t('browseHide') : t('browseShow') }}
      </button>
    </div>
    <div v-if="showOffices" class="office-grid">
      <button
        v-for="(o, i) in offices.offices"
        :key="o.code"
        type="button"
        class="office-cell"
        @click="bookOffice(o.code)"
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
  </div>
</template>
