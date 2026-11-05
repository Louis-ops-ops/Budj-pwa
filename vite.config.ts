import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { version } from './package.json'
import vercel from './vercel.json'

// Tells which build runs on the phone (Réglages).
const build = new Date().toISOString().slice(0, 16).replace('T', ' ')

// npm run preview serves the same security headers as production.
const previewHeaders = Object.fromEntries(vercel.headers[0].headers.map((h) => [h.key, h.value]))

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(`${version} (${build})`)
  },
  preview: {
    headers: previewHeaders
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      injectRegister: false,
      manifest: {
        id: './',
        name: 'Budj',
        short_name: 'Budj',
        description: 'Gestion de budget personnel, sur ton appareil',
        lang: 'fr',
        display: 'standalone',
        orientation: 'portrait',
        start_url: './#/',
        scope: './',
        background_color: '#FBFBFB',
        theme_color: '#4549FF',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'icons/icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{html,js,css,woff,woff2,png,svg}'],
        cleanupOutdatedCaches: true
      }
    })
  ]
})
