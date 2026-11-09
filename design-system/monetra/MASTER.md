# Design System Master File

> **LOGIC:** When building a specific page, first check `design-system/monetra/pages/[page-name].md`.
> If that file exists, its rules **override** this Master file.
> If not, strictly follow the rules below.

---

**Project:** Monetra
**Generated:** 2026-10-29 15:12:45 (ui-ux-pro-max)
**Revised:** 2026-10-29 : thème sombre pro (remplace glassmorphism, Caveat et Quicksand)
**Revised:** 2026-10-29 : version fluide « style Apple » (police système, springs, gestes, matériaux)
**Sources :** skill `ui-ux-pro-max` (couleurs, composants) et skill `apple-design` (`.claude/skills/apple-design/SKILL.md`).
En cas de conflit sur **le mouvement, la typographie ou les matériaux, `apple-design` prime.**
**Category:** Personal Finance Tracker (PWA mobile, 100 % locale)

---

## Global Rules

### Theme

- **Sombre par défaut** (fond noir OLED). Thème clair disponible en option dans Réglages, mémorisé sur l'appareil.
- Le thème est appliqué avant le premier rendu (script dans `index.html`) pour éviter un flash.
- `theme-color` : `#000000` (manifest et meta) ; `#F2F2F7` quand le thème clair est actif.

### Color Palette : sombre (défaut)

| Role | Hex | CSS Variable |
|------|-----|--------------|
| Background | `#000000` | `--color-bg` |
| Surface (cartes) | `#111113` | `--color-surface` |
| Surface surélevée (sheets, puces, tuiles) | `#1C1C1F` | `--color-surface-elevated` |
| Border (1px) | `#26262A` | `--color-border` |
| Border des champs de saisie | `#707076` | `--color-border-input` |
| Text principal | `#F5F5F7` | `--color-text` |
| Text secondaire | `#8E8E93` | `--color-text-secondary` |
| Text tertiaire (décoratif uniquement) | `#5A5A60` | `--color-text-tertiary` |
| Accent (revenus, action principale) | `#30D158` | `--color-accent` |
| On Accent | `#000000` | `--color-on-accent` |
| Accent 12 % (sélection) | `rgba(48,209,88,0.12)` | `--color-accent-soft` |
| Danger (erreurs, suppression) | `#FF453A` | `--color-danger` |
| Tab bar (matériau) | `rgba(0,0,0,0.72)` + flou 20px (clair : `rgba(249,249,251,0.78)`) | `--color-material` |

### Color Palette : clair (option)

| Role | Hex | CSS Variable |
|------|-----|--------------|
| Background | `#F2F2F7` | `--color-bg` |
| Surface / surélevée | `#FFFFFF` | `--color-surface`, `--color-surface-elevated` |
| Border | `#E5E5EA` | `--color-border` |
| Border des champs | `#8A8A8E` | `--color-border-input` |
| Text principal / secondaire / tertiaire | `#1C1C1E` / `#5C5C61` / `#8E8E93` | `--color-text*` |
| Accent / On Accent | `#1F7A35` / `#FFFFFF` | `--color-accent`, `--color-on-accent` |
| Danger | `#D70015` | `--color-danger` |

**Color Notes:**
- **Un seul accent**, le vert, réservé aux revenus et à l'action principale (bouton +, « Ajouter », sélection). Pas de bleu.
- **Les dépenses sont en texte principal**, jamais en rouge. Le rouge sert aux erreurs, à la suppression et au dépassement de budget, toujours accompagné d'une icône et d'un texte.
- En clair, le vert est assombri (`#1F7A35`) pour garder 5,4:1 en texte et sous du blanc.
- Le tertiaire (2,5 à 2,75:1) ne porte jamais d'information essentielle : poignée de sheet, placeholders.

### Contrastes vérifiés (WCAG)

