<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

import { ApiError } from '@/api/client'
import { bookAppointment } from '@/api/endpoints'
import { longSlot } from '@/format'
import { lang, t } from '@/i18n'
import { useBookingStore } from '@/stores/booking'
import { useOfficesStore } from '@/stores/offices'

const booking = useBookingStore()
const offices = useOfficesStore()
const router = useRouter()

const busy = ref(false)
const error = ref('')
const faq = computed(() => booking.shownFaq())

onMounted(() => {
  if (booking.booked) return
  if (!booking.office) router.replace({ name: 'ask' })
  else if (!booking.slot) router.replace({ name: 'slots' })
  offices.load().catch(() => {})
})

async function confirm() {
  if (!booking.office || !booking.slot || !booking.question.trim()) return
  error.value = ''
  busy.value = true
  try {
    booking.booked = await bookAppointment({
      office: booking.office,
      slot: booking.slot,
      question_text: booking.question.trim(),
      // La lingua in cui la domanda è stata posta, se è passata dalle FAQ.
      question_lang: booking.inquiry?.language ?? lang.value,
      faq_id: faq.value?.id ?? null,
    })
  } catch (e) {
    // Il caso tipico è lo slot preso da qualcun altro nel frattempo (US2e):
    // il backend lo riporta sul campo `slot`.
    error.value = e instanceof ApiError ? e.detail : t('genericError')
  } finally {
    busy.value = false
  }
}

function toBookings() {
  booking.reset()
  router.push({ name: 'bookings' })
}
</script>

<template>
  <div v-if="booking.booked" class="screen screen-narrow" data-screen-label="Conferma prenotazione">
    <div>
      <div class="kicker">{{ t('cK') }}</div>
      <h3 style="margin: 0">{{ t('cT') }}</h3>
    </div>
    <div class="summary">
      <div class="summary-row">
        <span>{{ t('office') }}</span
        ><span>{{ offices.nameOf(booking.booked.office) }}</span>
      </div>
      <div class="summary-row">
        <span>{{ t('when') }}</span
        ><span>{{ longSlot(booking.booked.slot) }}</span>
      </div>
      <div class="summary-row">
        <span>{{ t('assignedTo') }}</span
        ><span>{{ booking.booked.employee }}</span>
      </div>
      <div class="summary-row">
        <span>{{ t('question') }}</span
        ><span>{{ booking.booked.question_text }}</span>
      </div>
    </div>
    <div class="box box-accent" style="font-size: 13.5px">{{ t('emailSent') }}</div>
    <div class="row">
      <button type="button" class="btn btn-secondary" @click="toBookings">{{ t('toDash') }}</button>
    </div>
  </div>

  <div v-else-if="booking.slot" class="screen" data-screen-label="Domanda e conferma">
    <button
      type="button"
      class="btn btn-ghost"
      style="align-self: flex-start; padding-left: 0"
      @click="router.push({ name: 'slots' })"
    >
      ← {{ t('back') }}
    </button>
    <div>
      <div class="kicker">{{ offices.nameOf(booking.office) }} · {{ longSlot(booking.slot) }}</div>
      <h3 style="margin: 0 0 6px">{{ t('qT') }}</h3>
      <p class="lead">{{ t('qSub') }}</p>
    </div>
    <hr class="hr" style="margin: 0" />
    <div v-if="error" class="error" role="alert">{{ error }}</div>

    <div class="two-col">
      <form class="field" style="min-width: 0" @submit.prevent="confirm">
        <label for="q">{{ t('qLabel') }}</label>
        <textarea
          id="q"
          v-model="booking.question"
          class="input"
          style="min-height: 150px; font-size: 14px; line-height: 1.5"
          :placeholder="t('qPh')"
          maxlength="1000"
          required
        ></textarea>
        <div
          class="row"
          style="
            justify-content: space-between;
            font-size: 11px;
            color: var(--color-neutral-600);
            margin-top: 6px;
          "
        >
          <span>{{ t('privacy') }}</span
          ><span>{{ booking.question.length }}/1000</span>
        </div>
        <button
          type="submit"
          class="btn btn-primary"
          style="margin-top: 14px"
          :disabled="busy || !booking.question.trim()"
        >
          {{ t('confirmBtn') }}
        </button>
      </form>

      <div v-if="faq" class="side">
        <div>
          <div class="label" style="margin-bottom: 8px">{{ t('shownFaq') }}</div>
          <div class="answer-q" style="font-size: 13.5px">{{ faq.question }}</div>
          <div class="small" style="white-space: pre-line">{{ faq.answer }}</div>
        </div>
        <div>
          <p class="small" style="margin: 0; font-size: 11.5px">{{ t('shownFaqNote') }}</p>
        </div>
      </div>
    </div>
  </div>
</template>
