import { readFileSync } from 'node:fs'
import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// semantic-release writes the version of each release into package.json
const { version } = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf-8'))

// https://vite.dev/config/
export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(version),
  },
  plugins: [
    vue(),
    vueDevTools(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  // La build chiama il backend sulla propria origine (.env.production): in
  // "npm run preview" lo raggiunge così, come fa nginx nell'immagine Docker.
  preview: {
    proxy: Object.fromEntries(
      ['/api', '/admin', '/static'].map((path) => [path, 'http://localhost:8000']),
    ),
  },
})