| Paire | Sombre | Clair |
|------|--------|-------|
| Texte principal / surface | 17,3:1 | 17,0:1 |
| Texte secondaire / surface | 5,8:1 (5,2 sur surélevée) | 6,6:1 (5,9 sur fond) |
| Texte secondaire / fond plasma (pire cas mesuré) | 4,69:1 | 4,68:1 |
| Texte principal / fond plasma (pire cas mesuré) | 14,0:1 | 12,0:1 |
| Accent / surface | 9,3:1 | 5,4:1 |
| Texte du bouton accent | 10,4:1 | 5,4:1 |
| Bordure des champs / surface | 3,5 à 3,8:1 | 3,4:1 |

### Typography (apple-design §15)

- **Police système d'abord** : `-apple-system, BlinkMacSystemFont, 'Inter Variable', system-ui, sans-serif`.
  - Sur iOS et macOS, c'est SF Pro, avec son dimensionnement optique.
  - Ailleurs, Inter, auto-hébergée via `@fontsource-variable/inter` (hors ligne, sans CDN).
  - Inter est placée **avant** `system-ui`, sinon elle ne servirait jamais (system-ui existe sur toutes les plateformes).
- **Tailles en `rem`** : la mise en page suit le réglage de taille du texte de l'utilisateur.
- **Tracking et interlignage par taille**, jamais une valeur unique :
  - le grand texte est resserré, le petit légèrement ouvert ;
  - l'interlignage est serré sur les titres et plus aéré sur le corps.
  - Valeurs : courbe dynamique d'Inter, proche de la table de SF. Sous Safari (`@supports (font: -apple-system-body)`), le tracking repasse à `normal`, car SF applique déjà sa propre table optique.
- **Exception** : les libellés en MAJUSCULES (titres de section) gardent `+0.06em`.
- **Tous les montants** en `font-variant-numeric: tabular-nums`. Le reste à vivre s'anime en spring sans que les chiffres sautent.

| Taille | Tracking (`--ls-*`) | Interlignage (`--lh-*`) |
|--------|---------------------|-------------------------|
| 12px (`0.75rem`) | +0.000em | 1.33 |
| 13px (`0.8125rem`) | -0.003em | 1.38 |
| 14px (`0.875rem`) | -0.006em | 1.43 |
| 15px (`0.9375rem`) | -0.009em | 1.4 |
| 16px (`1rem`) | -0.011em | 1.5 |
| 17px (`1.0625rem`) | -0.013em | 1.41 |
| 18px (`1.125rem`) | -0.014em | 1.33 |
| 20px (`1.25rem`) | -0.017em | 1.25 |
| 28px (`1.75rem`) | -0.021em | 1.14 |
| 44px (`2.75rem`) | -0.022em | 1.09 |

| Rôle | Taille | Graisse |
|------|--------|---------|
| Titre d'écran (h1), logo « Monetra » | 28px | 600 |
| Titre de section / carte | 13px, MAJUSCULES, +0.06em | 500 |
| Titre de feuille | 20px | 600 |
| Corps | 16px | 400 (500 pour les libellés de ligne) |
| Méta, aide | 14px | 400 |
| Montant principal (reste à vivre, saisie) | 44px | 600 |
| Onglets (sur matériau : vibrancy) | 12px, +0.01em | 600 |

### Spacing Variables

| Token | Value | Usage |
|-------|-------|-------|
| `--space-xs` | `4px` | Tight gaps |
| `--space-sm` | `8px` | Icon gaps, inline spacing |
| `--space-md` | `16px` | Standard padding, gouttière d'écran |
| `--space-lg` | `24px` | Section padding |
| `--space-xl` | `32px` | Large gaps |

### Radius & Elevation

| Token | Value | Usage |
|-------|-------|-------|
| `--radius-sm` | `10px` | Champs, tuiles d'icône, segmented |
| `--radius-md` | `12px` | Boutons, puces de catégorie |
| `--radius-lg` | `16px` | Cartes |
| Sheet | `20px` (haut) | Bottom sheets |

