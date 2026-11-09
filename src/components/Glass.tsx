import type { ReactNode } from 'react'
import { LiquidGlass } from './LiquidGlass'

interface Props {
  className?: string
  width?: number | string
  height: number | string
  radius: number
  /** Voile (0 à 1) sous le contenu : plus fort quand du texte passe au-dessus d'autres contenus. */
  frost?: number
  /** Teinte du verre, comme glassEffect(.regular.tint(...)). */
  tint?: string
  children?: ReactNode
}

/** Liquid Glass Monetra (components/LiquidGlass.tsx) : classe `glass` pour la mise en page. */
export function Glass({ className = '', width = '100%', height, radius, frost = 0.12, tint, children }: Props) {
  return (
    <LiquidGlass className={`glass ${className}`} width={width} height={height} radius={radius} frost={frost} tint={tint}>
      {children}
    </LiquidGlass>
  )
}
