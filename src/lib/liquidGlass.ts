/**
 * Liquid Glass, version physique (d'après kube.io « Liquid Glass in the Browser » et la doc SwiftUI
 * « Applying Liquid Glass to custom views ») :
 *
 * - la forme est une plaque de verre (indice 1,5) posée sur le fond, au bord bombé en squircle,
 *   le profil que préfère Apple : transition plat → courbe douce, sans arête visible ;
 * - chaque rayon vertical est dévié par la loi de Snell-Descartes au passage dans le biseau :
 *   le centre plat laisse voir le fond tel quel, le bord le « tire » vers l'intérieur (convexe) ;
 * - ces déviations sont encodées dans une carte de déplacement (R = x, G = y, 128 = neutre),
 *   utilisée par <feDisplacementMap> (Chrome) ou par un shader WebGL (Safari, Firefox) ;
 * - un reflet spéculaire en liseré, dont l'intensité dépend de l'angle entre la normale
 *   du bord et une lumière fixe, donne le relief.
 *
 * Tout est calculé une fois par taille de forme puis mis en cache.
 */

export const GLASS_INDEX = 1.5
/** Nombre d'échantillons sur un rayon du biseau : la résolution utile d'un canal 8 bits. */
export const PROFILE_SAMPLES = 127

/** Profil du bord : 0 au bord extérieur, 1 à la fin du biseau (début du plat). */
export function squircle(t: number): number {
  const x = Math.min(1, Math.max(0, t))
  return Math.pow(1 - Math.pow(1 - x, 4), 1 / 4)
}

/**
 * Déplacement (en px) d'un rayon vertical à chaque distance du bord, sur un rayon du biseau.
 * `bezel` : largeur du biseau en px ; `thickness` : épaisseur du verre au plat, en px.
 */
export function refractionProfile(bezel: number, thickness: number, index = GLASS_INDEX, samples = PROFILE_SAMPLES): Float32Array {
  const out = new Float32Array(samples + 1)
  const delta = 0.001
  for (let i = 0; i <= samples; i++) {
    const t = i / samples
    const height = thickness * squircle(t)
    // Pente de la surface (px de hauteur par px parcouru vers l'intérieur).
    const t1 = Math.max(0, t - delta)
    const t2 = Math.min(1, t + delta)
    const slope = (thickness * (squircle(t2) - squircle(t1))) / ((t2 - t1) * bezel)
    // Angle d'incidence entre le rayon vertical et la normale, puis angle réfracté.
    const incidence = Math.atan(slope)
    const refracted = Math.asin(Math.sin(incidence) / index)
    // Le rayon traverse toute la hauteur de verre avant d'atteindre le fond.
    out[i] = height * Math.tan(incidence - refracted)
  }
  return out
}

export interface GlassShape {
  width: number
  height: number
  radius: number
  /** Largeur du biseau (px). */
  bezel: number
  /** Épaisseur du verre (px). */
  thickness: number
}

/** Biseau et épaisseur par défaut d'une forme, proportionnés à sa hauteur (capsule iOS). */
export function defaultShape(width: number, height: number, radius: number): GlassShape {
  const r = Math.min(radius, width / 2, height / 2)
  const bezel = Math.max(6, Math.min(r * 0.92, Math.min(width, height) * 0.36, 26))
  return { width, height, radius: r, bezel, thickness: bezel * 1.6 }
}

interface EdgeSample {
  /** Distance au bord, vers l'intérieur (px) ; négative hors de la forme. */
  depth: number
  /** Normale sortante du bord le plus proche. */
  nx: number
  ny: number
}

/** Distance signée au rectangle arrondi et normale sortante, au point (x, y). */
export function edgeAt(x: number, y: number, w: number, h: number, r: number): EdgeSample {
  const cx = w / 2
  const cy = h / 2
  const dx = x - cx
  const dy = y - cy
  const sx = dx < 0 ? -1 : 1
  const sy = dy < 0 ? -1 : 1
  const qx = Math.abs(dx) - (cx - r)
  const qy = Math.abs(dy) - (cy - r)
  if (qx > 0 && qy > 0) {
    const length = Math.hypot(qx, qy) || 1
    return { depth: r - length, nx: (sx * qx) / length, ny: (sy * qy) / length }
  }
  if (qx > qy) return { depth: r - qx, nx: sx, ny: 0 }
  return { depth: r - qy, nx: 0, ny: sy }
}

export interface GlassMaps {
  /** Largeur et hauteur des cartes, en pixels réels. */
  width: number
  height: number
  /** R, G : déplacement ; B : présence du biseau (pour le shader) ; A : 255. */
  displacement: ImageData | { width: number; height: number; data: Uint8ClampedArray }
  /** Liseré spéculaire : blanc, alpha = intensité. */
  specular: ImageData | { width: number; height: number; data: Uint8ClampedArray }
  /** Déplacement maximal en px CSS : l'échelle de <feDisplacementMap> pour un rendu exact. */
  maxDisplacement: number
}

export interface MapOptions {
  /** Pixels réels par px CSS. */
  ratio?: number
  /** Direction de la lumière, en degrés (0 = vers la droite, -90 = vers le haut). */
  lightAngle?: number
}

const makeImage = (width: number, height: number) =>
  typeof ImageData === 'undefined'
    ? { width, height, data: new Uint8ClampedArray(width * height * 4) }
    : new ImageData(width, height)

