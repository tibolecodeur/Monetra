/**
 * Scène de Liquid Glass : un seul filtre SVG posé sur le contenu, avec une lentille par surface de verre.
 *
 * Technique de liquid-glass-web-react (Pallav Agarwal, MIT) : au lieu d'un `backdrop-filter`
 * (que Safari refuse avec un filtre SVG), le filtre est appliqué au contenu lui-même avec
 * `filter: url(#…)`. Chaque lentille ne traite que sa zone (sous-région du filtre) :
 * le reste du contenu sort intact, et le coût suit la taille du verre, pas celle de l'écran.
 *
 * Ajouts Monetra par rapport à la bibliothèque d'origine :
 * - plusieurs lentilles dans un même filtre (tab bar, bouton +, toast, contrôles…), chacune
 *   suivant la position réelle de son élément à chaque image (défilement, springs, pression) ;
 * - teinte et voile du verre (glassEffect(.regular.tint(…))) et ombre portée dans le filtre,
 *   lus depuis les variables CSS de l'élément (`--lg-tint`, `--lg-tint-opacity`…) : le thème reste en CSS ;
 * - opacité de la lentille (fondu d'un toast) ;
 * - toujours en unités userSpaceOnUse (le chemin éprouvé sur iOS par la bibliothèque).
 */
import { renderDisplacementMap } from './displacementMap'

const SVG_NS = 'http://www.w3.org/2000/svg'

const UA = typeof navigator !== 'undefined' ? navigator.userAgent : ''
const IS_IOS =
  typeof navigator !== 'undefined' &&
  (/iPad|iPhone|iPod/.test(UA) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1))
/**
 * Safari garde en cache le résultat d'un filtre par identifiant : à chaque changement d'attribut,
 * le filtre reçoit un nouvel identifiant (comme dans la bibliothèque d'origine).
 */
export const IS_SAFARI = IS_IOS || /^((?!chrome|chromium|android).)*safari/i.test(UA)

/** Forme et optique d'une lentille. Les couleurs, elles, viennent du CSS. */
export interface LensOptions {
  /** Rayon des coins en px, ou « auto » pour une capsule. */
  radius: number | 'auto'
  /** Déplacement maximal du contenu dans le biseau, en px (échelle de feDisplacementMap). */
  refraction: number
  /** Largeur de la bande réfractante du bord, px. */
  depth: number
  /** Profil : 0 linéaire, 1 dôme sphérique (effet loupe). */
  curvature: number
  /** Aberration chromatique sur le bord, 0 à 1 (0 : une seule passe de déplacement). */
  chromatic: number
  /** Flou du contenu vu à travers le verre, px. */
  blur: number
  /** Lueur spéculaire intérieure, 0 à 1. */
  glow: number
  /** Liseré lumineux du bord, 0 à 1. */
  edgeHighlight: number
  /** Largeur du liseré, px. */
  edgeWidth: number
  /** Direction de la lumière, degrés. */
  specularAngle: number
  /**
   * Verre sans réfraction (contrôles posés dans la page) : chaîne courte, sans passes de déplacement ;
   * la lentille ne peint que la teinte, le reflet et la découpe.
   */
  flat: boolean
  /**
   * Place de la teinte : « over » voile le contenu vu à travers (verre qui flotte au-dessus
   * d'autre chose) ; « under » reste sous le contenu, quand ce contenu est le libellé du contrôle lui-même.
   */
  tintMode: 'over' | 'under'
  /** Ordre d'empilement entre lentilles d'une même scène. */
  z: number
}

export const DEFAULT_LENS: LensOptions = {
  radius: 'auto',
  refraction: 20,
  depth: 14,
  curvature: 0.6,
  chromatic: 0,
  blur: 0,
  glow: 0.1,
  edgeHighlight: 0.3,
  edgeWidth: 2.5,
  specularAngle: 50,
  flat: false,
  tintMode: 'under',
  z: 0,
}

