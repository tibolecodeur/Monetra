// Génère les icônes PNG de la PWA depuis public/logo-full.svg (source unique, carré plein bord).
// iOS et Android arrondissent eux-mêmes les coins ; le favicon garde son SVG aux coins arrondis.
// Usage : npm run icons
import { chromium } from '@playwright/test'
import { readFile } from 'node:fs/promises'

const svg = await readFile(new URL('../public/logo-full.svg', import.meta.url), 'utf8')
const targets = [
  ['apple-touch-icon-180x180.png', 180],
  ['pwa-192x192.png', 192],
  ['pwa-512x512.png', 512],
  // Le « M » tient déjà dans la zone sûre centrale (cercle de 80 %) exigée pour les icônes masquables.
  ['maskable-icon-512x512.png', 512],
]

const browser = await chromium.launch()
const page = await browser.newPage()
for (const [file, size] of targets) {
  await page.setViewportSize({ width: size, height: size })
  await page.setContent(
    `<style>html,body{margin:0;background:#0d0b12}svg{display:block;width:${size}px;height:${size}px}</style>${svg}`,
  )
  await page.screenshot({ path: new URL(`../public/${file}`, import.meta.url).pathname, omitBackground: false })
  console.log(`public/${file} (${size}×${size})`)
}
await browser.close()
