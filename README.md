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

### Lint with [ESLint](https://eslint.org/)

```sh
npm run lint
```

## Releases

`.github/workflows/deploy.yml` runs [semantic-release](https://semantic-release.gitbook.io)
after CI, on `main` only. It reads the commit messages, which therefore follow
[Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/): `feat`
makes a minor release, `fix` and `docs` a patch, a `!` a major one, while
`chore`, `ci`, `test` and `refactor` make none. A release is a git tag, a
GitHub release, the new version in `package.json` and an entry in
`CHANGELOG.md`, committed back as `chore(release): …`. Nothing is published to
npm.

The workflow needs one secret, `RELEASE_TOKEN`, a GitHub token allowed to push
to the repository: tag, GitHub release and release commit all come from the
account that owns it. Commit messages are checked on every pull request
(`.github/workflows/commitlint.yml`, rules in `commitlint.config.mjs`).

The version is compiled into the app as `__APP_VERSION__` (`vite.config.ts`)
and shown in the user menu and in the tooltip of the logo.
