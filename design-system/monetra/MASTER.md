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
**Revised:** 2026-11-10 : **retrait du Liquid Glass** (trop fragile selon les navigateurs) ; barre d'onglets classique, un seul matériau de barre, retour au toucher en CSS, règles des skills d'Emil Kowalski
**Sources :** skills `emil-design-eng`, `mobile-native`, `gestures`, `animation-performance`, `review-animations`, `remove-animations` et `apple-design` (`.agents/skills/`, installés avec `npx skills add emilkowalski/skills`), skill `ui-ux-pro-max` (palette, composants).
En cas de conflit sur **le mouvement, la typographie ou les matériaux, les skills d'Emil et `apple-design` priment.**
**Category:** Personal Finance Tracker (PWA mobile, 100 % locale)

---

## Principe

Sobre, lisible, fiable : l'interface d'une app Apple professionnelle, pas une démonstration d'effets.

- **Le fond plasma** donne la palette et la profondeur ; il reste derrière tout.
- **Barres** (onglets en bas, titre compact en haut, toast) : un seul matériau translucide et flouté, avec un filet de séparation. Un `backdrop-filter` standard, rien d'autre : ni filtre SVG, ni WebGL, ni détection de navigateur.
- **Contenu** (cartes, sélecteur de mois, contrôle segmenté, boutons secondaires) : un voile translucide sans flou.
- **Feuilles** : opaques.
- **Le mouvement se mérite** : ce qu'on fait cent fois par jour (changer d'onglet) ne s'anime pas ; ce qui répond à un geste suit le doigt ; le reste est court (≤ 250 ms) et en ease-out.

---

## Global Rules

### Theme

- **Sombre par défaut**. Thème clair dans Réglages, mémorisé sur l'appareil, appliqué avant le premier rendu.
- `theme-color` : la couleur du haut de la page, `#05060C` (manifest et meta) ; `#EEF0F8` en clair, mise à jour au changement de thème.

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
| Matériau du contenu (cartes, contrôles) | `rgba(17,20,36,0.66)`, sans flou | `--material-content` |
| Matériau des barres | `rgba(13,15,27,0.80)` + flou 20px, saturation 180 % ; opaque `#0D0F1B` en repli | `--material-bar`, `--material-bar-solid` |
| Feuille (sheet) | `#171A2B`, opaque | `--color-sheet` |
| Curseur du segmented | `rgba(120,132,180,0.42)` | `--color-segment` |
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
| Matériau du contenu | `rgba(255,255,255,0.76)` | `--material-content` |
| Matériau des barres | `rgba(246,247,252,0.82)` + flou ; opaque `#F6F7FC` en repli | `--material-bar` |
| Feuille | `#F7F8FD` | `--color-sheet` |

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

Mesurés **sur le rendu réel** : le texte est rendu invisible, puis le fond (plasma + matériaux) est photographié sur plusieurs images. Le pire cas (2e centile des pixels sous chaque texte) est calculé sur les 4 écrans, en haut de page et après défilement. Toute nouvelle couleur de texte ou de matériau se mesure de la même façon.

- **Mesure du 10/11/2026** (barre d'onglets classique, même méthode, contraste calculé pixel par pixel avec l'alpha du texte), pire cas par style :
  - sombre : texte secondaire des cartes 5,7 ; segmented inactif 6,5 ; onglets inactifs 6,9 ; segmented actif 8,4 ; onglet actif 9,0 ; boutons secondaires 14,4 ; bouton principal 4,7 (blanc sur accent, 17 px semi-gras) ;
  - clair : texte secondaire des cartes 5,4 ; onglets 5,7 ; segmented inactif 5,9 ; boutons secondaires 15,4.
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
| Onglets | 11px | 500 (600 actif) |

### Rayons

| Token | Valeur | Usage |
|-------|--------|-------|
| `--radius-sm` | 10px | Pastilles d'icône |
| `--radius-md` | 14px | Champs, puces de catégorie, contrôle segmenté |
| `--radius-lg` | 22px | Cartes |
| `--radius-xl` | 28px | Reste à vivre, haut des sheets |
| `--radius-full` | 999px | Capsules : boutons, sélecteur de mois, toast |

---

## Matériaux

| Matériau | Où | Recette |
|---|---|---|
| Barre | barre d'onglets, titre compact, toast, bouton « Nouveau récurrent » | `--material-bar` + `backdrop-filter: blur(20px) saturate(180%)`, filet `0.5px` `--color-separator` |
| Contenu | cartes, sélecteur de mois, segmented, boutons secondaires | `--material-content` + bordure `--material-content-edge`, **sans flou** |
| Feuille | sheets, lien d'évitement | `--color-sheet`, opaque |