En sombre, l'élévation passe par la surface (`#000` → `#111113` → `#1C1C1F`) et la bordure 1px, pas par les ombres. Les ombres sont réservées aux éléments flottants (toast, bouton sticky, sheet).

---

## Component Specs

### Carte « Reste à vivre »

```css
.hero {
  background:
    radial-gradient(120% 100% at 100% 0%, rgba(48, 209, 88, 0.08), transparent 60%),
    #111113;
  border: 1px solid #26262a;
  border-radius: 16px;
}
.hero-value { font-size: 44px; font-weight: 600; letter-spacing: -0.03em; font-variant-numeric: tabular-nums; }
```

En cas de dépassement, le halo passe au rouge à 8 % et le badge affiche « Budget dépassé » avec une icône.

### Buttons

```css
.btn-primary   { background: #30d158; color: #000; border-radius: 12px; min-height: 50px; font-weight: 600; }
.btn-secondary { background: #1c1c1f; color: #f5f5f7; border: 1px solid #26262a; }
.btn-danger    { background: rgba(255, 69, 58, 0.14); color: #ff453a; }
```

### Puces (catégories, comptes)

```css
.choice, .chip { background: #1c1c1f; border: 1px solid #26262a; }
.choice[aria-checked='true'] { border-color: #30d158; background: rgba(48, 209, 88, 0.12); }
```

Libellés sur une seule ligne (catégorie « Resto »), points de suspension en dernier recours.

### Inputs

```css
.input { background: #111113; border: 1px solid #707076; border-radius: 10px; min-height: 48px; font-size: 16px; }
.input:focus { border-color: #30d158; box-shadow: 0 0 0 3px rgba(48, 209, 88, 0.12); }
```

### Tab bar (matériau, apple-design §12)

```css
.tab-bar {
  background: rgba(0, 0, 0, 0.72);              /* clair : rgba(249, 249, 251, 0.78) */
  backdrop-filter: blur(20px) saturate(180%);   /* propriété standard seule : le build ajoute -webkit- */
  height: calc(64px + env(safe-area-inset-bottom));
}
/* Scroll edge effect au lieu d'une bordure, seulement quand du contenu passe dessous */
.tab-bar[data-edge='on']::before { background: linear-gradient(to top, rgba(0,0,0,.8), transparent); }
```

- Le contenu défile **sous** la barre, flouté. Chaque écran réserve `padding-bottom: hauteur tab bar + safe-area + 24px`, donc rien n'est masqué en bas de page.
- Libellés plus contrastés et plus gras sur le matériau (vibrancy).
- 4 onglets + bouton **+** central (vert, 52px), visible sur tous les écrans.
- « Nouveau récurrent » est `position: sticky` juste au-dessus de la barre.
- Ne jamais écrire `-webkit-backdrop-filter` à la main à côté de la propriété standard : le minifieur ne garderait que la version préfixée, et Chrome ne floute plus.

### Sheets

- Fond `#1C1C1F`, rayon 20px en haut, poignée, bouton fermer de 44px, bouton principal collé en bas.
- Le focus reste dans la feuille ; Échap ferme.
- **Voile modal** qui s'éclaircit avec la progression du glissement (dim to focus).

---

## Fond plasma (`@componentry/closing-plasma`)

Fond animé WebGL installé avec `npx shadcn@latest add @componentry/closing-plasma` (`src/components/ui/closing-plasma.tsx`), posé derrière tous les écrans par `src/components/AppBackground.tsx`.

