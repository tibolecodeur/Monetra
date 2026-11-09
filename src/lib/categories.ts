import type { AccountType, CategoryId } from './types'

export interface Category {
  id: CategoryId
  label: string
}

export const EXPENSE_CATEGORIES: Category[] = [
  { id: 'logement', label: 'Logement' },
  { id: 'courses', label: 'Courses' },
  { id: 'resto', label: 'Resto' },
  { id: 'abonnements', label: 'Abonnements' },
  { id: 'loisirs', label: 'Loisirs' },
  { id: 'epargne', label: 'Épargne' },
  { id: 'divers', label: 'Divers' },
]

export const INCOME_CATEGORY: Category = { id: 'revenu', label: 'Revenu' }

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