/** Apparence lue en CSS sur l'élément (variables, résolues par le navigateur). */
interface LensStyle {
  tint: string
  tintOpacity: number
  specular: number
}

interface LensNodes {
  /** Primitives limitées exactement à la lentille. */
  region: SVGElement[]
  /** Primitives limitées à la lentille élargie (flou). */
  padded: SVGElement[]
  image: SVGElement
  displace: SVGElement[]
  blur: SVGElement | null
  tint: SVGElement
  specular: SVGElement
  shape: SVGElement
}

interface Rect {
  x: number
  y: number
  w: number
  h: number
  opacity: number
}

export class Lens {
  el: HTMLElement
  options: LensOptions
  style: LensStyle | null = null
  nodes: LensNodes | null = null
  rect: Rect = { x: 0, y: 0, w: 0, h: 0, opacity: 0 }
  /** Taille de mise en page (hors transformations) pour laquelle la carte a été calculée. */
  mapSize = { w: 0, h: 0 }
  mapUrl = ''
  /** Pressé (data-pressed) : le CSS peut alors aviver le verre, on relit son style. */
  pressed = false
  /** Hors de la scène (défilé hors de l'écran) : retirée du filtre tant qu'elle n'y revient pas. */
  culled = false
  order: number

  constructor(el: HTMLElement, options: LensOptions, order: number) {
    this.el = el
    this.options = options
    this.order = order
  }
}

function fe(name: string, attrs: Record<string, string | number>): SVGElement {
  const el = document.createElementNS(SVG_NS, name)
  for (const key of Object.keys(attrs)) el.setAttribute(key, String(attrs[key]))
  return el
}

const num = (value: string, fallback: number) => {
  const n = parseFloat(value)
  return Number.isFinite(n) ? n : fallback
}

/** Clés dont un changement impose de recalculer la carte. */
const MAP_KEYS = ['radius', 'depth', 'curvature', 'glow', 'edgeHighlight', 'edgeWidth', 'specularAngle'] as const
/** Clés qui changent la structure du filtre. */
const STRUCTURE_KEYS = ['blur', 'chromatic', 'flat', 'tintMode', 'z'] as const

let sceneCounter = 0
let canvas: HTMLCanvasElement | null = null

/** Carte de déplacement d'une lentille, à environ 2 pixels de carte par pixel CSS. */
function lensMap(o: LensOptions, w: number, h: number): string {
  canvas ??= document.createElement('canvas')
  const even = (n: number) => Math.max(8, Math.min(1024, Math.round(n / 2) * 2))
  const hw = w / 2
  const hh = h / 2
  const radius = o.radius === 'auto' ? Math.min(hw, hh) : Math.min(o.radius, hw, hh)
  return renderDisplacementMap(
    {
      size: even(w * 2),
      sizeY: even(h * 2),
      halfWidth: hw,
      halfHeight: hh,
      radius,
      depth: Math.min(o.depth, hw - 1, hh - 1),
      domeDepth: Math.max(0, Math.min(1, o.curvature)) * Math.min(hw, hh),
      splay: 1,
      glow: o.glow,
      glowSpread: 1,
      glowExponent: 1.5,
      edgeHighlight: o.edgeHighlight,
      edgeWidth: o.edgeWidth,
      edgeExponent: 1.5,
      specularAngle: o.specularAngle,
    },
    canvas,
  )
}

export class GlassScene {
  readonly filtered: HTMLElement
  private defsHost: HTMLElement
  private lenses: Lens[] = []
  private filterEl: SVGElement | null = null
  private attached = false
  private empty = false
  private active = true
  private readonly id = `lg-scene-${++sceneCounter}`
  private version = 0
  private raf = 0
  private dirty = true
  private needsBuild = true
  private counter = 0
  private size = { w: 0, h: 0 }
  /** Marge (px) autour de la scène où le verre peut déborder (bulle qui grossit, ombre). */
  private overflow: number

