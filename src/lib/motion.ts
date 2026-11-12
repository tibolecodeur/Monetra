/**
 * Primitives de mouvement « à la Apple » (skill apple-design, Designing Fluid Interfaces) :
 * springs paramétrés en damping ratio + response, projection de momentum,
 * rubber-band et suivi de vélocité pour le passage de relais geste → animation.
 */
import type { Transition } from 'motion/react'

/**
 * Spring défini comme chez Apple : `dampingRatio` (1 = pas de rebond) et `response`
 * (secondes, ce n'est pas une durée). Converti en raideur/amortissement pour une masse de 1.
 */
function spring(dampingRatio: number, response: number, velocity = 0): Transition {
  const omega = (2 * Math.PI) / response
  return {
    type: 'spring',
    stiffness: omega * omega,
    damping: 2 * dampingRatio * omega,
    mass: 1,
    velocity,
    restDelta: 0.5,
    restSpeed: 10,
  }
}

/** Valeurs livrées par Apple (tableau du skill). */
export const SPRINGS = {
  /** Défaut UI : critique, sans dépassement. */
  default: (velocity = 0) => spring(1, 0.35, velocity),
  /** Repositionnement simple. */
  move: (velocity = 0) => spring(1, 0.4, velocity),
  /** Sheet / tiroir, uniquement quand un geste a donné de l'élan. */
  sheet: (velocity = 0) => spring(0.8, 0.3, velocity),
  /** Retour élastique après un flick. */
  flick: (velocity = 0) => spring(0.8, 0.35, velocity),
  /** Pastille d'onglet : critique et court, l'action la plus fréquente de l'app. */
  tab: () => spring(1, 0.3),
  /** Curseur du segmented : critique et vif (≈ 200 ms perçues). */
  segment: () => spring(1, 0.25),
  /** Données qui se réorganisent (bulles, tuiles) : critique, sans rebond. */
  data: () => spring(1, 0.45),
  /** Chiffres qui changent. */
  number: () => spring(1, 0.5),
}

/** Fondu court qui remplace glissements et springs quand le mouvement est réduit. */
export const REDUCED_FADE: Transition = { duration: 0.2, ease: 'easeOut' }

/**
 * Projection de momentum (fonction livrée par Apple) : distance parcourue
 * jusqu'à l'arrêt à partir d'une vélocité en px/s. 0.998 ≈ défilement normal.
 */
export function project(velocity: number, decelerationRate = 0.998): number {
  return ((velocity / 1000) * decelerationRate) / (1 - decelerationRate)
}

/** Résistance progressive au-delà d'une limite : plus on tire, moins ça suit. */
export function rubberband(overshoot: number, dimension: number, constant = 0.55): number {
  return (overshoot * dimension * constant) / (dimension + constant * Math.abs(overshoot))
}

/** Seuil de mouvement avant de s'engager dans une direction (hystérésis). */
export const GESTURE_SLOP = 10

/**
 * Historique court des positions pour calculer la vélocité au relâcher.
 * Passer l'horodatage de l'événement (`e.timeStamp`) plutôt que l'heure de traitement :
 * si le fil principal est occupé, les événements arrivent groupés mais gardent leur vraie date.
 */
export class VelocityTracker {
  private samples: { t: number; x: number; y: number }[] = []

  add(x: number, y: number, t = performance.now()) {
    this.samples.push({ t, x, y })
    // On ne garde que les 100 dernières ms : c'est l'intention finale qui compte.
    while (this.samples.length > 2 && t - this.samples[0].t > 100) this.samples.shift()
  }

  /** Vélocité en px/s. Nulle si le doigt s'est immobilisé avant de relâcher. */
  velocity(now = performance.now()): { x: number; y: number } {
    const first = this.samples[0]
    const last = this.samples[this.samples.length - 1]
    if (!first || !last || last.t === first.t || now - last.t > 80) return { x: 0, y: 0 }
    const dt = (last.t - first.t) / 1000
    return { x: (last.x - first.x) / dt, y: (last.y - first.y) / dt }
  }

  reset() {
    this.samples = []
  }
}

/**
 * Safari sur iPhone n'implémente pas l'API Vibration, mais iOS 18 joue le retour haptique du système
 * quand on bascule un interrupteur natif (`<input type="checkbox" switch>`). On en bascule un, invisible,
 * le temps d'un clic. Ailleurs (Android), l'API Vibration fait le travail.
 */
function iosTap() {
  const label = document.createElement('label')
  label.ariaHidden = 'true'
  label.style.display = 'none'
  const input = document.createElement('input')
  input.type = 'checkbox'
  input.setAttribute('switch', '')
  label.appendChild(input)
  document.head.appendChild(label)
  label.click()
  label.remove()
}

type HapticKind = 'selection' | 'success' | 'error'

/** Rythmes : un tap (sélection, seuil franchi), deux (réussite), trois (erreur), comme les retours d'iOS. */
const PATTERNS: Record<HapticKind, number[]> = {
  selection: [8],
  success: [6, 70, 6],
  error: [8, 60, 8, 60, 8],
}

/**
 * Retour haptique, réservé aux moments qui comptent : seuil franchi, appui long, mois changé,
 * enregistrement réussi, erreur de saisie. Appelé dans le gestionnaire de l'événement qui le cause,
 * pour que vibration et image arrivent ensemble.
 */
export function haptic(kind: HapticKind = 'selection') {
  const pattern = PATTERNS[kind]
  try {
    if (typeof navigator.vibrate === 'function') {
      navigator.vibrate(pattern)
      return
    }
    // iOS : un tap par impulsion du rythme, espacés comme lui.
    let delay = 0
    pattern.forEach((value, i) => {
      if (i % 2 === 1) {
        delay += value
        return
      }
      if (delay === 0) iosTap()
      else window.setTimeout(iosTap, delay)
    })
  } catch {
    /* non supporté */
  }
}
