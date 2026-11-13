import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useEffect, useState } from 'react'
import { SPRINGS } from '../lib/motion'
import { setSplashActive, startSplash, useSplashActive } from '../lib/splash'

/** Logo seul au centre, avant de rejoindre l'en-tête. */
const HOLD_MS = 400

/** Identifiant partagé avec la marque de l'en-tête de l'accueil (NavHeader). */
export const BRAND_LAYOUT_ID = 'brand-mark'

/**
 * Écran d'ouverture : le logo « M. » apparaît au centre, puis rejoint sa place dans l'en-tête de l'accueil
 * (même élément, `layoutId`) pendant que l'écran se dévoile. ≈ 0,95 s (≤ 1,2 s), une fois par session ;
 * un toucher le passe ; jamais en mouvement réduit. Hors de l'accueil, le logo s'efface simplement.
 */
export function Splash({ flyToHeader }: { flyToHeader: boolean }) {
  const reduced = useReducedMotion()
  // Démarré une seule fois, à la création (pas dans un effet : React peut les rejouer).
  const [started] = useState(() => !reduced && startSplash())
  const visible = useSplashActive()
  // Passé d'un toucher : on s'efface vite, sans faire voler le logo.
  const [skipped, setSkipped] = useState(false)

  useEffect(() => {
    if (!started) return
    const timer = window.setTimeout(() => setSplashActive(false), HOLD_MS)
    return () => window.clearTimeout(timer)
  }, [started])

  const fly = flyToHeader && !skipped
  const skip = () => {
    setSkipped(true)
    setSplashActive(false)
  }
  return (
    <>
      {/* Le fond seul passe par AnimatePresence : il s'efface en 240 ms puis quitte la page à coup sûr. */}
      <AnimatePresence>
        {visible && (
          <motion.div
            key="splash"
            className="splash"
            data-testid="splash"
            aria-hidden="true"
            exit={{ opacity: 0, transition: { duration: skipped ? 0.12 : 0.24, ease: [0.23, 1, 0.32, 1] } }}
            onPointerDown={skip}
          />
        )}
      </AnimatePresence>
      {/* Le logo, hors d'AnimatePresence : retiré dans la même mise à jour où celui de l'en-tête apparaît,
          qui vole alors depuis sa position (layoutId). Rien n'attend la fin du vol. */}
      {visible && (
        <div className="splash-logo-layer" aria-hidden="true">
          <motion.img
            className="splash-logo"
            src={`${import.meta.env.BASE_URL}favicon.svg`}
            alt=""
            layoutId={fly ? BRAND_LAYOUT_ID : undefined}
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1, transition: SPRINGS.segment() }}
            transition={SPRINGS.move()}
            style={{ borderRadius: 28 }}
          />
        </div>
      )}
    </>
  )
}