  constructor(filtered: HTMLElement, defsHost: HTMLElement, { overflow = 0 } = {}) {
    this.filtered = filtered
    this.defsHost = defsHost
    this.overflow = overflow
    this.tick = this.tick.bind(this)
    this.raf = requestAnimationFrame(this.tick)
    document.addEventListener('visibilitychange', this.onVisibility)
  }

  add(el: HTMLElement, options: Partial<LensOptions> = {}): Lens {
    const lens = new Lens(el, { ...DEFAULT_LENS, ...options }, this.counter++)
    this.lenses.push(lens)
    this.lenses.sort((a, b) => a.options.z - b.options.z || a.order - b.order)
    this.needsBuild = true
    return lens
  }

  update(lens: Lens, options: Partial<LensOptions>) {
    const next = { ...lens.options, ...options }
    if (MAP_KEYS.some((k) => next[k] !== lens.options[k])) lens.mapSize = { w: 0, h: 0 }
    if (STRUCTURE_KEYS.some((k) => next[k] !== lens.options[k])) this.needsBuild = true
    lens.options = next
    this.lenses.sort((a, b) => a.options.z - b.options.z || a.order - b.order)
    this.dirty = true
  }

  /** Ajuste la lentille d'un élément (réfraction animée, par exemple) sans rien reconstruire. */
  tune(el: HTMLElement | null, options: Partial<LensOptions>) {
    const lens = this.lenses.find((l) => l.el === el)
    if (lens) this.update(lens, options)
  }

  remove(lens: Lens) {
    this.lenses = this.lenses.filter((l) => l !== lens)
    this.needsBuild = true
  }

  /**
   * Met la scène en veille : le filtre est retiré (le contenu s'affiche tel quel) et plus rien n'est mesuré.
   * Les lentilles de sélection ne réfractent rien au repos : leur scène ne s'active qu'au toucher
   * ou en mouvement, ce qui évite de recalculer un filtre à chaque image pour rien.
   */
  setActive(active: boolean) {
    if (active === this.active) return
    this.active = active
    this.attached = false
    if (active) this.dirty = true
    else this.filtered.style.filter = ''
  }

  /** Relit les couleurs (changement de thème). */
  refreshStyles() {
    for (const lens of this.lenses) lens.style = null
    this.dirty = true
  }

  destroy() {
    cancelAnimationFrame(this.raf)
    this.raf = 0
    document.removeEventListener('visibilitychange', this.onVisibility)
    this.filtered.style.filter = ''
    this.defsHost.replaceChildren()
  }

  private onVisibility = () => {
    cancelAnimationFrame(this.raf)
    this.raf = document.hidden ? 0 : requestAnimationFrame(this.tick)
  }

  private readStyle(el: HTMLElement): LensStyle {
    const cs = getComputedStyle(el)
    const v = (name: string) => cs.getPropertyValue(name).trim()
    return {
      tint: v('--lg-tint') || 'rgb(128, 128, 128)',
      tintOpacity: num(v('--lg-tint-opacity'), 0.2),
      specular: num(v('--lg-specular'), 1),
    }
  }

