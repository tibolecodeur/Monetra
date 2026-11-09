# Design System Master File

> **LOGIC:** When building a specific page, first check `design-system/monetra/pages/[page-name].md`.
> If that file exists, its rules **override** this Master file.
> If not, strictly follow the rules below.

---

**Project:** Monetra
**Generated:** 2026-10-29 15:12:45 (ui-ux-pro-max)
**Revised:** 2026-10-29 : thème sombre pro, puis version fluide « style Apple » (springs, gestes)
**Revised:** 2026-11-09 : **Liquid Glass physique sur fond plasma** (réfraction de Snell, liseré spéculaire, palette tirée du plasma)
**Sources :** skill `ui-ux-pro-max` (style « liquid-glass », composants) et skill `apple-design` (`.claude/skills/apple-design/SKILL.md`).
En cas de conflit sur **le mouvement, la typographie ou les matériaux, `apple-design` prime.**
**Category:** Personal Finance Tracker (PWA mobile, 100 % locale)

---

## Principe

Le fond plasma animé donne la palette et la profondeur. Comme sur iOS 26 :

- **Liquid Glass réel pour la navigation et les contrôles** : tab bar, bouton +, barre de titre compacte, sélecteur de mois, contrôle segmenté, toast, boutons secondaires. Le verre réfracte ce qui est derrière.
- **Matériau dépoli pour le contenu** (cartes) : il reste sur sa propre couche, plus calme que le verre (règle du style « liquid-glass » : le verre est réservé à la navigation et aux contrôles).
- **Sheets** en verre épais dépoli (grande surface déplacée au doigt : pas de réfraction, trop coûteuse).

## Global Rules

### Theme

- **Sombre par défaut**. Thème clair dans Réglages, mémorisé sur l'appareil, appliqué avant le premier rendu.
- `theme-color` : `#000000` (manifest et meta) ; `#F2F2F7` en clair.

### Couleurs : sombre (défaut)

| Rôle | Valeur | Variable |
|------|--------|----------|
| Fond (sous le plasma) | `#05060C` | `--color-bg` |
| Libellé principal | `#FFFFFF` | `--color-text` |
| Libellé secondaire | `rgba(235,235,245,0.66)` | `--color-text-secondary` |
| Libellé tertiaire (décoratif) | `rgba(235,235,245,0.34)` | `--color-text-tertiary` |
| Texte posé sur le plasma | `rgba(255,255,255,0.86)` | `--color-text-on-bg` |
| Accent (pervenche, tiré du plasma) : remplissage | `#5468E0` | `--color-accent` |
| Accent : texte, onglet actif, liens, sélection | `#A8B6FF` | `--color-accent-text` |
| Revenus | `#30D158` | `--color-income` |
| Danger | `#FF6961` (texte), `#FF453A` (fond du swipe) | `--color-danger*` |
| Matériau du contenu (cartes) | `rgba(17,20,36,0.60)` + flou 22px | `--material-content` |
| Feuille (sheet) | `rgba(22,25,42,0.86)` + flou 40px | `--glass-sheet` |
| Remplissage (tuiles, champs, puces) | `rgba(120,132,180,0.20)` | `--color-fill` |
| Séparateurs | `rgba(255,255,255,0.10)` | `--color-separator` |

### Couleurs : clair

| Rôle | Valeur | Variable |
|------|--------|----------|
| Fond | `#EEF0F8` | `--color-bg` |
| Libellés principal / secondaire / tertiaire | `#000000` / `rgba(60,60,67,0.82)` / `rgba(60,60,67,0.42)` | `--color-text*` |
| Texte posé sur le plasma | `rgba(28,30,44,0.86)` | `--color-text-on-bg` |
| Accent : remplissage / texte | `#4A5EE0` / `#3A4FD0` | `--color-accent`, `--color-accent-text` |
| Revenus | `#196B2E` | `--color-income` |
| Danger | `#D70015` | `--color-danger` |
| Matériau du contenu | `rgba(255,255,255,0.66)` + flou | `--material-content` |

### Couleurs de catégories (pastilles d'icônes et barres)

Palette système iOS, glyphe blanc sur pastille arrondie (façon Réglages iOS). L'identité ne repose jamais sur la couleur seule : chaque pastille est accompagnée de son libellé.

| Catégorie | Sombre | Clair |
|-----------|--------|-------|
| Logement | `#FF9F0A` | `#FF9500` |
| Courses | `#40C8E0` | `#32ADE6` |
| Resto | `#FF453A` | `#FF3B30` |
| Abonnements | `#BF5AF2` | `#AF52DE` |
| Loisirs | `#FF375F` | `#FF2D55` |
| Épargne | `#5E5CE6` | `#5856D6` |
| Divers | `#8E8E93` | `#8E8E93` |
| Revenu | `#30D158` | `#34C759` |

