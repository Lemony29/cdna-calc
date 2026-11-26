import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { fileURLToPath, URL } from 'url'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // App instalável e com funcionamento offline (útil no celular/tablet da bancada)
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['litex.png', 'apple-touch-icon.png'],
      manifest: {
        name: 'Lab MasterMix — LITEX',
        short_name: 'MasterMix',
        description: 'Calculadora de master mix e preparo de amostras para síntese de cDNA',
        lang: 'pt-BR',
        theme_color: '#15803d',
        background_color: '#f9fafb',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,ico}'],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'src'),
    },
  },
})
