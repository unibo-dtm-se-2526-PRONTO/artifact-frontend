<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'

import { ApiError } from '@/api/client'
import PosterPanel from '@/components/PosterPanel.vue'
import { t } from '@/i18n'
import { homeFor } from '@/router'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()

const email = ref('')
const password = ref('')
const error = ref('')
const busy = ref(false)

async function submit() {
  error.value = ''
  busy.value = true
  try {
    await auth.login(email.value.trim(), password.value)
    const next = typeof route.query.next === 'string' ? route.query.next : null
    await router.push(next ?? homeFor(auth.role))
  } catch (e) {
    error.value = e instanceof ApiError ? e.detail : t('genericError')
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <div class="split" data-screen-label="Login">
    <form class="split-form" @submit.prevent="submit">
      <div>
        <div class="kicker">{{ t('sub') }}</div>
        <h2 style="margin: 0 0 6px; font-size: 30px">{{ t('inTitle') }}</h2>
        <p class="lead">{{ t('inSub') }}</p>
      </div>
      <div v-if="route.query.registered" class="note">{{ t('regDone') }}</div>
      <div v-if="error" class="error" role="alert">{{ error }}</div>
      <div class="field">
        <label for="login-email">{{ t('mail') }}</label>
        <input
          id="login-email"
          v-model="email"
          class="input"
          type="email"
          autocomplete="username"
          required
        />
      </div>
      <div class="field">
        <label for="login-pwd">{{ t('pwd') }}</label>
        <input
          id="login-pwd"
          v-model="password"
          class="input"
          type="password"
          autocomplete="current-password"
          required
        />
      </div>
      <div class="row">
        <button type="submit" class="btn btn-primary" :disabled="busy">{{ t('inCta') }}</button>
      </div>
      <hr class="hr" style="margin: 4px 0 0" />
      <div class="row">
        <span class="small">{{ t('noAccount') }}</span>
        <RouterLink class="btn btn-secondary" :to="{ name: 'register' }">{{
          t('create')
        }}</RouterLink>
      </div>
      <div class="note">{{ t('inNote') }}</div>
    </form>
    <PosterPanel />
  </div>
</template>
