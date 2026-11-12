import type { LucideIcon } from 'lucide-react'
import { createContext, useContext } from 'react'

export interface ContextMenuItem {
  label: string
  icon: LucideIcon
  onSelect: () => void
  destructive?: boolean
}

export interface ContextMenuRequest {
  /** L'élément touché : il est soulevé (aperçu), puis rendu à sa place à la fermeture. */
  anchor: HTMLElement
  label: string
  items: ContextMenuItem[]
}

export const ContextMenuContext = createContext<(request: ContextMenuRequest) => void>(() => {})

export function useContextMenu() {
  return useContext(ContextMenuContext)
}