### Contrastes vérifiés (WCAG AA)

Mesurés **sur le rendu réel** : le texte est rendu invisible, puis le fond (plasma + verre + matériaux) est photographié sur plusieurs images. Le pire cas (2e centile des pixels sous chaque texte) est calculé pour tous les styles de texte, sur les 4 écrans, en haut de page et après défilement.

- **Sombre** : tous les styles ≥ 4,93:1.
- **Clair** : tous les styles ≥ 4,59:1.
- Les bordures des champs restent au-dessus de 3:1.

### Typographie (apple-design §15)

- **SF Pro sous Safari, Inter ailleurs** (`@supports (font: -apple-system-body)`) ; **SF Pro Rounded** (`ui-rounded`) pour les montants clés sous Safari.
- Tailles en `rem`, tracking et interlignage par taille (tokens `--fs-*`, `--ls-*`, `--lh-*`), montants en `tabular-nums`.

| Rôle | Taille | Graisse |
|------|--------|---------|
| Grand titre d'écran (repliable) | 34px | 700 |
| Titre de la barre compacte | 17px | 600 |
| Titre de section (sur le fond) | 22px | 700 |
| Titre de carte | 17px | 600 |
| Ligne de liste (corps iOS) | 17px | 400 ; méta 15px |
| Reste à vivre | 52px arrondi | 700 |
| En-tête de jour | 13px majuscules, +0.04em | 600 |
| Onglets | 12px, −0.01em | 500 (600 actif) |

### Rayons

| Token | Valeur | Usage |
|-------|--------|-------|
| `--radius-sm` | 10px | Pastilles d'icône |
| `--radius-md` | 14px | Champs, puces de catégorie |
| `--radius-lg` | 22px | Cartes |
| `--radius-xl` | 28px | Reste à vivre, sheets |
| `--radius-full` | 999px | Capsules : boutons, sélecteur de mois, segmented, tab bar, toast |

---

## Liquid Glass (physique, maison)

