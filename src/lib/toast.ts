import { createContext, useContext } from 'react'

export interface ToastOptions {
  message: string
  action?: { label: string; onAction: () => void }
}

export const ToastContext = createContext<(toast: ToastOptions) => void>(() => {})

export function useToast() {
  return useContext(ToastContext)
}
