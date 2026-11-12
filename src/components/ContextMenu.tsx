import { AnimatePresence, motion } from 'motion/react'
import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { ContextMenuContext, type ContextMenuRequest } from '../lib/contextMenu'
import { haptic, SPRINGS } from '../lib/motion'

interface OpenMenu extends ContextMenuRequest {
  id: number
  rect: DOMRect
}

let nextId = 1

/** Marque la ligne d'origine pendant que son aperçu est soulevé (masquée en CSS). */
function setLifted(el: HTMLElement, lifted: boolean) {
  el.toggleAttribute('data-lifted', lifted)
}

/**
 * Menu contextuel façon iOS, ouvert par un appui long (ou un clic droit) : la ligne touchée se soulève
 * au-dessus d'un fond flouté, le menu sort d'elle, et tout revient à sa place à la fermeture.
 * Un seul menu à la fois, rendu au-dessus de tout (portail).
 */
export function ContextMenuProvider({ children }: { children: ReactNode }) {
  const [menu, setMenu] = useState<OpenMenu | null>(null)

  const open = useCallback((request: ContextMenuRequest) => {
    haptic()
    setMenu({ ...request, id: nextId++, rect: request.anchor.getBoundingClientRect() })
  }, [])
  const close = useCallback(() => setMenu(null), [])

  return (
    <ContextMenuContext.Provider value={open}>
      {children}
      <AnimatePresence>{menu && <MenuLayer key={menu.id} menu={menu} onClose={close} />}</AnimatePresence>
    </ContextMenuContext.Provider>
  )
}

const ITEM_HEIGHT = 48
const GAP = 8
const MARGIN = 16

/** Place l'aperçu et le menu dans l'écran : sous la ligne si possible, sinon au-dessus, sinon on remonte la ligne. */
function layout(rect: DOMRect, count: number) {
  const vw = window.innerWidth
  const vh = window.innerHeight
  const menuHeight = count * ITEM_HEIGHT
  const menuWidth = Math.min(250, vw - 2 * MARGIN)
  const safeTop = MARGIN + 32
  const safeBottom = MARGIN + 16
  let top = rect.top
  let placement: 'below' | 'above' = 'below'
  if (top + rect.height + GAP + menuHeight > vh - safeBottom) {
    if (top - GAP - menuHeight >= safeTop) placement = 'above'
    else top = Math.max(safeTop, vh - safeBottom - menuHeight - GAP - rect.height)
  }
  const menuTop = placement === 'below' ? top + rect.height + GAP : top - GAP - menuHeight
  const menuLeft = Math.min(Math.max(rect.left + MARGIN, MARGIN), vw - MARGIN - menuWidth)
  return { top, placement, menuTop, menuLeft, menuWidth }
}

function MenuLayer({ menu, onClose }: { menu: OpenMenu; onClose: () => void }) {
  const { anchor, rect, items, label } = menu
  const [geometry] = useState(() => layout(rect, items.length))
  const list = useRef<HTMLDivElement>(null)

  // La ligne d'origine s'efface le temps que son aperçu soit soulevé ; la page ne défile plus.
  useEffect(() => {
    setLifted(anchor, true)
    document.body.classList.add('no-scroll')
    list.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus({ preventScroll: true })
    return () => {
      setLifted(anchor, false)
      document.body.classList.remove('no-scroll')
      // Le focus revient à la ligne, sauf si une action l'a déjà emmené ailleurs (feuille d'édition).
      const idle = !document.activeElement || document.activeElement === document.body
      if (idle && anchor.isConnected) anchor.focus({ preventScroll: true })
    }
  }, [anchor])

  // L'aperçu est une copie inerte de la ligne : même rendu, sans interaction.
  const preview = useCallback(
    (node: HTMLDivElement | null) => {
      if (!node) return
      const copy = anchor.cloneNode(true) as HTMLElement
      copy.removeAttribute('data-lifted')
      node.replaceChildren(copy)
    },
    [anchor],
  )

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape' || e.key === 'Tab') {
      e.preventDefault()
      onClose()
      return
    }
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return
    e.preventDefault()
    const buttons = [...(list.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [])]
    const i = buttons.indexOf(document.activeElement as HTMLElement)
    const next = (i + (e.key === 'ArrowDown' ? 1 : -1) + buttons.length) % buttons.length
    buttons[next]?.focus()
  }

  const lift = geometry.top - rect.top
  const fade = { duration: 0.15, ease: [0.23, 1, 0.32, 1] as const }

  return createPortal(
    <div className="cm-layer" onKeyDown={onKeyDown}>
      <motion.div
        className="cm-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, transition: { duration: 0.2 } }}
        exit={{ opacity: 0, transition: fade }}
        // Fermé par un nouveau toucher, pas par un clic : le doigt qui a ouvert le menu se lève sur ce fond,
        // et le navigateur en ferait un clic.
        onPointerDown={onClose}
        aria-hidden="true"
      />
      <motion.div
        ref={preview}
        className="cm-preview"
        style={{ top: rect.top, left: rect.left, width: rect.width, height: rect.height }}
        initial={{ y: 0, scale: 1 }}
        animate={{ y: lift, scale: 1.02, transition: SPRINGS.default() }}
        exit={{ y: 0, scale: 1, transition: SPRINGS.default() }}
        inert
        aria-hidden="true"
      />
      <motion.div
        ref={list}
        className="cm-menu"
        role="menu"
        aria-label={label}
        style={{
          top: geometry.menuTop,
          left: geometry.menuLeft,
          width: geometry.menuWidth,
          // Le menu sort de la ligne : il grandit depuis le coin le plus proche d'elle.
          transformOrigin: geometry.placement === 'below' ? '24px 0' : '24px 100%',
        }}
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1, transition: SPRINGS.default() }}
        exit={{ opacity: 0, scale: 0.8, transition: fade }}
      >
        {items.map(({ label: itemLabel, icon: Icon, onSelect, destructive }) => (
          <button
            key={itemLabel}
            type="button"
            role="menuitem"
            className={`cm-item${destructive ? ' destructive' : ''}`}
            onClick={() => {
              onClose()
              onSelect()
            }}
          >
            <span>{itemLabel}</span>
            <Icon size={20} aria-hidden="true" />
          </button>
        ))}
      </motion.div>
    </div>,
    document.body,
  )
}
