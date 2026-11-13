import { motion } from 'motion/react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { AccountForm } from './components/AccountForm'
import { BottomNav, type Screen } from './components/BottomNav'
import { RecurringForm } from './components/RecurringForm'
import { Sheet } from './components/Sheet'
import { Splash } from './components/Splash'
import { TransactionForm } from './components/TransactionForm'
import { currentMonth, type MonthKey } from './lib/dates'
import { generateRecurring } from './lib/recurring'
import { takeDailySnapshot } from './lib/safety'
import type { Account, Recurring, Transaction, TransactionType } from './lib/types'
import { Dashboard } from './screens/Dashboard'
import { RecurringScreen } from './screens/RecurringScreen'
import { Settings } from './screens/Settings'
import { Transactions } from './screens/Transactions'

const SCREENS: Screen[] = ['accueil', 'operations', 'recurrents', 'reglages']

type Modal =
  | { kind: 'transaction'; transaction?: Transaction; type?: TransactionType }
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
  const main = useRef<HTMLElement>(null)
  const firstRender = useRef(true)
  // Premier écran affiché : pas de transition d'entrée ; seulement après une vraie navigation.
  const [navigated, setNavigated] = useState(false)

  useEffect(() => {
    const onHash = () => {
      setNavigated(true)
      setScreen(screenFromHash())
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  // Après un changement d'onglet, le focus va au titre de l'écran (lecteurs d'écran).
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false
      return
    }
    // L'écran peut encore charger ses données : on attend que son titre soit rendu.
    let frame = 0
    let tries = 0
    const focusTitle = () => {
      const h1 = main.current?.querySelector<HTMLElement>('h1')
      if (h1) h1.focus({ preventScroll: true })
      else if (tries++ < 30) frame = requestAnimationFrame(focusTitle)
    }
    focusTitle()
    return () => cancelAnimationFrame(frame)
  }, [screen])

  // Génère les récurrents au lancement et quand l'app revient au premier plan.
  useEffect(() => {
    // Puis la copie de sécurité du jour, une fois les récurrents à jour.
    const refresh = () => void generateRecurring().then(() => takeDailySnapshot())
    refresh()
    const onVisible = () => document.visibilityState === 'visible' && refresh()
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [])

  const navigate = (s: Screen) => {
    // Comme sur iOS : toucher l'onglet déjà ouvert remonte en haut de l'écran, en défilant.
    if (s === screen) {
      const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
      window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' })
      return
    }
    location.hash = `#/${s}`
    window.scrollTo(0, 0)
  }
  const close = useCallback(() => setModal(null), [])
  const editTransaction = (transaction: Transaction) => setModal({ kind: 'transaction', transaction })
  const addAccount = () => setModal({ kind: 'account' })

  return (
    <>
      <div className="app">
        <a
          href="#contenu"
          className="skip-link"
          onClick={(e) => {
            e.preventDefault()
            main.current?.querySelector<HTMLElement>('h1')?.focus()
          }}
        >
          Aller au contenu
        </a>
        <main id="contenu" ref={main}>
          {/* Changement d'écran : le nouvel écran apparaît en 180 ms (fondu, 8 px), l'ancien part tout de suite.
              Pas au premier affichage (l'écran d'ouverture et la cascade s'en chargent). En mouvement réduit,
              MotionConfig ne garde que le fondu. */}
          <motion.div
            key={screen}
            className="screen-enter"
            initial={navigated ? { opacity: 0, y: 8 } : false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
          >
          {screen === 'accueil' && (
            <Dashboard
              month={month}
              onMonthChange={setMonth}
              onSelect={editTransaction}
              onSeeAll={() => navigate('operations')}
              onAddAccount={addAccount}
              onAdd={(type) => setModal({ kind: 'transaction', type })}
            />
          )}
          {screen === 'operations' && (
            <Transactions
              month={month}
              onMonthChange={setMonth}
              onSelect={editTransaction}
              onAdd={() => setModal({ kind: 'transaction' })}
            />
          )}
          {screen === 'recurrents' && (
            <RecurringScreen
              onAdd={() => setModal({ kind: 'recurring' })}
              onSelect={(recurring) => setModal({ kind: 'recurring', recurring })}
            />
          )}
          {screen === 'reglages' && (
            <Settings onAddAccount={addAccount} onSelectAccount={(account) => setModal({ kind: 'account', account })} />
          )}
          </motion.div>
        </main>

        <Splash flyToHeader={screen === 'accueil'} />

        <BottomNav current={screen} onChange={navigate} onAdd={() => setModal({ kind: 'transaction' })} />

        {modal?.kind === 'transaction' && (
          <Sheet key="transaction" title={modal.transaction ? 'Modifier la transaction' : 'Nouvelle transaction'} onClose={close}>
            {(dismiss) => <TransactionForm transaction={modal.transaction} initialType={modal.type} onDone={dismiss} onNeedAccount={addAccount} />}
          </Sheet>
        )}
        {modal?.kind === 'account' && (
          <Sheet key="account" title={modal.account ? 'Modifier le compte' : 'Nouveau compte'} onClose={close}>
            {(dismiss) => <AccountForm account={modal.account} onDone={dismiss} />}
          </Sheet>
        )}
        {modal?.kind === 'recurring' && (
          <Sheet key="recurring" title={modal.recurring ? 'Modifier le récurrent' : 'Nouveau récurrent'} onClose={close}>
            {(dismiss) => <RecurringForm recurring={modal.recurring} onDone={dismiss} onNeedAccount={addAccount} />}
          </Sheet>
        )}
      </div>
    </>
  )
}
