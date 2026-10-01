<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'

import { ApiError } from '@/api/client'
import { register } from '@/api/endpoints'
import type { RegisterPayload } from '@/api/types'
import PosterPanel from '@/components/PosterPanel.vue'
import { t } from '@/i18n'

const router = useRouter()

const form = reactive({
  first_name: '',
  last_name: '',
  email: '',
  password: '',
  matricola: '',
  degree_programme: '',
})
const errors = ref<Record<string, string>>({})
const error = ref('')
const busy = ref(false)

// Il ruolo lo decide il backend dal dominio (US0/US1); qui serve solo a
// mostrare i campi giusti: matricola e corso sono richiesti agli studenti
// e rifiutati a tutti gli altri.
const isStudent = computed(() => form.email.trim().toLowerCase().endsWith('@studio.unibo.it'))

async function submit() {
  errors.value = {}
  error.value = ''
  busy.value = true
  const payload: RegisterPayload = {
    first_name: form.first_name.trim(),
    last_name: form.last_name.trim(),
    email: form.email.trim(),
    password: form.password,
  }
  if (isStudent.value) {
    payload.matricola = form.matricola.trim()
    payload.degree_programme = form.degree_programme.trim()
  }
  try {
    await register(payload)
    await router.push({ name: 'login', query: { registered: '1' } })
  } catch (e) {
    if (e instanceof ApiError) {
      errors.value = e.fieldErrors
      if (!Object.keys(errors.value).length) error.value = e.detail
    } else {
      error.value = t('genericError')
    }
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <div class="split" data-screen-label="Registrazione">
    <form class="split-form" @submit.prevent="submit">
      <div>
        <div class="kicker">{{ t('sub') }}</div>
        <h2 style="margin: 0 0 6px; font-size: 30px">{{ t('regTitle') }}</h2>
        <p class="lead">{{ t('regSub') }}</p>
      </div>
      <div v-if="error" class="error" role="alert">{{ error }}</div>
      <div class="grid-2">
        <div class="field">
          <label for="reg-fn">{{ t('fn') }}</label>
          <input
            id="reg-fn"
            v-model="form.first_name"
            class="input"
            autocomplete="given-name"
            required
          />
          <div v-if="errors.first_name" class="field-error">{{ errors.first_name }}</div>
        </div>
        <div class="field">
          <label for="reg-ln">{{ t('ln') }}</label>
          <input
            id="reg-ln"
            v-model="form.last_name"
            class="input"
            autocomplete="family-name"
            required
          />
          <div v-if="errors.last_name" class="field-error">{{ errors.last_name }}</div>
        </div>
      </div>
      <div class="field">
        <label for="reg-mail">{{ t('mail') }}</label>
        <input
          id="reg-mail"
          v-model="form.email"
          class="input"
          type="email"
          autocomplete="email"
          placeholder="nome.cognome@studio.unibo.it"
          required
        />
        <div v-if="errors.email" class="field-error">{{ errors.email }}</div>
      </div>
      <div v-if="isStudent" class="grid-2">
        <div class="field">
          <label for="reg-mat">{{ t('mat') }}</label>
          <input id="reg-mat" v-model="form.matricola" class="input" inputmode="numeric" required />
          <div v-if="errors.matricola" class="field-error">{{ errors.matricola }}</div>
        </div>
        <div class="field">
          <label for="reg-cdl">{{ t('cdl') }}</label>
          <input id="reg-cdl" v-model="form.degree_programme" class="input" required />
          <div v-if="errors.degree_programme" class="field-error">
            {{ errors.degree_programme }}
          </div>
        </div>
      </div>
      <div class="field">
        <label for="reg-pwd">{{ t('pwd') }}</label>
        <input
          id="reg-pwd"
          v-model="form.password"
          class="input"
          type="password"
          autocomplete="new-password"
          required
        />
        <div v-if="errors.password" class="field-error">{{ errors.password }}</div>
      </div>
      <div class="row">
        <button type="submit" class="btn btn-primary" :disabled="busy">{{ t('create') }}</button>
        <RouterLink class="btn btn-ghost" :to="{ name: 'login' }">{{ t('signin') }}</RouterLink>
      </div>
      <div class="note">{{ t('idpNote') }}</div>
    </form>
    <PosterPanel />
  </div>
</template>
