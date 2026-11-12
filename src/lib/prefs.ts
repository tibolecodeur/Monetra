/** Préférences locales non critiques : tout échec de stockage est ignoré. */
const ACCOUNT_KEY = 'monetra:lastAccount'
const THEME_KEY = 'monetra:theme'

/** Choix de l'utilisateur ; « auto » suit le réglage d'apparence de l'appareil. */
export type Theme = 'auto' | 'dark' | 'light'
type Applied = 'dark' | 'light'

/** Couleur de la barre d'état : le fond du haut de la page (--color-bg). */
const THEME_COLORS: Record<Applied, string> = { dark: '#070609', light: '#f4f2f8' }

function read(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function write(key: string, value: string) {
  try {
    localStorage.setItem(key, value)
  } catch {
    /* ignoré */
  }
}

export function getLastAccount(): string | null {
  return read(ACCOUNT_KEY)
}

export function setLastAccount(id: string) {
  write(ACCOUNT_KEY, id)
}

/** Sombre par défaut. Le thème est aussi appliqué avant le rendu par un script dans index.html. */
export function getTheme(): Theme {
  const saved = read(THEME_KEY)
  return saved === 'light' || saved === 'auto' ? saved : 'dark'
}

const systemLight = () => matchMedia('(prefers-color-scheme: light)').matches

export function setTheme(theme: Theme) {
  write(THEME_KEY, theme)
  applyTheme(theme)
}

function applyTheme(theme: Theme) {
  const applied: Applied = theme === 'auto' ? (systemLight() ? 'light' : 'dark') : theme
  const root = document.documentElement
  if (applied === 'light') root.dataset.theme = 'light'
  else delete root.dataset.theme
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLORS[applied])
}

/** En « auto », suit le changement d'apparence du système (Centre de contrôle, coucher du soleil). */
export function watchSystemTheme() {
  const query = matchMedia('(prefers-color-scheme: light)')
  const onChange = () => getTheme() === 'auto' && applyTheme('auto')
  query.addEventListener('change', onChange)
  return () => query.removeEventListener('change', onChange)
}
