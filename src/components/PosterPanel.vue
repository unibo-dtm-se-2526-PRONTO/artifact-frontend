<script setup lang="ts">
import { onMounted, ref } from 'vue'

import { countFaqs } from '@/api/endpoints'
import { t } from '@/i18n'

// Numeri veri, letti dal backend; l'elenco FAQ è pubblico, quindi
// disponibile anche prima del login. Se non risponde, la riga non compare.
const faqCount = ref<number | null>(null)

onMounted(async () => {
  try {
    faqCount.value = await countFaqs()
  } catch {
    faqCount.value = null
  }
})
</script>

<template>
  <aside class="poster">
    <h1>{{ t('posterA') }}<br />{{ t('posterB') }}</h1>
    <div>
      <div v-if="faqCount" class="poster-stat">
        <strong>{{ faqCount }}</strong
        ><span>{{ t('statFaq') }}</span>
      </div>
      <div class="poster-stat">
        <strong>4</strong><span>{{ t('statOffices') }}</span>
      </div>
    </div>
  </aside>
</template>