- **Repli** : sans `backdrop-filter` (`@supports not`), en transparence réduite ou en contraste renforcé, les barres passent à `--material-bar-solid`, opaques.
- **Flou ≤ 20 px**, et seulement sur de petites surfaces fixes. Pas de flou sur les cartes (elles défilent) ni sur les feuilles (grandes, déplacées au doigt) : c'est cher, surtout sur Safari.
- **Aucune détection de navigateur** : `@supports` et media queries uniquement.

---

## Component Specs

### Navigation

- **Grand titre repliable** (`NavHeader`) : 34px qui défile avec la page ; une barre compacte (matériau de barre, titre 17px centré, filet en bas) apparaît en fondu, liée au défilement, dès qu'il passe sous le haut de l'écran.
- **Barre d'onglets** (`BottomNav`) : fixe, collée au bas de l'écran, pleine largeur, 56px + zone de l'indicateur d'accueil. Cinq colonnes : Accueil, Opérations, **bouton d'ajout** (rond de 48px, accent) au centre, Récurrents, Réglages. Onglet actif en `--color-accent-text`, inactifs en `--color-text-secondary`, libellés de 11px. **Aucune animation au changement d'onglet.** Sur grand écran, les onglets restent groupés sur 480px.
- **Bouton « Nouveau récurrent »** : `position: sticky` juste au-dessus de la barre d'onglets, matériau de barre.
- Chaque écran réserve la hauteur de la barre en bas (`--content-bottom`).

### Cartes et listes

- Cartes en matériau de contenu, rayon 22px, arête claire en haut ; la carte du reste à vivre (rayon 28px) a un reflet supérieur, rouge si dépassement ; méta des comptes sur une ligne, tronquée.
- Listes « inset grouped » : séparateurs décalés après la pastille d'icône, lignes de 60px, surlignage immédiat à l'appui (`:active`).
- Swipe pour supprimer : le rouge n'occupe que la zone découverte (`clip-path`, pas `width`) ; la corbeille grossit quand le seuil est franchi.

### Boutons et contrôles

- Capsules (`--radius-full`), 50px. Principal : accent plein, sans dégradé ni reflet. Secondaire (`.btn-secondary`) : matériau de contenu. Danger : rouge à 18 %.
- Sélecteur de mois : capsule en matériau de contenu.
- Contrôle segmenté façon iOS : rail de 40px (cibles de 44px), curseur qui glisse en 200 ms ; rail en matériau de contenu sur la page, en simple remplissage dans une feuille.
- Champs : remplissage `--color-fill`, bordure ≥ 3:1, halo d'accent au focus, texte de 17px (jamais moins de 16px : iOS zoomerait la page).

### Sheets

Collées au bas de l'écran, opaques, rayon 28px en haut, poignée, bouton fermer rond, bouton principal collé en bas sur un fond opaque qui se fond vers le haut. Voile qui s'éclaircit avec le glissement. Tirée vers le haut (rubber-band), la feuille ne se décolle pas du bord (ombre pleine sous elle).

---

## Fond plasma (`@componentry/closing-plasma`)

Fond WebGL fixe derrière tous les écrans (`AppBackground`), non interactif, `aria-hidden`. Palette d'origine (bleu nuit / gris bleuté pâle), opacité `0.9` en sombre et `1` en clair, `speed 0.5`, 30 images/s, rendu à 0,5×. Suit le thème ; figé en mouvement réduit et sous une sheet. Adaptations commentées « Monetra » : `themeMode` appliqué, `paused`, `maxDpr`, `maxFps`, `premultipliedAlpha: false`. C'est la seule animation en boucle de l'app, et la seule décoration : elle reste lente, hors du contenu, et s'arrête dès qu'on ne la regarde pas (onglet caché, feuille ouverte, mouvement réduit).

---

## Motion (skills `emil-design-eng`, `gestures`, `apple-design`)

### Faut-il animer ? (dans cet ordre)

| Fréquence | Décision | Dans Monetra |
|---|---|---|
| Cent fois par jour, ou au clavier | Aucune animation | changement d'onglet, navigation, Échap |
| Dizaines de fois par jour | Réduite, à peine perceptible | retour à l'appui (140 ms), curseur du segmented (200 ms), chevrons de mois (fondu de 270 ms) |
| Occasionnelle | Animation normale | sheet, toast, suppression d'une ligne |
| Donnée lue ou manipulée | Seulement un vrai changement de valeur | reste à vivre qui glisse vers sa nouvelle valeur, jauges (250 ms) ; jamais rejoué au chargement |

