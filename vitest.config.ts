import { fileURLToPath } from 'node:url'
import { mergeConfig, defineConfig, configDefaults } from 'vitest/config'
import viteConfig from './vite.config'

// Dates are read in Europe/Rome; set before the workers start, on every OS.
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
        // Unresolvable, so no request can reach the real backend.
        VITE_API_URL: 'http://api.test',
      },
      coverage: {
        provider: 'v8',
        // Every source file counts; main.ts and types.ts hold no logic.
        include: ['src/**/*.{ts,vue}'],
        exclude: ['src/main.ts', 'src/api/types.ts', 'src/**/__tests__/**'],
        reporter: [['text', { skipFull: false }], 'text-summary', 'html'],
        reportsDirectory: 'coverage',
        // A few points under the current coverage.
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
