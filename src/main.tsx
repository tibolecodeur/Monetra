import { MotionConfig } from 'motion/react'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/inter'
import '@fontsource/instrument-serif/400.css'
import App from './App.tsx'
import { ContextMenuProvider } from './components/ContextMenu'
import { ToastProvider } from './components/Toast'
import './index.css'
import { watchSystemTheme } from './lib/prefs'

// iOS n'applique :active au toucher que si un écouteur touchstart existe : tout le retour
// au toucher de l'app est en CSS (:active), sans JavaScript.
document.addEventListener('touchstart', () => {}, { passive: true })
watchSystemTheme()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* « user » : les animations de transformation sont coupées si le système demande moins de mouvement. */}
    <MotionConfig reducedMotion="user">
      <ToastProvider>
        <ContextMenuProvider>
          <App />
        </ContextMenuProvider>
      </ToastProvider>
    </MotionConfig>
  </StrictMode>,
)
