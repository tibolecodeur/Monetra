import { useCallback, useEffect, useState } from 'react'
import { AccountForm } from './components/AccountForm'
import { BottomNav, type Screen } from './components/BottomNav'
import { PlusIcon } from './components/Icons'
import { RecurringForm } from './components/RecurringForm'
import { Sheet } from './components/Sheet'
import { TransactionForm } from './components/TransactionForm'
import { currentMonth, type MonthKey } from './lib/dates'
import { generateRecurring } from './lib/recurring'
import type { Account, Recurring, Transaction } from './lib/types'
import { Dashboard } from './screens/Dashboard'
import { RecurringScreen } from './screens/RecurringScreen'
import { Settings } from './screens/Settings'
import { Transactions } from './screens/Transactions'

const SCREENS: Screen[] = ['accueil', 'operations', 'recurrents', 'reglages']

type Modal =
  | { kind: 'transaction'; transaction?: Transaction }
  | { kind: 'account'; account?: Account }
  | { kind: 'recurring'; recurring?: Recurring }
  | null

function screenFromHash(): Screen {
  const id = location.hash.replace('#/', '') as Screen
  return SCREENS.includes(id) ? id : 'accueil'
}

export default function App() {
  const [screen, setScreen] = useState<Screen>(screenFromHash)
  const [month, setMonth] = useState<MonthKey>(currentMonth)
  const [modal, setModal] = useState<Modal>(null)

  useEffect(() => {
    const onHash = () => setScreen(screenFromHash())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  // Génère les récurrents au lancement et quand l'app revient au premier plan.
  useEffect(() => {
    generateRecurring()
    const onVisible = () => document.visibilityState === 'visible' && generateRecurring()
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [])

  const navigate = (s: Screen) => {
    location.hash = `#/${s}`
    window.scrollTo(0, 0)
  }
  const close = useCallback(() => setModal(null), [])
  const editTransaction = (transaction: Transaction) => setModal({ kind: 'transaction', transaction })
  const addAccount = () => setModal({ kind: 'account' })

  return (
    <div className="app">
      <main>
        {screen === 'accueil' && (
          <Dashboard
            month={month}
            onMonthChange={setMonth}
            onSelect={editTransaction}
            onSeeAll={() => navigate('operations')}
            onAddAccount={addAccount}
          />
        )}
        {screen === 'operations' && <Transactions month={month} onMonthChange={setMonth} onSelect={editTransaction} />}
        {screen === 'recurrents' && (
          <RecurringScreen
            onAdd={() => setModal({ kind: 'recurring' })}
            onSelect={(recurring) => setModal({ kind: 'recurring', recurring })}
          />
        )}
        {screen === 'reglages' && (
          <Settings onAddAccount={addAccount} onSelectAccount={(account) => setModal({ kind: 'account', account })} />
        )}
      </main>

      {(screen === 'accueil' || screen === 'operations') && (
        <button type="button" className="fab" aria-label="Ajouter une transaction" onClick={() => setModal({ kind: 'transaction' })}>
          <PlusIcon />
        </button>
      )}

      <BottomNav current={screen} onChange={navigate} />

      {modal?.kind === 'transaction' && (
        <Sheet title={modal.transaction ? 'Modifier la transaction' : 'Nouvelle transaction'} onClose={close}>
          <TransactionForm transaction={modal.transaction} onDone={close} onNeedAccount={addAccount} />
        </Sheet>
      )}
      {modal?.kind === 'account' && (
        <Sheet title={modal.account ? 'Modifier le compte' : 'Nouveau compte'} onClose={close}>
          <AccountForm account={modal.account} onDone={close} />
        </Sheet>
      )}
      {modal?.kind === 'recurring' && (
        <Sheet title={modal.recurring ? 'Modifier le récurrent' : 'Nouveau récurrent'} onClose={close}>
          <RecurringForm recurring={modal.recurring} onDone={close} onNeedAccount={addAccount} />
        </Sheet>
      )}
    </div>
  )
}
