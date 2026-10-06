/**
 * Mounting with the app's real plugins: a fresh Pinia and a router built on the
 * app's own routes, but with memory history so tests never touch the URL bar.
 *
 * The routes come from `@/router`; its navigation guard does not, because it is
 * registered on the app's singleton. The guard has its own tests
 * (router.spec.ts), and the full flows run on the real router (flows.spec.ts).
 */
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia, type Pinia } from 'pinia'
import type { Component } from 'vue'
import { createMemoryHistory, createRouter, type RouteLocationRaw, type Router } from 'vue-router'

import { setToken } from '@/api/client'
import type { User } from '@/api/types'
import appRouter from '@/router'
import { useAuthStore } from '@/stores/auth'

import { TOKEN } from './fixtures'

export interface MountOptions {
  /** Signs this user in: the token is stored and the store already knows them. */
  user?: User
  /** Where the router is before mounting. */
  route?: RouteLocationRaw
  /** Called with the fresh Pinia before mounting, to seed stores. */
  setup?: (pinia: Pinia) => void
}

export function freshPinia(): Pinia {
  const pinia = createPinia()
  setActivePinia(pinia)
  return pinia
}

export function memoryRouter(): Router {
  return createRouter({ history: createMemoryHistory(), routes: appRouter.options.routes })
}

/** Signs `user` in on the active Pinia, as if `/me/` had already answered. */
export function signIn(user: User) {
  setToken(TOKEN)
  const auth = useAuthStore()
  auth.token = TOKEN
  auth.user = user
  return auth
}

export async function mountWithPlugins(component: Component, options: MountOptions = {}) {
  const pinia = freshPinia()
  const router = memoryRouter()
  if (options.user) signIn(options.user)
  options.setup?.(pinia)
  await router.push(options.route ?? '/')
  await router.isReady()

  const wrapper = mount(component, { global: { plugins: [pinia, router] } })
  await flushPromises()
  return { wrapper, router, pinia }
}
