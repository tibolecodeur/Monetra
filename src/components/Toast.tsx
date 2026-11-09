import { CircleCheck } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { SPRINGS } from '../lib/motion'
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
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0, transition: SPRINGS.default() }}
            exit={{ opacity: 0, y: 24, transition: { duration: 0.15, ease: 'easeIn' } }}
          >
            <Glass className="toast" height={54} radius={27} frost={0.6}>
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
