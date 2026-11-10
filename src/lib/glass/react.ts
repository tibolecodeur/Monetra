import { useMotionValueEvent, type MotionValue } from 'motion/react'
import { createContext, useContext, useEffect, useLayoutEffect, useState, type RefObject } from 'react'
import { glassQuery, GlassScene, type LensOptions } from './scene'

/** Scène de verre la plus proche : les lentilles d'un sous-arbre s'y inscrivent. */
export const SceneContext = createContext<GlassScene | null>(null)

/** Conteneur qui défile (l'app ne fait pas défiler la fenêtre : voir App.tsx). */
export const ScrollerContext = createContext<RefObject<HTMLElement | null> | null>(null)

export function useScroller() {
  return useContext(ScrollerContext)
}

/**
 * Verre réfractant disponible : pas de transparence réduite ni de contraste renforcé.
 * Sinon, tout le verre devient un matériau opaque (CSS).
 */
export function useGlassLive(): boolean {
  const [live, setLive] = useState(() => !glassQuery()?.matches)
  useEffect(() => {
    const query = glassQuery()
    if (!query) return
    const onChange = () => setLive(!query.matches)
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [])
  return live
}

/**
 * Crée une scène sur `filtered` (le contenu réfracté) ; le filtre SVG est rendu dans `defs`.
 * Les couleurs du verre sont relues quand le thème change.
 */
export function useGlassScene(
  filtered: RefObject<HTMLElement | null>,
  defs: RefObject<HTMLElement | null>,
  { enabled = true, overflow = 0 } = {},
): GlassScene | null {
  const [scene, setScene] = useState<GlassScene | null>(null)
  useLayoutEffect(() => {
    if (!enabled || !filtered.current || !defs.current) return
    const created = new GlassScene(filtered.current, defs.current, { overflow })
    // La scène dépend du DOM monté : elle ne peut naître qu'ici, puis être publiée aux lentilles.
    // oxlint-disable-next-line react/set-state-in-effect
    setScene(created)
    const observer = new MutationObserver(() => created.refreshStyles())
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    return () => {
      observer.disconnect()
      created.destroy()
      setScene(null)
    }
  }, [enabled, filtered, defs, overflow])
  return scene
}

/**
 * Inscrit l'élément comme lentille de la scène (par défaut, celle du contexte).
 * Renvoie vrai si le verre est réfractant ; faux s'il doit être peint comme un matériau.
 */
export function useLens(
  ref: RefObject<HTMLElement | null>,
  options: Partial<LensOptions>,
  explicitScene?: GlassScene | null,
): boolean {
  const contextScene = useContext(SceneContext)
  const scene = explicitScene === undefined ? contextScene : explicitScene
  const key = JSON.stringify(options)
  useLayoutEffect(() => {
    if (!scene || !ref.current) return
    const lens = scene.add(ref.current, JSON.parse(key) as Partial<LensOptions>)
    return () => scene.remove(lens)
  }, [scene, ref, key])
  return Boolean(scene)
}

/**
 * Réfraction animée : la lentille de sélection ne courbe rien au repos (le libellé reste net),
 * et devient une vraie loupe quand on la touche ou qu'elle glisse (comme la bulle d'iOS 26).
 */
export function useLensIntensity(
  scene: GlassScene | null,
  ref: RefObject<HTMLElement | null>,
  intensity: MotionValue<number>,
  max: number,
) {
  const apply = (v: number) => {
    if (!scene) return
    const on = v > 0.002
    scene.setActive(on)
    scene.tune(ref.current, { refraction: v * max })
    // Au repos, la lentille est peinte en CSS (même teinte) : data-glass suit l'état de la scène.
    if (ref.current) ref.current.dataset.glass = on ? 'live' : 'material'
  }
  useMotionValueEvent(intensity, 'change', apply)
  useLayoutEffect(() => apply(intensity.get()))
}
