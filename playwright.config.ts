import { defineConfig } from '@playwright/test'

// Émulation iPhone (390×844, tactile) sur Chromium : c'est le navigateur disponible ici,
// et les gestes tactiles sont injectés via CDP (Input.dispatchTouchEvent).
const iphone = {
  browserName: 'chromium' as const,
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 3,
  isMobile: true,
  hasTouch: true,
  userAgent:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1',
  locale: 'fr-FR',
  timezoneId: 'Europe/Paris',
  // Rendu GPU logiciel : le compositing headless par défaut floute mal le bas des matériaux (backdrop-filter).
  launchOptions: { args: ['--lang=fr-FR', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] },
}

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list'], ['json', { outputFile: 'test-results/results.json' }]],
  use: { baseURL: 'http://localhost:4173', trace: 'retain-on-failure' },
  webServer: {
    command: 'npm run build && npx vite preview --port 4173 --strictPort',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [
    { name: 'iphone', testMatch: /.*\.e2e\.ts/, use: iphone },
    {
      // Enregistrement des vidéos de gestes (npm run record:videos), hors suite de tests.
      name: 'videos',
      testMatch: /.*\.video\.ts/,
      use: { ...iphone, deviceScaleFactor: 2, video: { mode: 'on', size: { width: 390, height: 844 } } },
    },
  ],
})