/** Calcule la carte de déplacement et la carte spéculaire d'une forme. */
export function buildMaps(shape: GlassShape, { ratio = 1, lightAngle = -55 }: MapOptions = {}): GlassMaps {
  const width = Math.max(1, Math.round(shape.width * ratio))
  const height = Math.max(1, Math.round(shape.height * ratio))
  const { bezel, radius } = shape
  const profile = refractionProfile(bezel, shape.thickness)
  let maxDisplacement = 0
  for (const value of profile) maxDisplacement = Math.max(maxDisplacement, Math.abs(value))
  const unit = maxDisplacement || 1

  const displacement = makeImage(width, height)
  const specular = makeImage(width, height)
  const d = displacement.data
  const s = specular.data
  const lx = Math.cos((lightAngle * Math.PI) / 180)
  const ly = Math.sin((lightAngle * Math.PI) / 180)
  // Liseré : une ligne fine (≈ 1,5 px) et un halo plus large qui se perd dans le biseau.
  const line = 1.5
  const halo = bezel * 0.45

  for (let py = 0; py < height; py++) {
    for (let px = 0; px < width; px++) {
      const i = (py * width + px) * 4
      const edge = edgeAt((px + 0.5) / ratio, (py + 0.5) / ratio, shape.width, shape.height, radius)
      let rx = 0
      let ry = 0
      let inBezel = 0
      let light = 0
      if (edge.depth >= 0 && edge.depth < bezel) {
        const t = edge.depth / bezel
        const k = t * PROFILE_SAMPLES
        const k0 = Math.floor(k)
        const k1 = Math.min(PROFILE_SAMPLES, k0 + 1)
        const magnitude = (profile[k0] + (profile[k1] - profile[k0]) * (k - k0)) / unit
        // Convexe : on lit le fond plus à l'intérieur, à l'opposé de la normale sortante.
        rx = -edge.nx * magnitude
        ry = -edge.ny * magnitude
        inBezel = 1 - t
        // Liseré éclairé de face (haut-gauche) et, plus faible, à contre-jour (bas-droite).
        const facing = edge.nx * lx + edge.ny * ly
        const strength = facing > 0 ? facing : -facing * 0.55
        const rim = Math.exp(-edge.depth / line) + 0.35 * Math.exp(-edge.depth / halo)
        light = Math.min(1, Math.pow(strength, 1.6) * rim * 0.9 + rim * 0.12)
      }
      d[i] = Math.round(128 + rx * 127)
      d[i + 1] = Math.round(128 + ry * 127)
      d[i + 2] = Math.round(inBezel * 255)
      d[i + 3] = 255
      // Antialiasing du contour : la couverture du pixel module le liseré.
      const coverage = Math.min(1, Math.max(0, edge.depth * ratio + 0.5))
      s[i] = 255
      s[i + 1] = 255
      s[i + 2] = 255
      s[i + 3] = Math.round(light * coverage * 255)
    }
  }
  return { width, height, displacement, specular, maxDisplacement }
}

const cache = new Map<string, { maps: GlassMaps; urls?: { displacement: string; specular: string } }>()

const toDataUrl = (image: GlassMaps['displacement']) => {
  const canvas = document.createElement('canvas')
  canvas.width = image.width
  canvas.height = image.height
  canvas.getContext('2d')?.putImageData(image as ImageData, 0, 0)
  return canvas.toDataURL('image/png')
}

/** Cartes d'une forme, mises en cache par taille (plusieurs surfaces identiques les partagent). */
export function glassMaps(shape: GlassShape, ratio: number) {
  const key = [shape.width, shape.height, shape.radius, shape.bezel, shape.thickness, ratio].map((n) => n.toFixed(1)).join('|')
  let entry = cache.get(key)
  if (!entry) {
    entry = { maps: buildMaps(shape, { ratio }) }
    cache.set(key, entry)
    if (cache.size > 24) cache.delete(cache.keys().next().value as string)
  }
  const urls = () => {
    if (!entry.urls)
      entry.urls = { displacement: toDataUrl(entry.maps.displacement), specular: toDataUrl(entry.maps.specular) }
    return entry.urls
  }
  return { key, maps: entry.maps, urls }
}

export type GlassMode = 'svg' | 'webgl' | 'frost'

let detected: GlassMode | null = null

/**
 * Chrome est le seul moteur qui accepte un filtre SVG en backdrop-filter : réfraction exacte du
 * contenu réel. Ailleurs (Safari, iOS, Firefox), le shader WebGL réfracte le fond plasma.
 */
export function detectGlassMode(): GlassMode {
  if (detected) return detected
  const ua = navigator.userAgent
  const blink = /Chrome|Chromium|Edg\//.test(ua) && !/CriOS|FxiOS|EdgiOS|Firefox/.test(ua) && !/iPhone|iPad/.test(ua)
  if (blink && CSS.supports('backdrop-filter', 'url(#a)')) detected = 'svg'
  else {
    let webgl = false
    try {
      const gl = document.createElement('canvas').getContext('webgl2')
      webgl = Boolean(gl)
      gl?.getExtension('WEBGL_lose_context')?.loseContext()
    } catch {
      webgl = false
    }
    detected = webgl ? 'webgl' : 'frost'
  }
  return detected
}
