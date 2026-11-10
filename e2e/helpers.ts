import { expect, type Page } from '@playwright/test'
import path from 'node:path'

export const DEMO = path.join(import.meta.dirname, 'fixtures', 'demo.json')

/** Date figée : les récurrents et le « reste à vivre » sont alors déterministes. */
export const TODAY = new Date('2026-10-29T10:00:00')

/** Ouvre l'app avec les données de démo, importées par l'écran Réglages comme le ferait un utilisateur. */
export async function openWithDemo(page: Page) {
  await page.clock.setFixedTime(TODAY)
  page.on('dialog', (d) => d.accept())
  await page.goto('/#/reglages')
  await page.getByTestId('import-input').setInputFiles(DEMO)
  await expect(page.getByText('Sauvegarde importée.')).toBeVisible()
  await page.getByRole('button', { name: 'Accueil' }).click()
  await expect(page.getByText('Le mois en détail')).toBeVisible()
}

type Point = { x: number; y: number }

/**
 * Glissement tactile réel (CDP) : `duration` règle la vélocité au relâcher,
 * `hold` immobilise le doigt avant de lever (vélocité nulle).
 * Chaque événement porte l'heure à laquelle le doigt y est (option `timestamp`), comme un vrai écran
 * tactile : l'app calcule la vélocité sur `e.timeStamp`, et le geste garde sa vitesse même si la machine
 * de test, en rendu logiciel, met du temps à accuser réception de chaque événement.
 */
export async function touchDrag(
  page: Page,
  from: Point,
  to: Point,
  { duration = 300, steps = 16, hold = 0, release = true } = {},
) {
  const cdp = await page.context().newCDPSession(page)
  const start = Date.now() / 1000
  const at = (ms: number) => start + ms / 1000
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: from.x, y: from.y }], timestamp: at(0) })
  for (let i = 1; i <= steps; i++) {
    const t = i / steps
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [{ x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t }],
      timestamp: at(duration * t),
    })
    // Pas d'attente après le dernier pas : un flick se relâche en mouvement.
    if (i < steps) await page.waitForTimeout(duration / steps)
  }
  if (hold) await page.waitForTimeout(hold)
  const end = { type: 'touchEnd' as const, touchPoints: [] }
  if (release) await cdp.send('Input.dispatchTouchEvent', { ...end, timestamp: at(duration + hold) })
  // Doigt toujours posé : on laisse passer une image pour que la position soit peinte.
  else await page.waitForTimeout(50)
  return {
    // Relâcher plus tard (doigt resté immobile) : horodaté à l'instant réel.
    release: () => cdp.send('Input.dispatchTouchEvent', { ...end, timestamp: Date.now() / 1000 }),
  }
}

/** Translation verticale courante (px) d'un élément, lue depuis sa matrice de transformation. */
export function translateY(page: Page, selector: string) {
  return page.locator(selector).evaluate((el) => new DOMMatrixReadOnly(getComputedStyle(el).transform).m42)
}

export function translateX(page: Page, selector: string) {
  return page.locator(selector).evaluate((el) => new DOMMatrixReadOnly(getComputedStyle(el).transform).m41)
}

/** Attend qu'une animation se pose (valeur stable sur plusieurs images). */
export async function settle(page: Page, read: () => Promise<number>, timeout = 3000) {
  const start = Date.now()
  let previous = await read()
  while (Date.now() - start < timeout) {
    await page.waitForTimeout(100)
    const next = await read()
    if (Math.abs(next - previous) < 0.5) return next
    previous = next
  }
  return previous
}

export async function center(page: Page, selector: string): Promise<Point> {
  const box = await page.locator(selector).first().boundingBox()
  if (!box) throw new Error(`Élément introuvable : ${selector}`)
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 }
}
