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

const PRIVATE_KEY = 'monetra:private'

/** Mode discret : les montants sont floutés partout (consulter ses comptes dans le métro). */
export function getPrivate(): boolean {
  return read(PRIVATE_KEY) === '1'
}

export function setPrivate(on: boolean) {
  write(PRIVATE_KEY, on ? '1' : '0')
  document.documentElement.toggleAttribute('data-private', on)
}

const BACKUP_ON_KEY = 'monetra:backupReminder'
const BACKUP_TIME_KEY = 'monetra:backupTime'
const LAST_BACKUP_KEY = 'monetra:lastBackup'
const BACKUP_SNOOZE_KEY = 'monetra:backupSnoozed'

export interface BackupPrefs {
  /** Rappel quotidien activé (oui par défaut). */
  enabled: boolean
  /** Heure à partir de laquelle la sauvegarde du jour est proposée, « HH:MM ». */
  time: string
  /** Instant ISO de la dernière sauvegarde enregistrée hors de l'app. */
  lastBackup: string | null
  /** Jour (YYYY-MM-DD) où le rappel a été reporté à demain. */
  snoozedDay: string | null
}

const listeners = new Set<() => void>()

export function getBackupPrefs(): BackupPrefs {
  return {
    enabled: read(BACKUP_ON_KEY) !== '0',
    time: read(BACKUP_TIME_KEY) ?? '21:00',
    lastBackup: read(LAST_BACKUP_KEY),
    snoozedDay: read(BACKUP_SNOOZE_KEY),
  }
}

export function setBackupPrefs(changes: Partial<BackupPrefs>) {
  if (changes.enabled !== undefined) write(BACKUP_ON_KEY, changes.enabled ? '1' : '0')
  if (changes.time) write(BACKUP_TIME_KEY, changes.time)
  if (changes.lastBackup) write(LAST_BACKUP_KEY, changes.lastBackup)
  if (changes.snoozedDay) write(BACKUP_SNOOZE_KEY, changes.snoozedDay)
  listeners.forEach((fn) => fn())
}

/** Abonnement aux changements (bandeau de l'accueil et Réglages restent d'accord). */
export function subscribeBackupPrefs(fn: () => void) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}
