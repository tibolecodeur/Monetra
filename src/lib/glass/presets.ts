import type { LensOptions } from './scene'

/**
 * Optiques du verre Monetra, par rôle (comme les variantes de glassEffect chez Apple).
 * Les couleurs (teinte, voile, intensité du reflet) et l'ombre portée (box-shadow) sont en CSS, par composant et par thème.
 */
export const LENS = {
  /**
   * Barres et boutons qui flottent au-dessus du contenu (tab bar, bouton +, toast) :
   * le contenu qui passe dessous est flouté, courbé dans le biseau, avec une frange chromatique.
   */
  chrome: {
    refraction: 34,
    depth: 18,
    curvature: 0.5,
    chromatic: 0.45,
    blur: 2.5,
    glow: 0.16,
    edgeHighlight: 0.42,
    edgeWidth: 2.5,
    specularAngle: 50,
    tintMode: 'over',
  },
  /**
   * Contrôles posés dans la page (sélecteur de mois, boutons secondaires, rail du segmented) :
   * derrière eux il n'y a que le fond (hors scène). Leur lentille ne réfracte donc rien
   * (elle courberait leurs propres libellés) : elle peint la teinte, le liseré, la lueur et l'ombre.
   */
  control: {
    flat: true,
    refraction: 0,
    depth: 12,
    curvature: 0.35,
    chromatic: 0,
    blur: 0,
    glow: 0.14,
    edgeHighlight: 0.42,
    edgeWidth: 2,
    specularAngle: 50,
  },
  /**
   * Lentille de sélection (onglet actif, curseur du segmented) : un dôme qui grossit et courbe
   * les libellés qu'elle traverse, comme la bulle de la tab bar d'iOS 26.
   */
  selection: {
    // Valeur au plus fort (doigt posé, glissement) ; au repos, la bulle ne réfracte pas (useLensIntensity).
    refraction: 14,
    depth: 12,
    curvature: 0.6,
    chromatic: 0.12,
    blur: 0,
    glow: 0.12,
    edgeHighlight: 0.36,
    edgeWidth: 2,
    specularAngle: 50,
  },
} satisfies Record<string, Partial<LensOptions>>
