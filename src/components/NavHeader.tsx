import { motion, useScroll, useTransform } from 'motion/react'

/**
 * Grand titre façon iOS : il défile avec le contenu, et une barre compacte en verre
 * (titre centré) apparaît en fondu dès qu'il passe sous le haut de l'écran.
 * Le h1 reste le titre de l'écran pour les lecteurs d'écran ; la barre compacte est décorative.
 */
export function NavHeader({ title }: { title: string }) {
  const { scrollY } = useScroll()
  const barOpacity = useTransform(scrollY, [18, 46], [0, 1])
  const titleScale = useTransform(scrollY, [-120, 0], [1.08, 1])

  return (
    <>
      <motion.div className="nav-bar" style={{ opacity: barOpacity }} aria-hidden="true">
        <span className="nav-bar-title">{title}</span>
      </motion.div>
      <header className="screen-header">
        <motion.h1 tabIndex={-1} className="large-title" style={{ scale: titleScale }}>
          {title}
        </motion.h1>
      </header>
    </>
  )
}
