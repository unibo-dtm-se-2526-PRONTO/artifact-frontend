/**
 * A typed stand-in for the backend: `globalThis.fetch` is replaced by a router
 * that answers by method and path, and records every request so tests can
 * assert on what the app sent.
 *
 *   const api = mockApi()
 *   api.on('GET', '/api/offices/', { body: offices })
 *   api.once('POST', '/api/auth/login/', { status: 400, body: { non_field_errors: [...] } })
 *   ...
 *   expect(api.last('POST', '/api/auth/login/')?.body).toEqual({ email, password })
 *
 * A request nobody mocked is answered with a network error *and* recorded:
 * the global setup fails the test if any was left, so a view that swallows
 * errors cannot hide a missing mock. Nothing ever reaches the network.
 */
import { vi } from 'vitest'

export type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

/** A request as the backend would see it. */
export interface RecordedRequest {
  method: Method
  /** Path and query, without the base URL: "/api/offices/?lang=it". */
  url: string
  path: string
  query: Record<string, string>
  headers: Record<string, string>
  /** The JSON body, parsed; `undefined` when there was none. */
  body: unknown
  /** Sent somewhere other than the mocked API base: always a test failure. */
  external: boolean
}

export interface MockResponse {
  status?: number
  /** Serialised as JSON. Leave out for an empty body (e.g. 204). */
  body?: unknown
  /** A raw, non-JSON body, e.g. an HTML error page from a proxy. */
  text?: string
  /** Throw instead of answering: what fetch does when the network is down. */
  networkError?: boolean
}

type Responder = MockResponse | ((request: RecordedRequest) => MockResponse | Promise<MockResponse>)

interface Route {
  method: Method
  /** Matches the path alone, or path and query when it contains a "?". */
  path: string | RegExp
  responder: Responder
  once: boolean
}

/** The base URL the tests run against, set in vitest.config.ts. */
export const API = 'http://api.test'

/** Every mock installed during the current test. */
const installed: ApiMock[] = []

export class ApiMock {
  readonly requests: RecordedRequest[] = []
  readonly unhandled: RecordedRequest[] = []
  private readonly routes: Route[] = []

  readonly fetch = vi.fn<typeof fetch>(async (input, init = {}) => {
    const request = record(input, init)
    this.requests.push(request)
    const route = request.external ? undefined : this.match(request)
    if (!route) {
      this.unhandled.push(request)
      throw new TypeError(`Unmocked request: ${request.method} ${request.url}`)
    }
    if (route.once) this.routes.splice(this.routes.indexOf(route), 1)
    const answer =
      typeof route.responder === 'function' ? await route.responder(request) : route.responder
    return toResponse(answer)
  })

  /** Answers every matching request, until a newer route overrides it. */
  on(method: Method, path: string | RegExp, responder: Responder = {}) {
    this.routes.push({ method, path, responder, once: false })
    return this
  }

  /** Answers the next matching request only, then falls back to older routes. */
  once(method: Method, path: string | RegExp, responder: Responder = {}) {
    this.routes.push({ method, path, responder, once: true })
    return this
  }

  /** Every request sent to `method path` (path alone, or with the query if it has one). */
  calls(method: Method, path: string | RegExp): RecordedRequest[] {
    return this.requests.filter((r) => r.method === method && matches(path, r))
  }

  last(method: Method, path: string | RegExp): RecordedRequest | undefined {
    const all = this.calls(method, path)
    return all[all.length - 1]
  }

  private match(request: RecordedRequest): Route | undefined {
    // Newest first, so a test can override a default set up in beforeEach.
    for (let i = this.routes.length - 1; i >= 0; i--) {
      const route = this.routes[i]!
      if (route.method === request.method && matches(route.path, request)) return route
    }
    return undefined
  }
}

function matches(path: string | RegExp, request: RecordedRequest): boolean {
  if (path instanceof RegExp) return path.test(request.url)
  return path.includes('?') ? path === request.url : path === request.path
}

function record(input: RequestInfo | URL, init: RequestInit): RecordedRequest {
  const href = input instanceof Request ? input.url : String(input)
  const url = new URL(href, API)
  let body: unknown
  if (typeof init.body === 'string') {
    try {
      body = JSON.parse(init.body)
    } catch {
      body = init.body
    }
  }
  return {
    method: (init.method ?? 'GET').toUpperCase() as Method,
    url: url.origin === API ? url.pathname + url.search : href,
    path: url.pathname,
    query: Object.fromEntries(url.searchParams),
    headers: { ...(init.headers as Record<string, string> | undefined) },
    body,
    external: url.origin !== API,
  }
}

function toResponse({ status = 200, body, text, networkError }: MockResponse): Response {
  if (networkError) throw new TypeError('Failed to fetch')
  if (text !== undefined) {
    return new Response(text, { status, headers: { 'Content-Type': 'text/html' } })
  }
  const payload = body === undefined || status === 204 ? null : JSON.stringify(body)
  return new Response(payload, { status, headers: { 'Content-Type': 'application/json' } })
}

/** Replaces `fetch` for the current test; the global setup restores it afterwards. */
export function mockApi(): ApiMock {
  const api = new ApiMock()
  installed.push(api)
  vi.stubGlobal('fetch', api.fetch)
  return api
}

/** Called by the global setup after each test. */
export function takeUnhandledRequests(): RecordedRequest[] {
  const left = installed.flatMap((api) => api.unhandled)
  installed.length = 0
  return left
}

/** A promise the test resolves by hand, to observe loading states. */
export function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

/** DRF's validation error: `{field: [message]}`. */
export const fieldError = (field: string, message: string): MockResponse => ({
  status: 400,
  body: { [field]: [message] },
})

/** DRF's other errors: `{detail: message}`. */
export const detailError = (status: number, message: string): MockResponse => ({
  status,
  body: { detail: message },
})
