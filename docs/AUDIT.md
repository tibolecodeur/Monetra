# Audit design et code (10 novembre 2026)

Audit mené avec les skills d'[Emil Kowalski](https://github.com/emilkowalski/skills) (`emil-design-eng`, `mobile-native`, `gestures`, `animation-performance`, `review-animations`, `remove-animations`) et le skill `apple-design`. Il porte sur l'app telle qu'elle était après la PR #8 (Liquid Glass en scène filtrée).

Méthode : lecture du code, recherche systématique (`transition`, `:hover`, `ease-in`, `width`, détection de navigateur…), `knip` pour le code mort, captures dans les deux thèmes, en contraste renforcé, à 320 px et à 1024 px, mesure des contrastes sur le rendu réel. Rien n'a pu être vérifié sur un vrai iPhone.

## Corrigé

| Avant | Après | Pourquoi |
| --- | --- | --- |
| Liquid Glass : filtre SVG sur toute la scène, cartes de déplacement, 3 scènes, boucle de mesure à chaque image (≈ 1 600 lignes avec le retour au toucher en JavaScript) | Un matériau de barre : `backdrop-filter: blur(20px)`, repli opaque avec `@supports` | L'effet dépendait du moteur de rendu ; la règle est de ne pas échanger la fiabilité contre un effet |
| Détection de Safari par user agent (`IS_SAFARI`, `IS_IOS`) | Plus aucune détection ; `@supports` et media queries | « Never branch on user agent strings » (`mobile-native`) |
| L'app défilait dans un conteneur interne (`.scroller`), imposé par le filtre | La fenêtre défile | Défilement natif : retour en haut par la barre d'état, barre d'adresse de Safari |
| Tab bar flottante, réduite au défilement avec `transition: width 0.5s` | Barre fixe, pleine largeur, toujours entière | Animation d'une propriété de mise en page, 500 ms, sur la navigation principale |
| Bulle de l'onglet actif animée, glissable, étirée selon la vitesse | Aucun mouvement : la teinte change à l'instant | Le changement d'onglet se fait cent fois par jour : « No animation. Ever. » |
| Retour au toucher en JavaScript (`lib/press.ts`, écouteurs globaux, spring par appui) | CSS : `:active { transform: scale(0.97) }`, 140 ms, ease-out | « Reaching for JavaScript when CSS does it » ; moins de code, hors du fil principal |
| Curseur du segmented : lentille dans sa propre scène de verre, `ResizeObserver`, hook de 180 lignes | Un `<span>` et `transition: transform 200ms` | Même indication d'état, sans mesure ni JavaScript |
| Swipe pour supprimer : `width` animée à chaque image du geste | `clip-path: inset(…)` | `width` relance la mise en page à chaque image ; `clip-path` reste au compositeur |
| Chevrons de mois : glissement sortant puis entrant, deux springs (≈ 750 ms) | Fondu enchaîné de 270 ms ; le glissement reste réservé au geste | Plus de 300 ms pour une action fréquente ; un bouton n'applique aucune force |
| Sortie du toast en `easeIn` | `cubic-bezier(0.23, 1, 0.32, 1)`, 150 ms | `ease-in` retarde le moment que l'utilisateur regarde |
| Feuille en `backdrop-filter: blur(40px)`, flottante, liseré calculé | Feuille opaque, collée au bas de l'écran | Flou > 20 px sur une grande surface déplacée au doigt : coûteux, surtout sur Safari |
| Bouton principal : dégradé, quatre ombres internes, halo qui suit le doigt | Aplat d'accent | Décoration sans fonction ; le halo dépendait du JavaScript retiré |
| `:hover` sous `@media (hover: hover)` | `@media (hover: hover) and (pointer: fine)` | Évite les survols fantômes au toucher sur certains appareils |
| `@media (prefers-reduced-motion)` : toutes les transitions à 0,01 ms | Seuls les déplacements et les échelles sont coupés | « Fewer and gentler animations, not zero » : couleur et opacité aident à comprendre |
| Jauges : `transition` de 300 ms, courbe propre | 250 ms, `--ease-out` partagé | Budget de 300 ms ; une seule courbe pour toute l'app |
| Pas de `user-select: none` sur les contrôles | Ajouté sur `button` et `[role='radio']`, avec `-webkit-touch-callout: none` | Un appui long sélectionnait le libellé d'un bouton |
| `theme-color` `#000000` / `#F2F2F7` | `#05060C` / `#EEF0F8`, la couleur du haut de la page | La barre d'état ne correspondait pas au fond |
| Contraste renforcé en thème clair : barre translucide sans flou, texte visible au travers | Barre opaque dans les deux thèmes (testé) | Le thème clair redéfinissait le matériau avec plus de poids que la media query |
| Thème clair : curseur blanc du segmented sur rail blanc | Rail gris-bleu, contour en contraste renforcé | Le curseur ne se détachait pas |
| Bouton « Nouveau récurrent » dans un portail hors de l'écran | Bouton `sticky` dans l'écran | Le portail n'existait que pour échapper au filtre |
| Test e2e : toucher ignoré juste après un geste | Délai de 150 ms dans le helper | Artefact de Chromium après un relâcher horodaté, pas un défaut de l'app |

