import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

import { getToken, setToken } from '@/api/client'
import * as api from '@/api/endpoints'
import type { User } from '@/api/types'

/** Chi è collegato. Il token sopravvive ai ricaricamenti; l'utente si rilegge con `/me/`. */
export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const token = ref<string | null>(getToken())

  const isAuthenticated = computed(() => token.value !== null)
  const role = computed(() => user.value?.role ?? null)
  const initials = computed(() =>
    user.value
      ? `${user.value.first_name[0] ?? ''}${user.value.last_name[0] ?? ''}`.toUpperCase()
      : '',
  )

  async function login(email: string, password: string) {
    const { token: key } = await api.login(email, password)
    setToken(key)
    token.value = key
    await fetchMe()
  }

  /** Rilegge l'utente dal token salvato; un token scaduto o revocato porta al logout. */
  async function fetchMe() {
    if (!token.value) return
    try {
      user.value = await api.me()
    } catch {
      forget()
    }
  }

  async function logout() {
    try {
      await api.logout()
    } finally {
      forget()
    }
  }

  function forget() {
    setToken(null)
    token.value = null
    user.value = null
  }

  return { user, token, isAuthenticated, role, initials, login, fetchMe, logout }
})
