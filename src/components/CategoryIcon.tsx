import {
  Banknote,
  Building2,
  CalendarSync,
  Gamepad2,
  House,
  Landmark,
  Package,
  PiggyBank,
  Shield,
  ShoppingCart,
  Sprout,
  UtensilsCrossed,
  Wallet,
  type LucideIcon,
} from 'lucide-react'
import type { AccountType, CategoryId } from '../lib/types'

const CATEGORY_ICONS: Record<CategoryId, LucideIcon> = {
  logement: House,
  courses: ShoppingCart,
  resto: UtensilsCrossed,
  abonnements: CalendarSync,
  loisirs: Gamepad2,
  epargne: PiggyBank,
  divers: Package,
  revenu: Banknote,
}

const ACCOUNT_ICONS: Record<AccountType, LucideIcon> = {
  courant: Wallet,
  livret: PiggyBank,
  pel: House,
  per: Sprout,
  'assurance-vie': Shield,
  'parts-sociales': Building2,
}

interface Props {
  size?: number
}

export function CategoryIcon({ categorie, size = 20 }: Props & { categorie: CategoryId }) {
  const Icon = CATEGORY_ICONS[categorie] ?? Package
  return <Icon size={size} strokeWidth={2} aria-hidden="true" />
}

export function AccountIcon({ type, size = 20 }: Props & { type: AccountType }) {
  const Icon = ACCOUNT_ICONS[type] ?? Landmark
  return <Icon size={size} strokeWidth={2} aria-hidden="true" />
}
