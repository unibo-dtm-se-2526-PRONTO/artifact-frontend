import { createRouter, createWebHistory } from 'vue-router'

import { API_BASE_URL } from '@/api/client'
import type { Role } from '@/api/types'
import { useAuthStore } from '@/stores/auth'

declare module 'vue-router' {
  interface RouteMeta {
    /** Pagina pubblica: login e registrazione. */
    public?: boolean
    /** Il ruolo richiesto (FR3); assente = qualunque utente autenticato. */
    role?: Role
  }
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'root', redirect: { name: 'login' } },
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/auth/LoginView.vue'),
      meta: { public: true },
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('@/views/auth/RegisterView.vue'),
      meta: { public: true },
    },

    // — studente —
    {
      path: '/ask',
      name: 'ask',
      component: () => import('@/views/student/AskView.vue'),
      meta: { role: 'STUDENT' },
    },
    {
      path: '/book/slots',
      name: 'slots',
      component: () => import('@/views/student/SlotsView.vue'),
      meta: { role: 'STUDENT' },
    },
    {
      path: '/book/confirm',
      name: 'confirm',
      component: () => import('@/views/student/ConfirmView.vue'),
      meta: { role: 'STUDENT' },
    },
    {
      path: '/bookings',
      name: 'bookings',
      component: () => import('@/views/student/BookingsView.vue'),
      meta: { role: 'STUDENT' },
    },

    // — dipendente —
    {
      path: '/queue',
      name: 'queue',
      component: () => import('@/views/employee/QueueView.vue'),
      meta: { role: 'EMPLOYEE' },
    },
    {
      path: '/availability',
      name: 'availability',
      component: () => import('@/views/employee/AvailabilityView.vue'),
      meta: { role: 'EMPLOYEE' },
    },
    {
      path: '/profile',
      name: 'profile',
      component: () => import('@/views/employee/ProfileView.vue'),
      meta: { role: 'EMPLOYEE' },
    },

    { path: '/:pathMatch(.*)*', redirect: { name: 'root' } },
  ],
})

/** La prima schermata di ciascun ruolo. */
export function homeFor(role: Role | null) {
  return role === 'EMPLOYEE' ? { name: 'queue' } : { name: 'ask' }
}

router.beforeEach(async (to) => {
  const auth = useAuthStore()
  if (auth.isAuthenticated && !auth.user) await auth.fetchMe()

  if (to.meta.public) {
    // Chi è già collegato non ha motivo di rivedere login e registrazione.
    return auth.user ? homeFor(auth.role) : true
  }
  if (!auth.user) return { name: 'login', query: { next: to.fullPath } }
  if (auth.role === 'ADMIN') {
    // Nessuna schermata dell'app è per gli admin: lavorano nel Django admin.
    window.location.assign(`${API_BASE_URL}/admin/`)
    return false
  }
  if (to.meta.role && to.meta.role !== auth.role) return homeFor(auth.role)
  return true
})

export default router
