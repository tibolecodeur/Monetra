import { describe, expect, it } from 'vitest'
import { buildMaps, defaultShape, edgeAt, refractionProfile, squircle } from './liquidGlass'

describe('Liquid Glass', () => {
  it('profil squircle : 0 au bord, 1 au plat, croissant', () => {
    expect(squircle(0)).toBe(0)
    expect(squircle(1)).toBe(1)
    for (let t = 0.1; t < 1; t += 0.1) expect(squircle(t)).toBeGreaterThan(squircle(t - 0.1))
  })

  it('réfraction de Snell : nulle au bord et au plat, maximale dans le biseau', () => {
    const profile = refractionProfile(20, 32)
    expect(profile[0]).toBeCloseTo(0, 5)
    expect(profile[profile.length - 1]).toBeCloseTo(0, 1)
    const peak = Math.max(...profile)
    expect(peak).toBeGreaterThan(1)
    expect(profile.indexOf(peak)).toBeGreaterThan(0)
  })

  it('distance au bord et normale sortante d’un rectangle arrondi', () => {
    expect(edgeAt(50, 1, 100, 40, 20)).toMatchObject({ depth: 1, nx: 0, ny: -1 })
    expect(edgeAt(99, 20, 100, 40, 20)).toMatchObject({ depth: 1, nx: 1, ny: 0 })
    const corner = edgeAt(2, 2, 100, 40, 20)
    expect(corner.nx).toBeLessThan(0)
    expect(corner.ny).toBeLessThan(0)
  })

  it('carte de déplacement : neutre au centre, tirée vers l’intérieur sur le bord', () => {
    const shape = defaultShape(120, 50, 25)
    const { displacement, specular, width } = buildMaps(shape)
    const at = (x: number, y: number) => (y * width + x) * 4
    const center = at(60, 25)
    expect([displacement.data[center], displacement.data[center + 1]]).toEqual([128, 128])
    // Bord gauche, à mi-hauteur : le fond est lu plus à droite (R > 128).
    const left = at(4, 25)
    expect(displacement.data[left]).toBeGreaterThan(140)
    // Bord haut : lu plus bas (G > 128).
    const top = at(60, 4)
    expect(displacement.data[top + 1]).toBeGreaterThan(140)
    // Le liseré spéculaire s'allume sur le bord, pas au centre.
    expect(specular.data[at(60, 0) + 3]).toBeGreaterThan(specular.data[center + 3])
    expect(specular.data[center + 3]).toBe(0)
  })
})
