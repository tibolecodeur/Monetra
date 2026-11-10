import { useCallback, useEffect, useRef, useState } from 'react'
import { AccountForm } from './components/AccountForm'
import { AppBackground } from './components/AppBackground'
import { BottomNav, type Screen } from './components/BottomNav'
import { RecurringForm } from './components/RecurringForm'
import { Sheet } from './components/Sheet'
import { ToastProvider } from './components/Toast'
import { TransactionForm } from './components/TransactionForm'
import { SceneContext, ScrollerContext, useGlassLive, useGlassScene } from './lib/glass/react'
import { currentMonth, type MonthKey } from './lib/dates'
import { installPressFeedback } from './lib/press'
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
  const main = useRef<HTMLElement>(null)
  // Scène de verre : le contenu qui défile est réfracté par chaque surface de verre (lib/glass).
  // L'app défile dans ce conteneur (et non la fenêtre) : le filtre ne porte ainsi que sur l'écran visible,
  // ce que Safari exige pour garder un filtre SVG rapide.
  const scene = useRef<HTMLDivElement>(null)
  const defs = useRef<HTMLDivElement>(null)
  const glass = useGlassScene(scene, defs, { enabled: useGlassLive() })
  const firstRender = useRef(true)

  useEffect(() => {
    const onHash = () => setScreen(screenFromHash())
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

  // Sous une feuille, le verre est voilé et ne réfracte plus rien d'utile : la scène se met en veille
  // (le CSS peint le même verre, sans filtre), pour que le flou de la feuille ne la recalcule pas à chaque image.
  const sheetOpen = modal !== null
  useEffect(() => glass?.setActive(!sheetOpen), [glass, sheetOpen])

  // Retour visuel au pointer-down sur tous les éléments touchables.
  useEffect(() => installPressFeedback(), [])

  // Génère les récurrents au lancement et quand l'app revient au premier plan.
  useEffect(() => {
    generateRecurring()
    const onVisible = () => document.visibilityState === 'visible' && generateRecurring()
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [])

  const navigate = (s: Screen) => {
    location.hash = `#/${s}`
    main.current?.scrollTo(0, 0)
  }
  const close = useCallback(() => setModal(null), [])
  const editTransaction = (transaction: Transaction) => setModal({ kind: 'transaction', transaction })
  const addAccount = () => setModal({ kind: 'account' })

  return (
    <ScrollerContext.Provider value={main}>
    <SceneContext.Provider value={glass}>
    <ToastProvider>
      <AppBackground />
      <div className="scene" ref={scene}>
      <main id="contenu" className="scroller" ref={main}>
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
      </div>
      </main>
      </div>
      <div ref={defs} className="lg-defs" />
      <div className="chrome">
        <BottomNav current={screen} onChange={navigate} onAdd={() => setModal({ kind: 'transaction' })} />

        {modal?.kind === 'transaction' && (
          <Sheet key="transaction" title={modal.transaction ? 'Modifier la transaction' : 'Nouvelle transaction'} onClose={close}>
            {(dismiss) => <TransactionForm transaction={modal.transaction} onDone={dismiss} onNeedAccount={addAccount} />}
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
    </ToastProvider>
    </SceneContext.Provider>
    </ScrollerContext.Provider>
  )
}
