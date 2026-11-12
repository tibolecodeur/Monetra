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
**Revised:** 2026-11-12 : **refonte « Noir & Violet »** : fond noir uni (plasma retiré), accent violet unique, îlots graphiques (reste à vivre embrasé, bulles de dépenses), registre d'opérations, capsule d'onglets flottante, titres en serif éditoriale. Inspirée de trois maquettes bancaires (panneau « Spent » noir → orange, bulles « Expenses » bleues, registre « Transactions » noir et blanc).
**Sources :** skills `emil-design-eng`, `mobile-native`, `gestures`, `animation-performance`, `review-animations`, `remove-animations` et `apple-design` (`.agents/skills/`, installés avec `npx skills add emilkowalski/skills`), skill `ui-ux-pro-max` (palette, composants).
En cas de conflit sur **le mouvement, la typographie ou les matériaux, les skills d'Emil et `apple-design` priment.**
**Category:** Personal Finance Tracker (PWA mobile, 100 % locale)

---

## Principe

Noir, violet, graphique : une app bancaire moderne, pas une démonstration d'effets.

- **Fond noir uni** (`#070609`). Plus de fond animé : la profondeur vient des îlots violets, pas d'une boucle WebGL.
- **Une seule couleur d'accent : le violet.** Le vert est réservé aux revenus, le rouge aux erreurs et au dépassement ; les catégories n'ont qu'une teinte d'icône.
- **Îlots graphiques** : le panneau du reste à vivre (noir qui s'embrase en violet vers le bas) et la carte des bulles de dépenses. Ils restent sombres dans les deux thèmes.
- **Registre** : sur Opérations et Récurrents, un résumé chiffré posé sur le fond, puis une grande surface qui porte toute la liste.
- **Barres** (capsule d'onglets, titre compact, toast) : un seul matériau translucide et flouté, `backdrop-filter` standard.
- **Feuilles** : opaques.
- **Le mouvement se mérite** : inchangé (voir Motion).

---

## Global Rules

### Theme

- **Sombre par défaut**. Thème clair dans Réglages, mémorisé sur l'appareil, appliqué avant le premier rendu. Les îlots restent sombres en clair (classe `.island`, qui repose les tokens sombres).
- `theme-color` : `#070609` (manifest et meta) ; `#F4F2F8` en clair.

### Couleurs : sombre (défaut)

| Rôle | Valeur | Variable |
|------|--------|----------|
| Fond | `#070609` | `--color-bg` |
| Surface (cartes, registre) | `#111017` | `--surface-1` |
| Surface posée (pastilles, sélecteur de mois, rail) | `#1C1A24` | `--surface-2` |
| Arête des surfaces | `rgba(255,255,255,0.06)` | `--surface-edge` |
| Libellé principal / secondaire / tertiaire | `#FFFFFF` / `rgba(240,236,250,0.62)` / `0.34` | `--color-text*` |
| Accent : remplissage (boutons, ajout) | `#7C4DFF` | `--color-accent` |
| Accent : texte, liens, sélection | `#B8A1FF` | `--color-accent-text` |
| Accent : halo (ombres colorées des boutons) | `rgba(124,77,255,0.38)` | `--color-accent-glow` |
| Revenus | `#5EE39A` | `--color-income` |
| Danger | `#FF7A85` (texte), `#FF453A` (fond du swipe) | `--color-danger*` |
| Matériau des barres | `rgba(22,20,30,0.78)` + flou 20px, saturation 180 % ; opaque `#16141E` en repli | `--material-bar`, `--material-bar-solid` |
| Feuille | `#121018`, opaque | `--color-sheet` |

### Couleurs : clair

| Rôle | Valeur | Variable |
|------|--------|----------|
| Fond | `#F4F2F8` | `--color-bg` |
| Surfaces | `#FFFFFF` / `#EBE8F2` | `--surface-1`, `--surface-2` |
| Libellés | `#0B0A10` / `rgba(30,24,48,0.68)` / `0.40` | `--color-text*` |
| Accent : remplissage / texte | `#6D3CF0` / `#5A2BD8` | `--color-accent`, `--color-accent-text` |
| Revenus / danger | `#157A3C` / `#C8102E` | |
| Matériau des barres | `rgba(255,255,255,0.82)` + flou ; opaque `#FFFFFF` | `--material-bar` |

### Îlots (fixes, dans les deux thèmes)

| Élément | Recette |
|---|---|
| Reste à vivre (`.hero`) | `#0D0B12` + lueur radiale centrée sous le bas du panneau : `#9B7BFF` → `#6A3CF0` → `#4A1FB0` → `#1D0D45` → transparent. En dépassement, la même lueur en rose-rouge. |
| Plateau « Le mois en détail » (`.hero-tray`) | dégradé vertical `#230C57` → `#4A20B5` → `#6532E0`, plus étroit que le panneau (10 px de chaque côté), glissé 32 px dessous. |
| Bulles de dépenses (`.spending`) | `#0F0D16` + deux halos violets (haut gauche, bas droite). |

La lueur la plus claire reste sous le bord du panneau : le texte posé dessus (jauge, « % des revenus engagés ») ne voit jamais plus clair que `#6A3CF0`.

### Couleurs de catégories (une teinte par catégorie, `--tint`)

Une seule teinte par catégorie, appliquée à l'icône sur une pastille ronde du même ton à 16 % (`.row-icon`, `.dot-icon`, `.choice`), et à l'arc des bulles. Classes `.tint-*`. L'identité ne repose jamais sur la couleur seule : toujours le libellé à côté.

| Catégorie | Sombre | Clair |
|-----------|--------|-------|
| Logement | `#FFB547` | `#B45F00` |
| Courses | `#3FD6C6` | `#0B8277` |
| Resto | `#FF7A6B` | `#CC3524` |
| Abonnements | `#C18CFF` | `#8236D1` |
| Loisirs | `#FF6FAE` | `#C4206A` |
| Épargne | `#8F9BFF` | `#4450D4` |
| Divers | `#A9A6B4` | `#67646F` |
| Revenu | `#5EE39A` | `#157A3C` |
| Compte | `#B8A1FF` | `#6D3CF0` |

### Montants

- Chiffres tabulaires partout, chasse serrée (`--ls-display: -0.045em`, `-0.03em` sous Safari) pour les montants d'affichage.
- **Centimes estompés** (`.cents`, composant `Money` et `AnimatedAmount`) : opacité 0,5 en sombre, 0,62 en clair, 0,8 sur le plateau violet (contraste AA conservé).

### Contrastes vérifiés (WCAG AA)

Calculés le 12/11/2026 sur les couleurs composées (alpha appliqué sur la surface réelle) :

- sombre : secondaire sur carte 6,7 ; secondaire sur pastille 6,4 ; centimes 5,3 ; accent-texte 8,6 ; revenus 11,7 ; danger 7,5 ; blanc sur bouton violet 4,8 ;
- îlots : « % des revenus engagés » 6,0 (pire cas, `#6A3CF0`) ; libellés du plateau 6,0 ; centimes du plateau ≥ 4,5 ;
- clair : secondaire 5,9 ; centimes 5,4 ; accent-texte 7,6 ; revenus 5,4 ; danger 5,9 ; blanc sur bouton violet 5,9.
- Le tertiaire (34 %) ne sert qu'aux textes d'exemple et au symbole € décoratif de la saisie.
- À refaire sur le rendu réel (méthode de la mesure du 10/11) avant une publication.

### Typographie

- **SF Pro sous Safari, Inter ailleurs** pour l'interface et les montants.
- **Instrument Serif** (auto-hébergée, `@fontsource/instrument-serif`, 400) pour les titres éditoriaux uniquement : grand titre d'écran, nom de l'app, titres de section, titre des feuilles, titre « Où part l'argent ».

| Rôle | Police | Taille | Graisse |
|------|--------|--------|---------|
| Grand titre d'écran | Serif | 44px | 400 |
| Nom de l'app (accueil) | Serif | 28px | 400 |
| Titre de section (sur le fond) | Serif | 28px | 400 |
| Titre de feuille | Serif | 30px | 400 |
| Reste à vivre | Sans | `clamp(40px, 13.5vw, 60px)` | 600 |
| Total d'un résumé | Sans | 44px | 600 |
| Ligne de liste | Sans | 17px | 500 ; méta 13px |
| En-tête de jour | Sans | 12px majuscules, +0.06em | 600 |
| Onglet actif | Sans | 15px | 600 |

### Rayons

| Token | Valeur | Usage |
|-------|--------|-------|
| `--radius-sm` | 12px | |
| `--radius-md` | 16px | Champs |
| `--radius-lg` | 24px | Cartes |
| `--radius-xl` | 32px | Reste à vivre, registre, haut des feuilles |
| `--radius-full` | 999px | Capsules : boutons, onglets, sélecteur de mois, segmented, toast |
| (rond) | 50 % | Pastilles d'icônes, logo, bouton d'ajout, jour des récurrents |

---

## Matériaux

| Matériau | Où | Recette |
|---|---|---|
| Barre | capsule d'onglets, titre compact, toast | `--material-bar` + `backdrop-filter: blur(20px) saturate(180%)`, arête `--material-bar-edge` |
| Surface | cartes, registre, tuiles | `--surface-1` / `--surface-2`, pleines, **sans flou** |
| Îlot | reste à vivre, plateau, bulles | dégradés fixes (voir plus haut), **sans flou** |
| Feuille | sheets, lien d'évitement | `--color-sheet`, opaque |

- **Repli** : sans `backdrop-filter` (`@supports not`), en transparence réduite ou en contraste renforcé, les barres passent à `--material-bar-solid`.
- **Flou ≤ 20 px**, seulement sur de petites surfaces fixes.
- **Aucune détection de navigateur** : `@supports` et media queries uniquement.

---

## Component Specs

### Navigation

- **En-tête** (`NavHeader`) : grand titre en serif, ou, sur l'accueil, logo rond violet + « Monetra » avec le sélecteur de mois à droite. Une barre compacte (titre 17px centré) apparaît en fondu au défilement.
- **Capsule d'onglets** (`BottomNav`) : conteneur fixe pleine largeur (`.tab-bar`, transparent aux touchers, fondu vers le fond pour effacer le contenu qui passe dessous), capsule flottante de 64px (`.tab-pill`) à 10px au-dessus de l'indicateur d'accueil. Accueil, Opérations, **bouton d'ajout** (rond de 52px, violet, halo) au centre, Récurrents, Réglages. **Onglet actif : pastille pleine (blanche en sombre, noire en clair) avec icône et libellé** ; inactifs : icône seule, libellé gardé pour les lecteurs d'écran. **Aucune animation au changement d'onglet** : la pastille change de place à l'instant.
- **Bouton « Nouveau récurrent »** : capsule violette centrée, `position: sticky` au-dessus de la capsule d'onglets.
- Chaque écran réserve la hauteur de la barre en bas (`--content-bottom`).

### Accueil

1. **Reste à vivre** (`.hero`, îlot) : libellé, montant géant centré, pastilles d'état (« Dans le vert » / « Budget dépassé ») et de reste par jour, deux actions rapides (« Dépense » blanc plein, « Revenu » en verre) qui ouvrent la saisie sur le bon type, jauge blanche et « % des revenus engagés ».
2. **Plateau** (`.hero-tray`) : « Le mois en détail », trois colonnes Revenus / Charges fixes / Variables, avec « dont … à venir ».
3. **Où part l'argent** (`.spending`, îlot) : total du mois, **bulles** (`CategoryBubbles`) puis **tuiles** chiffrées (2 colonnes).
   - Une bulle par catégorie, aire proportionnelle au montant (rayon 30 à 78 unités), placée par une spirale aplatie (`lib/bubbles.ts`, déterministe, testé), arc de la teinte de la catégorie pour la part du total, icône, libellé si la bulle est assez grande, pourcentage.
   - Le SVG est `aria-hidden` : les tuiles portent la même information (libellé, montant, part).
4. **À venir ce mois-ci** et **Dernières opérations** : titres serif sur le fond, bouton rond cerclé « Tout voir », liste dans une carte.
5. Pied : solde total des comptes.

Le swipe horizontal de mois porte sur tout ce bloc (sauf l'en-tête).

### Opérations, Récurrents, Réglages

- **Résumé** (`.summary`) posé sur le fond : libellé (+ sélecteur de mois sur Opérations), total de 44px, deux tuiles (`.pill`) Entrées / Sorties ou Revenus fixes / Charges fixes.
- **Registre** (`.ledger`) : surface de rayon 32px, `overflow: clip` (le rouge du swipe reste dans les coins). Segmented de filtre en tête, puis groupes par jour (en-tête en petites capitales, net du jour à droite), lignes pleine largeur.
- Réglages : résumé du total des comptes, listes en cartes.

### Listes

- Lignes de 64px, **pastille d'icône ronde de 40px teintée**, titre 17px, méta 13px, montant à droite, séparateurs décalés après la pastille.
- Récurrents : pastille ronde du jour du mois (« le 12 »), verte pour un revenu.
- Surlignage immédiat à l'appui (`:active`) ; swipe pour supprimer inchangé.

### Boutons et contrôles

- Capsules. Principal : violet plein, halo violet. Secondaire : `--surface-2`. Sur îlot : blanc plein (`.btn-light`) ou verre (`.btn-glass`). Danger : rouge à 16 %.
- Bouton rond cerclé (`.round-button`) : 44px, liseré et icône en accent-texte.
- Sélecteur de mois : capsule compacte `--surface-2`, chevrons de 44px.
- Segmented : rail capsule, curseur capsule qui glisse en 200 ms (3px de marge).
- Champs : remplissage, bordure ≥ 3:1, halo d'accent au focus, 17px.

### Saisie

- Montant géant centré, € décoratif.
- **Catégories en grille de 4** : pastille ronde teintée de 48px, libellé dessous ; sélection = cadre et voile violets, pastille pleine de la teinte.
- Comptes en puces capsules.

### Sheets

Collées au bas de l'écran, opaques, rayon 32px en haut, poignée, titre serif, bouton fermer rond, bouton principal collé en bas. Mécanique inchangée.

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

**Style:** banque moderne, noir et violet, graphique

**Keywords:** noir profond, lueur violette, centimes estompés, serif éditoriale, bulles, capsules, pastilles rondes teintées

**Icons:** Lucide (SVG, trait de 2px) ; dans la teinte de la catégorie sur une pastille ronde du même ton ; noir sur la pastille blanche de l'onglet actif.

---

## Anti-Patterns (Do NOT Use)

- ❌ Fond animé en boucle (plasma WebGL) : retiré, la profondeur vient des îlots
- ❌ Une seconde couleur d'accent : le violet est seul ; vert = revenus, rouge = erreurs
- ❌ Lueur claire sous du texte : le pic de la lueur reste hors du panneau
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
