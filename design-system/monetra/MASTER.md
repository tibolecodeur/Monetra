# Design System Master File

> **LOGIC:** When building a specific page, first check `design-system/monetra/pages/[page-name].md`.
> If that file exists, its rules **override** this Master file.
> If not, strictly follow the rules below.

---

**Project:** Monetra
**Generated:** 2026-10-29 15:12:45 (ui-ux-pro-max)
**Revised:** 2026-10-29 : thème sombre pro (remplace glassmorphism, Caveat et Quicksand)
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
| Tab bar (opaque) | `#000000` (clair : `#F9F9FB`) | `--color-nav` |

### Color Palette : clair (option)

| Role | Hex | CSS Variable |
|------|-----|--------------|
| Background | `#F2F2F7` | `--color-bg` |
| Surface / surélevée | `#FFFFFF` | `--color-surface`, `--color-surface-elevated` |
| Border | `#E5E5EA` | `--color-border` |
| Border des champs | `#8A8A8E` | `--color-border-input` |
| Text principal / secondaire / tertiaire | `#1C1C1E` / `#6C6C70` / `#8E8E93` | `--color-text*` |
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
| Texte secondaire / surface | 5,8:1 (5,2 sur surélevée) | 5,2:1 (4,7 sur fond) |
| Accent / surface | 9,3:1 | 5,4:1 |
| Texte du bouton accent | 10,4:1 | 5,4:1 |
| Bordure des champs / surface | 3,5 à 3,8:1 | 3,4:1 |

### Typography

- **Police unique : Inter** (variable), auto-hébergée via `@fontsource-variable/inter`, sans CDN, pour fonctionner hors ligne.
- Repli : `-apple-system, system-ui, sans-serif`.
- **Tous les montants** en `font-variant-numeric: tabular-nums`.

| Rôle | Taille | Graisse | Interlettrage | Couleur |
|------|--------|---------|---------------|---------|
| Titre d'écran (h1), logo « Monetra » | 28px | 600 | -0.02em | principal |
| Titre de section / carte | 13px, MAJUSCULES | 500 | 0.06em | secondaire |
| Titre de feuille (sheet) | 20px | 600 | -0.01em | principal |
| Corps | 16px | 400 (500 pour les libellés de ligne) | normal | principal |
| Méta, aide | 14px | 400 | normal | secondaire |
| Montant principal (reste à vivre, saisie) | 44px | 600 | -0.03em | principal |
| Onglets | 12px | 500 (600 si actif) | normal | secondaire / principal |

Le logo est un simple texte Inter semibold, sans effet.

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

### Tab bar

```css
.tab-bar {
  background: #000000; /* opaque : aucun contenu ne transparaît */
  border-top: 1px solid #26262a;
  height: calc(64px + env(safe-area-inset-bottom));
}
```

- 4 onglets + bouton **+** central (vert, 52px), visible sur tous les écrans.
- Chaque écran réserve `padding-bottom: hauteur tab bar + safe-area + 24px`.
- Un bouton d'action en bas de liste (ex. « Nouveau récurrent ») est `position: sticky` juste au-dessus de la tab bar.

### Sheets

Fond `#1C1C1F`, rayon 20px en haut, poignée, bouton fermer de 44px, bouton principal collé en bas. Le focus reste dans la feuille ; Échap ferme.

---

## Style Guidelines

**Style:** Dark Mode (OLED), sobre et professionnel

**Keywords:** noir profond, surfaces étagées, bordures fines, un seul accent, typographie neutre, chiffres alignés

**Key Effects:** pas de verre décoratif ni de dégradés vifs. Un seul halo radial vert (8 % max) sur la carte du reste à vivre. La tab bar est opaque.

**Icons:** Lucide (SVG, trait de 2px), en couleur secondaire ; vertes uniquement pour les revenus et l'état sélectionné.

---

## Anti-Patterns (Do NOT Use)

- ❌ Police manuscrite ou décorative (titres, logo, sections)
- ❌ Dépenses en rouge, ou un deuxième accent (bleu, violet…)
- ❌ Glassmorphism décoratif sur les cartes
- ❌ **Emojis comme icônes** : utiliser des SVG (Lucide)
- ❌ Chiffres proportionnels pour les montants
- ❌ Contenu masqué par la tab bar fixe
- ❌ Texte tertiaire pour une information essentielle
- ❌ **Focus invisible** ; cibles tactiles de moins de 44px

---

## Pre-Delivery Checklist

- [ ] Aucun emoji ; icônes Lucide uniquement
- [ ] Inter partout, montants en `tabular-nums`
- [ ] Contrastes AA vérifiés dans les deux thèmes
- [ ] Cibles tactiles ≥ 44px, aucun défilement horizontal (375px, paysage, texte 150 %)
- [ ] Rien ne passe sous la tab bar ; actions sticky visibles
- [ ] Focus visible, focus piégé dans les sheets
- [ ] `prefers-reduced-motion` respecté
