<script setup lang="ts">
import { onMounted, ref } from 'vue'

import { ApiError } from '@/api/client'
import { cancelAppointment, listAppointments } from '@/api/endpoints'
import type { Appointment } from '@/api/types'
import StatusTag from '@/components/StatusTag.vue'
import { shortDate, time } from '@/format'
import { t } from '@/i18n'
import { useOfficesStore } from '@/stores/offices'

const offices = useOfficesStore()
const appointments = ref<Appointment[]>([])
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

onMounted(() => {
  offices.load().catch(() => {})
  load()
})

const cancellable = (a: Appointment) => a.status === 'BOOKED' && new Date(a.slot) > new Date()

/** FR11 */
async function cancel(a: Appointment) {
  if (!window.confirm(t('cancelConfirm'))) return
  error.value = ''
  try {
    await cancelAppointment(a.id)
    await load()
  } catch (e) {
    error.value = e instanceof ApiError ? e.detail : t('genericError')
  }
}
</script>

<template>
  <div class="screen" data-screen-label="Dashboard studente">
    <h3 style="margin: 0">{{ t('dashT') }}</h3>
    <hr class="hr" style="margin: 0" />
    <div v-if="error" class="error" role="alert">{{ error }}</div>
    <p v-if="loading" class="small">{{ t('loading') }}</p>
    <p v-else-if="!appointments.length" class="small">{{ t('dashEmpty') }}</p>
    <div v-else class="list">
      <div v-for="a in appointments" :key="a.id" class="list-item">
        <div style="min-width: 92px">
          <div class="heading" style="font-size: 16px">{{ shortDate(a.slot) }}</div>
          <div style="font-size: 12px; color: var(--color-neutral-600)">{{ time(a.slot) }}</div>
        </div>
        <div style="flex: 1; min-width: 180px">
          <div class="heading" style="font-size: 14px; margin-bottom: 3px">
            {{ offices.nameOf(a.office) }}
          </div>
          <div class="small" style="line-height: 1.4">{{ a.question_text }}</div>
        </div>
        <div class="row" style="gap: 10px">
          <StatusTag :status="a.status" />
          <button
            v-if="cancellable(a)"
            type="button"
            class="btn btn-ghost"
            style="font-size: 12.5px"
            @click="cancel(a)"
          >
            {{ t('cancel') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