Chaque animation a une raison : retour au toucher, cohérence spatiale, indication d'état, ou éviter un changement brutal. « C'est joli » n'en est pas une.

### Deux outils

- **CSS** pour ce qui est prédéterminé : retour à l'appui (`:active`, `transform: scale(0.97)`, `--press-duration` 140 ms), curseur du segmented, jauges. Courbe `--ease-out: cubic-bezier(0.23, 1, 0.32, 1)`. Jamais `transition: all`, jamais `ease-in`, jamais plus de 300 ms, uniquement `transform`, `opacity` ou `clip-path`.
- **Springs `motion`** pour ce qui suit un geste et doit pouvoir être rattrapé : sheet, swipe d'une ligne, swipe de mois. Pas de `@keyframes` sur ces éléments.

### Springs (damping ratio + response, convertis pour Motion : k = (2π/response)², c = 4π·ζ/response)

| Usage | Damping | Response | Où |
|-------|---------|----------|----|
| Défaut UI (sans dépassement) | 1.0 | 0.35 s | ouverture de sheet, retour en place sans élan, entrée du toast |
| Repositionnement | 1.0 | 0.4 s | fermeture de sheet, sortie d'une ligne supprimée, changement de mois au doigt |
| Sheet après un geste avec élan | 0.8 | 0.3 s | retour de la sheet après un flick |
| Flick | 0.8 | 0.35 s | retour élastique d'une ligne ou d'un mois après un geste rapide |
| Chiffres | 1.0 | 0.5 s | reste à vivre |

Le rebond n'apparaît **que** si le geste avait de l'élan : un bouton n'applique aucune force, donc aucun rebond.

### Règles

- **Réponse à l'appui, pas au relâcher**, en CSS (`:active`) :
  - échelle 0.97 sur les boutons, les puces et le bouton d'ajout ;
  - surlignage immédiat des lignes de liste ; opacité sur les onglets ;
  - pendant un glissement (`data-dragging`), ce qu'on a touché n'est plus surligné ni enfoncé.
  - iOS n'applique `:active` au toucher que si un écouteur `touchstart` existe : il est posé dans `main.tsx`.
- **Suivi 1:1** : Pointer Events + `setPointerCapture`, hystérésis de 10 px avant de choisir une direction. La position est une motion value écrite en `transform` sur l'élément (jamais un état React ni une variable CSS héritée). `touch-action` laisse le défilement vertical au navigateur (`pan-y`), sauf sur la poignée de la sheet (`none`).
- **Interruptible** : toucher un élément en mouvement stoppe l'animation et repart de sa position affichée. Une sheet qui se ferme peut être rattrapée.
- **Passage de relais de vélocité** : la vélocité du doigt au relâcher (fenêtre de 100 ms, nulle si le doigt s'est arrêté) devient la vélocité initiale du spring. Elle se calcule sur l'horodatage des événements (`e.timeStamp`).
- **Projection du momentum** : `projection = position + (v/1000)·0.998/(1−0.998)`. La cible est choisie depuis le point projeté. Au-delà de 300 px/s, c'est le sens du geste qui décide.
- **Rubber-band** : `(d·dim·0.55)/(dim + 0.55·|d|)` au-delà des limites (sheet vers le haut, ligne vers la droite ou au-delà de sa largeur).
- **Cohérence spatiale** : la sheet et le toast sortent par où ils sont entrés (le bas). Le mois suivant entre par le côté opposé, dans le prolongement du geste.
- **Valeurs liées** : le voile de la sheet et le rouge du swipe dérivent de la position du geste (une seule source), jamais d'une animation séparée.
- **Sortie plus courte que l'entrée** : toast (spring à l'entrée, 150 ms à la sortie).

### Gestes

| Geste | Seuil / décision | Alternative sans geste |
|-------|------------------|------------------------|
| Sheet vers le bas | fermeture si projection > 40 % de la hauteur, ou flick vers le bas | bouton Fermer, Échap, voile |
| Ligne vers la gauche (opérations, récurrents) | suppression si projection > 45 % de la largeur ; retour haptique au franchissement ; **annulation par toast**, pas de dialogue | bouton Supprimer dans la feuille d'édition |
| Dashboard horizontal | mois suivant ou précédent si projection > 50 % de la largeur | chevrons du sélecteur de mois (fondu, sans glissement) |

