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
    },
  }),
)
