import { fileURLToPath } from 'node:url'
import { mergeConfig, defineConfig, configDefaults } from 'vitest/config'
import viteConfig from './vite.config'

// The app serves the Cesena campus: dates and slot times are read in Europe/Rome.
// Set here, before Vitest starts its workers, so every run — any OS, any shell
// TZ, CI included — formats the same instants the same way. Node honours a TZ
// assigned at runtime on Linux, macOS and Windows alike.
process.env.TZ = 'Europe/Rome'

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'jsdom',
      exclude: [...configDefaults.exclude, 'e2e/**'],
      root: fileURLToPath(new URL('./', import.meta.url)),
      setupFiles: ['src/__tests__/helpers/storage.ts', 'src/__tests__/helpers/setup.ts'],
      env: {
        TZ: 'Europe/Rome',
        // A reserved, unresolvable host: a request that escapes the fetch mock
        // can never reach the real backend (and its shared database).
        VITE_API_URL: 'http://api.test',
      },
      coverage: {
        provider: 'v8',
        // Every source file counts, tested or not; main.ts only mounts the app
        // and types.ts holds no code.
        include: ['src/**/*.{ts,vue}'],
        exclude: ['src/main.ts', 'src/api/types.ts', 'src/**/__tests__/**'],
        reporter: [['text', { skipFull: false }], 'text-summary', 'html'],
        reportsDirectory: 'coverage',
        // A few points under what the suite reaches, so a real regression
        // fails CI but an unrelated refactor does not.
        thresholds: {
          lines: 95,
          statements: 95,
          functions: 95,
          branches: 90,
        },
      },
    },
  }),
)
