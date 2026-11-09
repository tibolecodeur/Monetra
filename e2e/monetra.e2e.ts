import { expect, test, type Page } from '@playwright/test'
import { readFile } from 'node:fs/promises'
import { center, openWithDemo, settle, touchDrag, translateX, translateY } from './helpers.ts'

const heroValue = async (page: Page) => Number(await page.locator('.hero-value').getAttribute('data-value'))
// Intl insère des espaces insécables (fines) : on les normalise pour comparer.
const heroText = async (page: Page) =>
  (await page.locator('.hero-value > span[aria-hidden]').innerText()).replace(/[\u00a0\u202f]/g, ' ')
const sheetY = (page: Page) => translateY(page, '[data-testid="sheet"]')

test.describe('Monetra en émulation iPhone', () => {
  test('ajout d’une transaction et mise à jour du reste à vivre', async ({ page }) => {
    await openWithDemo(page)
    const before = await heroValue(page)
    expect(before).toBe(482.52)

    await page.getByRole('button', { name: 'Ajouter une transaction' }).tap()
    await page.getByLabel('Montant').fill('12,90')
    await page.getByRole('radio', { name: 'Courses' }).tap()
    await page.getByRole('button', { name: 'Ajouter', exact: true }).tap()

    await expect(page.getByTestId('sheet')).toHaveCount(0)
    await expect(page.getByText(/Dépense de 12,90\s€ ajoutée/)).toBeVisible()
    await expect.poll(() => heroValue(page)).toBe(469.62)
    // Le chiffre glisse en spring vers sa nouvelle valeur, puis s'y pose.
    await expect.poll(() => heroText(page)).toBe('469,62 €')
  })

  test('ouverture et fermeture de la sheet par glissement', async ({ page }) => {
    await openWithDemo(page)
    await page.getByRole('button', { name: 'Ajouter une transaction' }).tap()
    await expect.poll(() => settle(page, () => sheetY(page))).toBeLessThan(1)
    const grab = await center(page, '[data-testid="sheet-grabber"] .sheet-handle')

    // Suivi 1:1 pendant le geste (au seuil d'engagement près).
    const held = await touchDrag(page, grab, { x: grab.x, y: grab.y + 160 }, { duration: 400, release: false })
    const during = await sheetY(page)
    expect(during).toBeGreaterThan(160 - 10 - 6)
    expect(during).toBeLessThan(160 + 6)
    await page.waitForTimeout(150) // doigt immobile : vélocité nulle
    await held.release()
    // Pas assez loin et sans élan : la sheet revient.
    await expect.poll(() => settle(page, () => sheetY(page))).toBeLessThan(1)
    await expect(page.getByTestId('sheet')).toBeVisible()

    // Rubber-band vers le haut : la sheet résiste au lieu de suivre.
    const up = await touchDrag(page, grab, { x: grab.x, y: grab.y - 200 }, { duration: 400, release: false })
    const stretched = await sheetY(page)
    expect(stretched).toBeLessThan(0)
    expect(stretched).toBeGreaterThan(-110)
    await page.waitForTimeout(150)
    await up.release()
    await expect.poll(() => settle(page, () => sheetY(page))).toBeGreaterThan(-1)

    // Petit flick vers le bas : la projection du momentum ferme la sheet.
    await touchDrag(page, grab, { x: grab.x, y: grab.y + 90 }, { duration: 60, steps: 6 })
    await expect(page.getByTestId('sheet')).toHaveCount(0)
  })

  test('swipe pour supprimer puis annulation', async ({ page }) => {
    await openWithDemo(page)
    await page.getByRole('button', { name: 'Opérations' }).tap()
    const row = page.locator('.swipe-content', { hasText: 'Kebab' })
    await row.scrollIntoViewIfNeeded()
    const box = (await row.boundingBox())!
    const y = box.y + box.height / 2

    // Glissement court et lent : sous le seuil, la ligne revient en place.
    await touchDrag(page, { x: box.x + box.width - 40, y }, { x: box.x + box.width - 120, y }, { duration: 500, hold: 150 })
    await expect.poll(() => settle(page, () => translateX(page, '.swipe-content:has-text("Kebab")'))).toBeGreaterThan(-1)
    await expect(row).toBeVisible()

    // Glissement rapide vers la gauche : suppression, sans dialogue de confirmation.
    await touchDrag(page, { x: box.x + box.width - 40, y }, { x: box.x + 60, y }, { duration: 120, steps: 8 })
    await expect(page.locator('.swipe-content', { hasText: 'Kebab' })).toHaveCount(0)
    await expect(page.getByText('Transaction supprimée')).toBeVisible()

    // Annuler depuis le toast restaure la ligne.
    await page.getByRole('button', { name: 'Annuler' }).tap()
    await expect(page.locator('.swipe-content', { hasText: 'Kebab' })).toBeVisible()

    // Même geste sur un récurrent.
    await page.getByRole('button', { name: 'Récurrents' }).tap()
    // L'écran Opérations a aussi une ligne « Forfait mobile » (transaction générée) : on attend le bon écran.
    await expect(page.getByRole('heading', { name: 'Récurrents', level: 1 })).toBeVisible()
    const rec = page.locator('.swipe-content', { hasText: 'Forfait mobile' })
    await rec.scrollIntoViewIfNeeded()
    const rbox = (await rec.boundingBox())!
    const ry = rbox.y + rbox.height / 2
    await touchDrag(page, { x: rbox.x + rbox.width - 40, y: ry }, { x: rbox.x + 60, y: ry }, { duration: 120, steps: 8 })
    await expect(page.locator('.swipe-content', { hasText: 'Forfait mobile' })).toHaveCount(0)
    await expect(page.getByText('« Forfait mobile » supprimé')).toBeVisible()
    await page.getByRole('button', { name: 'Annuler' }).tap()
    await expect(page.locator('.swipe-content', { hasText: 'Forfait mobile' })).toBeVisible()
  })

  test('changement de mois par swipe', async ({ page }) => {
    await openWithDemo(page)
    const label = page.locator('.month-label')
    await expect(label).toHaveText('Octobre 2026')
    const c = await center(page, '.hero')

    // Glissement lent et court : snap de retour sur le même mois.
    await touchDrag(page, c, { x: c.x - 90, y: c.y }, { duration: 500, hold: 150 })
    await expect.poll(() => settle(page, () => translateX(page, '[data-testid="month-pager"]'))).toBeGreaterThan(-1)
    await expect(label).toHaveText('Octobre 2026')

    // Flick court mais rapide : le momentum projeté suffit à passer au mois suivant.
    await touchDrag(page, c, { x: c.x - 90, y: c.y }, { duration: 70, steps: 6 })
    await expect(label).toHaveText('Novembre 2026')

    // Deux glissements vers la droite : retour à octobre, puis septembre.
    await touchDrag(page, c, { x: c.x + 220, y: c.y }, { duration: 160, steps: 8 })
    await expect(label).toHaveText('Octobre 2026')
    await touchDrag(page, c, { x: c.x + 220, y: c.y }, { duration: 160, steps: 8 })
    await expect(label).toHaveText('Septembre 2026')
    await expect.poll(() => settle(page, () => translateX(page, '[data-testid="month-pager"]'))).toBeLessThan(1)
  })

  test('export puis import JSON avec données identiques', async ({ page }) => {
    await openWithDemo(page)
    await page.getByRole('button', { name: 'Réglages' }).tap()
    const [first] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Exporter' }).tap()])
    const firstPath = await first.path()
    const a = JSON.parse(await readFile(firstPath, 'utf8'))

    // On modifie la base, puis on réimporte la première sauvegarde.
    await page.getByRole('button', { name: 'Ajouter une transaction' }).tap()
    await page.getByLabel('Montant').fill('50')
    await page.getByRole('radio', { name: 'Loisirs' }).tap()
    await page.getByRole('button', { name: 'Ajouter', exact: true }).tap()
    await expect(page.getByTestId('sheet')).toHaveCount(0)

    await page.getByTestId('import-input').setInputFiles(firstPath)
    await expect(page.getByText('Sauvegarde importée.')).toBeVisible()
    const [second] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Exporter' }).tap()])
    const b = JSON.parse(await readFile(await second.path(), 'utf8'))

    const normalize = (data: Record<string, { id?: string; categorie?: string }[]>) =>
      Object.fromEntries(
        Object.entries(data).map(([k, list]) => [
          k,
          [...list].sort((x, y) => String(x.id ?? x.categorie).localeCompare(String(y.id ?? y.categorie))),
        ]),
      )
    expect(b.app).toBe('monetra')
    expect(normalize(b.data)).toEqual(normalize(a.data))
    expect(a.data.transactions.length).toBeGreaterThan(0)
  })

  test('fond plasma derrière tous les écrans, sans bloquer les touchers', async ({ page }) => {
    await openWithDemo(page)
    const background = page.getByTestId('app-background')
    for (const tab of ['Accueil', 'Opérations', 'Récurrents', 'Réglages']) {
      await page.getByRole('button', { name: tab }).tap()
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
      await expect(background.locator('canvas')).toBeVisible()
    }
    const style = await background.evaluate((el) => getComputedStyle(el))
    expect(style.position).toBe('fixed')
    expect(style.pointerEvents).toBe('none')
    expect(await background.getAttribute('aria-hidden')).toBe('true')
    // Le centre de l'écran appartient au contenu, pas au fond.
    const hit = await page.evaluate(() => document.elementFromPoint(innerWidth / 2, innerHeight / 2)?.closest('[data-testid="app-background"]'))
    expect(hit).toBeNull()
  })

  test('Liquid Glass : réfraction SVG sur Chrome', async ({ page }) => {
    await openWithDemo(page)
    const bar = page.locator('.tab-bar')
    await expect(bar).toBeVisible()
    expect(await page.locator('.lg--svg').count()).toBeGreaterThanOrEqual(3)
    expect(await page.locator('.lg--webgl, .lg--frost').count()).toBe(0)
    // Le verre filtre son arrière-plan avec un filtre SVG : carte de déplacement calculée + flou + saturation.
    const glass = await bar.evaluate((el) => {
      const id = getComputedStyle(el).backdropFilter.match(/url\("?#([^")]+)/)?.[1] ?? ''
      const filter = document.getElementById(id)
      return {
        id,
        scale: Number(filter?.querySelector('feDisplacementMap')?.getAttribute('scale')),
        map: filter?.querySelector('feImage')?.getAttribute('href')?.slice(0, 22),
        specular: getComputedStyle(el.querySelector('.lg-specular')!).backgroundImage.slice(0, 26),
      }
    })
    expect(glass.id).not.toBe('')
    expect(glass.scale).toBeGreaterThan(4)
    expect(glass.map).toBe('data:image/png;base64,')
    expect(glass.specular).toContain('data:image/png')
  })

  test('Liquid Glass interactif : le verre gonfle et s\'éclaire sous le doigt', async ({ page }) => {
    await openWithDemo(page)
    const add = page.locator('.tab-add-glass')
    const box = (await add.boundingBox())!
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
    await page.mouse.down()
    await expect(add).toHaveAttribute('data-pressed', 'true')
    await expect.poll(() => add.evaluate((el) => el.getBoundingClientRect().width)).toBeGreaterThan(box.width + 1)
    expect(await add.evaluate((el) => getComputedStyle(el).getPropertyValue('--lg-x'))).not.toBe('')
    await page.mouse.up()
    await expect(add).not.toHaveAttribute('data-pressed')
  })

  test.describe('sur iPhone (Safari)', () => {
    test.use({
      userAgent:
        'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1',
    })

    test('Liquid Glass : réfraction WebGL du fond plasma', async ({ page }) => {
      const errors: string[] = []
      page.on('pageerror', (e) => errors.push(String(e)))
      await page.goto('/#/accueil')
      // Safari ne gère pas la réfraction SVG : chaque verre réfracte le canvas plasma en WebGL.
      await expect.poll(() => page.locator('.lg--webgl').count(), { timeout: 15_000 }).toBeGreaterThanOrEqual(3)
      expect(await page.locator('.lg--svg, .lg--frost').count()).toBe(0)
      const canvas = page.locator('.tab-bar .lg-canvas')
      await expect(canvas).toBeVisible()
      expect(await canvas.evaluate((c: HTMLCanvasElement) => c.width * c.height)).toBeGreaterThan(0)
      // Le fond plasma expose son numéro d'image, que le verre suit.
      await expect.poll(() => page.getByTestId('app-background').locator('canvas').getAttribute('data-frame')).not.toBeNull()
      expect(errors).toEqual([])
    })
  })

  test.describe('avec prefers-reduced-motion', () => {
    test.use({ reducedMotion: 'reduce' })

    test('rendu sans glissement ni spring', async ({ page }, info) => {
      await openWithDemo(page)
      expect(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(true)

      // La sheet apparaît en fondu, sans translation.
      await page.getByRole('button', { name: 'Ajouter une transaction' }).tap()
      await page.waitForTimeout(30)
      expect(Math.abs(await sheetY(page))).toBeLessThan(1)
      await page.getByLabel('Montant').fill('12,90')
      await page.getByRole('radio', { name: 'Courses' }).tap()
      await page.getByRole('button', { name: 'Ajouter', exact: true }).tap()

      // Le chiffre change directement, sans animation intermédiaire.
      await expect.poll(() => heroValue(page)).toBe(469.62)
      expect(await heroText(page)).toBe('469,62 €')

      // Le changement de mois est un fondu : le contenu ne se translate pas.
      const c = await center(page, '.hero')
      await touchDrag(page, c, { x: c.x - 220, y: c.y }, { duration: 140, steps: 8 })
      await expect(page.locator('.month-label')).toHaveText('Novembre 2026')
      expect(Math.abs(await translateX(page, '[data-testid="month-pager"]'))).toBeLessThan(1)

      await page.getByRole('button', { name: 'Accueil' }).tap()
      await info.attach('accueil-mouvement-reduit', { body: await page.screenshot(), contentType: 'image/png' })
    })
  })
})
