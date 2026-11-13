import { expect, test, type Page } from '@playwright/test'
import { readFile } from 'node:fs/promises'
import { center, DEMO, openWithDemo, settle, skipSplash, touchDrag, translateX, translateY } from './helpers.ts'

const heroValue = async (page: Page) => Number(await page.locator('.hero-value').getAttribute('data-value'))
// Intl insère des espaces insécables (fines) : on les normalise pour comparer.
const heroText = async (page: Page) =>
  (await page.locator('.hero-value > span[aria-hidden]').innerText()).replace(/[\u00a0\u202f]/g, ' ')
const sheetY = (page: Page) => translateY(page, '[data-testid="sheet"]')
const scrollTo = (page: Page, y: number) => page.evaluate((top) => window.scrollTo(0, top), y)

test.describe('Monetra en émulation iPhone', () => {
  test.beforeEach(({ page }) => skipSplash(page))

  test('ajout d’une transaction et mise à jour du reste à vivre', async ({ page }) => {
    await openWithDemo(page)
    const before = await heroValue(page)
    expect(before).toBe(482.52)

    await page.getByRole('button', { name: 'Ajouter une transaction' }).tap()
    await page.getByLabel('Montant', { exact: true }).fill('12,90')
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
    const [first] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Sauvegarder maintenant' }).tap()])
    const firstPath = await first.path()
    const a = JSON.parse(await readFile(firstPath, 'utf8'))

    // On modifie la base, puis on réimporte la première sauvegarde.
    await page.getByRole('button', { name: 'Ajouter une transaction' }).tap()
    await page.getByLabel('Montant', { exact: true }).fill('50')
    await page.getByRole('radio', { name: 'Loisirs' }).tap()
    await page.getByRole('button', { name: 'Ajouter', exact: true }).tap()
    await expect(page.getByTestId('sheet')).toHaveCount(0)

    await page.getByTestId('import-input').setInputFiles(firstPath)
    await expect(page.getByText('Sauvegarde importée.')).toBeVisible()
    const [second] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Sauvegarder maintenant' }).tap()])
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

  test('bulles de dépenses : une par catégorie, sans chevauchement, doublées d\'une liste lisible', async ({ page }) => {
    await openWithDemo(page)
    const bubbles = page.getByTestId('bubbles')
    await expect(bubbles).toBeVisible()
    // Décoratives pour les lecteurs d'écran : la liste des catégories porte l'information.
    expect(await bubbles.getAttribute('aria-hidden')).toBe('true')
    const discs = await bubbles.locator('.bubble-disc').evaluateAll((els) =>
      els.map((el) => {
        const r = el.getBoundingClientRect()
        return { x: r.x + r.width / 2, y: r.y + r.height / 2, r: r.width / 2 }
      }),
    )
    await expect(page.locator('.cat-tile')).toHaveCount(discs.length)
    expect(discs.length).toBeGreaterThan(1)
    for (const [i, a] of discs.entries())
      for (const b of discs.slice(i + 1)) expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeGreaterThan(a.r + b.r - 1)
    // Aucun fond WebGL : l'app n'a plus de canvas.
    await expect(page.locator('canvas')).toHaveCount(0)
  })

  test('barre d\'onglets : capsule flottante fixe en bas, toujours entière, sans rien masquer', async ({ page }) => {
    await openWithDemo(page)
    const bar = page.locator('.tab-bar')
    const box = (await bar.boundingBox())!
    expect(Math.round(box.y + box.height)).toBe(844)
    expect(Math.round(box.width)).toBe(390)
    // La capsule flotte au-dessus du bord, dans la largeur de l'écran.
    const pill = (await page.locator('.tab-pill').boundingBox())!
    expect(pill.y + pill.height).toBeLessThan(844)
    expect(pill.x).toBeGreaterThanOrEqual(0)
    expect(pill.x + pill.width).toBeLessThanOrEqual(390)
    // Un seul matériau, flouté par un backdrop-filter standard (pas de filtre SVG, pas de WebGL).
    const style = await page.locator('.tab-pill').evaluate((el) => {
      const cs = getComputedStyle(el)
      return { position: cs.position, backdrop: cs.backdropFilter, filter: cs.filter }
    })
    expect(await bar.evaluate((el) => getComputedStyle(el).position)).toBe('fixed')
    expect(style.backdrop).toContain('blur(20px)')
    expect(style.filter).toBe('none')

    // Au défilement, la barre ne bouge pas et garde ses quatre onglets et le bouton d'ajout.
    await scrollTo(page, 600)
    expect((await bar.boundingBox())!.y).toBe(box.y)
    for (const name of ['Accueil', 'Opérations', 'Récurrents', 'Réglages', 'Ajouter une transaction']) {
      const target = (await page.getByRole('button', { name }).boundingBox())!
      expect(target.width).toBeGreaterThanOrEqual(44)
      expect(target.height).toBeGreaterThanOrEqual(44)
    }

    // Sur chaque écran, tout en bas, le dernier élément finit au-dessus de la barre.
    for (const tab of ['Accueil', 'Opérations', 'Récurrents', 'Réglages']) {
      await page.getByRole('button', { name: tab }).tap()
      await expect(page.getByRole('button', { name: tab })).toHaveAttribute('aria-current', 'page')
      // L'écran charge ses données (IndexedDB) : on attend son titre avant de mesurer.
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
      await expect
        .poll(async () => {
          await scrollTo(page, 100_000)
          return page.locator('.screen').evaluate((el) => el.lastElementChild?.getBoundingClientRect().bottom ?? Infinity)
        })
        .toBeLessThanOrEqual(box.y)
    }
  })

  test('retour à l\'appui en CSS, changement d\'onglet et curseur du segmented', async ({ page }) => {
    await openWithDemo(page)
    // Le bouton d'ajout se réduit dès l'appui (pas au relâcher), puis revient.
    const add = page.locator('.tab-add')
    const box = (await add.boundingBox())!
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
    await page.mouse.down()
    await expect.poll(async () => (await add.boundingBox())!.width).toBeLessThan(box.width - 1)
    await page.mouse.move(0, 0)
    await page.mouse.up()
    await expect.poll(async () => (await add.boundingBox())!.width).toBeGreaterThan(box.width - 0.5)

    // Changer d'onglet ne déclenche aucune transition : la teinte est déjà la bonne à l'image suivante.
    const tab = page.getByRole('button', { name: 'Opérations' })
    const active = await page.getByRole('button', { name: 'Accueil' }).evaluate((el) => getComputedStyle(el).color)
    await tab.tap()
    // Dès que l'onglet est marqué actif, sa teinte est déjà la bonne : aucune transition en cours.
    await expect(tab).toHaveAttribute('aria-current', 'page')
    expect(await tab.evaluate((el) => getComputedStyle(el).color)).toBe(active)
    expect(await tab.evaluate((el) => getComputedStyle(el).transitionDuration)).toBe('0s')

    // La pastille glisse jusqu'à l'onglet choisi (layoutId), en passant sous le bouton d'ajout.
    const indicator = page.locator('.tab-indicator')
    await expect(indicator).toHaveCount(1)
    await expect
      .poll(async () => {
        const i = (await indicator.boundingBox())!
        const t = (await tab.boundingBox())!
        return Math.abs(i.x - t.x) < 1 && Math.abs(i.width - t.width) < 1
      })
      .toBe(true)

    // Le curseur du segmented glisse sous l'option choisie.
    const thumb = page.locator('.segment-thumb')
    const option = page.getByRole('radio', { name: 'Revenus' })
    await option.tap()
    await expect(option).toHaveAttribute('aria-checked', 'true')
    await expect
      .poll(async () => {
        const t = (await thumb.boundingBox())!
        const o = (await option.boundingBox())!
        return Math.abs(t.x - o.x) < 1 && Math.abs(t.width - o.width) < 1
      })
      .toBe(true)
  })

  test('appui long : menu contextuel façon iOS, sans ouvrir la fiche', async ({ page }) => {
    await openWithDemo(page)
    await page.getByRole('button', { name: 'Opérations' }).tap()
    const row = page.locator('.swipe-content', { hasText: 'Kebab' })
    await row.scrollIntoViewIfNeeded()
    const c = await center(page, '.swipe-content:has-text("Kebab")')

    // Doigt immobile 600 ms : le menu s'ouvre, la ligne est soulevée, la fiche ne s'ouvre pas.
    await touchDrag(page, c, c, { duration: 0, steps: 1, hold: 600 })
    const menu = page.getByRole('menu', { name: 'Kebab' })
    await expect(menu).toBeVisible()
    await expect(menu.getByRole('menuitem')).toHaveText(['Modifier', 'Dupliquer aujourd’hui', 'Supprimer'])
    await expect(page.getByTestId('sheet')).toHaveCount(0)
    await expect(page.locator('[data-lifted]')).toHaveCount(1)

    // Dupliquer : une seconde ligne, annulable depuis le toast.
    await menu.getByRole('menuitem', { name: 'Dupliquer aujourd’hui' }).tap()
    await expect(menu).toHaveCount(0)
    await expect(page.locator('.swipe-content', { hasText: 'Kebab' })).toHaveCount(2)
    await page.getByRole('button', { name: 'Annuler' }).tap()
    await expect(page.locator('.swipe-content', { hasText: 'Kebab' })).toHaveCount(1)
    await expect(page.locator('[data-lifted]')).toHaveCount(0)

    // Un doigt qui bouge (défilement) n'ouvre rien.
    await touchDrag(page, c, { x: c.x, y: c.y - 60 }, { duration: 600, steps: 12 })
    await expect(page.getByRole('menu')).toHaveCount(0)

    // Toucher le fond ferme le menu ; clic droit à la souris l'ouvre aussi, Échap le ferme.
    // (Le glissement a fait défiler la page : la ligne a bougé.)
    await row.scrollIntoViewIfNeeded()
    const c2 = await center(page, '.swipe-content:has-text("Kebab")')
    await touchDrag(page, c2, c2, { duration: 0, steps: 1, hold: 600 })
    await expect(menu).toBeVisible()
    await page.mouse.click(20, 20)
    await expect(menu).toHaveCount(0)
    await row.click({ button: 'right' })
    await expect(menu).toBeVisible()
    await expect(menu.getByRole('menuitem').first()).toBeFocused()
    await page.keyboard.press('Escape')
    await expect(menu).toHaveCount(0)
  })

  test('réflexes iOS : onglet actif qui remonte, toast balayé', async ({ page }) => {
    await openWithDemo(page)
    // Toucher l'onglet déjà ouvert remonte en haut de l'écran.
    await scrollTo(page, 700)
    await page.getByRole('button', { name: 'Accueil' }).tap()
    await expect.poll(() => page.evaluate(() => scrollY)).toBe(0)
    await expect(page.getByRole('button', { name: 'Accueil' })).toHaveAttribute('aria-current', 'page')

    // Le toast se balaie vers le bas pour le fermer.
    await page.getByRole('button', { name: 'Ajouter une transaction' }).tap()
    await page.getByLabel('Montant', { exact: true }).fill('5')
    await page.getByRole('radio', { name: 'Divers' }).tap()
    await page.getByRole('button', { name: 'Ajouter', exact: true }).tap()
    const toast = page.locator('.toast')
    await expect(toast).toBeVisible()
    const t = await center(page, '.toast')
    await touchDrag(page, t, { x: t.x, y: t.y + 90 }, { duration: 120, steps: 8 })
    await expect(toast).toHaveCount(0)
  })

  test('trajectoire : lecture au doigt, sans changer de mois', async ({ page }) => {
    await openWithDemo(page)
    const chart = page.getByTestId('trajectory')
    await chart.scrollIntoViewIfNeeded()
    await expect(page.locator('.trajectory-insight')).toContainText('Au rythme actuel')
    const box = (await chart.boundingBox())!
    const y = box.y + box.height / 2
    // Glissement horizontal sur la courbe : le curseur suit, le mois ne change pas.
    const finger = await touchDrag(page, { x: box.x + box.width * 0.2, y }, { x: box.x + box.width * 0.7, y }, { duration: 300, release: false })
    await expect(page.locator('.trajectory-cursor')).toHaveCount(1)
    await expect(page.locator('.trajectory-readout')).toContainText(/estimés|dépensés/)
    await expect(page.locator('.month-label')).toHaveText('Octobre 2026')
    expect(Math.abs(await translateX(page, '[data-testid="month-pager"]'))).toBeLessThan(1)
    // Doigt levé : le curseur disparaît.
    await finger.release()
    await expect(page.locator('.trajectory-cursor')).toHaveCount(0)
    // Au clavier : flèches gauche et droite, depuis aujourd'hui (le 29).
    await chart.focus()
    await page.keyboard.press('ArrowLeft')
    await expect(chart).toHaveAttribute('aria-valuetext', /28 octobre/)
  })

  test('mode discret et raccourcis de date', async ({ page }) => {
    await openWithDemo(page)
    // Le mode discret floute les montants, et tient après rechargement.
    await page.getByRole('button', { name: 'Masquer les montants' }).tap()
    await expect(page.locator('html')).toHaveAttribute('data-private', '')
    expect(await page.locator('.hero-value').evaluate((el) => getComputedStyle(el).filter)).toContain('blur')
    await page.reload()
    await expect(page.locator('html')).toHaveAttribute('data-private', '')
    await page.getByRole('button', { name: 'Afficher les montants' }).tap()
    await expect(page.locator('html')).not.toHaveAttribute('data-private')

    // « Hier » en un toucher : l'opération apparaît sous l'en-tête « Hier ».
    await page.getByRole('button', { name: 'Ajouter une transaction' }).tap()
    await page.getByLabel('Montant', { exact: true }).fill('3,10')
    await page.getByRole('radio', { name: 'Divers' }).tap()
    await page.getByLabel('Libellé').fill('Café')
    await page.getByRole('radio', { name: 'Hier' }).tap()
    await page.getByRole('button', { name: 'Ajouter', exact: true }).tap()
    await page.getByRole('button', { name: 'Opérations' }).tap()
    await expect(page.getByRole('region', { name: 'Hier' })).toContainText('Café')
  })

  test('sauvegarde du jour : bandeau à l’heure choisie, fichier, suivi', async ({ page }) => {
    await openWithDemo(page)
    // 10 h : avec le rappel à 21 h par défaut, pas de bandeau.
    await expect(page.getByTestId('backup-banner')).toHaveCount(0)

    // Rappel avancé à 9 h : le bandeau apparaît sur l'accueil, en alerte (jamais sauvegardé).
    await page.getByRole('button', { name: 'Réglages' }).tap()
    await expect(page.getByTestId('last-backup')).toHaveText(/jamais/)
    await page.getByLabel('Heure du rappel').fill('09:00')
    await page.getByRole('button', { name: 'Accueil' }).tap()
    const banner = page.getByTestId('backup-banner')
    await expect(banner).toBeVisible()
    await expect(banner).toHaveClass(/stale/)

    // Sauvegarder : un fichier daté (téléchargé ici ; feuille de partage sur iPhone), le bandeau disparaît.
    const [download] = await Promise.all([page.waitForEvent('download'), banner.getByRole('button', { name: 'Sauvegarder' }).tap()])
    expect(download.suggestedFilename()).toBe('monetra-2026-10-29.json')
    const saved = JSON.parse(await readFile(await download.path(), 'utf8'))
    expect(saved.app).toBe('monetra')
    expect(saved.data.transactions.length).toBeGreaterThan(0)
    await expect(banner).toHaveCount(0)
    await page.getByRole('button', { name: 'Réglages' }).tap()
    await expect(page.getByTestId('last-backup')).toHaveText(/aujourd'hui à \d{1,2} h \d{2}/)

    // Désactivé : plus de bandeau, même dû.
    await page.getByRole('switch', { name: /Rappel quotidien/ }).tap()
    await expect(page.getByLabel('Heure du rappel')).toHaveCount(0)
  })

  test('« Plus tard » reporte le bandeau à demain', async ({ page }) => {
    await openWithDemo(page)
    await page.getByRole('button', { name: 'Réglages' }).tap()
    await page.getByLabel('Heure du rappel').fill('08:00')
    await page.getByRole('button', { name: 'Accueil' }).tap()
    await page.getByRole('button', { name: 'Plus tard (demain)' }).tap()
    await expect(page.getByTestId('backup-banner')).toHaveCount(0)
    await page.reload()
    await expect(page.getByText('Le mois en détail')).toBeVisible()
    await expect(page.getByTestId('backup-banner')).toHaveCount(0)
  })

  test('copies de sécurité : copie du jour, avant import, restauration réversible', async ({ page }) => {
    await openWithDemo(page)
    // À l'ouverture suivante, la copie du jour est prise.
    await page.reload()
    await page.getByRole('button', { name: 'Réglages' }).tap()
    const copies = page.getByTestId('safety-copies')
    await expect(copies.locator('li')).toHaveCount(1)
    await expect(copies).toContainText('Copie du jour')

    // On ajoute une opération, puis on revient à la copie : l'opération disparaît.
    await page.getByRole('button', { name: 'Ajouter une transaction' }).tap()
    await page.getByLabel('Montant', { exact: true }).fill('7')
    await page.getByLabel('Libellé').fill('Opération test')
    await page.getByRole('radio', { name: 'Divers' }).tap()
    await page.getByRole('button', { name: 'Ajouter', exact: true }).tap()
    await page.getByRole('button', { name: 'Opérations' }).tap()
    await expect(page.getByText('Opération test')).toBeVisible()
    await page.getByRole('button', { name: 'Réglages' }).tap()
    await copies.getByRole('button', { name: 'Restaurer' }).tap()
    await expect(page.getByText('Copie restaurée')).toBeVisible()
    await page.getByRole('button', { name: 'Opérations' }).tap()
    await expect(page.getByText('Opération test')).toHaveCount(0)

    // L'état d'avant la restauration est lui-même gardé, et un import est précédé d'une copie.
    await page.getByRole('button', { name: 'Réglages' }).tap()
    await expect(copies).toContainText('Avant une restauration')
    await page.getByTestId('import-input').setInputFiles(DEMO)
    await expect(page.getByText('Sauvegarde importée.')).toBeVisible()
    await expect(copies).toContainText('Avant un import')
    await expect(copies.locator('li')).toHaveCount(3)
  })

  test('mise à jour de la base (v1 → v2) : les données d’un téléphone existant sont conservées', async ({ page }) => {
    await page.clock.setFixedTime(new Date('2026-10-29T10:00:00'))
    // Une page vide sur la même origine crée la base telle que l'app V1 la laissait (Dexie : version 1 = 10).
    await page.route('**/seed-v1', (route) => route.fulfill({ contentType: 'text/html', body: '<!doctype html><title>seed</title>' }))
    await page.goto('/seed-v1')
    await page.evaluate(
      () =>
        new Promise<void>((resolve, reject) => {
          const open = indexedDB.open('monetra', 10)
          open.onupgradeneeded = () => {
            const db = open.result
            db.createObjectStore('accounts', { keyPath: 'id' })
            const tx = db.createObjectStore('transactions', { keyPath: 'id' })
            tx.createIndex('date', 'date')
            tx.createIndex('compteId', 'compteId')
            tx.createIndex('recurringId', 'recurringId')
            db.createObjectStore('recurring', { keyPath: 'id' }).createIndex('compteId', 'compteId')
            db.createObjectStore('budgets', { keyPath: 'categorie' })
            db.createObjectStore('goals', { keyPath: 'id' })
          }
          open.onsuccess = () => {
            const db = open.result
            const t = db.transaction(['accounts', 'transactions'], 'readwrite')
            t.objectStore('accounts').put({ id: 'c', nom: 'Compte courant', type: 'courant', banque: '', solde: 734.86 })
            t.objectStore('transactions').put({
              id: 't1', date: '2026-10-28', montant: 4.2, type: 'depense', categorie: 'resto', compteId: 'c', note: 'Boulangerie',
            })
            t.oncomplete = () => {
              db.close()
              resolve()
            }
            t.onerror = () => reject(t.error)
          }
          open.onerror = () => reject(open.error)
        }),
    )

    // La nouvelle version de l'app ouvre cette base : tout est là, et la copie du jour est prise.
    await page.goto('/#/operations')
    await expect(page.getByText('Boulangerie')).toBeVisible()
    await page.getByRole('button', { name: 'Réglages' }).tap()
    await expect(page.locator('.summary-value')).toHaveText(/734,86/)
    await expect(page.getByTestId('safety-copies')).toContainText('Copie du jour')
  })

  test.describe('écran d’ouverture', () => {
    // Densité ×1 : allège le rendu logiciel des tests pour le chronométrage ; ce qu'on vérifie n'en dépend pas.
    test.use({ deviceScaleFactor: 1 })

    test('écran d’ouverture : le logo rejoint l’en-tête, une fois par session, un toucher le passe', async ({ page, context }) => {
      await openWithDemo(page)
      // Nouvel onglet = nouvelle session (sessionStorage vide), même données.
      const fresh = await context.newPage()
      // Chronométré dans la page, image par image (indépendant de la latence du pilote de test) :
      // de l'apparition de l'écran d'ouverture au fond transparent et au logo posé dans l'en-tête.
      await fresh.addInitScript(() => {
        const w = window as unknown as { splashTiming: { start?: number; clear?: number; landed?: number } }
        w.splashTiming = {}
        const tick = () => {
          const t = w.splashTiming
          const now = performance.now()
          const el = document.querySelector('.splash')
          if (el && t.start === undefined) t.start = now
          if (t.start !== undefined && t.clear === undefined && (!el || Number(getComputedStyle(el).opacity) < 0.05)) t.clear = now
          const logo = document.querySelector('img.brand-mark')?.getBoundingClientRect()
          if (t.start !== undefined && t.landed === undefined && logo && Math.abs(logo.width - 44) < 1) t.landed = now
          if (t.clear === undefined || t.landed === undefined) requestAnimationFrame(tick)
        }
        requestAnimationFrame(tick)
      })
      await fresh.goto('/#/accueil')
      const splash = fresh.getByTestId('splash')
      await expect(splash).toBeVisible()
      const timing = await fresh.waitForFunction(() => {
        const t = (window as unknown as { splashTiming: { start?: number; clear?: number; landed?: number } }).splashTiming
        return t.clear !== undefined && t.landed !== undefined ? t : null
      })
      const { start, landed } = (await timing.jsonValue()) as { start: number; clear: number; landed: number }
      // La transition du logo vers l'en-tête tient en 1,2 s. Le fondu du fond (240 ms prévus) n'est pas chronométré :
      // le rendu logiciel des tests l'étire quand la cascade et les compteurs démarrent en même temps.
      expect(landed - start).toBeLessThanOrEqual(1200)
      expect((await fresh.locator('img.brand-mark').boundingBox())!.y).toBeLessThan(80)
      // Puis il quitte la page et ne bloque aucun toucher.
      await expect(splash).toHaveCount(0)
      await fresh.getByRole('button', { name: 'Opérations' }).tap()
      await expect(fresh.getByRole('heading', { name: 'Opérations', level: 1 })).toBeVisible()
      await fresh.getByRole('button', { name: 'Accueil' }).tap()
      // Une fois par session : un rechargement ne le rejoue pas.
      await fresh.reload()
      await expect(fresh.getByText('Le mois en détail')).toBeVisible()
      await expect(splash).toHaveCount(0)

      // Une autre session : un toucher le passe tout de suite.
      const other = await context.newPage()
      await other.goto('/#/accueil')
      await expect(other.getByTestId('splash')).toBeVisible()
      await other.getByTestId('splash').tap()
      await expect(other.getByTestId('splash')).toHaveCount(0)
      await expect(other.getByText('Le mois en détail')).toBeVisible()
    })
  })

  test('compteurs : montants clés exacts au format fr-FR, rejoués au changement', async ({ page }) => {
    await openWithDemo(page)
    const text = (selector: string) =>
      page.locator(`${selector} > span[aria-hidden]`).innerText().then((t) => t.replace(/[\u00a0\u202f]/g, ' '))
    await expect.poll(() => text('.hero-value')).toBe('482,52 €')
    await expect.poll(() => text('.spending-total')).toBe('803,98 €')
    // Le solde total est en bas de page : il compte quand il arrive à l'écran.
    await page.locator('.footnote').scrollIntoViewIfNeeded()
    await expect.poll(() => text('.footnote .amount')).toBe('4 735,87 €')
    await scrollTo(page, 0)
    // Centimes estompés, valeur finale pour les lecteurs d'écran.
    await expect(page.locator('.hero-value .cents')).toHaveText(/^,52\s€$/)
    await expect(page.locator('.hero-value .sr-only')).toHaveText(/^482,52\s€$/)
    // Changement de mois : le compteur repart de la valeur affichée vers la nouvelle.
    await page.getByRole('button', { name: 'Mois suivant' }).tap()
    await expect.poll(() => page.locator('.hero-value').getAttribute('data-value')).not.toBe('482.52')
    const target = Number(await page.locator('.hero-value').getAttribute('data-value'))
    const expected = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(target).replace(/[\u00a0\u202f]/g, ' ')
    await expect.poll(() => text('.hero-value')).toBe(expected)
    // Opérations : « Sorties » compte aussi.
    await page.getByRole('button', { name: 'Mois précédent' }).tap()
    await expect(page.locator('.month-label')).toHaveText('Octobre 2026')
    await page.getByRole('button', { name: 'Opérations' }).tap()
    await expect.poll(() => text('.pill .amount:not(.revenu)')).toBe('−803,98 €')
  })

  test('cascade et transitions : jouées une fois, sans bloquer les touchers', async ({ page }) => {
    await openWithDemo(page)
    // Première arrivée de la session sur l'accueil : cascade ; elle ne revient pas aux arrivées suivantes.
    await expect(page.locator('.month-pager.cascade')).toHaveCount(1)
    await page.getByRole('button', { name: 'Opérations' }).tap()
    // Pendant la transition d'entrée, l'écran répond déjà : on touche immédiatement le filtre.
    await page.getByRole('radio', { name: 'Revenus' }).tap()
    await expect(page.getByRole('radio', { name: 'Revenus' })).toHaveAttribute('aria-checked', 'true')
    await page.getByRole('button', { name: 'Accueil' }).tap()
    await expect(page.getByText('Le mois en détail')).toBeVisible()
    await expect(page.locator('.month-pager.cascade')).toHaveCount(0)
    // La transition d'entrée se pose bien (pas de transformation résiduelle).
    await expect.poll(() => page.locator('.screen-enter').evaluate((el) => getComputedStyle(el).opacity)).toBe('1')
  })

  test.describe('avec l’apparence claire du système', () => {
    test.use({ colorScheme: 'light' })

    test('le thème Auto suit le système', async ({ page }) => {
      await openWithDemo(page)
      await expect(page.locator('html')).not.toHaveAttribute('data-theme', 'light')
      await page.getByRole('button', { name: 'Réglages' }).tap()
      await page.getByRole('radio', { name: 'Auto' }).tap()
      await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
      await page.emulateMedia({ colorScheme: 'dark' })
      await expect(page.locator('html')).not.toHaveAttribute('data-theme', 'light')
      // Gardé après rechargement, appliqué avant le premier rendu.
      await page.emulateMedia({ colorScheme: 'light' })
      await page.reload()
      await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
    })
  })

  test.describe('avec un contraste renforcé', () => {
    test.use({ contrast: 'more' })

    test('barres opaques, sans flou, dans les deux thèmes', async ({ page }) => {
      await openWithDemo(page)
      const read = () =>
        page.locator('.tab-pill').evaluate((el) => {
          const cs = getComputedStyle(el)
          return { background: cs.backgroundColor, backdrop: cs.backdropFilter }
        })
      const dark = await read()
      expect(dark.background).toMatch(/^rgb\(/) // couleur pleine, sans transparence
      expect(dark.backdrop).toBe('none')

      await page.getByRole('button', { name: 'Réglages' }).tap()
      await page.getByRole('radio', { name: 'Clair' }).tap()
      await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
      const light = await read()
      expect(light.background).toMatch(/^rgb\(/)
      expect(light.background).not.toBe(dark.background)
      expect(light.backdrop).toBe('none')
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
      await page.getByLabel('Montant', { exact: true }).fill('12,90')
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

      // Mouvement réduit : ni écran d'ouverture (même dans une nouvelle session) ni cascade.
      const fresh = await page.context().newPage()
      await fresh.goto('/#/accueil')
      await expect(fresh.getByText('Le mois en détail')).toBeVisible()
      await expect(fresh.getByTestId('splash')).toHaveCount(0)
      expect(await fresh.locator('.month-pager > *').first().evaluate((el) => getComputedStyle(el).animationName)).toBe('none')
      await fresh.close()

      await page.getByRole('button', { name: 'Accueil' }).tap()
      await info.attach('accueil-mouvement-reduit', { body: await page.screenshot(), contentType: 'image/png' })
    })
  })
})
