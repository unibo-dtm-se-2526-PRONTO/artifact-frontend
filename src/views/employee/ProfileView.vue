<script setup lang="ts">
import { onMounted, ref } from 'vue'

import { ApiError } from '@/api/client'
import { getEmployeeProfile, setEmployeeProfile } from '@/api/endpoints'
import type { OfficeCode } from '@/api/types'
import { t } from '@/i18n'
import { useAuthStore } from '@/stores/auth'
import { useOfficesStore } from '@/stores/offices'

const auth = useAuthStore()
const offices = useOfficesStore()
const current = ref<OfficeCode | null>(null)
const choice = ref<OfficeCode | ''>('')
const loading = ref(true)
const error = ref('')

onMounted(async () => {
  try {
    await offices.load()
    current.value = (await getEmployeeProfile()).office
  } catch (e) {
    // 404 = ufficio non ancora scelto: si mostra il form.
    if (!(e instanceof ApiError && e.status === 404)) error.value = t('genericError')
  } finally {
    loading.value = false
  }
})

/** US1: l'ufficio si sceglie una volta; poi lo cambia solo un amministratore. */
async function save() {
  if (!choice.value) return
  error.value = ''
  try {
    current.value = (await setEmployeeProfile(choice.value)).office
  } catch (e) {
    error.value = e instanceof ApiError ? e.detail : t('genericError')
  }
}
</script>

<template>
  <div class="screen" style="max-width: 640px" data-screen-label="Profilo dipendente">
    <div>
      <div class="kicker">{{ t('roleEmployee') }}</div>
      <h3 style="margin: 0">{{ t('empT') }}</h3>
    </div>
    <hr class="hr" style="margin: 0" />
    <div v-if="error" class="error" role="alert">{{ error }}</div>

    <div class="summary">
      <div class="summary-row">
        <span>{{ t('fn') }}</span
        ><span>{{ auth.user?.first_name }}</span>
      </div>
      <div class="summary-row">
        <span>{{ t('ln') }}</span
        ><span>{{ auth.user?.last_name }}</span>
      </div>
      <div class="summary-row">
        <span>Email</span><span>{{ auth.user?.email }}</span>
      </div>
      <div v-if="current" class="summary-row">
        <span>{{ t('officeSet') }}</span
        ><span class="heading">{{ offices.nameOf(current) }}</span>
      </div>
    </div>

    <form
      v-if="!loading && !current"
      class="row"
      style="align-items: flex-end"
      @submit.prevent="save"
    >
      <div class="field" style="flex: 1; min-width: 220px">
        <label for="office">{{ t('office') }}</label>
        <select id="office" v-model="choice" class="input" required>
          <option v-for="o in offices.offices" :key="o.code" :value="o.code">{{ o.name }}</option>
        </select>
      </div>
      <button type="submit" class="btn btn-primary" :disabled="!choice">
        {{ t('setOffice') }}
      </button>
    </form>
  </div>
</template>