- **Placement** : `position: fixed`, plein écran, `z-index: 0`, `pointer-events: none`, `aria-hidden`. Le contenu (`.app`) est au-dessus (`z-index: 1`). Le plasma se voit entre les cartes, derrière les en-têtes et, flouté, sous la tab bar.
- **Réglages** : palette d'origine du composant (bleu nuit en sombre, gris bleuté pâle en clair), `speed 0.6`, `sparkle 0.25`, non interactif. Opacité `0.45` en sombre et `0.6` en clair : le texte posé directement sur le fond garde au moins 4,5:1 dans le pire cas mesuré.
- **Coût** : rendu à 0,5× puis agrandi (le plasma est flou), animation arrêtée quand l'onglet est caché.
- **Thème** : suit le choix de Réglages (`data-theme`).
- **`prefers-reduced-motion`** : image fixe, aucune animation.
- **Adaptations du composant d'origine** (commentées « Monetra » dans le fichier) :
  - prop `themeMode` réellement appliquée (elle était figée en sombre) ;
  - props `paused` et `maxDpr` ;
  - pause quand l'onglet est caché ;
  - `premultipliedAlpha: false`, sans quoi `opacity` < 1 surexposait le rendu.
- **Exception assumée à « pas de bleu »** : le plasma reste en arrière-plan discret, l'accent fonctionnel reste le vert.

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
- **`prefers-reduced-transparency: reduce`** : tab bar opaque, sans flou, avec une bordure fine.
- **`prefers-contrast: more`** : fonds pleins, bordures `#707076`, texte secondaire `#AEAEB2` (clair : `#3A3A3C`).

---

## Style Guidelines

**Style:** Dark Mode (OLED), sobre et professionnel

**Keywords:** noir profond, surfaces étagées, bordures fines, un seul accent, typographie neutre, chiffres alignés

**Key Effects:**
- Pas de verre décoratif sur les cartes ni de dégradés vifs.
- Un seul halo radial vert (8 % max) sur la carte du reste à vivre.
- Un seul matériau translucide : la tab bar (fonctionnel, le contenu défile dessous).
- Un fond plasma animé et discret derrière tous les écrans (voir « Fond plasma »).

**Icons:** Lucide (SVG, trait de 2px), en couleur secondaire ; vertes uniquement pour les revenus et l'état sélectionné.

---

## Anti-Patterns (Do NOT Use)

- ❌ Police manuscrite ou décorative (titres, logo, sections)
- ❌ Dépenses en rouge, ou un deuxième accent (bleu, violet…)
- ❌ Glassmorphism décoratif sur les cartes (le seul matériau est la tab bar)
- ❌ Transitions CSS ou `@keyframes` sur un élément manipulé au doigt : utiliser un spring `motion`
- ❌ Retour visuel uniquement au relâcher ; animation qui bloque l'entrée
- ❌ Dialogue de confirmation pour une suppression annulable : préférer l'annulation par toast
- ❌ Bordure dure sous une barre flottante : utiliser le scroll edge effect
- ❌ **Emojis comme icônes** : utiliser des SVG (Lucide)
- ❌ Chiffres proportionnels pour les montants
- ❌ Contenu masqué par la tab bar fixe
- ❌ Texte tertiaire pour une information essentielle
- ❌ **Focus invisible** ; cibles tactiles de moins de 44px

---

## Pre-Delivery Checklist

- [ ] Aucun emoji ; icônes Lucide uniquement
- [ ] Police système (SF) puis Inter, tracking et interlignage par taille, montants en `tabular-nums`
- [ ] Gestes testés en e2e (`npm run test:e2e`) : sheet, swipe-suppression + annulation, swipe de mois
- [ ] Springs `motion` sur tout ce qui se manipule ; retour au pointer-down partout
- [ ] Contrastes AA vérifiés dans les deux thèmes
- [ ] Cibles tactiles ≥ 44px, aucun défilement horizontal (375px, paysage, texte 150 %)
- [ ] Rien ne passe sous la tab bar ; actions sticky visibles
- [ ] Focus visible, focus piégé dans les sheets
- [ ] `prefers-reduced-motion`, `prefers-reduced-transparency` et `prefers-contrast` respectés
