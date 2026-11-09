import type { ReactNode } from 'react'
import GlassSurface from './GlassSurface'

/**
 * Source du verre en rendu WebGL : le canvas du fond plasma.
 * Safari (iPhone) ne gère pas la réfraction SVG ; GlassSurface réfracte alors ce canvas.
 * Lu à chaque image, d'où le getter.
 */
const plasmaBackdrop = {
  get current() {
    return document.querySelector<HTMLCanvasElement>('[data-testid="app-background"] canvas')
  },
}

interface Props {
  className?: string
  width?: number | string
  height: number | string
  radius: number
  /** Voile (0 à 1) sous le contenu : plus fort quand du texte passe au-dessus d'autres contenus. */
  frost?: number
  children?: ReactNode
}

/**
 * Liquid Glass (React Bits GlassSurface) avec les réglages Monetra :
 * distorsion -180, dispersion 0.5, fond plasma en source de réfraction.
 */
export function Glass({ className = '', width = '100%', height, radius, frost = 0.1, children }: Props) {
  return (
    <GlassSurface
      className={`glass ${className}`}
      width={width}
      height={height}
      borderRadius={radius}
      distortionScale={-180}
      displace={0.5}
      backgroundOpacity={frost}
      backdrop={plasmaBackdrop}
    >
      {children}
    </GlassSurface>
  )
}
