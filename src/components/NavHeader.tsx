import { motion, useScroll, useTransform } from 'motion/react'

/**
 * Grand titre façon iOS : il défile avec le contenu, et une barre compacte (titre centré)
 * apparaît en fondu dès qu'il passe sous le haut de l'écran. Elle partage le matériau de la
 * barre d'onglets. Le h1 reste le titre de l'écran pour les lecteurs d'écran ; la barre est décorative.
 */
export function NavHeader({ title }: { title: string }) {
  const { scrollY } = useScroll()
  // Liée au défilement (pas une animation minutée) : la barre est exactement aussi visible que le titre est masqué.
  const barOpacity = useTransform(scrollY, [18, 46], [0, 1])

  return (
    <>
      <motion.div className="nav-bar" style={{ opacity: barOpacity }} aria-hidden="true">
        <span className="nav-bar-title">{title}</span>
      </motion.div>
      <header className="screen-header">
        <h1 tabIndex={-1} className="large-title">
          {title}
        </h1>
      </header>
    </>
  )
}
