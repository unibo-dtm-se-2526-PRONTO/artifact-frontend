/// <reference types="vite/client" />

/** La versione rilasciata (package.json), sostituita da Vite in fase di build. */
declare const __APP_VERSION__: string

interface ImportMetaEnv {
  /** URL base del backend Django, es. "http://localhost:8000". Definito in .env */
  readonly VITE_API_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