  /** Une image : mesure chaque lentille et n'écrit dans le filtre que ce qui a changé. */
  private tick() {
    this.raf = requestAnimationFrame(this.tick)
    const host = this.filtered
    if (!host.isConnected || !this.active) return
    const box = host.getBoundingClientRect()
    const W = host.offsetWidth
    const H = host.offsetHeight
    if (!W || !H) return
    // Une transformation d'un ancêtre (feuille qui glisse, pression) change l'échelle : on la compense.
    const sx = box.width / W || 1
    const sy = box.height / H || 1
    if (W !== this.size.w || H !== this.size.h) {
      this.size = { w: W, h: H }
      this.dirty = true
    }

    for (const lens of this.lenses) {
      const el = lens.el
      const pressed = el.dataset.pressed !== undefined || el.dataset.lit !== undefined
      if (pressed !== lens.pressed) {
        lens.pressed = pressed
        lens.style = null
      }
      if (!lens.style) {
        lens.style = this.readStyle(el)
        this.dirty = true
      }
      let next: Rect
      if (!el.isConnected) next = { x: 0, y: 0, w: 0, h: 0, opacity: 0 }
      else {
        const r = el.getBoundingClientRect()
        let opacity = 1
        if (el.dataset.lensFade !== undefined) {
          for (let node: HTMLElement | null = el, i = 0; node && i < 4; node = node.parentElement, i++) {
            opacity *= num(getComputedStyle(node).opacity, 1)
          }
        }
        next = {
          x: (r.left - box.left) / sx,
          y: (r.top - box.top) / sy,
          w: r.width / sx,
          h: r.height / sy,
          opacity: el.dataset.lensHidden !== undefined ? 0 : opacity,
        }
        // Carte recalculée à la taille de mise en page ; pendant une pression (échelle),
        // la carte existante est simplement étirée.
        const lw = el.offsetWidth
        const lh = el.offsetHeight
        if (lw > 2 && lh > 2 && (lw !== lens.mapSize.w || lh !== lens.mapSize.h)) {
          lens.mapSize = { w: lw, h: lh }
          lens.mapUrl = lensMap(lens.options, lw, lh)
          lens.nodes?.image.setAttribute('href', lens.mapUrl)
          this.dirty = true
        }
      }
      const p = lens.rect
      if (
        Math.abs(next.x - p.x) > 0.05 ||
        Math.abs(next.y - p.y) > 0.05 ||
        Math.abs(next.w - p.w) > 0.05 ||
        Math.abs(next.h - p.h) > 0.05 ||
        Math.abs(next.opacity - p.opacity) > 0.005
      ) {
        lens.rect = next
        this.dirty = true
      }
      // Chaque lentille coûte une dizaine de primitives : celles qui sont sorties de l'écran
      // (défilement) quittent le filtre, et y reviennent en approchant.
      const margin = 80
      const culled =
        next.w <= 1 ||
        next.h <= 1 ||
        next.x + next.w < -margin ||
        next.y + next.h < -margin ||
        next.x > W + margin ||
        next.y > H + margin
      if (culled !== lens.culled) {
        lens.culled = culled
        this.needsBuild = true
      }
    }

    if (this.needsBuild) {
      this.build()
      this.needsBuild = false
      this.dirty = true
    }
    if (this.dirty) {
      this.apply()
      this.dirty = false
    }
  }

