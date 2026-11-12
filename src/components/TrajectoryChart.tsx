import { useId, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import type { MonthKey } from '../lib/dates'
import { formatMoney } from '../lib/format'
import { haptic } from '../lib/motion'
import type { Trajectory } from '../lib/trajectory'

const W = 340
const H = 168
const TOP = 18
const BOTTOM = 22

const dayLabel = (month: MonthKey, day: number, style: 'short' | 'long') => {
  const [y, m] = month.split('-').map(Number)
  const date = new Date(y, m - 1, day)
  const text =
    style === 'short'
      ? date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })
      : date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })
  return text.charAt(0).toUpperCase() + text.slice(1)
}

interface Props {
  month: MonthKey
  trajectory: Trajectory
}

/**
 * Courbe des dépenses cumulées du mois face aux revenus : le réel (trait plein et aire violette)
 * jusqu'à aujourd'hui, puis l'estimation (pointillés) jusqu'au dernier jour.
 * On la lit en glissant le doigt dessus, comme dans Bourse : un curseur suit le doigt et l'en-tête
 * affiche le jour touché. Au clavier, flèches gauche et droite.
 */
export function TrajectoryChart({ month, trajectory: t }: Props) {
  const gradientId = `trajectory-${useId().replace(/:/g, '')}`
  const svg = useRef<SVGSVGElement>(null)
  const [cursor, setCursor] = useState<number | null>(null)
  const lastHaptic = useRef<boolean | null>(null)

  const geometry = useMemo(() => {
    const max = Math.max(t.ceiling, t.projectedSpent, ...t.points.map((p) => p.spent), 1) * 1.08
    const x = (day: number) => (day / t.days) * W
    const y = (value: number) => TOP + (1 - value / max) * (H - TOP - BOTTOM)
    const at = (day: number) => (day === 0 ? 0 : t.points[day - 1].spent)
    const line = (from: number, to: number) => {
      let d = ''
      for (let day = from; day <= to; day++) d += `${day === from ? 'M' : 'L'}${x(day).toFixed(1)},${y(at(day)).toFixed(1)}`
      return d
    }
    const last = t.lastActualDay
    const actual = last > 0 ? line(0, last) : ''
    const area = last > 0 ? `${actual}L${x(last).toFixed(1)},${y(0)}L0,${y(0)}Z` : ''
    const projection = last < t.days ? line(last, t.days) : ''
    return { x, y, at, actual, area, projection, baseline: y(0) }
  }, [t])

  const { x, y, at } = geometry
  const shown = cursor ?? (t.lastActualDay || null)

  const pick = (clientX: number) => {
    const rect = svg.current!.getBoundingClientRect()
    const day = Math.min(t.days, Math.max(1, Math.round(((clientX - rect.left) / rect.width) * t.days)))
    setCursor(day)
    // Un tap quand le doigt passe du réel à l'estimation : la limite se sent sous le doigt.
    const projected = day > t.lastActualDay
    if (lastHaptic.current !== null && lastHaptic.current !== projected) haptic()
    lastHaptic.current = projected
  }

  const onPointerDown = (e: PointerEvent<SVGSVGElement>) => {
    // Le geste appartient à la courbe : le swipe de mois du dessous ne démarre pas.
    e.stopPropagation()
    e.currentTarget.setPointerCapture(e.pointerId)
    lastHaptic.current = null
    pick(e.clientX)
  }
  const onPointerMove = (e: PointerEvent<SVGSVGElement>) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) pick(e.clientX)
  }
  const release = () => setCursor(null)

  const onKeyDown = (e: KeyboardEvent<SVGSVGElement>) => {
    const step = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0
    if (!step) return
    e.preventDefault()
    setCursor((c) => Math.min(t.days, Math.max(1, (c ?? (t.lastActualDay || 1)) + step)))
  }

  const describe = (day: number) => {
    const value = formatMoney(at(day))
    return day > t.lastActualDay ? `${value} estimés` : `${value} dépensés`
  }

  return (
    <div className="trajectory-chart">
      <p className="trajectory-readout" aria-hidden="true">
        {cursor !== null ? (
          <>
            <span>{dayLabel(month, cursor, 'short')}</span>
            <strong className={cursor > t.lastActualDay ? 'estimate' : undefined}>{describe(cursor)}</strong>
          </>
        ) : (
          <span>Glissez le doigt sur la courbe</span>
        )}
      </p>
      <svg
        ref={svg}
        className="trajectory-svg"
        viewBox={`0 0 ${W} ${H}`}
        role="slider"
        tabIndex={0}
        aria-label="Dépenses cumulées du mois"
        aria-valuemin={1}
        aria-valuemax={t.days}
        aria-valuenow={shown ?? 1}
        aria-valuetext={shown ? `${dayLabel(month, shown, 'long')} : ${describe(shown)}` : 'Aucune dépense'}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={release}
        onPointerCancel={release}
        onKeyDown={onKeyDown}
        onBlur={release}
        data-testid="trajectory"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#7c4dff" stopOpacity="0.55" />
            <stop offset="1" stopColor="#7c4dff" stopOpacity="0" />
          </linearGradient>
        </defs>

        {t.ceiling > 0 && (
          <g className="trajectory-ceiling">
            <line x1={0} x2={W} y1={y(t.ceiling)} y2={y(t.ceiling)} />
            <text x={W} y={y(t.ceiling) - 6} textAnchor="end">
              Revenus {formatMoney(t.ceiling)}
            </text>
          </g>
        )}

        {geometry.area && <path className="trajectory-area" d={geometry.area} fill={`url(#${gradientId})`} />}
        {geometry.projection && <path className="trajectory-projection" d={geometry.projection} />}
        {geometry.actual && <path className="trajectory-line" d={geometry.actual} />}

        {t.overflowDay !== null && (
          <circle className="trajectory-overflow" cx={x(t.overflowDay)} cy={y(at(t.overflowDay))} r={4.5} />
        )}

        {t.lastActualDay > 0 && t.lastActualDay < t.days && (
          <g className="trajectory-today">
            <circle cx={x(t.lastActualDay)} cy={y(at(t.lastActualDay))} r={9} className="halo" />
            <circle cx={x(t.lastActualDay)} cy={y(at(t.lastActualDay))} r={4.5} />
          </g>
        )}

        {cursor !== null && (
          <g className="trajectory-cursor">
            <line x1={x(cursor)} x2={x(cursor)} y1={TOP - 6} y2={geometry.baseline} />
            <circle cx={x(cursor)} cy={y(at(cursor))} r={5.5} />
          </g>
        )}

        <g className="trajectory-axis">
          {[1, 10, 20, t.days].map((day) => (
            <text key={day} x={Math.min(Math.max(x(day), 8), W - 8)} y={H - 4} textAnchor="middle">
              {day}
            </text>
          ))}
        </g>
      </svg>
    </div>
  )
}
