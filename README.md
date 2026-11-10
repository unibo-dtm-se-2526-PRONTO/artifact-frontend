# PRONTO frontend

PRONTO automates the phone helpdesk of the Campus of Cesena. Students look for
an answer among the FAQs of each office and, when none helps, book an
appointment with the office's staff.

This is the web app: Vue 3, TypeScript, Pinia and Vue Router, built with Vite.
The API is the Django backend in the separate
[artifact-backend](https://github.com/unibo-dtm-se-2526-PRONTO/artifact-backend)
repository.

| Who | Pages |
|-----|-------|
| Everyone | `/login`, `/register` |
| Students (`@studio.unibo.it`) | `/ask` (questions and FAQs), `/book/slots` and `/book/confirm` (booking), `/bookings` |
| Employees (`@unibo.it`) | `/queue` (the office's appointments), `/availability` (weekly shifts), `/profile` |

The interface is in Italian and English.

## Getting started

You need Node.js `^22.18.0` or `>=24.12.0`, and the backend running on
<http://localhost:8000> (see its README).

```sh
npm install
npm run dev          # http://localhost:5173, with hot reload
```

The backend allows requests from <http://localhost:5173> only (CORS). The
development `docker-compose.yml` of the backend repository also starts this app
on that address, from a clone of this repository next to it.

### Scripts

| Command | What it does |
|---------|--------------|
| `npm run dev` | Development server |
| `npm run build` | Type check and production build in `dist/` |
| `npm run preview` | Serves `dist/` on <http://localhost:4173>, forwarding the API to <http://localhost:8000> |
| `npm run test:unit` | Tests, see [Testing](#testing) |
| `npm run lint` | oxlint and ESLint, fixing what they can |
| `npm run format` | Prettier on `src/` |

## Configuration

| File | Used by | `VITE_API_URL` |
|------|---------|----------------|
| `.env` | `npm run dev` | `http://localhost:8000`, the backend on this machine |
| `.env.production` | `npm run build` | `/`: the API on the app's own origin |
| `.env.local` | both, not versioned | your own values, overriding the two above |

`VITE_*` values are compiled into the JavaScript the browser downloads, so they
are public: never put secrets in them.

The production build calls the API on its own origin, so the same build works
with any backend address and the browser needs no CORS. Whatever serves it
must forward `/api/`, `/admin/` and `/static/` to the backend: nginx in the
Docker image, the proxy of `npm run preview` locally.

## Using a release

Each release ships the built app in two forms.

### Docker

`ghcr.io/unibo-dtm-se-2526-pronto/pronto-helpdesk-frontend`, tagged with the
version and `latest`, for amd64 and arm64. nginx serves the app on port 80 and
forwards the API to `BACKEND_URL`, by default `http://backend:8000`, the
backend service of a compose file. It starts even when the backend is not
reachable: the app loads, and the API answers 502 until the backend is up.

The whole application, database and backend included, runs from the released
images with `docker-compose.release.yml` of the backend repository:

```sh
docker compose -f docker-compose.release.yml up -d   # in artifact-backend
```

and is then on <http://localhost:8080>. The image alone, against a backend
running on this machine:

```sh
docker run --rm -p 8080:80 -e BACKEND_URL=http://host.docker.internal:8000 \
  ghcr.io/unibo-dtm-se-2526-pronto/pronto-helpdesk-frontend
```

### npm

[`pronto-helpdesk-frontend`](https://www.npmjs.com/package/pronto-helpdesk-frontend)
holds only the built app, in `dist/`:

```sh
npm install pronto-helpdesk-frontend
# node_modules/pronto-helpdesk-frontend/dist/
```

Serve it as static files with the same forwarding as above, and send every
other path to `index.html` (the router uses the history mode).

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
`chore`, `ci`, `test` and `refactor` make none. Commit messages are checked on
every pull request (`.github/workflows/commitlint.yml`, rules in
`commitlint.config.mjs`).

A release, configured in `release.config.mjs`:

1. writes the new version into `package.json` and an entry into `CHANGELOG.md`;
2. builds `dist/` and publishes it to npm;
3. builds the Docker image for amd64 and arm64 and pushes it to GHCR as the
   version and `latest`;
4. creates the git tag and the GitHub release, and commits the version back as
   `chore(release): …`.

The npm publish uses the `NPM_TOKEN` repository secret, a granular access token
from npmjs.com with read and write access to packages. Everything else uses the
token GitHub Actions generates for every run: tag and GitHub release come from
`github-actions[bot]`, the release commit from `semantic-release-bot`, and the
image is pushed with the `packages: write` permission. A new package on GHCR is
private until its visibility is changed in its settings.

The version is compiled into the app as `__APP_VERSION__` (`vite.config.ts`)
and shown in the user menu and in the tooltip of the logo.

## License

Apache 2.0
