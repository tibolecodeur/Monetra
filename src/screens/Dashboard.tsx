import { ArrowDownLeft, ArrowRight, Eye, EyeOff, Plus, Receipt, TrendingUp, TriangleAlert } from 'lucide-react'
import { EmptyState } from '../components/EmptyState'
import { motion } from 'motion/react'
import { useMemo, useRef, useState } from 'react'
import { AnimatedAmount, Money } from '../components/AnimatedAmount'
import { BackupBanner } from '../components/BackupBanner'
import { CategoryBubbles } from '../components/CategoryBubbles'
import { CategoryIcon } from '../components/CategoryIcon'
import { MonthSwitcher } from '../components/MonthSwitcher'
import { NavHeader } from '../components/NavHeader'
import { TrajectoryChart } from '../components/TrajectoryChart'
import { TransactionRow } from '../components/TransactionRow'
import { getCategory } from '../lib/categories'
import { SPRINGS } from '../lib/motion'
import { addMonths, currentMonth, daysInMonth, formatMonth, formatShortDate, formatShortDay, relativeDay, today, type MonthKey } from '../lib/dates'
import { formatMoney, formatMoneyRound } from '../lib/format'
import { accountLabels, useAccounts, useMonthTransactions, useRecurring } from '../lib/hooks'
import { getPrivate, setPrivate } from '../lib/prefs'
import { upcomingOccurrences } from '../lib/recurring'
import { summarize } from '../lib/summary'
import type { Transaction, TransactionType } from '../lib/types'
import { computeTrajectory } from '../lib/trajectory'
import { useMonthPager } from '../lib/useMonthPager'

interface Props {
  month: MonthKey
  onMonthChange: (m: MonthKey) => void
  onSelect: (t: Transaction) => void
  onSeeAll: () => void
  onAddAccount: () => void
  onAdd: (type: TransactionType) => void
}

const percentFmt = new Intl.NumberFormat('fr-FR', { style: 'percent', maximumFractionDigits: 1 })

