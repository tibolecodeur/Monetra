import { useMemo } from 'react'
import { MonthSwitcher } from '../components/MonthSwitcher'
import { TransactionRow } from '../components/TransactionRow'
import { getCategory } from '../lib/categories'
import { currentMonth, daysInMonth, formatShortDate, today, type MonthKey } from '../lib/dates'
import { formatMoney } from '../lib/format'
import { accountLabels, useAccounts, useMonthTransactions, useRecurring } from '../lib/hooks'
import { upcomingOccurrences } from '../lib/recurring'
import { summarize } from '../lib/summary'
import type { Transaction } from '../lib/types'

interface Props {
  month: MonthKey
  onMonthChange: (m: MonthKey) => void
  onSelect: (t: Transaction) => void
  onSeeAll: () => void
  onAddAccount: () => void
}

export function Dashboard({ month, onMonthChange, onSelect, onSeeAll, onAddAccount }: Props) {
  const accounts = useAccounts()
  const transactions = useMonthTransactions(month)
  const recurring = useRecurring()

  const upcoming = useMemo(() => upcomingOccurrences(recurring ?? [], month), [recurring, month])
  const summary = useMemo(() => summarize(transactions ?? [], upcoming), [transactions, upcoming])
  const accountNames = useMemo(() => accountLabels(accounts, transactions), [accounts, transactions])

  if (!accounts || !transactions || !recurring) return null

  const isCurrent = month === currentMonth()
  const daysLeft = daysInMonth(month) - Number(today().slice(8)) + 1
  const perDay = summary.resteAVivre > 0 && isCurrent ? summary.resteAVivre / daysLeft : null
  const spent = summary.chargesFixes + summary.depensesVariables
  const ratio = summary.revenus > 0 ? Math.min(spent / summary.revenus, 1) : spent > 0 ? 1 : 0
  const maxCat = summary.parCategorie[0]?.total ?? 0
  const totalSolde = accounts.reduce((s, a) => s + a.solde, 0)

  return (
    <div className="screen">
      <header className="screen-header">
        <h1 className="brand">Monetra</h1>
        <MonthSwitcher month={month} onChange={onMonthChange} />
      </header>

      {accounts.length === 0 && (
        <section className="card onboarding">
          <h2>Bienvenue 👋</h2>
          <p>Toutes vos données restent sur cet appareil. Commencez par créer votre compte courant.</p>
          <button type="button" className="button primary" onClick={onAddAccount}>
            Créer un compte
          </button>
        </section>
      )}

      <section className={`card hero${summary.resteAVivre < 0 ? ' negative' : ''}`} aria-label="Reste à vivre">
        <p className="hero-label">Reste à vivre</p>
        <p className="hero-value">{formatMoney(summary.resteAVivre)}</p>
        {perDay !== null && (
          <p className="hero-sub">
            soit {formatMoney(perDay)} / jour sur {daysLeft} jour{daysLeft > 1 ? 's' : ''}
          </p>
        )}
        <div
          className="meter"
          role="meter"
          aria-label="Part des revenus dépensée"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(ratio * 100)}
        >
          <span style={{ width: `${ratio * 100}%` }} />
        </div>
        <p className="hero-sub">
          {Math.round(ratio * 100)} % des revenus engagés
        </p>
      </section>

      <section className="stats" aria-label="Synthèse du mois">
        <div className="stat">
          <span className="stat-label">Revenus</span>
          <span className="stat-value income">{formatMoney(summary.revenus)}</span>
          {summary.revenusAVenir > 0 && <span className="stat-sub">dont {formatMoney(summary.revenusAVenir)} à venir</span>}
        </div>
        <div className="stat">
          <span className="stat-label">Charges fixes</span>
          <span className="stat-value">{formatMoney(summary.chargesFixes)}</span>
          {summary.chargesFixesAVenir > 0 && (
            <span className="stat-sub">dont {formatMoney(summary.chargesFixesAVenir)} à venir</span>
          )}
        </div>
        <div className="stat">
          <span className="stat-label">Dépenses variables</span>
          <span className="stat-value">{formatMoney(summary.depensesVariables)}</span>
        </div>
      </section>

      {summary.parCategorie.length > 0 && (
        <section className="card">
          <h2 className="card-title">Dépenses par catégorie</h2>
          <ul className="bars">
            {summary.parCategorie.map(({ categorie, total }) => {
              const c = getCategory(categorie)
              return (
                <li key={categorie}>
                  <span className="bar-label">
                    <span aria-hidden="true">{c.emoji}</span> {c.label}
                  </span>
                  <span className="bar-value">{formatMoney(total)}</span>
                  <span className="bar-track" aria-hidden="true">
                    <span style={{ width: `${(total / maxCat) * 100}%` }} />
                  </span>
                </li>
              )
            })}
          </ul>
        </section>
      )}

      {upcoming.length > 0 && (
        <section className="card">
          <h2 className="card-title">À venir ce mois-ci</h2>
          <ul className="upcoming">
            {upcoming.map(({ recurring: r, date }) => (
              <li key={r.id}>
                <span>
                  <span aria-hidden="true">{getCategory(r.categorie).emoji}</span> {r.libelle}
                </span>
                <span className="muted">{formatShortDate(date)}</span>
                <span className={`tx-amount ${r.type}`}>
                  {r.type === 'revenu' ? '+' : '−'}
                  {formatMoney(r.montant)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="card">
        <div className="card-title-row">
          <h2 className="card-title">Dernières opérations</h2>
          {transactions.length > 0 && (
            <button type="button" className="link-button" onClick={onSeeAll}>
              Tout voir
            </button>
          )}
        </div>
        {transactions.length === 0 ? (
          <p className="muted">Aucune opération ce mois-ci. Touchez + pour en ajouter une.</p>
        ) : (
          <ul className="tx-list">
            {transactions.slice(0, 5).map((t) => (
              <TransactionRow
                key={t.id}
                transaction={t}
                accountName={accountNames.get(t.compteId)}
                dateLabel={formatShortDate(t.date)}
                onSelect={onSelect}
              />
            ))}
          </ul>
        )}
      </section>

      {accounts.length > 0 && (
        <p className="footnote">
          Solde total de vos comptes : <strong>{formatMoney(totalSolde)}</strong>
        </p>
      )}
    </div>
  )
}
