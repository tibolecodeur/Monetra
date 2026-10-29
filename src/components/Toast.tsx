import { CircleCheck } from 'lucide-react'
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
        {toast && (
          <div className="toast" key={toast.id}>
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
          </div>
        )}
      </div>
    </ToastContext.Provider>
  )
}