## Code inutile retiré

- `src/lib/glass/` (scène, carte de déplacement, optiques, hooks, licence), `Glass.tsx`, `GlassButton.tsx`, `useSelectionLens.ts`, `press.ts`.
- Exports non utilisés : `prefersReducedMotion`, `spring`, `SPRINGS.press`, `toISODate`, `applyTheme`, `createBackup`, `BACKUP_VERSION`, `BackupData`, export par défaut en double de `closing-plasma`.
- Skill `.claude/skills/liquid-glass` (SwiftUI), sans objet.
- Captures périmées : `docs/screenshots/` contenait cinq jeux de captures d'anciennes interfaces (≈ 19 Mo), remplacés par six captures de l'interface actuelle. Les vidéos des gestes sont réenregistrées.

## Vérifié, conforme

- Baseline `mobile-native` : `viewport-fit=cover`, zones sûres, `dvh`, `-webkit-tap-highlight-color`, `text-size-adjust`, `touch-action: manipulation`, champs ≥ 16 px, `inputMode="decimal"`, zoom jamais désactivé.
- Gestes : suivi 1:1 par motion value écrite en `transform`, `setPointerCapture`, rubber-band, fermeture sur distance **ou** vélocité, spring amorcé par la vélocité du doigt, interruption possible, voile dérivé de la position.
- Aucun `transition: all`, aucun `scale(0)`, aucun `@keyframes`.
- Contrastes mesurés sur le rendu réel : tous les libellés mesurés ≥ 5,4:1, sauf le bouton principal à 4,7:1 (blanc sur accent, 17 px semi-gras).

## Laissé en l'état, à décider

| Point | Constat | Recommandation |
| --- | --- | --- |
| Fond plasma | Seule animation en boucle et seule décoration de l'app (WebGL, 30 images/s). `remove-animations` conseille de figer ou retirer une boucle sur un élément permanent. Gardé : c'est un choix de design explicite, déjà ralenti et mis en pause sous une feuille. | Pour un rendu plus sobre et moins de batterie : le figer sur une image, ou passer à des fonds système unis |
| Feuille faite maison | `gestures` recommande Vaul pour un bottom sheet. La nôtre couvre les mêmes cas (focus piégé, Échap, vélocité, interruption) et elle est testée. | La garder tant qu'elle ne pose pas de problème sur iPhone |
| Thème | Sombre par défaut, sans suivre le réglage du système. | Ajouter un choix « Automatique » |
| Segmented | `role="radiogroup"` sans navigation aux flèches. | L'ajouter si l'app est utilisée au clavier |
| Toast | Ne se balaie pas au doigt ; son minuteur continue quand l'onglet est caché. | Mineur ; Sonner gère les deux si on change de composant |
| Modèle de données | Tables `budgets` et `goals` sans écran. | Les garder (elles sont dans les sauvegardes) jusqu'à la V2 |
| Poids | Un seul fichier JavaScript de 580 ko (186 ko compressé). | Charger le fond plasma à part si le démarrage paraît lent |
| iPhone réel | Zones sûres, clavier, `:active` au toucher, barre d'état : non vérifiables ici. | À tester sur l'appareil |
