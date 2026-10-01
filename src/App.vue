<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink, RouterView, useRouter } from 'vue-router'

import { lang, setLang, t, type Lang } from '@/i18n'
import { homeFor } from '@/router'
import { useAuthStore } from '@/stores/auth'
import { useBookingStore } from '@/stores/booking'

const auth = useAuthStore()
const router = useRouter()
const menuOpen = ref(false)

const links = computed(() => {
  if (auth.role === 'STUDENT')
    return [
      { to: { name: 'ask' }, label: t('navAsk') },
      { to: { name: 'bookings' }, label: t('navBookings') },
    ]
  if (auth.role === 'EMPLOYEE')
    return [
      { to: { name: 'queue' }, label: t('navQueue') },
      { to: { name: 'availability' }, label: t('navAvail') },
      { to: { name: 'profile' }, label: t('navProfile') },
    ]
  return []
})

const roleLabel = computed(() =>
  auth.role === 'STUDENT'
    ? `${t('roleStudent')} · ${auth.user?.matricola}`
    : auth.role === 'EMPLOYEE'
      ? t('roleEmployee')
      : t('roleAdmin'),
)

const langs: Lang[] = ['it', 'en']

async function signOut() {
  menuOpen.value = false
  useBookingStore().reset()
  await auth.logout()
  router.push({ name: 'login' })
}
</script>

<template>
  <header class="topbar">
    <RouterLink class="brand" :to="auth.user ? homeFor(auth.role) : { name: 'login' }">
      <span class="brand-mark"></span>
      <span class="brand-name">PRONTO</span>
    </RouterLink>

    <nav v-if="links.length" class="nav-links" aria-label="Principale">
      <RouterLink v-for="l in links" :key="l.label" :to="l.to">{{ l.label }}</RouterLink>
    </nav>

    <div class="seg-bar" role="group" aria-label="Lingua / Language">
      <button
        v-for="l in langs"
        :key="l"
        type="button"
        :aria-pressed="lang === l"
        @click="setLang(l)"
      >
        {{ l.toUpperCase() }}
      </button>
    </div>

    <div v-if="auth.user" style="position: relative">
      <button
        type="button"
        class="avatar"
        :aria-expanded="menuOpen"
        aria-haspopup="menu"
        :aria-label="`${auth.user.first_name} ${auth.user.last_name}`"
        @click="menuOpen = !menuOpen"
      >
        {{ auth.initials }}
      </button>
      <div v-if="menuOpen" class="menu" role="menu" @click="menuOpen = false">
        <div class="menu-head">
          <div class="heading" style="font-size: 14px">
            {{ auth.user.first_name }} {{ auth.user.last_name }}
          </div>
          <div style="font-size: 11px; color: var(--color-neutral-600); word-break: break-all">
            {{ auth.user.email }}
          </div>
          <div class="kicker" style="font-size: 10px; margin: 5px 0 0">{{ roleLabel }}</div>
        </div>
        <RouterLink v-for="l in links" :key="l.label" :to="l.to" role="menuitem">{{
          l.label
        }}</RouterLink>
        <button type="button" class="signout" role="menuitem" @click="signOut">
          {{ t('signOut') }}
        </button>
      </div>
    </div>
  </header>

  <main class="page">
    <RouterView />
  </main>
</template>