export function Dashboard({ month, onMonthChange, onSelect, onSeeAll, onAddAccount, onAdd }: Props) {
  const accounts = useAccounts()
  const transactions = useMonthTransactions(month)
  const recurring = useRecurring()

  const upcoming = useMemo(() => upcomingOccurrences(recurring ?? [], month), [recurring, month])
  const trajectory = useMemo(
    () => computeTrajectory(month, transactions ?? [], upcoming, today()),
    [month, transactions, upcoming],
  )
  const summary = useMemo(() => summarize(transactions ?? [], upcoming), [transactions, upcoming])
  const accountNames = useMemo(() => accountLabels(accounts, transactions), [accounts, transactions])
  const pagerArea = useRef<HTMLDivElement>(null)
  const [hidden, setHidden] = useState(getPrivate)
  const pager = useMonthPager(month, onMonthChange, pagerArea)

  if (!accounts || !transactions || !recurring) return <div className="screen" aria-busy="true" />

  const isCurrent = month === currentMonth()
  const daysLeft = daysInMonth(month) - Number(today().slice(8)) + 1
  const negative = summary.resteAVivre < 0
  const perDay = !negative && isCurrent && summary.resteAVivre > 0 ? summary.resteAVivre / daysLeft : null
  const spent = summary.chargesFixes + summary.depensesVariables
  const ratio = summary.revenus > 0 ? Math.min(spent / summary.revenus, 1) : spent > 0 ? 1 : 0
  const percent = Math.round(ratio * 100)
  const totalDepenses = summary.parCategorie.reduce((s, c) => s + c.total, 0)
  const totalSolde = accounts.reduce((s, a) => s + a.solde, 0)
  const lastDay = `${trajectory.days} ${formatMonth(month).split(' ')[0].toLowerCase()}`
  // Une phrase, en clair : ce que la courbe dit.
  const insight =
    trajectory.lastActualDay === 0
      ? `Mois à venir : ${formatMoney(trajectory.projectedSpent)} de prélèvements déjà prévus.`
      : trajectory.lastActualDay === trajectory.days
        ? `Mois terminé : ${formatMoney(trajectory.projectedSpent)} dépensés sur ${formatMoney(trajectory.ceiling)} de revenus.`
        : trajectory.overflowDay
          ? `Au rythme actuel (${formatMoney(trajectory.dailyPace)} par jour), vos revenus seront dépassés le ${trajectory.overflowDay}. Pour tenir, visez ${formatMoney(trajectory.safePace)} par jour.`
          : `Au rythme actuel (${formatMoney(trajectory.dailyPace)} par jour), il vous restera environ ${formatMoneyRound(trajectory.projectedLeft)} le ${lastDay}.`

  return (
    <div className="screen">
      <NavHeader
        title="Monetra"
        variant="brand"
        action={
          <MonthSwitcher
            month={month}
            onChange={(m) =>
              m === addMonths(month, 1) ? pager.go(1) : m === addMonths(month, -1) ? pager.go(-1) : onMonthChange(m)
            }
          />
        }
      />

      {accounts.length > 0 && <BackupBanner />}

      <motion.div
        ref={pagerArea}
        className="month-pager"
        style={{ x: pager.x, opacity: pager.opacity }}
        data-testid="month-pager"
        {...pager.drag}
      >
        {accounts.length === 0 && (
          <section className="card onboarding">
            <h2 className="card-title">Bienvenue</h2>
            <p className="body-muted">
              Vos données restent sur cet appareil. Commencez par créer votre compte courant avec son solde actuel.
            </p>
            <button type="button" className="btn btn-primary btn-block" onClick={onAddAccount}>
              Créer mon premier compte
            </button>
          </section>
        )}

        <div className="hero-stack island">
          <section className={`hero${negative ? ' negative' : ''}`} aria-labelledby="hero-label">
            <button
              type="button"
              className="hero-privacy"
              aria-pressed={hidden}
              aria-label={hidden ? 'Afficher les montants' : 'Masquer les montants'}
              onClick={() => {
                setPrivate(!hidden)
                setHidden(!hidden)
              }}
            >
              {hidden ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
            </button>
            <p id="hero-label" className="hero-label">
              Reste à vivre
            </p>
            <AnimatedAmount className="hero-value" value={summary.resteAVivre} />
            <div className="hero-chips">
              <span className="hero-status">
                {negative ? (
                  <TriangleAlert size={14} aria-hidden="true" />
                ) : (
                  <TrendingUp size={14} aria-hidden="true" />
                )}
                {negative ? 'Budget dépassé' : 'Dans le vert'}
              </span>
              {perDay !== null && (
                <span className="hero-chip">
                  <strong>{formatMoney(perDay)}</strong> / jour · {daysLeft} j
                </span>
              )}
            </div>

            <div className="hero-actions">
              <button type="button" className="btn btn-light" onClick={() => onAdd('depense')}>
                <Plus size={18} aria-hidden="true" />
                Dépense
              </button>
              <button type="button" className="btn btn-glass" onClick={() => onAdd('revenu')}>
                <ArrowDownLeft size={18} aria-hidden="true" />
                Revenu
              </button>
            </div>

            <div className="hero-meter">
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
            </div>
          </section>

          {/* Panneau glissé sous le reste à vivre : les trois chiffres qui le composent. */}
          <section className="hero-tray" aria-labelledby="breakdown-title">
            <h2 id="breakdown-title" className="tray-title">
              Le mois en détail
            </h2>
            <dl className="tray-stats">
              <div>
                <dt>Revenus</dt>
                <dd className="amount">
                  <Money value={summary.revenus} sign="+" />
                </dd>
                {summary.revenusAVenir > 0 && <dd className="tray-note">{formatMoney(summary.revenusAVenir)} à venir</dd>}
              </div>
              <div>
                <dt>Charges fixes</dt>
                <dd className="amount">
                  <Money value={summary.chargesFixes} sign="−" />
                </dd>
                {summary.chargesFixesAVenir > 0 && (
                  <dd className="tray-note">{formatMoney(summary.chargesFixesAVenir)} à venir</dd>
                )}
              </div>
              <div>
                <dt>Variables</dt>
                <dd className="amount">
                  <Money value={summary.depensesVariables} sign="−" />
                </dd>
              </div>
            </dl>
          </section>
        </div>

        <section className="card trajectory island" aria-labelledby="trajectory-title">
          <div className="trajectory-head">
            <h2 id="trajectory-title" className="card-title">
              Trajectoire
            </h2>
            {isCurrent && trajectory.ceiling > 0 && (
              <span className={`trajectory-status${trajectory.overflowDay ? ' over' : ''}`}>
                {trajectory.overflowDay
                  ? `Dépassement le ${trajectory.overflowDay}`
                  : `≈ ${formatMoneyRound(trajectory.projectedLeft)} le ${trajectory.days}`}
              </span>
            )}
          </div>
          <TrajectoryChart key={`trajectory-${month}`} month={month} trajectory={trajectory} />
          <p className="trajectory-insight">{insight}</p>
        </section>

        {summary.parCategorie.length > 0 && (
          <section className="card spending island" aria-labelledby="cat-title">
            <div className="spending-head">
              <h2 id="cat-title" className="card-title">
                Où part l'argent
              </h2>
              <p className="spending-total amount">
                <Money value={totalDepenses} />
              </p>
            </div>
            {/* Clé = mois : au changement de mois, rien ne glisse (le contenu entier glisse déjà avec le geste). */}
            <CategoryBubbles key={`bubbles-${month}`} items={summary.parCategorie} />
            <ul className="cat-tiles" key={`tiles-${month}`}>
              {summary.parCategorie.map(({ categorie, total }) => (
                <motion.li
                  key={categorie}
                  className={`cat-tile tint-${categorie}`}
                  layout="position"
                  transition={SPRINGS.data()}
                >
                  <span className="cat-tile-top">
                    <span className="cat-tile-label">{getCategory(categorie).label}</span>
                    <span className="dot-icon">
                      <CategoryIcon categorie={categorie} size={14} />
                    </span>
                  </span>
                  <span className="amount">
                    <Money value={total} />
                  </span>
                  <span className="cat-tile-share">{percentFmt.format(total / totalDepenses)}</span>
                </motion.li>
              ))}
            </ul>
          </section>
        )}

        {upcoming.length > 0 && (
          <section className="stack" aria-labelledby="upcoming-title">
            <div className="section-head">
              <h2 id="upcoming-title" className="section-title">
                À venir ce mois-ci
              </h2>
            </div>
            <ul className="list card card-flush">
              {upcoming.map(({ recurring: r, date }) => (
                <li key={r.id} className="row static">
                  <span className={`row-icon tint-${r.categorie}`}>
                    <CategoryIcon categorie={r.categorie} />
                  </span>
                  <span className="row-main">
                    <span className="row-title">{r.libelle}</span>
                    <span className="row-meta">Prévu {relativeDay(date)?.toLowerCase() ?? `le ${formatShortDate(date)}`}</span>
                  </span>
                  <span className={`amount ${r.type}`}>
                    <Money value={r.montant} sign={r.type === 'revenu' ? '+' : '−'} />
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="stack" aria-labelledby="recent-title">
          <div className="section-head">
            <h2 id="recent-title" className="section-title">
              Dernières opérations
            </h2>
            {transactions.length > 0 && (
              <button type="button" className="round-button" onClick={onSeeAll} aria-label="Tout voir">
                <ArrowRight size={20} aria-hidden="true" />
              </button>
            )}
          </div>
          {transactions.length === 0 ? (
            <div className="card">
              <EmptyState
                icon={Receipt}
                title="Aucune opération ce mois-ci"
                text="Saisissez votre première dépense : trois touchers suffisent."
                action={{ label: 'Saisir une dépense', onClick: () => onAdd('depense') }}
              />
            </div>
          ) : (
            <ul className="list card card-flush">
              {transactions.slice(0, 5).map((t) => (
                <TransactionRow
                  key={t.id}
                  transaction={t}
                  accountName={accountNames.get(t.compteId)}
                  dateLabel={formatShortDay(t.date)}
                  onSelect={onSelect}
                />
              ))}
            </ul>
          )}
        </section>
      </motion.div>

      {accounts.length > 0 && (
        <p className="footnote">
          Solde total de vos comptes : <strong className="amount">{formatMoney(totalSolde)}</strong>
        </p>
      )}
    </div>
  )
}
