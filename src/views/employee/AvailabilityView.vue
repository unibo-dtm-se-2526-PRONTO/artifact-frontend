<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { RouterLink } from 'vue-router'

import { ApiError } from '@/api/client'
import { addShift, getEmployeeProfile, listShifts, removeShift } from '@/api/endpoints'
import type { Office, Shift } from '@/api/types'
import { hhmm, minutesBetween } from '@/format'
import { dayName, t } from '@/i18n'
import { useOfficesStore } from '@/stores/offices'

const offices = useOfficesStore()
const office = ref<Office | null>(null)
const hasProfile = ref(true)
const shifts = ref<Shift[]>([])
const loading = ref(true)
const error = ref('')
const form = reactive({ weekday: 0, start_time: '09:00', end_time: '12:00' })

const step = computed(() => office.value?.slot_duration_minutes ?? 30)

async function loadShifts() {
  shifts.value = await listShifts()
}

onMounted(async () => {
  try {
    await offices.load()
    try {
      const profile = await getEmployeeProfile()
      office.value = offices.byCode(profile.office) ?? null
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) hasProfile.value = false
      else throw e
    }
    await loadShifts()
  } catch {
    error.value = t('genericError')
  } finally {
    loading.value = false
  }
})

/** Lunedì–venerdì sempre in elenco, anche senza turni; il weekend solo se usato. */
const week = computed(() => {
  const used = new Set(shifts.value.map((s) => s.weekday))
  return [0, 1, 2, 3, 4, 5, 6]
    .filter((d) => d < 5 || used.has(d))
    .map((d) => ({ weekday: d, shifts: shifts.value.filter((s) => s.weekday === d) }))
})

const slotsOf = (s: Shift) => Math.floor(minutesBetween(s.start_time, s.end_time) / step.value)
const total = computed(() => shifts.value.reduce((n, s) => n + slotsOf(s), 0))

/** FR4/FR5: dichiarare un turno; il backend controlla griglia e sovrapposizioni. */
async function submit() {
  error.value = ''
  try {
    await addShift({
      weekday: Number(form.weekday),
      start_time: form.start_time,
      end_time: form.end_time,
    })
    await loadShifts()
  } catch (e) {
    error.value = e instanceof ApiError ? e.detail : t('genericError')
  }
}

async function remove(s: Shift) {
  error.value = ''
  try {
    await removeShift(s.id)
    await loadShifts()
  } catch (e) {
    error.value = e instanceof ApiError ? e.detail : t('genericError')
  }
}
</script>

<template>
  <div class="screen" data-screen-label="Disponibilità">
    <div>
      <div class="kicker">{{ office?.name ?? t('roleEmployee') }}</div>
      <h3 style="margin: 0">{{ t('availT') }}</h3>
    </div>
    <hr class="hr" style="margin: 0" />

    <div v-if="!hasProfile" class="box">
      <span class="small">{{ t('needOffice') }}</span>
      <RouterLink class="btn btn-primary" style="align-self: flex-start" :to="{ name: 'profile' }">
        {{ t('navProfile') }} →
      </RouterLink>
    </div>

    <template v-else>
      <div v-if="error" class="error" role="alert">{{ error }}</div>
      <p v-if="loading" class="small">{{ t('loading') }}</p>

      <div v-else style="border-top: 2px solid var(--color-text)">
        <template v-for="d in week" :key="d.weekday">
          <div v-if="!d.shifts.length" class="shift-row">
            <span class="heading" style="font-size: 14px; min-width: 96px">{{
              dayName(d.weekday)
            }}</span>
            <span class="shift-range shift-range-off">{{ t('closed') }}</span>
          </div>
          <div v-for="s in d.shifts" :key="s.id" class="shift-row">
            <span class="heading" style="font-size: 14px; min-width: 96px">{{
              dayName(d.weekday)
            }}</span>
            <span class="shift-range">{{ hhmm(s.start_time) }} – {{ hhmm(s.end_time) }}</span>
            <span class="small" style="flex: 1; min-width: 120px"
              >{{ slotsOf(s) }} slot × {{ step }} min</span
            >
            <button
              type="button"
              class="btn btn-ghost"
              style="font-size: 12.5px"
              @click="remove(s)"
            >
              {{ t('remove') }}
            </button>
          </div>
        </template>
      </div>

      <form class="shift-form" @submit.prevent="submit">
        <div class="field">
          <label for="sh-day">{{ t('weekday') }}</label>
          <select id="sh-day" v-model="form.weekday" class="input">
            <option v-for="d in 7" :key="d" :value="d - 1">{{ dayName(d - 1) }}</option>
          </select>
        </div>
        <div class="field">
          <label for="sh-start">{{ t('start') }}</label>
          <input
            id="sh-start"
            v-model="form.start_time"
            class="input"
            type="time"
            :step="step * 60"
            required
          />
        </div>
        <div class="field">
          <label for="sh-end">{{ t('end') }}</label>
          <input
            id="sh-end"
            v-model="form.end_time"
            class="input"
            type="time"
            :step="step * 60"
            required
          />
        </div>
        <button type="submit" class="btn btn-secondary">+ {{ t('addShift') }}</button>
        <span class="small">{{ t('genTotal', { n: total }) }}</span>
      </form>

      <div class="note">{{ t('availNote') }}</div>
    </template>
  </div>
</template>
