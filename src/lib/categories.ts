import type { AccountType, CategoryId } from './types'

export interface Category {
  id: CategoryId
  label: string
  emoji: string
}

export const EXPENSE_CATEGORIES: Category[] = [
  { id: 'logement', label: 'Logement', emoji: '🏠' },
  { id: 'courses', label: 'Courses', emoji: '🛒' },
  { id: 'resto', label: 'Resto / fast-food', emoji: '🍔' },
  { id: 'abonnements', label: 'Abonnements', emoji: '📱' },
  { id: 'loisirs', label: 'Loisirs', emoji: '🎮' },
  { id: 'epargne', label: 'Épargne', emoji: '🐷' },
  { id: 'divers', label: 'Divers', emoji: '📦' },
]

export const INCOME_CATEGORY: Category = { id: 'revenu', label: 'Revenu', emoji: '💶' }

const BY_ID = new Map<CategoryId, Category>(
  [...EXPENSE_CATEGORIES, INCOME_CATEGORY].map((c) => [c.id, c]),
)

export function getCategory(id: CategoryId): Category {
  return BY_ID.get(id) ?? EXPENSE_CATEGORIES[EXPENSE_CATEGORIES.length - 1]
}

export const ACCOUNT_TYPES: { id: AccountType; label: string }[] = [
  { id: 'courant', label: 'Compte courant' },
  { id: 'livret', label: 'Livret' },
  { id: 'pel', label: 'PEL' },
  { id: 'per', label: 'PER' },
  { id: 'assurance-vie', label: 'Assurance-vie' },
  { id: 'parts-sociales', label: 'Parts sociales' },
]

export function accountTypeLabel(type: AccountType): string {
  return ACCOUNT_TYPES.find((t) => t.id === type)?.label ?? type
}
