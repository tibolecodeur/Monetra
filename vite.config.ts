import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
// Sous-dossier de publication : '/Monetra/' sur GitHub Pages (fixé par la CI), racine en local.
const base = process.env.BASE_PATH ?? '/'

export default defineConfig({
  base,
  // Alias « @/ » attendu par les composants shadcn.
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon-180x180.png'],
      manifest: {
        name: 'Monetra',
        short_name: 'Monetra',
        description: 'Gestion de finances personnelles, 100 % locale.',
        lang: 'fr',
        start_url: base,
        scope: base,
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#05060c',
        theme_color: '#05060c',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Polices : seuls les sous-ensembles latins (français) sont mis en cache hors ligne.
        globPatterns: ['**/*.{js,css,html,svg,png,webmanifest}', '**/*-latin{,-ext}-wght-*.woff2'],
        navigateFallback: `${base}index.html`,
      },
    }),
  ],
})
