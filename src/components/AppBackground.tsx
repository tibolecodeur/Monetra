import { useReducedMotion } from 'motion/react'
import { useEffect, useState } from 'react'
import { ClosingPlasma } from '@/components/ui/closing-plasma'

type Theme = 'dark' | 'light'

const readTheme = (): Theme => (document.documentElement.dataset.theme === 'light' ? 'light' : 'dark')

/** Suit le thème choisi dans Réglages (attribut data-theme sur <html>). */
function useDocumentTheme(): Theme {
  const [theme, setTheme] = useState<Theme>(readTheme)
  useEffect(() => {
    const observer = new MutationObserver(() => setTheme(readTheme()))
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    return () => observer.disconnect()
  }, [])
  return theme
}

/** Vrai tant qu'une feuille modale est ouverte (Sheet pose la classe no-scroll sur <body>). */
function useSheetOpen(): boolean {
  const [open, setOpen] = useState(() => document.body.classList.contains('no-scroll'))
  useEffect(() => {
    const observer = new MutationObserver(() => setOpen(document.body.classList.contains('no-scroll')))
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])
  return open
}

/**
 * Fond plasma (@componentry/closing-plasma) derrière tous les écrans.
 * Fixe, non interactif et ignoré par les lecteurs d'écran ; figé si le système
 * demande moins de mouvement ; rendu à 0,5× puis agrandi (le plasma est flou), pour ménager le GPU et la batterie.
 */
export function AppBackground() {
  const theme = useDocumentTheme()
  const reduced = useReducedMotion()
  // Figé sous une feuille : le fond est voilé, inutile de le recalculer.
  const sheetOpen = useSheetOpen()
  return (
    <ClosingPlasma
      className="app-background"
      aria-hidden="true"
      data-testid="app-background"
      themeMode={theme}
      paused={Boolean(reduced) || sheetOpen}
      interactive={false}
      maxDpr={0.5}
      maxFps={30}
      speed={0.5}
      sparkle={0.25}
      opacity={theme === 'dark' ? 0.9 : 1}
    />
  )
}
