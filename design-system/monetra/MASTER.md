# Design System Master File

> **LOGIC:** When building a specific page, first check `design-system/monetra/pages/[page-name].md`.
> If that file exists, its rules **override** this Master file.
> If not, strictly follow the rules below.

---

**Project:** Monetra
**Generated:** 2026-10-29 15:12:45 (ui-ux-pro-max)
**Revised:** 2026-10-29 : thème sombre pro, puis version fluide « style Apple » (springs, gestes)
**Revised:** 2026-11-09 : **Liquid Glass physique sur fond plasma** (réfraction de Snell, liseré spéculaire, palette tirée du plasma)
**Revised:** 2026-11-10 : **nouveau Liquid Glass, scène filtrée** d'après [liquid-glass-web-react](https://github.com/PallavAg/liquid-glass-web-react) (même rendu sur Safari, Chrome et Firefox), lentilles de sélection glissables, défilement dans un conteneur
**Sources :** skill `ui-ux-pro-max` (style « liquid-glass », composants) et skill `apple-design` (`.claude/skills/apple-design/SKILL.md`).
En cas de conflit sur **le mouvement, la typographie ou les matériaux, `apple-design` prime.**
**Category:** Personal Finance Tracker (PWA mobile, 100 % locale)

---

## Principe

Le fond plasma animé donne la palette et la profondeur. Comme sur iOS 26 :

