import { CircleCheck } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { SPRINGS } from '../lib/motion'
import { LENS } from '../lib/glass/presets'
import { Glass } from './Glass'
import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { ToastContext, type ToastOptions } from '../lib/toast'

interface ActiveToast extends ToastOptions {
  id: number
}

let nextId = 1

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ActiveToast | null>(null)

  const show = useCallback((options: ToastOptions) => setToast({ ...options, id: nextId++ }), [])

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), toast.action ? 5000 : 3000)
    return () => clearTimeout(timer)
  }, [toast])

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div className="toast-region" role="status" aria-live="polite">
        <AnimatePresence>
        {toast && (
          <motion.div
            className="toast-motion"
            key={toast.id}
            initial={{ opacity: 0, y: 24, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1, transition: SPRINGS.default() }}
            exit={{ opacity: 0, y: 16, scale: 0.96, transition: { duration: 0.18, ease: 'easeIn' } }}
          >
            <Glass className="toast" lens={{ ...LENS.chrome, z: 2 }} fade>
              <CircleCheck size={20} aria-hidden="true" className="toast-icon" />
              <span className="toast-message">{toast.message}</span>
              {toast.action && (
                <button
                  type="button"
                  className="toast-action"
                  onClick={() => {
                    toast.action?.onAction()
                    setToast(null)
                  }}
                >
                  {toast.action.label}
                </button>
              )}
            </Glass>
          </motion.div>
        )}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}
