import { CircleCheck } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { SPRINGS } from '../lib/motion'
import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { ToastContext, type ToastOptions } from '../lib/toast'

interface ActiveToast extends ToastOptions {
  id: number
}

let nextId = 1

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ActiveToast | null>(null)
  // Pendant qu'on le tient, le toast ne se ferme pas tout seul.
  const [held, setHeld] = useState(false)
  // Fermé d'un geste : il part vers le bas, dans le prolongement du doigt.
  const [flung, setFlung] = useState(false)

  const show = useCallback((options: ToastOptions) => {
    setFlung(false)
    setToast({ ...options, id: nextId++ })
  }, [])

  useEffect(() => {
    if (!toast || held) return
    const timer = setTimeout(() => setToast(null), toast.action ? 5000 : 3000)
    return () => clearTimeout(timer)
  }, [toast, held])

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div className="toast-region" role="status" aria-live="polite">
        <AnimatePresence custom={flung}>
        {toast && (
          <motion.div
            key={toast.id}
            className="toast"
            // Entre et sort par le bas (même axe) ; la sortie est plus courte que l'entrée, sans ease-in.
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1, transition: SPRINGS.default() }}
            variants={{
              out: (wasFlung: boolean) => ({
                opacity: 0,
                y: wasFlung ? 140 : 16,
                transition: { duration: wasFlung ? 0.2 : 0.15, ease: [0.23, 1, 0.32, 1] },
              }),
            }}
            exit="out"
            // Se balaie vers le bas pour le fermer, comme une notification iOS ; résiste vers le haut.
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0.08, bottom: 0.9 }}
            dragSnapToOrigin
            onDragStart={() => setHeld(true)}
            onDragEnd={(_, info) => {
              setHeld(false)
              if (info.offset.y > 36 || info.velocity.y > 400) {
                setFlung(true)
                setToast(null)
              }
            }}
          >
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
          </motion.div>
        )}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}