  /**
   * Chaîne de primitives, pour chaque lentille visible (d'après liquid-glass-web-react) :
   *   fond neutre + carte (feImage) ─▶ carte
   *   contenu (flouté) ─▶ 1 ou 3 feDisplacementMap (aberration chromatique) ─▶ réfraction
   *   teinte du verre par-dessus ou dessous ─▶ verre ; + canal bleu de la carte ─▶ reflet
   *   découpe à la forme exacte (alpha de la carte)
   * Verre plat (contrôles) : carte, contenu tel quel sous la teinte, reflet, découpe.
   * Puis : contenu percé des formes, et les verres par-dessus, dans l'ordre d'empilement.
   * L'ombre portée est en CSS (box-shadow), bien moins coûteuse qu'un flou dans le filtre.
   */
  private build() {
    const filter = fe('filter', {
      filterUnits: 'userSpaceOnUse',
      primitiveUnits: 'userSpaceOnUse',
      'color-interpolation-filters': 'sRGB',
      x: 0,
      y: 0,
      width: 1,
      height: 1,
    })
    const add = (el: SVGElement) => {
      filter.appendChild(el)
      return el
    }
    const drawn: string[] = []
    for (const [i, lens] of this.lenses.entries()) {
      if (lens.culled) {
        lens.nodes = null
        continue
      }
      const o = lens.options
      const p = `l${i}`
      drawn.push(p)
      const region: SVGElement[] = []
      const padded: SVGElement[] = []
      const r = <T extends SVGElement>(el: T) => (region.push(el), add(el))
      const pad = <T extends SVGElement>(el: T) => (padded.push(el), add(el))

      const image = r(fe('feImage', { preserveAspectRatio: 'none', result: `${p}raw`, href: lens.mapUrl }))
      let blur: SVGElement | null = null
      const displace: SVGElement[] = []
      let content = 'SourceGraphic'
      if (!o.flat) {
        r(fe('feFlood', { 'flood-color': 'rgb(128,128,128)', 'flood-opacity': 1, result: `${p}bg` }))
        r(fe('feComposite', { in: `${p}raw`, in2: `${p}bg`, operator: 'over', result: `${p}map` }))
        let source = 'SourceGraphic'
        if (o.blur > 0) {
          blur = pad(fe('feGaussianBlur', { in: 'SourceGraphic', stdDeviation: o.blur, edgeMode: 'duplicate', result: `${p}src` }))
          source = `${p}src`
        }
        if (o.chromatic > 0) {
          const channels = [
            '1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0',
            '0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0',
            '0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0',
          ]
          channels.forEach((values, c) => {
            displace.push(
              r(fe('feDisplacementMap', { in: source, in2: `${p}map`, scale: 0, xChannelSelector: 'R', yChannelSelector: 'G' })),
            )
            r(fe('feColorMatrix', { type: 'matrix', values, result: `${p}d${c}` }))
          })
          r(fe('feComposite', { in: `${p}d0`, in2: `${p}d1`, operator: 'arithmetic', k1: 0, k2: 1, k3: 1, k4: 0, result: `${p}d01` }))
          r(fe('feComposite', { in: `${p}d01`, in2: `${p}d2`, operator: 'arithmetic', k1: 0, k2: 1, k3: 1, k4: 0, result: `${p}ref` }))
        } else {
          displace.push(
            r(
              fe('feDisplacementMap', {
                in: source,
                in2: `${p}map`,
                scale: 0,
                xChannelSelector: 'R',
                yChannelSelector: 'G',
                result: `${p}ref`,
              }),
            ),
          )
        }
        content = `${p}ref`
      }
      const tint = r(fe('feFlood', { 'flood-color': 'rgb(128,128,128)', 'flood-opacity': 0, result: `${p}tint` }))
      r(
        fe('feComposite', {
          in: o.tintMode === 'over' ? `${p}tint` : content,
          in2: o.tintMode === 'over' ? content : `${p}tint`,
          operator: 'over',
          result: `${p}glass`,
        }),
      )
      // Reflet : le canal bleu de la carte (128 = rien) devient un blanc additif.
      r(
        fe('feColorMatrix', {
          in: IS_SAFARI || o.flat ? `${p}raw` : `${p}map`,
          type: 'matrix',
          values: `0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 1 0 ${-128 / 255}`,
          result: `${p}spec`,
        }),
      )
      const specular = r(
        fe('feComposite', { in: `${p}spec`, in2: `${p}glass`, operator: 'arithmetic', k1: 0, k2: 1, k3: 1, k4: 0, result: `${p}lit` }),
      )
      // Forme exacte (alpha de la carte), multipliée par l'opacité de la lentille.
      const shape = r(
        fe('feColorMatrix', { in: `${p}raw`, type: 'matrix', values: '0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0', result: `${p}shape` }),
      )
      r(fe('feComposite', { in: `${p}lit`, in2: `${p}shape`, operator: 'in', result: `${p}out` }))
      lens.nodes = { region, padded, image, displace, blur, tint, specular, shape }
    }

    if (drawn.length) {
      // Contenu percé de toutes les formes, puis les verres, dans l'ordre d'empilement.
      const union = fe('feMerge', { result: 'union' })
      for (const p of drawn) union.appendChild(fe('feMergeNode', { in: `${p}shape` }))
      add(union)
      add(fe('feComposite', { in: 'SourceGraphic', in2: 'union', operator: 'out', result: 'holed' }))
      const merge = fe('feMerge', {})
      merge.appendChild(fe('feMergeNode', { in: 'holed' }))
      for (const p of drawn) merge.appendChild(fe('feMergeNode', { in: `${p}out` }))
      add(merge)
    }

    const svg = document.createElementNS(SVG_NS, 'svg')
    svg.setAttribute('aria-hidden', 'true')
    svg.setAttribute('width', '0')
    svg.setAttribute('height', '0')
    svg.style.position = 'absolute'
    const defs = document.createElementNS(SVG_NS, 'defs')
    defs.appendChild(filter)
    svg.appendChild(defs)
    this.defsHost.replaceChildren(svg)
    this.filterEl = filter
    this.empty = drawn.length === 0
    // Nouveau filtre : il faut le reposer sur la scène (et, sur Safari, sous un nouvel identifiant).
    this.attached = false
    if (!IS_SAFARI) filter.id = this.id
  }

