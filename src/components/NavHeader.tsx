import { motion, useScroll, useTransform } from 'motion/react'
import { useScroller } from '../lib/glass/react'

/**
 * Grand titre façon iOS : il défile avec le contenu, et une barre compacte (titre centré)
 * apparaît en fondu dès qu'il passe sous le haut de l'écran. Comme sur iOS 26, cette barre
 * n'est pas une plaque de verre : c'est un scroll edge effect (flou progressif), le verre
 * étant réservé aux contrôles qui flottent au-dessus du contenu.
 * Le h1 reste le titre de l'écran pour les lecteurs d'écran ; la barre compacte est décorative.
 */
export function NavHeader({ title }: { title: string }) {
  const scroller = useScroller()
  const { scrollY } = useScroll(scroller ? { container: scroller } : undefined)
  const barOpacity = useTransform(scrollY, [18, 46], [0, 1])
  const titleScale = useTransform(scrollY, [-120, 0], [1.08, 1])

  return (
    <>
      <motion.div className="nav-bar" style={{ opacity: barOpacity }} aria-hidden="true">
        <div className="nav-bar-edge">
          <span className="nav-bar-title">{title}</span>
        </div>
      </motion.div>
      <header className="screen-header">
        <motion.h1 tabIndex={-1} className="large-title" style={{ scale: titleScale }}>
          {title}
        </motion.h1>
      </header>
    </>
  )
}
