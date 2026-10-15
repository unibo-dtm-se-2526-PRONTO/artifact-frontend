# frontend

This template should help get you started developing with Vue 3 in Vite.

## Recommended IDE Setup

[VS Code](https://code.visualstudio.com/) + [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## Recommended Browser Setup

- Chromium-based browsers (Chrome, Edge, Brave, etc.):
  - [Vue.js devtools](https://chromewebstore.google.com/detail/vuejs-devtools/nhdogjmejiglipccpnnnanhbledajbpd)
  - [Turn on Custom Object Formatter in Chrome DevTools](http://bit.ly/object-formatters)
- Firefox:
  - [Vue.js devtools](https://addons.mozilla.org/en-US/firefox/addon/vue-js-devtools/)
  - [Turn on Custom Object Formatter in Firefox DevTools](https://fxdx.dev/firefox-devtools-custom-object-formatters/)

## Type Support for `.vue` Imports in TS

TypeScript cannot handle type information for `.vue` imports by default, so we replace the `tsc` CLI with `vue-tsc` for type checking. In editors, we need [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) to make the TypeScript language service aware of `.vue` types.

## Customize configuration

See [Vite Configuration Reference](https://vite.dev/config/).

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Type-Check, Compile and Minify for Production

```sh
npm run build
```

### Run Unit Tests with [Vitest](https://vitest.dev/)

```sh
npm run test:unit
```

See [Testing](#testing).

### Lint with [ESLint](https://eslint.org/)

```sh
npm run lint
```

## Testing

The suite runs on Vitest with jsdom and `@vue/test-utils`, and never talks to a
real backend.

```sh
npm run test:unit                # watch mode
npm run test:unit -- --run       # once, as CI does
npm run test:coverage            # once, with coverage; HTML report in coverage/
```

Tests live in `src/__tests__/`: one file per module, store, component or view
(`AskView.spec.ts`, `auth-store.spec.ts`, …), plus `router.spec.ts` for the
navigation guard and `flows.spec.ts` for whole journeys through the real router.
Shared helpers are in `src/__tests__/helpers/`:

| File | What it gives |
|------|---------------|
| `fetch.ts` | `mockApi()`, the stand-in for the backend, and `deferred()` for loading states |
| `fixtures.ts` | backend payloads built from `src/api/types.ts`: users per role, offices, FAQs, inquiries, slots, appointments, shifts |
| `mount.ts` | `mountWithPlugins()`: a fresh Pinia, a memory-history router on the app's routes, an optional signed-in user |
| `dom.ts` | queries by label, button text and role (`field`, `button`, `alertText`, …) |
| `time.ts` | `freezeTime()`: fakes `Date` only, so promises and timers still run |
| `setup.ts`, `storage.ts` | run before every file: see below |

### Conventions

- **No network.** Before each test `fetch` is replaced by an empty mock, and the
  API base URL is `http://api.test`, a host that cannot resolve. A request the
  test did not mock fails the test, even when the page catches the error.
- **Mocking an endpoint.** Answer by method and path; `once` answers the next
  request only, and a newer route wins over an older one:

  ```ts
  const api = mockApi()
  api.on('GET', '/api/offices/?lang=it', { body: fx.offices() })   // with the query
  api.on('POST', '/api/auth/login/', {                             // any query
    status: 400,
    body: { non_field_errors: ['Invalid email or password.'] },
  })
  api.on('GET', '/api/appointments/', { networkError: true })      // fetch rejects
  api.on('GET', /availability/, (req) => ({ body: fx.availability(req.query.date!) }))

  expect(api.last('POST', '/api/auth/login/')?.body).toEqual({ email, password })
  expect(api.last('GET', '/api/auth/me/')?.headers.Authorization).toBe(`Token ${fx.TOKEN}`)
  ```

- **Behaviour through the DOM.** Fill fields by their label, click buttons by
  their text, read errors from `role="alert"`; assert on what the user sees, the
  requests sent and the route reached, not on component internals.
- **Clean state.** `localStorage`, `sessionStorage`, the session token, the
  language (Italian), stubbed globals and the clock are reset after each test.
- **Time zone.** `vitest.config.ts` sets `TZ=Europe/Rome`, the office's zone,
  whatever the machine or CI runner uses, so slot times and dates are the same
  everywhere. Write instants with their offset (`2026-10-07T09:00:00+02:00`).
- **Known bugs** are written as `it.fails`, with a comment saying what is wrong:
  the test starts passing, and so failing, the day the bug is fixed.

### Coverage

`npm run test:coverage` measures every file under `src/` except `main.ts` and
`api/types.ts`, and fails below **95%** of lines, statements and functions or
**90%** of branches. CI runs it in the `check` job and uploads the HTML report
as the `coverage-report-<sha>` artifact.

## Releases

`.github/workflows/deploy.yml` runs [semantic-release](https://semantic-release.gitbook.io)
after CI, on `main` only. It reads the commit messages, which therefore follow
[Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/): `feat`
makes a minor release, `fix` and `docs` a patch, a `!` a major one, while
`chore`, `ci`, `test` and `refactor` make none. A release is a git tag, a
GitHub release, the new version in `package.json` and an entry in
`CHANGELOG.md`, committed back as `chore(release): …`. Nothing is published to
npm.

The workflow pushes with the token GitHub Actions generates for every run, so
tag and GitHub release come from `github-actions[bot]` and the release commit
from `semantic-release-bot`; it needs no secret. Commit messages are checked
on every pull request
(`.github/workflows/commitlint.yml`, rules in `commitlint.config.mjs`).

The version is compiled into the app as `__APP_VERSION__` (`vite.config.ts`)
and shown in the user menu and in the tooltip of the logo.
