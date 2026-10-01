/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** URL base del backend Django, es. "http://localhost:8000". Definito in .env */
  readonly VITE_API_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