---

## Sentir le natif sur téléphone (skill `mobile-native`)

- `viewport-fit=cover` + `env(safe-area-inset-*)` sur la barre d'onglets, la barre de titre et les feuilles ; hauteurs en `dvh`.
- `-webkit-tap-highlight-color: transparent`, `text-size-adjust: 100%`, `overscroll-behavior: none` sur `html` et `body` (ni pull-to-refresh ni rebond de la page), `contain` dans les feuilles.
- Contrôles : `touch-action: manipulation`, `user-select: none`, pas de menu d'appui long. Le contenu, lui, reste sélectionnable.
- Champs ≥ 16px, `inputMode` adapté (`decimal` pour les montants).
- `:hover` uniquement sous `@media (hover: hover) and (pointer: fine)`.
- Jamais de zoom désactivé, jamais de détection par user agent.
- **Ce qui ne se vérifie que sur un vrai téléphone** : zones sûres, clavier, rebond, `:active` au toucher, barre d'état.

---

## Accessibilité du mouvement et des matériaux

- **`prefers-reduced-motion: reduce`** : moins de mouvement, pas zéro.
  - plus de glissements ni de springs ; la sheet apparaît et disparaît en fondu ;
  - le changement de mois est un fondu enchaîné ; les chiffres changent directement ;
  - plus d'échelle à l'appui (opacité à la place), curseur du segmented sans glissement ;
  - les changements de couleur et d'opacité restent ;
  - `MotionConfig reducedMotion="user"` coupe les animations de transformation et de layout.
- **`prefers-reduced-transparency: reduce`** : barres et cartes opaques, sans flou.
- **`prefers-contrast: more`** : fonds pleins, bordures franches, libellés secondaires renforcés.

---

## Style Guidelines

**Style:** Apple professionnel, sobre, sur fond plasma bleu nuit

**Keywords:** barres translucides, filets fins, capsules, grand titre repliable, pastilles colorées, calme, retenue

**Icons:** Lucide (SVG, trait de 2px) ; blancs sur pastilles de catégorie colorées dans les listes, accent pour l'onglet actif.

---

## Anti-Patterns (Do NOT Use)

- ❌ Effets de verre réfractant (filtre SVG, WebGL, cartes de déplacement) : retirés, trop fragiles d'un navigateur à l'autre
- ❌ Détection de navigateur par user agent ; préférer `@supports` et les media queries
- ❌ Animation au changement d'onglet ou sur une action au clavier
- ❌ `transition: all`, `ease-in`, durée > 300 ms, animation de `width` / `height` / `top` / `margin`
- ❌ JavaScript pour un retour à l'appui que `:active` sait faire
- ❌ Flou de plus de 20 px, ou flou sur une grande surface qui bouge (cartes, feuilles)
- ❌ `:hover` hors de `@media (hover: hover) and (pointer: fine)`
- ❌ `-webkit-backdrop-filter` écrit à la main à côté de la propriété standard (le minifieur ne garde que la version préfixée)
- ❌ `@keyframes` sur un élément manipulé au doigt : utiliser un spring `motion`
- ❌ Dialogue de confirmation pour une suppression annulable : préférer l'annulation par toast
- ❌ Couleur seule pour identifier une catégorie (toujours le libellé)
- ❌ **Emojis comme icônes** ; chiffres proportionnels pour les montants
- ❌ Contenu masqué par la barre d'onglets ; **focus invisible** ; cibles tactiles de moins de 44px

---

## Pre-Delivery Checklist

- [ ] Chaque animation ajoutée a une raison et respecte le tableau « Faut-il animer ? »
- [ ] Contrastes AA mesurés sur le rendu réel, dans les deux thèmes
- [ ] Barre d'onglets : fixe, entière au défilement, rien de masqué dessous (`npm run test:e2e`)
- [ ] Gestes testés en e2e : sheet, swipe-suppression + annulation, swipe de mois
- [ ] Retour à l'appui en CSS partout ; springs `motion` sur ce qui suit un geste
- [ ] Cibles tactiles ≥ 44px, libellés des onglets sans débordement à 375px
- [ ] `prefers-reduced-motion`, `prefers-reduced-transparency` et `prefers-contrast` respectés
- [ ] Vérifié sur un vrai iPhone (zones sûres, clavier, `:active`)
