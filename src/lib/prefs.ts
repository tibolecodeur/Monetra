/** Préférences locales non critiques : tout échec de stockage est ignoré. */
const KEY = 'monetra:lastAccount'

export function getLastAccount(): string | null {
  try {
    return localStorage.getItem(KEY)
  } catch {
    return null
  }
}

export function setLastAccount(id: string) {
  try {
    localStorage.setItem(KEY, id)
  } catch {
    /* ignoré */
  }
}