  private apply() {
    const filter = this.filterEl
    if (!filter) return
    const { w: W, h: H } = this.size
    const m = this.overflow
    filter.setAttribute('x', String(-m))
    filter.setAttribute('y', String(-m))
    filter.setAttribute('width', String(W + 2 * m))
    filter.setAttribute('height', String(H + 2 * m))

    for (const lens of this.lenses) {
      const n = lens.nodes
      const s = lens.style
      if (!n || !s) continue
      const o = lens.options
      const { x, y, w, h, opacity } = lens.rect
      const visible = w > 1 && h > 1 && opacity > 0.001
      // Biais d'un demi-pixel, comme dans la bibliothèque : évite les artefacts du bord de sous-région.
      const b = 0.5
      const set = (el: SVGElement, px: number) => {
        el.setAttribute('x', String(visible ? x + b - px : 0))
        el.setAttribute('y', String(visible ? y + b - px : 0))
        el.setAttribute('width', String(visible ? Math.max(0, w - 2 * b + 2 * px) : 0))
        el.setAttribute('height', String(visible ? Math.max(0, h - 2 * b + 2 * px) : 0))
      }
      for (const el of n.region) set(el, 0)
      for (const el of n.padded) set(el, o.blur * 3)

      const scale = o.refraction
      const c = o.chromatic
      const scales = c > 0 ? [scale * (1 + 0.2 * c), scale * (1 + 0.1 * c), scale] : [scale]
      n.displace.forEach((el, i) => el.setAttribute('scale', String(scales[i])))
      n.blur?.setAttribute('stdDeviation', String(o.blur))
      n.tint.setAttribute('flood-color', s.tint)
      n.tint.setAttribute('flood-opacity', String(s.tintOpacity))
      n.specular.setAttribute('k2', String(s.specular))
      n.shape.setAttribute('values', `0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 ${opacity} 0`)
    }

    // Aucune lentille à l'écran : pas de filtre du tout (le contenu s'affiche tel quel, sans coût).
    if (this.empty) {
      this.filtered.style.filter = ''
      return
    }

    if (IS_SAFARI) {
      filter.id = `${this.id}-v${++this.version}`
      this.filtered.style.filter = `url(#${filter.id})`
    } else if (!this.attached) {
      // Ailleurs, les attributs s'appliquent en place : le filtre est posé une fois pour toutes.
      this.attached = true
      this.filtered.style.filter = `url(#${this.id})`
    }
  }
}

/** Le verre réfractant est coupé quand le système demande moins de transparence ou plus de contraste. */
export function glassQuery(): MediaQueryList | null {
  return typeof matchMedia === 'function'
    ? matchMedia('(prefers-reduced-transparency: reduce), (prefers-contrast: more)')
    : null
}
