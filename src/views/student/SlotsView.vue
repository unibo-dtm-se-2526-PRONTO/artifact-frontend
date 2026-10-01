<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

import { availability } from '@/api/endpoints'
import { dayLabel, isoDate, longSlot, nextWorkingDays, time } from '@/format'
import { t } from '@/i18n'
import { useBookingStore } from '@/stores/booking'
import { useOfficesStore } from '@/stores/offices'

const booking = useBookingStore()
const offices = useOfficesStore()
const router = useRouter()

// Due settimane lavorative: abbastanza per trovare posto, poche richieste.
const days = nextWorkingDays(10)
const slotsByDay = ref<Record<string, string[]>>({})
const selectedDay = ref(isoDate(days[0]!))
const loading = ref(true)
const error = ref('')

const daySlots = computed(() => slotsByDay.value[selectedDay.value] ?? [])

onMounted(async () => {
  if (!booking.office) {
    router.replace({ name: 'ask' })
    return
  }
  offices.load().catch(() => {})
  const code = booking.office
  try {
    // Gli slot non sono salvati: il backend li calcola dai turni (FR4), un
    // giorno per richiesta. I dieci giorni partono insieme.
    const answers = await Promise.all(days.map((d) => availability(code, isoDate(d))))
    slotsByDay.value = Object.fromEntries(answers.map((a) => [a.date, a.slots]))
    const firstFree = answers.find((a) => a.slots.length)
    if (firstFree) selectedDay.value = firstFree.date
  } catch {
    error.value = t('genericError')
  } finally {
    loading.value = false
  }
})

function next() {
  if (booking.slot) router.push({ name: 'confirm' })
}
</script>

<template>
  <div class="screen" data-screen-label="Selezione slot">
    <button
      type="button"
      class="btn btn-ghost"
      style="align-self: flex-start; padding-left: 0"
      @click="router.push({ name: 'ask' })"
    >
      ← {{ t('back') }}
    </button>
    <div>
      <div class="kicker">{{ offices.nameOf(booking.office) }}</div>
      <h3 style="margin: 0 0 6px">{{ t('slotsT') }}</h3>
      <p v-if="booking.question" class="small" style="margin: 0; max-width: 60ch">
        {{ t('routedNote') }}
      </p>
    </div>
    <hr class="hr" style="margin: 0" />

    <div v-if="error" class="error" role="alert">{{ error }}</div>
    <p v-else-if="loading" class="small">{{ t('loading') }}</p>

    <div v-else class="two-col">
      <div style="min-width: 0">
        <div class="days" role="group" :aria-label="t('slotsT')">
          <button
            v-for="d in days"
            :key="isoDate(d)"
            type="button"
            class="day"
            :aria-pressed="selectedDay === isoDate(d)"
            @click="selectedDay = isoDate(d)"
          >
            <span class="day-n">{{ dayLabel(d) }}</span>
            <span class="slot-tag" style="margin: 0">
              {{ t('freeN', { n: (slotsByDay[isoDate(d)] ?? []).length }) }}
            </span>
          </button>
        </div>

        <div class="slot-list" style="margin-top: 14px">
          <button
            v-for="s in daySlots"
            :key="s"
            type="button"
            class="slot-row"
            :aria-pressed="booking.slot === s"
            @click="booking.slot = s"
          >
            <span class="slot-time">{{ time(s) }}</span>
            <span style="font-size: 12px">{{ offices.nameOf(booking.office) }}</span>
            <span class="slot-tag">{{ t('free') }}</span>
          </button>
          <p v-if="!daySlots.length" class="small" style="padding: 12px 0; margin: 0">
            {{ t('noSlotsDay') }}
          </p>
        </div>
      </div>

      <div class="side">
        <div>
          <div class="label" style="margin-bottom: 4px">{{ t('selK') }}</div>
          <div class="heading" style="font-size: 17px">
            {{ booking.slot ? longSlot(booking.slot) : t('noSlot') }}
          </div>
          <div class="small" style="margin-top: 2px">{{ offices.nameOf(booking.office) }}</div>
        </div>
        <div>
          <div class="label" style="margin-bottom: 6px">{{ t('whoK') }}</div>
          <p class="small" style="margin: 0; font-size: 11.5px">{{ t('whoNote') }}</p>
        </div>
        <div>
          <button
            type="button"
            class="btn btn-primary btn-block"
            :disabled="!booking.slot"
            @click="next"
          >
            {{ t('next') }} →
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
