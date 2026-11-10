import { forwardRef, useLayoutEffect, useRef, useState, type HTMLAttributes } from 'react'
import { renderSpecular } from '../lib/glass/displacementMap'
import { useLens } from '../lib/glass/react'
import type { LensOptions } from '../lib/glass/scene'

interface Props extends HTMLAttributes<HTMLDivElement> {
  /** Optique de la lentille (voir lib/glass/presets.ts). */
  lens: Partial<LensOptions>
  /** Rayon des coins en px, « auto » pour une capsule. */
  radius?: number | 'auto'
  /** Le verre suit l'opacité de l'élément et de ses parents (toast qui apparaît en fondu). */
  fade?: boolean
}

const rimCache = new Map<string, string>()

/**
 * Liseré spéculaire seul, pour le verre qui ne réfracte rien (feuilles, matériau de repli) :
 * même lumière que le verre réfractant (canal bleu de la même carte).
 */
export function GlassRim({ radius = 'auto', lens }: { radius?: number | 'auto'; lens?: Partial<LensOptions> }) {
  const ref = useRef<HTMLSpanElement>(null)
  const [size, setSize] = useState<{ w: number; h: number } | null>(null)
  useLayoutEffect(() => {
    const node = ref.current
    if (!node) return
    let timer = 0
    const read = () => {
      const w = node.offsetWidth
      const h = node.offsetHeight
      setSize((old) => (old && old.w === w && old.h === h ? old : w > 2 && h > 2 ? { w, h } : null))
    }
    read()
    const observer = new ResizeObserver(() => {
      window.clearTimeout(timer)
      timer = window.setTimeout(read, 120)
    })
    observer.observe(node)
    return () => {
      window.clearTimeout(timer)
      observer.disconnect()
    }
  }, [])

  let url = ''
  if (size) {
    const hw = size.w / 2
    const hh = size.h / 2
    const r = radius === 'auto' ? Math.min(hw, hh) : Math.min(radius, hw, hh)
    const edge = lens?.edgeHighlight ?? 0.42
    const key = `${size.w}x${size.h}r${r}e${edge}`
    url = rimCache.get(key) ?? ''
    if (!url) {
      const even = (n: number) => Math.max(8, Math.min(1024, Math.round(n / 2) * 2))
      url = renderSpecular({
        size: even(size.w * 2),
        sizeY: even(size.h * 2),
        halfWidth: hw,
        halfHeight: hh,
        radius: r,
        depth: Math.min(lens?.depth ?? 14, hw - 1, hh - 1),
        domeDepth: 0,
        splay: 1,
        glow: lens?.glow ?? 0.12,
        glowSpread: 1,
        glowExponent: 1.5,
        edgeHighlight: edge,
        edgeWidth: lens?.edgeWidth ?? 2.5,
        edgeExponent: 1.5,
        specularAngle: lens?.specularAngle ?? 50,
      })
      rimCache.set(key, url)
    }
  }
  return (
    <span
      ref={ref}
      className="lg-rim"
      aria-hidden="true"
      style={url ? { backgroundImage: `url(${url})` } : undefined}
    />
  )
}

/**
 * Surface de Liquid Glass. Dans une scène (lib/glass), son corps est peint par le filtre de la scène :
 * réfraction du contenu qui passe dessous, teinte, reflet et ombre. Hors scène, ou si le système
 * demande moins de transparence, c'est un matériau dépoli avec le même liseré.
 * L'apparence (teinte, voile, ombre) se règle en CSS avec les variables `--lg-*`.
 */
export const Glass = forwardRef<HTMLDivElement, Props>(function Glass(
  { lens, radius = 'auto', fade = false, className = '', children, ...rest },
  forwarded,
) {
  const ref = useRef<HTMLDivElement | null>(null)
  const live = useLens(ref, { ...lens, radius })
  return (
    <div
      {...rest}
      ref={(node) => {
        ref.current = node
        if (typeof forwarded === 'function') forwarded(node)
        else if (forwarded) forwarded.current = node
      }}
      className={`lg ${className}`}
      data-glass={live ? 'live' : 'material'}
      data-lens-fade={fade ? '' : undefined}
    >
      {!live && <GlassRim radius={radius} lens={lens} />}
      <span className="lg-glow" aria-hidden="true" />
      {children}
    </div>
  )
})
