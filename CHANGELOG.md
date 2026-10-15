## 1.0.0 (2026-10-15)

### Features

* **api:** add the typed client for the Django REST backend ([655a988](https://github.com/unibo-dtm-se-2526-PRONTO/artifact-frontend/commit/655a9884ab5c5c5373e5c5c28b635ce116d105df))
* **auth:** add sign-in, registration and role-based routing ([d4f9fcd](https://github.com/unibo-dtm-se-2526-PRONTO/artifact-frontend/commit/d4f9fcded5f21f7bd1d5c3dd26c636683881160f))
* **auth:** tell users they can sign in right after registering ([0f8cd98](https://github.com/unibo-dtm-se-2526-PRONTO/artifact-frontend/commit/0f8cd987a300006da096bb80d14acaf77a3072f5))
* **booking:** add the ask-to-booking flow for students ([f900323](https://github.com/unibo-dtm-se-2526-PRONTO/artifact-frontend/commit/f900323a40f3cc68e46d033e0567529dcb249f5b))
* **config:** read the backend base URL from VITE_API_URL ([7e0857c](https://github.com/unibo-dtm-se-2526-PRONTO/artifact-frontend/commit/7e0857cf1bea181a34d5a89e2cdd91ee56c3ff60))
* **employee:** add appointment queue, shifts and profile screens ([1dc700f](https://github.com/unibo-dtm-se-2526-PRONTO/artifact-frontend/commit/1dc700fbde452b74b962d10765ebcbf3a21d5ae7))
* **format:** add date, time and relevance formatting helpers ([db91b0f](https://github.com/unibo-dtm-se-2526-PRONTO/artifact-frontend/commit/db91b0f06a079743df60c13bca4d78088794f3f5))
* **i18n:** add bilingual interface texts and locale helpers ([7881f45](https://github.com/unibo-dtm-se-2526-PRONTO/artifact-frontend/commit/7881f45d036a39ab326c64f3ce478430d2e56f6b))
* **stores:** add auth, offices and booking stores ([1349525](https://github.com/unibo-dtm-se-2526-PRONTO/artifact-frontend/commit/1349525a326eab7a0d236392096c28ec296b4457))
* **ui:** add the application shell with role navigation ([5404619](https://github.com/unibo-dtm-se-2526-PRONTO/artifact-frontend/commit/5404619556545c6dc9de6d28e6321cb872d62139))
* **ui:** adopt the Modernist design system for the app styles ([b3126f6](https://github.com/unibo-dtm-se-2526-PRONTO/artifact-frontend/commit/b3126f6a2841f13366c7a35cfdca9d330573fa65))
* **ui:** say what the app gives on the sign-in poster ([99a56f0](https://github.com/unibo-dtm-se-2526-PRONTO/artifact-frontend/commit/99a56f0a4ba2b3f95b9a41c11d724ff5596006c0))
* **ui:** show the released version in the user menu ([cf24aa3](https://github.com/unibo-dtm-se-2526-PRONTO/artifact-frontend/commit/cf24aa3db9ca3025cd2d14a8cb34988882d3122a))

### Bug Fixes

* **auth:** tell users they can sign in right after registering ([195de68](https://github.com/unibo-dtm-se-2526-PRONTO/artifact-frontend/commit/195de6804dc874ba2d4b5973a7d7e3e94c2d5050))
* remove verbosity and internal implementation from ui ([f422cb7](https://github.com/unibo-dtm-se-2526-PRONTO/artifact-frontend/commit/f422cb75efd49409a867da65c4759d371fe68b42))
* removed browse of office and internal implementation details shown on the ask screen ([1470418](https://github.com/unibo-dtm-se-2526-PRONTO/artifact-frontend/commit/1470418d0c6b70a9658d95d88b181dc3d80f4e63))

### Documentation

* describe how releases are made ([4dedd01](https://github.com/unibo-dtm-se-2526-PRONTO/artifact-frontend/commit/4dedd01b6c960cea0db2207880adebfc6b0a3d81))
* describe how the frontend is tested ([d487852](https://github.com/unibo-dtm-se-2526-PRONTO/artifact-frontend/commit/d487852240c3b81fff1e720c68bfcf333c929b8b))

### Tests

* add shared helpers for api mocks and mounting ([0d0aac6](https://github.com/unibo-dtm-se-2526-PRONTO/artifact-frontend/commit/0d0aac63a6e51b12864ffb415f761677cd78d9b6))
* **api:** cover the client and every endpoint ([0bcff67](https://github.com/unibo-dtm-se-2526-PRONTO/artifact-frontend/commit/0bcff673f24314a28f3fd8518cb3c046fd5f1da0))
* **components:** cover the application shell and shared components ([045108f](https://github.com/unibo-dtm-se-2526-PRONTO/artifact-frontend/commit/045108f0b208ddfde72e6039fcb8a690ef60ebfa))
* cover date formatting and translations ([25643af](https://github.com/unibo-dtm-se-2526-PRONTO/artifact-frontend/commit/25643af5d21404a8626659bb8c62cfe0784ca4c5))
* follow the ask screen and the views as they are on develop ([d184a56](https://github.com/unibo-dtm-se-2526-PRONTO/artifact-frontend/commit/d184a5628df4a7b837f63a79977ea424ce51460c))
* measure coverage with v8 and enforce thresholds ([2d5d70d](https://github.com/unibo-dtm-se-2526-PRONTO/artifact-frontend/commit/2d5d70d1360e788c956c059f5e09037253bf282b))
* **router:** cover the navigation guard ([ae8c4ad](https://github.com/unibo-dtm-se-2526-PRONTO/artifact-frontend/commit/ae8c4adf7f79fc2cc1ca3b8a97091e4a8cdb9278))
* run whole journeys through the real router ([b9b2f88](https://github.com/unibo-dtm-se-2526-PRONTO/artifact-frontend/commit/b9b2f887f50817bb8d387c45c75b3eb876ee150d))
* **stores:** cover auth, booking and offices stores ([8282f13](https://github.com/unibo-dtm-se-2526-PRONTO/artifact-frontend/commit/8282f13b6885ff208ecf473bd4c5675bb64f503e))
* **views:** cover sign-in and registration ([d61287b](https://github.com/unibo-dtm-se-2526-PRONTO/artifact-frontend/commit/d61287b667162f8216774e9e1397a78ed94a64d9))
* **views:** cover the employee pages ([fbc4905](https://github.com/unibo-dtm-se-2526-PRONTO/artifact-frontend/commit/fbc4905946617004ecc24272e15acec6d07d23b7))
* **views:** cover the student flow ([4c9eb18](https://github.com/unibo-dtm-se-2526-PRONTO/artifact-frontend/commit/4c9eb183a861b3600b4e4875b4d974ec1655b396))

### Build and continuous integration

* check that commit messages are Conventional Commits ([67c6f74](https://github.com/unibo-dtm-se-2526-PRONTO/artifact-frontend/commit/67c6f74fba1635814515ba79d877673d82708474))
* **commitlint:** skip the release pull request from develop ([63f99a4](https://github.com/unibo-dtm-se-2526-PRONTO/artifact-frontend/commit/63f99a4eae3dc8cafefbbb8f4a7b59d64e914963))
* **deploy:** author release commits as the owner of RELEASE_TOKEN ([dadf0e7](https://github.com/unibo-dtm-se-2526-PRONTO/artifact-frontend/commit/dadf0e73e3008fd3ef0805e46fcc0ee952cb08c9))
* measure frontend coverage ([dab08cb](https://github.com/unibo-dtm-se-2526-PRONTO/artifact-frontend/commit/dab08cb2ea40f29d701284776c98aed97505d0d8))
* **release:** release as the GitHub Actions bot instead of a personal token ([06b8f45](https://github.com/unibo-dtm-se-2526-PRONTO/artifact-frontend/commit/06b8f45b3a30c07c1dd1f8b56b5460526c275cd0))

### General maintenance

* add test coverage ([1ec7f4e](https://github.com/unibo-dtm-se-2526-PRONTO/artifact-frontend/commit/1ec7f4eafd3af7952efe670728fbfd17c1af76d7))
* remove stray files from the repository ([7db26d9](https://github.com/unibo-dtm-se-2526-PRONTO/artifact-frontend/commit/7db26d9575acfe6fb9afa02293b382bf497bd51f))
