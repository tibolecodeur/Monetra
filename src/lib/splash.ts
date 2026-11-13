import { useSyncExternalStore } from 'react'

/**
 * État de l'écran d'ouverture, partagé entre Splash et la marque de l'en-tête : un seul des deux porte
 * le `layoutId` du logo à un instant donné (règle de Motion pour un élément partagé).
 */
const SEEN_KEY = 'monetra:splash-seen'
let active = false
const listeners = new Set<() => void>()

function alreadySeen(): boolean {
  try {
    return sessionStorage.getItem(SEEN_KEY) === '1'
  } catch {
    return false
  }
}

/** Démarre l'écran d'ouverture s'il n'a pas encore été vu dans cette session. Renvoie s'il démarre. */
export function startSplash(): boolean {
  if (alreadySeen()) return false
  try {
    sessionStorage.setItem(SEEN_KEY, '1')
  } catch {
    /* ignoré */
  }
  setSplashActive(true)
  return true
}

export function setSplashActive(next: boolean) {
  if (active === next) return
  active = next
  listeners.forEach((fn) => fn())
}

const subscribe = (fn: () => void) => {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export function useSplashActive(): boolean {
  return useSyncExternalStore(subscribe, () => active)
}

let cascadePlayed = false

/** La cascade des cartes de l'accueil se joue à la première arrivée de la session, une seule fois. */
export function claimCascade(): boolean {
  if (cascadePlayed) return false
  cascadePlayed = true
  return true
}
