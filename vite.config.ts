import { URL, fileURLToPath } from 'node:url'

import { defineConfig } from 'vite'
import { resolve } from 'path'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'

export default defineConfig({
  plugins: [vue(), vueJsx()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  build: {
    rollupOptions: {
      input: entryPoints('index.html', 'gemini/index.html')
    }
  },
  publicDir: 'public'
})

function entryPoints(...paths: string[]) {
  const entries = paths.map((path) => {
    const name = path.split('/').pop()?.replace('.html', '') || ''
    return [name, resolve(__dirname, path)]
  })

  return Object.fromEntries(entries)
}
