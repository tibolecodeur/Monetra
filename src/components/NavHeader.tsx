import { motion, useScroll, useTransform } from 'motion/react'
import type { ReactNode } from 'react'

interface Props {
  title: string
  /** Titre éditorial (serif) par défaut ; « brand » : logo + nom, pour l'accueil. */
  variant?: 'large' | 'brand'
  /** Contrôle posé à droite du titre (sélecteur de mois, bouton rond…). */
  action?: ReactNode
}

/**
 * Grand titre : il défile avec le contenu, et une barre compacte (titre centré) apparaît en fondu
 * dès qu'il passe sous le haut de l'écran. Le h1 reste le titre de l'écran pour les lecteurs d'écran ;
 * la barre est décorative.
 */
export function NavHeader({ title, variant = 'large', action }: Props) {
  const { scrollY } = useScroll()
  // Liée au défilement (pas une animation minutée) : la barre est exactement aussi visible que le titre est masqué.
  const barOpacity = useTransform(scrollY, [18, 46], [0, 1])

  return (
    <>
      <motion.div className="nav-bar" style={{ opacity: barOpacity }} aria-hidden="true">
        <span className="nav-bar-title">{title}</span>
      </motion.div>
      <header className={`screen-header ${variant}`}>
        {variant === 'brand' && (
          // La même icône que sur l'écran d'accueil du téléphone (public/favicon.svg).
          <img className="brand-mark" src={`${import.meta.env.BASE_URL}favicon.svg`} alt="" width={44} height={44} />
        )}
        <h1 tabIndex={-1} className={variant === 'brand' ? 'brand-title' : 'large-title'}>
          {title}
        </h1>
        {action && <div className="screen-header-action">{action}</div>}
      </header>
    </>
  )
}
