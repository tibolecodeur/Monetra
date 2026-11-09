import { useEffect, useId, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { defaultShape, detectGlassMode, glassMaps, type GlassMaps, type GlassMode } from '../lib/liquidGlass'

export interface LiquidGlassProps {
  className?: string
  width?: number | string
  height: number | string
  radius: number
  /**
   * Voile (0 à 1) posé sur le verre. Apple : « regular » (voile léger, pour la navigation)
   * ou plus fort quand du texte doit rester lisible au-dessus d'autres contenus.
   */
  frost?: number
  /** Teinte du verre (glassEffect(.regular.tint(...))) ; couleur CSS. */
  tint?: string
  /** Intensité de la réfraction (1 = physique). */
  refraction?: number
  /** Flou du fond vu à travers le verre, en px. */
  blur?: number
  style?: CSSProperties
  children?: ReactNode
}

const css = (value: number | string) => (typeof value === 'number' ? `${value}px` : value)

/** Taille de mise en page (sans les transformations : l'effet de pression ne recalcule rien). */
function useSize(ref: React.RefObject<HTMLElement | null>) {
  const [size, setSize] = useState<{ w: number; h: number } | null>(null)
  useLayoutEffect(() => {
    const node = ref.current
    if (!node) return
    const measure = () => {
      const w = Math.round(node.offsetWidth)
      const h = Math.round(node.offsetHeight)
      setSize((old) => (old && old.w === w && old.h === h ? old : w && h ? { w, h } : null))
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(node)
    return () => observer.disconnect()
  }, [ref])
  return size
}

/**
 * Liquid Glass façon Apple : une plaque de verre qui réfracte ce qu'il y a derrière (biseau en
 * squircle, loi de Snell), floute légèrement, renforce les couleurs, et porte un liseré spéculaire.
 * Voir lib/liquidGlass.ts pour la physique.
 */
export function LiquidGlass({
  className = '',
  width = '100%',
  height,
  radius,
  frost = 0.12,
  tint,
  refraction = 1,
  blur = 2.5,
  style,
  children,
}: LiquidGlassProps) {
  const ref = useRef<HTMLDivElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const [mode] = useState<GlassMode>(() => (typeof window === 'undefined' ? 'frost' : detectGlassMode()))
  const size = useSize(ref)
  const filterId = `lg-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`

  const ratio = Math.min(2, typeof window === 'undefined' ? 1 : window.devicePixelRatio || 1)
  const shape = size ? defaultShape(size.w, size.h, radius) : null
  // Chrome : la carte de déplacement suffit en 1×, le liseré est calculé à la densité de l'écran.
  const specular = shape ? glassMaps(shape, ratio) : null
  const refract = shape && mode === 'svg' ? glassMaps(shape, 1) : null
  const scale = refract ? refract.maps.maxDisplacement * 2 * refraction : 0

  useWebglGlass(mode === 'webgl' ? canvas : null, ref, specular?.maps ?? null, refraction, blur)

  // L'identifiant change avec la taille : Chrome relit alors le filtre.
  const svgId = refract && size ? `${filterId}-${size.w}x${size.h}` : ''
  const rootStyle: CSSProperties & Record<`--${string}`, string | number> = {
    width: css(width),
    height: css(height),
    borderRadius: radius,
    '--lg-frost': frost,
    ...(tint ? { '--lg-tint': tint } : null),
    ...(svgId ? { backdropFilter: `url(#${svgId})` } : null),
    ...style,
  }

  return (
    <div ref={ref} className={`lg lg--${mode} ${className}`} style={rootStyle} data-glass={mode}>
      {refract && size && (
        <svg className="lg-defs" aria-hidden="true" width="0" height="0" focusable="false">
          <filter
            id={svgId}
            x="0"
            y="0"
            width={size.w}
            height={size.h}
            filterUnits="userSpaceOnUse"
            primitiveUnits="userSpaceOnUse"
            colorInterpolationFilters="sRGB"
          >
            <feGaussianBlur in="SourceGraphic" stdDeviation={blur} result="soft" />
            <feImage
              href={refract.urls().displacement}
              x="0"
              y="0"
              width={size.w}
              height={size.h}
              preserveAspectRatio="none"
              result="map"
            />
            <feDisplacementMap in="soft" in2="map" scale={scale} xChannelSelector="R" yChannelSelector="G" result="bent" />
            <feColorMatrix in="bent" type="saturate" values="1.7" />
          </filter>
        </svg>
      )}
      {mode === 'webgl' && <canvas ref={canvas} className="lg-canvas" aria-hidden="true" />}
      <span className="lg-tint" aria-hidden="true" />
      {specular && (
        <span className="lg-specular" aria-hidden="true" style={{ backgroundImage: `url(${specular.urls().specular})` }} />
      )}
      <span className="lg-glow" aria-hidden="true" />
      <div className="lg-content">{children}</div>
    </div>
  )
}

/* Rendu WebGL (Safari, Firefox) : le shader applique la même carte de déplacement au fond plasma. */

const VERTEX = `#version 300 es
in vec2 aPosition;
void main() { gl_Position = vec4(aPosition, 0.0, 1.0); }`

const FRAGMENT = `#version 300 es
precision highp float;
uniform sampler2D uBackdrop;
uniform sampler2D uMap;
uniform vec2 uCanvas;
uniform vec2 uSize;
uniform vec2 uOrigin;
uniform vec2 uStep;
uniform float uScale;
uniform float uBlur;
uniform vec3 uBase;
uniform float uOpacity;
out vec4 outColor;

vec3 backdrop(vec2 p) {
  vec4 c = texture(uBackdrop, uOrigin + p * uStep);
  return mix(uBase, c.rgb, c.a * uOpacity);
}

void main() {
  vec2 p = vec2(gl_FragCoord.x, uCanvas.y - gl_FragCoord.y) / uCanvas * uSize;
  vec4 m = texture(uMap, p / uSize);
  vec2 shift = (m.rg * 255.0 - 128.0) / 127.0 * uScale;
  vec2 q = p + shift;
  // Flou léger en croix (le plasma est déjà doux).
  vec3 c = backdrop(q) * 0.4
    + (backdrop(q + vec2(uBlur, 0.0)) + backdrop(q - vec2(uBlur, 0.0))
    + backdrop(q + vec2(0.0, uBlur)) + backdrop(q - vec2(0.0, uBlur))) * 0.15;
  float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
  c = clamp(mix(vec3(l), c, 1.7), 0.0, 1.0);
  // Opaque dans le biseau (là où la lumière est déviée), transparent au centre :
  // le centre garde le flou CSS du contenu réel.
  float a = smoothstep(0.0, 0.3, m.b);
  outColor = vec4(c * a, a);
}`

function compile(gl: WebGL2RenderingContext) {
  const shader = (type: number, source: string) => {
    const s = gl.createShader(type)
    if (!s) return null
    gl.shaderSource(s, source)
    gl.compileShader(s)
    return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null
  }
  const vertex = shader(gl.VERTEX_SHADER, VERTEX)
  const fragment = shader(gl.FRAGMENT_SHADER, FRAGMENT)
  const program = gl.createProgram()
  if (!vertex || !fragment || !program) return null
  gl.attachShader(program, vertex)
  gl.attachShader(program, fragment)
  gl.bindAttribLocation(program, 0, 'aPosition')
  gl.linkProgram(program)
  gl.deleteShader(vertex)
  gl.deleteShader(fragment)
  return gl.getProgramParameter(program, gl.LINK_STATUS) ? program : null
}

const plasmaCanvas = () => document.querySelector<HTMLCanvasElement>('[data-testid="app-background"] canvas')

const parseColor = (value: string): [number, number, number] => {
  const hex = value.trim().match(/^#([0-9a-f]{6})$/i)
  if (!hex) return [0.02, 0.024, 0.047]
  const n = parseInt(hex[1], 16)
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]
}

function useWebglGlass(
  canvasRef: React.RefObject<HTMLCanvasElement | null> | null,
  elementRef: React.RefObject<HTMLElement | null>,
  maps: GlassMaps | null,
  refraction: number,
  blur: number,
) {
  useEffect(() => {
    const canvas = canvasRef?.current
    const element = elementRef.current
    if (!canvas || !element || !maps) return
    const gl = canvas.getContext('webgl2', { alpha: true, premultipliedAlpha: true, antialias: false, depth: false })
    const program = gl ? compile(gl) : null
    if (!gl || !program) return
    const u = (name: string) => gl.getUniformLocation(program, name)
    const uniforms = {
      backdrop: u('uBackdrop'),
      map: u('uMap'),
      canvas: u('uCanvas'),
      size: u('uSize'),
      origin: u('uOrigin'),
      step: u('uStep'),
      scale: u('uScale'),
      blur: u('uBlur'),
      base: u('uBase'),
      opacity: u('uOpacity'),
    }
    const vao = gl.createVertexArray()
    const buffer = gl.createBuffer()
    gl.bindVertexArray(vao)
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
    gl.enableVertexAttribArray(0)
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0)

    const texture = () => {
      const t = gl.createTexture()
      gl.bindTexture(gl.TEXTURE_2D, t)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
      return t
    }
    const backdropTexture = texture()
    const mapTexture = texture()
    gl.bindTexture(gl.TEXTURE_2D, mapTexture)
    const { width: mw, height: mh, data } = maps.displacement
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, mw, mh, 0, gl.RGBA, gl.UNSIGNED_BYTE, data)

    let frame = 0
    let visible = true
    let drawn = ''
    const tick = () => {
      frame = 0
      if (!visible || document.hidden) return
      frame = requestAnimationFrame(tick)
      const plasma = plasmaCanvas()
      if (!plasma || !plasma.width) return
      const box = element.getBoundingClientRect()
      const content = plasma.getBoundingClientRect()
      const w = element.offsetWidth
      const h = element.offsetHeight
      if (!w || !h || !content.width) return
      const signature = `${box.left}|${box.top}|${box.width}|${box.height}|${plasma.dataset.frame}|${plasma.width}|${content.width}`
      if (signature === drawn) return
      drawn = signature
      const ratio = Math.min(2, window.devicePixelRatio || 1)
      const cw = Math.round(w * ratio)
      const ch = Math.round(h * ratio)
      if (canvas.width !== cw || canvas.height !== ch) {
        canvas.width = cw
        canvas.height = ch
      }
      gl.bindTexture(gl.TEXTURE_2D, backdropTexture)
      try {
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, plasma)
      } catch {
        return
      }
      const scaleX = box.width / w
      const scaleY = box.height / h
      const layer = plasma.parentElement ?? plasma
      const styles = getComputedStyle(document.documentElement)
      gl.viewport(0, 0, cw, ch)
      gl.useProgram(program)
      gl.bindVertexArray(vao)
      gl.activeTexture(gl.TEXTURE0)
      gl.bindTexture(gl.TEXTURE_2D, backdropTexture)
      gl.uniform1i(uniforms.backdrop, 0)
      gl.activeTexture(gl.TEXTURE1)
      gl.bindTexture(gl.TEXTURE_2D, mapTexture)
      gl.uniform1i(uniforms.map, 1)
      gl.uniform2f(uniforms.canvas, cw, ch)
      gl.uniform2f(uniforms.size, w, h)
      gl.uniform2f(uniforms.origin, (box.left - content.left) / content.width, (box.top - content.top) / content.height)
      gl.uniform2f(uniforms.step, scaleX / content.width, scaleY / content.height)
      gl.uniform1f(uniforms.scale, maps.maxDisplacement * refraction)
      gl.uniform1f(uniforms.blur, blur)
      gl.uniform3f(uniforms.base, ...parseColor(styles.getPropertyValue('--color-bg')))
      gl.uniform1f(uniforms.opacity, Number(getComputedStyle(layer).opacity) || 1)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
    }
    const wake = () => {
      if (!frame && visible && !document.hidden) frame = requestAnimationFrame(tick)
    }
    const io = new IntersectionObserver((entries) => {
      visible = entries.some((e) => e.isIntersecting)
      wake()
    })
    io.observe(element)
    document.addEventListener('visibilitychange', wake)
    wake()
    return () => {
      cancelAnimationFrame(frame)
      io.disconnect()
      document.removeEventListener('visibilitychange', wake)
      gl.deleteTexture(backdropTexture)
      gl.deleteTexture(mapTexture)
      gl.deleteBuffer(buffer)
      gl.deleteVertexArray(vao)
      gl.deleteProgram(program)
    }
  }, [canvasRef, elementRef, maps, refraction, blur])
}
