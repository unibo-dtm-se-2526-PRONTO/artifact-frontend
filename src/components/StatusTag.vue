<script setup lang="ts">
import { computed } from 'vue'

import type { AppointmentStatus } from '@/api/types'
import { t } from '@/i18n'

const props = defineProps<{ status: AppointmentStatus }>()

const label = computed(() =>
  props.status === 'BOOKED'
    ? t('stBooked')
    : props.status === 'COMPLETED'
      ? t('stCompleted')
      : t('stCancelled'),
)
</script>

<template>
  <span class="status" :class="`status-${status}`">{{ label }}</span>
</template>