D'après la doc Apple [Applying Liquid Glass to custom views](https://developer.apple.com/documentation/swiftui/applying-liquid-glass-to-custom-views) et l'article [Liquid Glass in the Browser](https://kube.io/blog/liquid-glass-css-svg/). Physique dans `src/lib/liquidGlass.ts` (testée), rendu dans `src/components/LiquidGlass.tsx`, toujours utilisé via `src/components/Glass.tsx` :

```tsx
<Glass className="month-switcher" height={50} radius={25} frost={0.12} tint="var(--color-accent)">…</Glass>
```

- **Modèle** : une plaque de verre (indice 1,5) posée sur le contenu, au **bord bombé en squircle** `y = ⁴√(1 − (1 − x)⁴)`. Le centre est plat (le fond passe tel quel) ; dans le biseau, chaque rayon est dévié par la **loi de Snell**, convexe : le fond est « tiré » vers l'intérieur, comme dans une lentille.
- **Carte de déplacement** calculée par forme et par taille (mise en cache) : R = x, G = y, 128 = neutre ; l'échelle est le déplacement maximal en px.
- **Liseré spéculaire** calculé par pixel : intensité selon l'angle entre la normale du bord et une lumière fixe (haut-gauche), plus faible à contre-jour (bas-droite) ; il s'avive au toucher.
- **Matériau** : léger flou (2,5 px) + saturation 170 % + voile (`frost`) ou teinte (`tint`, comme `.tint()`).
- **Deux rendus selon le navigateur** :
  - **Chrome / Android** : filtre SVG en `backdrop-filter` (`feGaussianBlur` → `feDisplacementMap` → `feColorMatrix`) : réfraction du contenu réel.
  - **Safari / iPhone, Firefox** : pas de filtre SVG en `backdrop-filter`. Un shader WebGL applique la même carte au fond plasma dans le biseau ; le centre garde le flou CSS du contenu réel.
  - Transparence réduite ou contraste renforcé : verre opaque, sans réfraction ni liseré.
- **Interactif** (`.glass-press`, comme `.interactive()`) : au toucher, le verre gonfle (≈ 4 px sur son grand côté), la lumière naît sous le doigt, puis il rebondit au relâcher (spring 0,55 / 0,42 s).
- **Usage, comme Apple** : le verre est réservé à ce qui flotte au-dessus du contenu (tab bar, bouton +, sélecteur de mois, segmented, toast, boutons secondaires). Les cartes restent du contenu dépoli ; la barre de titre est un **scroll edge effect** (flou progressif), pas une plaque de verre.
- **Voile (`frost`)** : `0.12` sur le plasma, `0.32` pour le segmented, `0.6` sur ce que le contenu traverse (tab bar, toast). Contraste AA mesuré sur rendu réel : pire cas 4,70.
- **Performance** : le plasma tourne à 30 images/s et expose `data-frame` ; le verre WebGL ne redessine que lorsqu'une nouvelle image existe (5 lectures de texture par pixel).

### Correspondance avec SwiftUI (skill `liquid-glass`)

Règles du skill [`haider-nawaz/liquid-glass-skill`](https://github.com/haider-nawaz/liquid-glass-skill), copié dans `.claude/skills/liquid-glass/` (API SwiftUI iOS 26), transposées au web :

| SwiftUI | Monetra |
|---|---|
| `.glassEffect(.regular, in: .capsule)` | `<Glass radius={h / 2}>` (réfraction + liseré) |
| `.regular.tint(color)` | `<Glass tint="…">` (bouton +) |
| `.regular.interactive()` | `.glass-press` : gonfle, s'éclaire sous le doigt, rebondit |
| `GlassEffectContainer` | `.glass-container` (dock) : la lumière du toucher rayonne vers le verre voisin |
| `.buttonStyle(.glassProminent)` | `.btn-primary` : verre teinté de l'accent, liseré, lumière au toucher |
| `.tabBarMinimizeBehavior(.onScrollDown)` | tab bar réduite à l'onglet courant en descendant ; remonter ou toucher la rouvre |
| Sheet partielle (`.presentationDetents`) | sheet flottante, décollée de 8 px des bords, rayon 34 px, liseré spéculaire (`GlassRim`) |
| Pas de verre sur le contenu | cartes et listes en matériau dépoli ; barre de titre en scroll edge effect |
| Transparence réduite / contraste renforcé | verre opaque, sans réfraction ni liseré |

---

## Component Specs

### Navigation

- **Grand titre repliable** (`NavHeader`) : 34px qui défile avec la page ; une barre compacte (scroll edge effect, flou progressif), titre 17px centré, apparaît en fondu dès qu'il passe sous le haut de l'écran.
- **Dock** : tab bar en capsule flottante (60px, 4 onglets) + bouton + rond séparé (56px), posés au-dessus de l'indicateur d'accueil. Scroll edge effect (dégradé) seulement quand du contenu passe dessous. Chaque écran réserve la hauteur du dock en bas.

### Cartes et listes

- Cartes en matériau dépoli, rayon 22px, arête claire en haut ; la carte du reste à vivre (rayon 28px) a un reflet supérieur, rouge si dépassement.
- Listes « inset grouped » : séparateurs décalés après la pastille d'icône, lignes de 60px, surlignage au toucher.
- Swipe pour supprimer : le rouge n'occupe que la zone découverte (la ligne reste transparente sur le verre).

### Boutons et contrôles

- Capsules (`--radius-full`), 50px. Principal : accent plein avec reflet ; secondaire : Liquid Glass (`GlassButton`) ; danger : rouge à 18 %.
- Sélecteur de mois et segmented : capsules de verre ; segmented avec lentille glissante.
- Champs : remplissage `--color-fill`, bordure ≥ 3:1, halo d'accent au focus.

### Sheets

Verre épais dépoli, rayon 28px en haut, poignée, bouton fermer rond, bouton principal collé en bas sur un dégradé. Voile qui s'éclaircit avec le glissement.

---

## Fond plasma (`@componentry/closing-plasma`)

Fond WebGL fixe derrière tous les écrans (`AppBackground`), non interactif, `aria-hidden`. Palette d'origine (bleu nuit / gris bleuté pâle), opacité `0.9` en sombre et `1` en clair, `speed 0.5`, 30 images/s, rendu à 0,5×. Suit le thème ; figé en mouvement réduit et sous une sheet. Adaptations commentées « Monetra » : `themeMode` appliqué, `paused`, `maxDpr`, `maxFps`, `premultipliedAlpha: false`, `preserveDrawingBuffer` (lecture par le verre WebGL), `data-frame`.

---

## Motion (apple-design §1 à §11)

Tout ce qui se manipule au doigt est animé avec **`motion`** en springs. Pas de transition CSS ni de `@keyframes` sur ces éléments : un spring repart de la valeur affichée et peut être rattrapé à tout moment.

### Springs (damping ratio + response, convertis pour Motion : k = (2π/response)², c = 4π·ζ/response)

| Usage | Damping | Response | Où |
|-------|---------|----------|----|
| Défaut UI (sans dépassement) | 1.0 | 0.35 s | ouverture de sheet, retour en place sans élan, indicateur du segmented, toast |
| Repositionnement | 1.0 | 0.4 s | fermeture de sheet, sortie d'une ligne supprimée, changement de mois |
| Sheet après un geste avec élan | 0.8 | 0.3 s | retour de la sheet après un flick |
| Flick | 0.8 | 0.35 s | retour élastique d'une ligne ou d'un mois après un geste rapide |
| Retour au toucher | 1.0 | 0.15 s | échelle 0.97 au pointer-down |
| Chiffres | 1.0 | 0.5 s | reste à vivre |

Le rebond n'apparaît **que** si le geste avait de l'élan.

### Règles

- **Réponse au pointer-down** :
  - échelle 0.97 en spring sur les boutons, puces et onglets ;
  - surlignage immédiat des lignes de liste ;
  - annulé si le doigt bouge de plus de 10 px.
- **Suivi 1:1** : Pointer Events + `setPointerCapture`, hystérésis de 10 px avant de choisir une direction. `touch-action` laisse le défilement vertical au navigateur (`pan-y`), sauf sur la poignée de la sheet (`none`).
- **Interruptible** : toucher un élément en mouvement stoppe l'animation et repart de sa position affichée. Une sheet qui se ferme peut être rattrapée.
- **Passage de relais de vélocité** : la vélocité du doigt au relâcher (fenêtre de 100 ms, nulle si le doigt s'est arrêté) devient la vélocité initiale du spring.
- **Projection du momentum** : `projection = position + (v/1000)·0.998/(1−0.998)`. La cible est choisie depuis le point projeté. Au-delà de 300 px/s, c'est le sens du geste qui décide.
- **Rubber-band** : `(d·dim·0.55)/(dim + 0.55·|d|)` au-delà des limites (sheet vers le haut, ligne vers la droite ou au-delà de sa largeur).
- **Cohérence spatiale** : la sheet sort par où elle est entrée (le bas). Le mois suivant entre par le côté opposé, dans le prolongement du geste.

### Gestes

| Geste | Seuil / décision | Alternative sans geste |
|-------|------------------|------------------------|
| Sheet vers le bas | fermeture si projection > 40 % de la hauteur, ou flick vers le bas | bouton Fermer, Échap, voile |
| Ligne vers la gauche (opérations, récurrents) | suppression si projection > 45 % de la largeur ; retour haptique au franchissement ; **annulation par toast**, pas de dialogue | bouton Supprimer dans la feuille d'édition |
| Dashboard horizontal | mois suivant ou précédent si projection > 50 % de la largeur | chevrons du sélecteur de mois |

---

## Accessibilité du mouvement et des matériaux (apple-design §14)

- **`prefers-reduced-motion: reduce`** :
  - plus de glissements ni de springs ;
  - la sheet apparaît et disparaît en fondu ;
  - le changement de mois est un fondu enchaîné ;
  - les chiffres changent directement ;
  - `MotionConfig reducedMotion="user"` coupe les animations de transformation et de layout.
- **`prefers-reduced-transparency: reduce`** : verre et matériaux deviennent opaques ; réfraction et flou coupés (canvas WebGL du verre masqué).
- **`prefers-contrast: more`** : fonds pleins, bordures franches, libellés secondaires renforcés ; verre opaque.

---

## Style Guidelines

**Style:** Liquid Glass (iOS 26) sur fond plasma bleu nuit

**Keywords:** verre réfractant, lentille, capsules, grand titre repliable, pastilles colorées, profondeur, calme

**Icons:** Lucide (SVG, trait de 2px) ; blancs sur pastilles de catégorie colorées dans les listes, accent pour l'onglet actif.

---

## Anti-Patterns (Do NOT Use)

- ❌ Liquid Glass sur le contenu (cartes, listes) : le verre est réservé à la navigation et aux contrôles
- ❌ Verre sans voile là où du contenu passe dessous (libellés illisibles)
- ❌ `-webkit-backdrop-filter` écrit à la main à côté de la propriété standard (le minifieur ne garde que la version préfixée)
- ❌ Transitions CSS ou `@keyframes` sur un élément manipulé au doigt : utiliser un spring `motion`
- ❌ Dialogue de confirmation pour une suppression annulable : préférer l'annulation par toast
- ❌ Couleur seule pour identifier une catégorie (toujours le libellé)
- ❌ **Emojis comme icônes** ; chiffres proportionnels pour les montants
- ❌ Contenu masqué par le dock ; **focus invisible** ; cibles tactiles de moins de 44px

---

## Pre-Delivery Checklist

- [ ] Verre via `Glass` / `GlassButton` uniquement, voile adapté à ce qui passe dessous
- [ ] Contrastes AA mesurés sur le rendu réel, dans les deux thèmes
- [ ] Chemin iPhone (verre WebGL) et chemin Chrome (verre SVG) vérifiés (`npm run test:e2e`)
- [ ] Gestes testés en e2e : sheet, swipe-suppression + annulation, swipe de mois
- [ ] Springs `motion` sur tout ce qui se manipule ; retour au pointer-down partout
- [ ] Cibles tactiles ≥ 44px, libellés des onglets sans débordement à 375px
- [ ] `prefers-reduced-motion`, `prefers-reduced-transparency` et `prefers-contrast` respectés