- **Liquid Glass réel pour la navigation et les contrôles** : tab bar, bouton +, toast, bouton flottant « Nouveau récurrent », sélecteur de mois, contrôle segmenté, boutons secondaires. Le verre qui flotte réfracte le contenu qui passe dessous.
- **Lentilles de sélection** : la bulle de l'onglet actif et le curseur du segmented sont des lentilles qui grossissent et courbent les libellés qu'elles traversent ; on les fait glisser au doigt (iOS 26).
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
- **Libellés sur le verre** (mesure du 10/11/2026, nouveau verre, même méthode, contraste calculé pixel par pixel avec l'alpha du texte, textes masqués par le dock exclus) :
  - sombre : onglet actif 5,0 ; segmented inactif 5,3 ; segmented actif 6,1 ; sélecteur de mois 11,7 ; boutons de verre 11,3 ; onglets inactifs 15,2 ;
  - clair : segmented inactif 5,2 ; onglet actif 5,8 (accent foncé `#2737a8` sur la tab bar) ; boutons de verre 17,0 ; sélecteur de mois 16,7.
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

## Liquid Glass : scène filtrée (lib/glass)

Technique de [liquid-glass-web-react](https://github.com/PallavAg/liquid-glass-web-react) (Pallav Agarwal, MIT, d'après l'article d'Aave *Building Glass for the Web*), portée et étendue dans `src/lib/glass/`. Toujours utilisé via `Glass` / `GlassButton` / `Segmented` / la tab bar :

```tsx
<Glass className="month-switcher" lens={LENS.control}>…</Glass>
```

- **Pourquoi ce choix** : Safari refuse un filtre SVG en `backdrop-filter`. Ici, le filtre est posé **sur le contenu lui-même** (`filter: url(#…)`) : même rendu sur Safari, iPhone, Chrome, Android et Firefox, sans chemin de repli WebGL.
- **Scène** : le contenu de l'app défile dans `.scroller`, à l'intérieur de `.scene` (fixe, taille de l'écran). Un seul filtre SVG sur `.scene` porte **une lentille par surface de verre** ; chaque lentille ne traite que sa zone (sous-région du filtre), le reste du contenu sort intact. L'écran entier n'est jamais filtré au-delà de sa taille, comme Safari l'exige.
- **Une lentille** (`lib/glass/scene.ts`) :
  - **carte de déplacement** calculée par taille (`displacementMap.ts`, portée de la bibliothèque, rendue rectangulaire) : R/G = déplacement, B = reflet, alpha = forme exacte (capsule ou rayon) ;
  - contenu flouté (`blur`), déplacé une ou trois fois (`chromatic` : frange colorée), puis **teinte** du verre (`glassEffect(.regular.tint(…))`) par-dessus (`tintMode: 'over'`, verre qui flotte) ou dessous (`'under'`, quand le contenu est le libellé du contrôle) ;
  - **reflet** (canal bleu), **découpe** à la forme ; l'**ombre portée** est un `box-shadow` CSS (un flou dans le filtre coûte bien plus cher) ;
  - verre plat (`flat`, contrôles) : ni carte de déplacement ni flou, seulement teinte, reflet et découpe ;
  - une lentille sortie de l'écran (défilement) quitte le filtre ; plus aucune lentille visible : plus de filtre du tout ;
  - la lentille suit à chaque image la position réelle de son élément (défilement, springs, pression), et son opacité si `fade` (toast).
- **Optiques** (`lib/glass/presets.ts`) :

| Rôle | Où | Réfraction | Flou | Frange | Teinte |
|---|---|---|---|---|---|
| `chrome` | tab bar, bouton +, toast, bouton flottant | 34 px, biseau 18 px | 2,5 px | 0,45 | par-dessus |
| `control` | sélecteur de mois, boutons secondaires, rail du segmented | 0 (rien derrière : le plasma est sous la scène) | 0 | 0 | dessous |
| `selection` | bulle de la tab bar, curseur du segmented | 0 au repos → 14 px doigt posé ou en mouvement (dôme 0,6) | 0 | 0,12 | dessous |

- **Couleurs en CSS**, par composant et par thème : `--lg-tint`, `--lg-tint-opacity`, `--lg-specular` (lues par le filtre), `--lg-shadow-color`, `--lg-shadow-opacity`, `--lg-shadow-blur`, `--lg-shadow-y` (box-shadow) (valeurs de base `--glass-tint-chrome|control|accent|lens`). Les teintes s'écrivent `rgb(r, g, b)` (lues par le filtre SVG).

| Teinte (opacité) | Sombre | Clair |
|---|---|---|
| Verre de navigation (`chrome`) | `rgb(10, 12, 26)` 0,60 | `rgb(255, 255, 255)` 0,74 |
| Contrôles (`control`) | `rgb(44, 52, 92)` 0,30 | `rgb(255, 255, 255)` 0,42 |
| Bouton + (`accent`) | `rgb(84, 104, 224)` 0,95 | `rgb(74, 94, 224)` 0,90 |
| Lentille de sélection (`lens`) | `rgb(255, 255, 255)` 0,10 | `rgb(44, 52, 110)` 0,07 |

- **Lentilles de sélection** (`useSelectionLens`) : spring vers le segment choisi ; doigt posé, la bulle se soulève (×1,1 / ×1,16) ; glissement 1:1 avec rubber-band, projection du momentum au relâcher, vélocité passée au spring ; étirement proportionnel à la vitesse. Au repos, sa scène est en veille (pas de filtre) et la bulle est peinte en CSS avec la même teinte.
- **Safari** : le filtre reçoit un nouvel identifiant à chaque changement (Safari garde le résultat en cache par identifiant) ; unités `userSpaceOnUse` partout (le chemin éprouvé sur iOS).
- **Interactif** (`.glass-press`, comme `.interactive()`) : le verre gonfle (≈ 4 px), la lumière naît sous le doigt, le reflet s'avive (`--lg-specular` × 1,7), puis il rebondit (spring 0,55 / 0,42 s).
- **Matériau de repli** (`data-glass='material'`) : feuilles, verre hors scène (contrôles dans une feuille). Flou d'arrière-plan + teinte + même liseré (`GlassRim`, canal bleu de la même carte).
- **Transparence réduite / contraste renforcé** : la scène n'est pas créée ; tout le verre devient opaque (`--glass-strong`), le bouton + garde l'accent plein.
- **Performance** (mesurée en rendu logiciel, le pire cas) :
  - au repos, 16,7 ms par image avec le verre, autant que sans (le coût venait des ombres floutées dans le filtre, désormais en CSS) ;
  - Chrome rejoue le filtre à chaque image du plasma (30 images/s), sur le GPU d'un téléphone ;
  - les scènes des lentilles de sélection dorment au repos, et la scène principale sous une feuille ouverte (le CSS peint alors le même verre, sans filtre) ;
  - sur WebKit, la scène est gardée en cache entre deux défilements.

### Correspondance avec SwiftUI (skill `liquid-glass`)

Règles du skill [`haider-nawaz/liquid-glass-skill`](https://github.com/haider-nawaz/liquid-glass-skill), copié dans `.claude/skills/liquid-glass/` (API SwiftUI iOS 26), transposées au web :

| SwiftUI | Monetra |
|---|---|
| `.glassEffect(.regular, in: .capsule)` | `<Glass lens={LENS.chrome}>` (capsule par défaut, `radius` sinon) |
| `.regular.tint(color)` | `--lg-tint` / `--lg-tint-opacity` en CSS (bouton + : accent) |
| `.regular.interactive()` | `.glass-press` : gonfle, s'éclaire sous le doigt, rebondit |
| `GlassEffectContainer` | `.glass-container` (dock) : la lumière du toucher rayonne vers le verre voisin ; une scène = un conteneur, le verre ne réfracte pas le verre |
| Tab bar iOS 26 (bulle qui grossit, glissable) | lentille de sélection de la tab bar (`useSelectionLens`) |
| `.buttonStyle(.glassProminent)` | `.btn-primary` : verre teinté de l'accent, liseré, lumière au toucher |
| `.tabBarMinimizeBehavior(.onScrollDown)` | tab bar réduite à l'onglet courant en descendant ; remonter ou toucher la rouvre |
| Sheet partielle (`.presentationDetents`) | sheet flottante, décollée de 8 px des bords, rayon 34 px, liseré spéculaire (`GlassRim`) |
| Pas de verre sur le contenu | cartes et listes en matériau dépoli ; barre de titre en scroll edge effect |
| Transparence réduite / contraste renforcé | verre opaque, sans réfraction ni liseré |

---

## Component Specs

### Navigation

- **Grand titre repliable** (`NavHeader`) : 34px qui défile avec la page ; une barre compacte (scroll edge effect, flou progressif), titre 17px centré, apparaît en fondu dès qu'il passe sous le haut de l'écran.
- **Dock** : tab bar en capsule flottante (60px, 4 onglets) + bouton + rond séparé (56px, écart 10px), posés au-dessus de l'indicateur d'accueil. La bulle de l'onglet actif se fait glisser d'un onglet à l'autre. Scroll edge effect (dégradé) seulement quand du contenu passe dessous. Chaque écran réserve la hauteur du dock en bas.
- **Bouton flottant** (« Nouveau récurrent ») : au-dessus du dock, hors de la scène, en verre de navigation ; l'écran réserve sa place en plus de celle du dock.

### Cartes et listes

- Cartes en matériau dépoli (`--material-content`, sans `backdrop-filter` : dans la scène il n'y aurait rien à flouter), rayon 22px, arête claire en haut ; méta des comptes sur une ligne, tronquée ; la carte du reste à vivre (rayon 28px) a un reflet supérieur, rouge si dépassement.
- Listes « inset grouped » : séparateurs décalés après la pastille d'icône, lignes de 60px, surlignage au toucher.
- Swipe pour supprimer : le rouge n'occupe que la zone découverte (la ligne reste transparente sur le verre).

### Boutons et contrôles

- Capsules (`--radius-full`), 50px. Principal : accent plein avec reflet ; secondaire : Liquid Glass (`GlassButton`) ; danger : rouge à 18 %.
- Sélecteur de mois et segmented : capsules de verre ; curseur du segmented en lentille glissable (dans une feuille, le rail est un simple remplissage).
- Champs : remplissage `--color-fill`, bordure ≥ 3:1, halo d'accent au focus.

### Sheets

Verre épais dépoli, flottant, rayon 34px, liseré `GlassRim`, poignée, bouton fermer rond, bouton principal collé en bas sur un fond flouté qui se fond vers le haut. Voile qui s'éclaircit avec le glissement. Aucune lentille dans une feuille (rien de la scène ne passe dessous), sauf le curseur du segmented, qui a sa propre petite scène.

---

## Fond plasma (`@componentry/closing-plasma`)

Fond WebGL fixe derrière tous les écrans (`AppBackground`), non interactif, `aria-hidden`. Palette d'origine (bleu nuit / gris bleuté pâle), opacité `0.9` en sombre et `1` en clair, `speed 0.5`, 30 images/s, rendu à 0,5×. Suit le thème ; figé en mouvement réduit et sous une sheet. Adaptations commentées « Monetra » : `themeMode` appliqué, `paused`, `maxDpr`, `maxFps`, `premultipliedAlpha: false`. Le fond est **sous** la scène de verre, pas dedans : un canvas WebGL n'est pas garanti dans un filtre SVG sur Safari.

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
| Bulle de la tab bar, curseur du segmented | segment le plus proche du point projeté (décélération 0,99) ; retour haptique à chaque segment franchi | toucher l'onglet ou l'option |

La vélocité se calcule sur l'horodatage des événements (`e.timeStamp`), pas sur l'heure de traitement : fiable même si le fil principal est chargé.

---

## Accessibilité du mouvement et des matériaux (apple-design §14)

- **`prefers-reduced-motion: reduce`** :
  - plus de glissements ni de springs ;
  - la sheet apparaît et disparaît en fondu ;
  - le changement de mois est un fondu enchaîné ;
  - les chiffres changent directement ;
  - `MotionConfig reducedMotion="user"` coupe les animations de transformation et de layout.
- **`prefers-reduced-transparency: reduce`** : verre et matériaux deviennent opaques ; pas de scène de verre (ni réfraction ni flou).
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
- ❌ Lentille réfractante sur un contrôle de la page : elle courberait ses propres libellés (optique `control` : réfraction 0)
- ❌ Texte ou bouton flottant dans la scène avec une teinte « par-dessus » : il serait flouté par son propre verre (le sortir de la scène)
- ❌ `window.scrollTo` / `window.scrollY` : l'app défile dans `.scroller` (`useScroller()`)
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
- [ ] Scène vérifiée avec user agent Chrome et iPhone (nouvel identifiant de filtre), contraste renforcé (`npm run test:e2e`)
- [ ] Lentille de sélection glissée en e2e
- [ ] Gestes testés en e2e : sheet, swipe-suppression + annulation, swipe de mois
- [ ] Springs `motion` sur tout ce qui se manipule ; retour au pointer-down partout
- [ ] Cibles tactiles ≥ 44px, libellés des onglets sans débordement à 375px
- [ ] `prefers-reduced-motion`, `prefers-reduced-transparency` et `prefers-contrast` respectés
