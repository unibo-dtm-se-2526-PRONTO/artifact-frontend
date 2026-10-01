/**
 * Punto unico di accesso al backend Django.
 *
 * L'URL base arriva da VITE_API_URL (vedi .env) invece di essere scritto a mano
 * nelle chiamate, così passare da locale a un altro ambiente non richiede di
 * toccare il codice.
 */

const rawBaseUrl = import.meta.env.VITE_API_URL

if (!rawBaseUrl) {
  throw new Error(
    'VITE_API_URL non è definita: copiare i valori da .env e riavviare "npm run dev".',
  )
}

/** URL base del backend, senza slash finale. */
export const API_BASE_URL = rawBaseUrl.replace(/\/+$/, '')

const TOKEN_KEY = 'pronto.token'

let token: string | null = readToken()

function readToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

/** Il token DRF della sessione corrente, `null` se non autenticati. */
export function getToken(): string | null {
  return token
}

/** Salva (o rimuove, con `null`) il token, anche tra un ricaricamento e l'altro. */
export function setToken(value: string | null) {
  token = value
  try {
    if (value) localStorage.setItem(TOKEN_KEY, value)
    else localStorage.removeItem(TOKEN_KEY)
  } catch {
    // localStorage non disponibile: il token vive solo in memoria.
  }
}

/**
 * Risposta non-2xx del backend. `body` è il JSON di errore di DRF, che può
 * essere `{detail: "..."}` oppure `{campo: ["messaggio", ...]}`.
 */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly body: unknown,
    message: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }

  /** Gli errori per campo, nel formato `{campo: "primo messaggio"}`. */
  get fieldErrors(): Record<string, string> {
    const errors: Record<string, string> = {}
    if (this.body && typeof this.body === 'object') {
      for (const [field, value] of Object.entries(this.body)) {
        if (field === 'detail') continue
        errors[field] = Array.isArray(value) ? String(value[0]) : String(value)
      }
    }
    return errors
  }

  /** Un messaggio leggibile: il `detail` di DRF o il primo errore di campo. */
  get detail(): string {
    if (this.body && typeof this.body === 'object' && 'detail' in this.body) {
      return String((this.body as { detail: unknown }).detail)
    }
    const first = Object.values(this.fieldErrors)[0]
    return first ?? this.message
  }
}

/**
 * Wrapper su fetch che risolve il path sul backend, aggiunge il token e
 * solleva un `ApiError` sulle risposte non-2xx invece di restituirle
 * silenziosamente.
 *
 * @param path percorso assoluto sul backend, es. "/api/offices/"
 */
export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string> | undefined),
  }
  if (token) headers.Authorization = `Token ${token}`

  const response = await fetch(`${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`, {
    ...init,
    headers,
  })

  if (!response.ok) {
    const body = await response.json().catch(() => null)
    throw new ApiError(
      response.status,
      body,
      `${init.method ?? 'GET'} ${path} ha risposto ${response.status}`,
    )
  }

  // 204 No Content: cancel, complete, logout, delete.
  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}
