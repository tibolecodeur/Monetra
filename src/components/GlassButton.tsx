import type { ButtonHTMLAttributes } from 'react'
import { LENS } from '../lib/glass/presets'
import { Glass } from './Glass'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Classes de la surface de verre. */
  glassClassName?: string
  /** Le bouton flotte au-dessus d'une liste (sticky) : verre de navigation, qui floute ce qui passe dessous. */
  floating?: boolean
}

/** Bouton secondaire en Liquid Glass : le bouton remplit la surface, qui réagit entière au toucher. */
export function GlassButton({ glassClassName = '', floating = false, className = '', children, ...button }: Props) {
  return (
    <Glass
      className={`glass-button glass-press${floating ? ' glass-button--floating' : ''} ${glassClassName}`}
      lens={floating ? { ...LENS.chrome, z: 1 } : LENS.control}
    >
      <button type="button" className={`glass-button-inner ${className}`} {...button}>
        {children}
      </button>
    </Glass>
  )
}
