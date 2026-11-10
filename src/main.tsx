import { MotionConfig } from 'motion/react'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/inter'
import App from './App.tsx'
import { ToastProvider } from './components/Toast'
import './index.css'

// iOS n'applique :active au toucher que si un écouteur touchstart existe : tout le retour
// au toucher de l'app est en CSS (:active), sans JavaScript.
document.addEventListener('touchstart', () => {}, { passive: true })

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* « user » : les animations de transformation sont coupées si le système demande moins de mouvement. */}
    <MotionConfig reducedMotion="user">
      <ToastProvider>
        <App />
      </ToastProvider>
    </MotionConfig>
  </StrictMode>,
)
