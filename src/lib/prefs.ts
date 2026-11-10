/** Préférences locales non critiques : tout échec de stockage est ignoré. */
const ACCOUNT_KEY = 'monetra:lastAccount'
const THEME_KEY = 'monetra:theme'

export type Theme = 'dark' | 'light'

/** Couleur de la barre d'état : le fond du haut de la page (--color-bg). */
const THEME_COLORS: Record<Theme, string> = { dark: '#05060c', light: '#eef0f8' }

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
  return read(THEME_KEY) === 'light' ? 'light' : 'dark'
}

export function setTheme(theme: Theme) {
  write(THEME_KEY, theme)
  applyTheme(theme)
}

function applyTheme(theme: Theme) {
  const root = document.documentElement
  if (theme === 'light') root.dataset.theme = 'light'
  else delete root.dataset.theme
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLORS[theme])
}
