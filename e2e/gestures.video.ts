import { test, type Page } from '@playwright/test'
import { center, openWithDemo, touchDrag } from './helpers.ts'

/**
 * Enregistrement des vidéos de gestes (npm run record:videos), hors suite de tests.
 * Un cercle est dessiné sous le doigt pour rendre les gestes lisibles à l'écran ;
 * ce marqueur n'existe que dans ces vidéos, pas dans l'app.
 */
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    addEventListener('DOMContentLoaded', () => {
      const dot = document.createElement('div')
      dot.style.cssText =
        'position:fixed;z-index:9999;width:44px;height:44px;margin:-22px 0 0 -22px;border-radius:50%;' +
        'background:rgba(255,255,255,.35);border:2px solid rgba(255,255,255,.8);pointer-events:none;display:none'
      document.body.appendChild(dot)
      const show = (e: TouchEvent) => {
        const t = e.touches[0]
        if (!t) return
        dot.style.display = 'block'
        dot.style.left = `${t.clientX}px`
        dot.style.top = `${t.clientY}px`
      }
      addEventListener('touchstart', show, { capture: true, passive: true })
      addEventListener('touchmove', show, { capture: true, passive: true })
      addEventListener('touchend', () => (dot.style.display = 'none'), { capture: true, passive: true })
    })
  })
})

const pause = (page: Page, ms = 700) => page.waitForTimeout(ms)

test('sheet', async ({ page }) => {
  await openWithDemo(page)
  await pause(page)
  await page.getByRole('button', { name: 'Ajouter une transaction' }).tap()
  await pause(page, 900)
  const grab = await center(page, '[data-testid="sheet-grabber"] .sheet-handle')
  // Suivi 1:1, puis relâché sans élan : la sheet revient.
  await touchDrag(page, grab, { x: grab.x, y: grab.y + 220 }, { duration: 900, steps: 40, hold: 300 })
  await pause(page, 900)
  // Rubber-band vers le haut.
  await touchDrag(page, grab, { x: grab.x, y: grab.y - 240 }, { duration: 800, steps: 40, hold: 300 })
  await pause(page, 900)
  // Flick vers le bas : la projection du momentum ferme la sheet.
  await touchDrag(page, grab, { x: grab.x, y: grab.y + 110 }, { duration: 90, steps: 8 })
  await pause(page, 1200)
  // Réouverture, puis interruption : on rattrape la sheet pendant qu'elle se ferme.
  await page.getByRole('button', { name: 'Ajouter une transaction' }).tap()
  await pause(page, 900)
  await touchDrag(page, grab, { x: grab.x, y: grab.y + 90 }, { duration: 90, steps: 8 })
  await page.waitForTimeout(60)
  const caught = await center(page, '[data-testid="sheet-grabber"] .sheet-handle')
  await touchDrag(page, caught, { x: caught.x, y: caught.y - 60 }, { duration: 500, steps: 25, hold: 250 })
  await pause(page, 1200)
})

test('swipe-suppression', async ({ page }) => {
  await openWithDemo(page)
  await page.getByRole('button', { name: 'Opérations' }).tap()
  await pause(page)
  const row = page.locator('.swipe-content', { hasText: 'Boulangerie' })
  await row.scrollIntoViewIfNeeded()
  const b = (await row.boundingBox())!
  const y = b.y + b.height / 2
  // Sous le seuil : retour élastique.
  await touchDrag(page, { x: b.x + b.width - 30, y }, { x: b.x + b.width - 130, y }, { duration: 700, steps: 30, hold: 300 })
  await pause(page, 900)
  // Au-delà du droit (vers la droite) : rubber-band.
  await touchDrag(page, { x: b.x + 60, y }, { x: b.x + 260, y }, { duration: 700, steps: 30, hold: 300 })
  await pause(page, 900)
  // Glissement franc vers la gauche : suppression, puis annulation depuis le toast.
  await touchDrag(page, { x: b.x + b.width - 30, y }, { x: b.x + 40, y }, { duration: 260, steps: 14 })
  await pause(page, 1500)
  await page.getByRole('button', { name: 'Annuler' }).tap()
  await pause(page, 1500)
})

test('swipe-mois', async ({ page }) => {
  await openWithDemo(page)
  await pause(page)
  const c = await center(page, '.hero')
  // Glissement lent et court : snap de retour.
  await touchDrag(page, c, { x: c.x - 110, y: c.y }, { duration: 800, steps: 35, hold: 300 })
  await pause(page, 900)
  // Flick : le momentum projeté fait passer au mois suivant.
  await touchDrag(page, c, { x: c.x - 100, y: c.y }, { duration: 80, steps: 6 })
  await pause(page, 1300)
  // Retour au mois précédent, puis encore un.
  await touchDrag(page, c, { x: c.x + 200, y: c.y }, { duration: 300, steps: 14 })
  await pause(page, 1300)
  await touchDrag(page, c, { x: c.x + 200, y: c.y }, { duration: 300, steps: 14 })
  await pause(page, 1500)
})
