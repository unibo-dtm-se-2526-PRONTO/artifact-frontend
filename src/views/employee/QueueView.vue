<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

import { ApiError } from '@/api/client'
import { completeAppointment, listAppointments } from '@/api/endpoints'
import type { Appointment } from '@/api/types'
import StatusTag from '@/components/StatusTag.vue'
import { shortDate, time } from '@/format'
import { t } from '@/i18n'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const appointments = ref<Appointment[]>([])
const filter = ref<'upcoming' | 'all'>('upcoming')
const loading = ref(true)
const error = ref('')

async function load() {
  try {
    appointments.value = await listAppointments()
  } catch {
    error.value = t('genericError')
  } finally {
    loading.value = false
  }
}
onMounted(load)

// Il backend ordina dal più recente; la coda si legge dal prossimo in poi.
const shown = computed(() => {
  const list =
    filter.value === 'upcoming'
      ? appointments.value.filter((a) => a.status === 'BOOKED')
      : appointments.value
  return [...list].sort((a, b) => a.slot.localeCompare(b.slot))
})

/** FR12: solo un appuntamento già iniziato si può chiudere. */
const completable = (a: Appointment) => a.status === 'BOOKED' && new Date(a.slot) <= new Date()

async function complete(a: Appointment) {
  error.value = ''
  try {
    await completeAppointment(a.id)
    await load()
  } catch (e) {
    error.value = e instanceof ApiError ? e.detail : t('genericError')
  }
}
</script>

<template>
  <div class="screen" data-screen-label="Coda richieste">
    <div class="row" style="justify-content: space-between; align-items: flex-end; gap: 16px">
      <div>
        <div class="kicker">{{ auth.user?.first_name }} {{ auth.user?.last_name }}</div>
        <h3 style="margin: 0">{{ t('queueT') }}</h3>
      </div>
      <div class="seg-bar" role="group">
        <button type="button" :aria-pressed="filter === 'upcoming'" @click="filter = 'upcoming'">
          {{ t('filterUpcoming') }}
        </button>
        <button type="button" :aria-pressed="filter === 'all'" @click="filter = 'all'">
          {{ t('filterAll') }}
        </button>
      </div>
    </div>
    <hr class="hr" style="margin: 0" />
    <div v-if="error" class="error" role="alert">{{ error }}</div>
    <p v-if="loading" class="small">{{ t('loading') }}</p>
    <p v-else-if="!shown.length" class="small">{{ t('queueEmpty') }}</p>
    <div v-else style="overflow: auto">
      <table class="table">
        <thead>
          <tr>
            <th>{{ t('thWhen') }}</th>
            <th>{{ t('thStudent') }}</th>
            <th>{{ t('thQ') }}</th>
            <th>{{ t('thStatus') }}</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="a in shown" :key="a.id">
            <td style="white-space: nowrap">
              <strong>{{ shortDate(a.slot) }}</strong
              ><br />
              <span style="font-size: 12px; color: var(--color-neutral-600)">{{
                time(a.slot)
              }}</span>
            </td>
            <td style="white-space: nowrap; font-size: 13px">{{ a.student }}</td>
            <td style="max-width: 360px; font-size: 13px">
              {{ a.question_text }}
              <span v-if="a.faq_id" class="tag tag-neutral" style="margin-left: 6px"
                >FAQ #{{ a.faq_id }}</span
              >
            </td>
            <td><StatusTag :status="a.status" /></td>
            <td>
              <button
                v-if="completable(a)"
                type="button"
                class="btn btn-secondary"
                style="font-size: 12.5px"
                @click="complete(a)"
              >
                {{ t('complete') }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
