import { expect, test, type Page } from '@playwright/test'
import { readFile } from 'node:fs/promises'
import { center, openWithDemo, settle, touchDrag, translateX, translateY } from './helpers.ts'

const heroValue = async (page: Page) => Number(await page.locator('.hero-value').getAttribute('data-value'))
// Intl insère des espaces insécables (fines) : on les normalise pour comparer.
const heroText = async (page: Page) =>
  (await page.locator('.hero-value > span[aria-hidden]').innerText()).replace(/[\u00a0\u202f]/g, ' ')
const sheetY = (page: Page) => translateY(page, '[data-testid="sheet"]')
// L'app défile dans .scroller (la fenêtre ne défile pas : voir App.tsx).
const scrollTo = (page: Page, y: number) => page.locator('.scroller').evaluate((el, top) => el.scrollTo(0, top), y)

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

    // Même geste sur un récurrent. La tab bar s'est réduite au défilement : on remonte pour la rouvrir.
    await scrollTo(page, 0)
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

  test('Liquid Glass : une scène filtrée, une lentille par surface de verre', async ({ page }) => {
    await openWithDemo(page)
    await expect(page.locator('.tab-bar')).toHaveAttribute('data-glass', 'live')
    // Le filtre est posé sur le contenu (pas un backdrop-filter) : c'est ce qui le rend possible sur Safari.
    const scene = await page.locator('.scene').evaluate((el) => {
      const id = el.style.filter.match(/#([^")]+)/)?.[1] ?? ''
      const filter = document.getElementById(id)
      const maps = [...(filter?.querySelectorAll('feImage') ?? [])]
      const bar = document.querySelector('.tab-bar')!.getBoundingClientRect()
      return {
        id,
        units: filter?.getAttribute('primitiveUnits'),
        maps: maps.map((m) => m.getAttribute('href')?.slice(0, 22)),
        // La lentille de la tab bar suit sa position réelle à l'écran.
        barLens: maps.some(
          (m) => Math.abs(Number(m.getAttribute('x')) - bar.x) < 2 && Math.abs(Number(m.getAttribute('y')) - bar.y) < 2,
        ),
        maxScale: Math.max(...[...(filter?.querySelectorAll('feDisplacementMap') ?? [])].map((d) => Number(d.getAttribute('scale')))),
        backdrop: getComputedStyle(document.querySelector('.tab-bar')!).backdropFilter,
      }
    })
    expect(scene.id).not.toBe('')
    expect(scene.units).toBe('userSpaceOnUse')
    expect(scene.maps.length).toBeGreaterThanOrEqual(3)
    expect(scene.maps.every((m) => m === 'data:image/png;base64,')).toBe(true)
    expect(scene.barLens).toBe(true)
    expect(scene.maxScale).toBeGreaterThan(10)
    expect(scene.backdrop).toBe('none')

    // Au défilement, la lentille du sélecteur de mois suit le contrôle.
    const before = await page.locator('.month-switcher').boundingBox()
    await scrollTo(page, 60)
    await expect
      .poll(() =>
        page.locator('.scene').evaluate((el, y) => {
          const id = el.style.filter.match(/#([^")]+)/)?.[1] ?? ''
          return [...document.getElementById(id)!.querySelectorAll('feImage')].some(
            (m) => Math.abs(Number(m.getAttribute('y')) - y) < 2,
          )
        }, before!.y - 60),
      )
      .toBe(true)
  })

  test('lentille de sélection : on fait glisser la bulle de la tab bar d\'un onglet à l\'autre', async ({ page }) => {
    await openWithDemo(page)
    const bubble = page.locator('.tab-bubble')
    const start = (await bubble.boundingBox())!
    const tabs = (await page.locator('.tab-items').boundingBox())!
    const step = tabs.width / 4
    const y = start.y + start.height / 2
    // Doigt posé sur l'onglet actif, glissé vers « Récurrents » : la bulle suit le doigt, soulevée.
    const held = await touchDrag(page, { x: start.x + start.width / 2, y }, { x: start.x + start.width / 2 + step * 2, y }, { duration: 400, release: false })
    await expect(bubble).toHaveAttribute('data-lifted', '')
    const during = (await bubble.boundingBox())!
    expect(during.x + during.width / 2).toBeGreaterThan(start.x + start.width / 2 + step * 1.5)
    await page.waitForTimeout(150)
    await held.release()
    await expect(page.getByRole('heading', { name: 'Récurrents', level: 1 })).toBeVisible()
    await expect(bubble).not.toHaveAttribute('data-lifted', '')
    // Elle se pose sur l'onglet choisi.
    await expect
      .poll(async () => {
        const b = (await bubble.boundingBox())!
        return Math.round(b.x + b.width / 2 - (tabs.x + step * 2.5))
      })
      .toBe(0)
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

  test('tab bar réduite au défilement vers le bas, rouverte en remontant ou au toucher', async ({ page }) => {
    await openWithDemo(page)
    const dock = page.locator('.tab-dock')
    const bar = page.locator('.tab-bar')
    const full = (await bar.boundingBox())!.width
    await scrollTo(page, 500)
    await expect(dock).toHaveAttribute('data-minimized', 'true')
    await expect.poll(async () => (await bar.boundingBox())!.width).toBeLessThan(80)
    await expect(page.getByRole('button', { name: 'Opérations' })).toBeHidden()
    // Remonter un peu suffit à la rouvrir.
    await scrollTo(page, 440)
    await expect(dock).not.toHaveAttribute('data-minimized')
    // Toucher l'onglet de la barre réduite la rouvre aussi, sans changer d'écran.
    await scrollTo(page, 800)
    await expect(dock).toHaveAttribute('data-minimized', 'true')
    await page.getByRole('button', { name: 'Accueil' }).tap()
    await expect(dock).not.toHaveAttribute('data-minimized')
    await expect.poll(async () => (await bar.boundingBox())!.width).toBeGreaterThan(full - 2)
  })

  test.describe('sur iPhone (Safari)', () => {
    test.use({
      userAgent:
        'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1',
    })

    test('Liquid Glass : même scène, avec un nouvel identifiant de filtre à chaque changement', async ({ page }) => {
      const errors: string[] = []
      page.on('pageerror', (e) => errors.push(String(e)))
      await openWithDemo(page)
      // Safari garde en cache le résultat d'un filtre par identifiant : la scène en change à chaque mise à jour.
      const id = () => page.locator('.scene').evaluate((el) => el.style.filter)
      const first = await id()
      expect(first).toMatch(/url\("?#lg-scene-\d+-v\d+/)
      await scrollTo(page, 80)
      await expect.poll(id).not.toBe(first)
      expect(await page.locator('[data-glass="live"]').count()).toBeGreaterThanOrEqual(3)
      expect(errors).toEqual([])
    })
  })

  test.describe('avec un contraste renforcé', () => {
    test.use({ contrast: 'more' })

    test('verre opaque, sans réfraction', async ({ page }) => {
      await openWithDemo(page)
      await expect(page.locator('.tab-bar')).toHaveAttribute('data-glass', 'material')
      expect(await page.locator('.scene').evaluate((el) => el.style.filter)).toBe('')
      const bg = await page.locator('.tab-bar').evaluate((el) => getComputedStyle(el).backgroundColor)
      expect(bg).toMatch(/^rgb\(/) // couleur pleine, sans transparence
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

      // Le chiffre change directement, sans animation intermédiaire : seules l'ancienne et la nouvelle valeur s'affichent.
      await expect.poll(() => heroValue(page)).toBe(469.62)
      const seen = new Set<string>()
      await expect
        .poll(async () => {
          const text = await heroText(page)
          seen.add(text)
          return text
        })
        .toBe('469,62 €')
      expect([...seen].every((t) => t === '482,52 €' || t === '469,62 €')).toBe(true)

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
