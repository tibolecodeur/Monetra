import { ArrowDownLeft, ArrowRight, Repeat, ShoppingBag, TrendingUp, TriangleAlert } from 'lucide-react'
import { useMemo } from 'react'
import { CategoryIcon } from '../components/CategoryIcon'
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

  if (!accounts || !transactions || !recurring) return <div className="screen" aria-busy="true" />

  const isCurrent = month === currentMonth()
  const daysLeft = daysInMonth(month) - Number(today().slice(8)) + 1
  const negative = summary.resteAVivre < 0
  const perDay = !negative && isCurrent && summary.resteAVivre > 0 ? summary.resteAVivre / daysLeft : null
  const spent = summary.chargesFixes + summary.depensesVariables
  const ratio = summary.revenus > 0 ? Math.min(spent / summary.revenus, 1) : spent > 0 ? 1 : 0
  const percent = Math.round(ratio * 100)
  const maxCat = summary.parCategorie[0]?.total ?? 0
  const totalSolde = accounts.reduce((s, a) => s + a.solde, 0)

  return (
    <div className="screen">
      <header className="screen-header">
        <h1 className="brand" tabIndex={-1}>
          Monetra
        </h1>
        <MonthSwitcher month={month} onChange={onMonthChange} />
      </header>

      {accounts.length === 0 && (
        <section className="card onboarding">
          <h2 className="card-title">Bienvenue</h2>
          <p className="muted">
            Vos données restent sur cet appareil. Commencez par créer votre compte courant avec son solde actuel.
          </p>
          <button type="button" className="btn btn-primary btn-block" onClick={onAddAccount}>
            Créer mon premier compte
          </button>
        </section>
      )}

      <section className={`hero${negative ? ' negative' : ''}`} aria-labelledby="hero-label">
        <div className="hero-top">
          <p id="hero-label" className="hero-label">
            Reste à vivre
          </p>
          <span className="hero-status">
            {negative ? (
              <TriangleAlert size={16} aria-hidden="true" />
            ) : (
              <TrendingUp size={16} aria-hidden="true" />
            )}
            {negative ? 'Budget dépassé' : 'Dans le vert'}
          </span>
        </div>
        <p className="hero-value">{formatMoney(summary.resteAVivre)}</p>
        {perDay !== null && (
          <p className="hero-sub">
            Soit <strong>{formatMoney(perDay)}</strong> par jour pendant {daysLeft} jour{daysLeft > 1 ? 's' : ''}
          </p>
        )}
        <div
          className="meter"
          role="meter"
          aria-label="Part des revenus engagée"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent}
          aria-valuetext={`${percent} % des revenus engagés`}
        >
          <span style={{ transform: `scaleX(${ratio})` }} />
        </div>
        <p className="hero-sub">{percent} % des revenus engagés</p>
      </section>

      <section className="card" aria-labelledby="breakdown-title">
        <h2 id="breakdown-title" className="card-title">
          Le mois en détail
        </h2>
        <dl className="breakdown">
          <div>
            <dt>
              <span className="row-icon revenu">
                <ArrowDownLeft size={20} aria-hidden="true" />
              </span>
              <span>
                Revenus
                {summary.revenusAVenir > 0 && (
                  <small>dont {formatMoney(summary.revenusAVenir)} à venir</small>
                )}
              </span>
            </dt>
            <dd className="amount revenu">+{formatMoney(summary.revenus)}</dd>
          </div>
          <div>
            <dt>
              <span className="row-icon">
                <Repeat size={20} aria-hidden="true" />
              </span>
              <span>
                Charges fixes
                {summary.chargesFixesAVenir > 0 && (
                  <small>dont {formatMoney(summary.chargesFixesAVenir)} à venir</small>
                )}
              </span>
            </dt>
            <dd className="amount">−{formatMoney(summary.chargesFixes)}</dd>
          </div>
          <div>
            <dt>
              <span className="row-icon">
                <ShoppingBag size={20} aria-hidden="true" />
              </span>
              <span>Dépenses variables</span>
            </dt>
            <dd className="amount">−{formatMoney(summary.depensesVariables)}</dd>
          </div>
          <div className="breakdown-total">
            <dt>Reste à vivre</dt>
            <dd className={`amount${negative ? ' negative' : ''}`}>{formatMoney(summary.resteAVivre)}</dd>
          </div>
        </dl>
      </section>

      {summary.parCategorie.length > 0 && (
        <section className="card" aria-labelledby="cat-title">
          <h2 id="cat-title" className="card-title">
            Dépenses par catégorie
          </h2>
          <ul className="bars">
            {summary.parCategorie.map(({ categorie, total }) => (
              <li key={categorie}>
                <span className="bar-label">
                  <CategoryIcon categorie={categorie} size={18} />
                  {getCategory(categorie).label}
                </span>
                <span className="amount">{formatMoney(total)}</span>
                <span className="bar-track" aria-hidden="true">
                  <span style={{ transform: `scaleX(${maxCat ? total / maxCat : 0})` }} />
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {upcoming.length > 0 && (
        <section className="card card-flush" aria-labelledby="upcoming-title">
          <h2 id="upcoming-title" className="card-title">
            À venir ce mois-ci
          </h2>
          <ul className="list">
            {upcoming.map(({ recurring: r, date }) => (
              <li key={r.id} className="row static">
                <span className={`row-icon ${r.type}`}>
                  <CategoryIcon categorie={r.categorie} />
                </span>
                <span className="row-main">
                  <span className="row-title">{r.libelle}</span>
                  <span className="row-meta">Prévu le {formatShortDate(date)}</span>
                </span>
                <span className={`amount ${r.type}`}>
                  {r.type === 'revenu' ? '+' : '−'}
                  {formatMoney(r.montant)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="card card-flush" aria-labelledby="recent-title">
        <div className="card-title-row">
          <h2 id="recent-title" className="card-title">
            Dernières opérations
          </h2>
          {transactions.length > 0 && (
            <button type="button" className="btn btn-link" onClick={onSeeAll}>
              Tout voir
              <ArrowRight size={16} aria-hidden="true" />
            </button>
          )}
        </div>
        {transactions.length === 0 ? (
          <p className="empty-text">Aucune opération ce mois-ci. Touchez le bouton + en bas pour en ajouter une.</p>
        ) : (
          <ul className="list">
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
          Solde total de vos comptes : <strong className="amount">{formatMoney(totalSolde)}</strong>
        </p>
      )}
    </div>
  )
}
