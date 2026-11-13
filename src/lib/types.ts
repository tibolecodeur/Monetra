export type AccountType = 'courant' | 'livret' | 'pel' | 'per' | 'assurance-vie' | 'parts-sociales'

export type TransactionType = 'revenu' | 'depense'

export type CategoryId =
  | 'logement'
  | 'courses'
  | 'resto'
  | 'abonnements'
  | 'loisirs'
  | 'epargne'
  | 'divers'
  | 'revenu'

export interface Account {
  id: string
  nom: string
  type: AccountType
  banque: string
  /** Solde courant, mis à jour à chaque transaction. */
  solde: number
}

export interface Transaction {
  id: string
  /** Date locale au format YYYY-MM-DD. */
  date: string
  /** Montant positif ; le sens est donné par `type`. */
  montant: number
  type: TransactionType
  categorie: CategoryId
  compteId: string
  note: string
  recurringId?: string
}

export interface Recurring {
  id: string
  libelle: string
  montant: number
  type: TransactionType
  /** 1 à 31 ; ramené au dernier jour pour les mois plus courts. */
  jourDuMois: number
  categorie: CategoryId
  compteId: string
  /** Premier jour du mois de départ (YYYY-MM-DD). */
  dateDebut: string
  dateFin?: string
  /** Dernier mois (YYYY-MM) pour lequel l'occurrence a été générée. */
  derniereGeneration?: string
}

export interface Budget {
  categorie: CategoryId
  plafondMensuel: number
}

export interface Goal {
  id: string
  nom: string
  montantCible: number
  echeance: string
  montantActuel: number
}

/** Contenu d'une sauvegarde (export JSON, copie de sécurité). */
export interface BackupData {
  accounts: Account[]
  transactions: Transaction[]
  recurring: Recurring[]
  budgets: Budget[]
  goals: Goal[]
}

/** Copie de sécurité gardée sur l'appareil (effacée avec l'app). */
export interface Snapshot {
  id: string
  /** Instant ISO. */
  createdAt: string
  /** auto : copie du jour ; import / restore : prise juste avant de remplacer les données. */
  reason: 'auto' | 'import' | 'restore'
  data: BackupData
}
