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
      input: {
        main: resolve(__dirname, 'index.html') // main page
      },
      external: [
        'node-fetch',
        'stream',
        'util',
        'buffer',
        'events',
        'url',
        'http',
        'https',
        'zlib',
        'fs',
        'path',
        'crypto',
        'querystring'
      ]
    }
  },
  publicDir: 'public'
})
