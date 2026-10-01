import { ref, watch } from 'vue'
import { defineStore } from 'pinia'

import * as api from '@/api/endpoints'
import type { Office, OfficeCode } from '@/api/types'
import { lang } from '@/i18n'

/** Gli uffici attivi, nella lingua dell'interfaccia. Ricaricati quando la lingua cambia. */
export const useOfficesStore = defineStore('offices', () => {
  const offices = ref<Office[]>([])
  let loaded: Promise<void> | null = null

  function load(force = false) {
    if (!loaded || force) {
      loaded = api.listOffices().then((list) => {
        offices.value = list
      })
      loaded.catch(() => {
        loaded = null
      })
    }
    return loaded
  }

  function byCode(code: OfficeCode | null | undefined): Office | undefined {
    return offices.value.find((o) => o.code === code)
  }

  /** Il nome dell'ufficio, o il codice finché la lista non è arrivata. */
  function nameOf(code: OfficeCode | null | undefined): string {
    return byCode(code)?.name ?? code ?? '—'
  }

  watch(lang, () => {
    if (loaded) load(true)
  })

  return { offices, load, byCode, nameOf }
})
