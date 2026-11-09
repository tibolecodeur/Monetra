import type { ButtonHTMLAttributes } from 'react'
import { Glass } from './Glass'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Classes de la surface de verre (ex. sticky-action). */
  glassClassName?: string
}

/** Bouton secondaire en Liquid Glass : le bouton remplit la surface, qui réagit entière au toucher. */
export function GlassButton({ glassClassName = '', className = '', children, ...button }: Props) {
  return (
    <Glass className={`glass-button glass-press ${glassClassName}`} height={50} radius={25} frost={0.18}>
      <button type="button" className={`glass-button-inner ${className}`} {...button}>
        {children}
      </button>
    </Glass>
  )
}
