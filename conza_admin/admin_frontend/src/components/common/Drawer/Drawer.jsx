import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'

export default function Drawer({ isOpen, onClose, title, children, position = 'right' }) {
  const overlayRef = useRef(null)

  useEffect(() => {
    const handleEsc = (e) => { if (e.key === 'Escape') onClose() }
    if (isOpen) document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const positionClasses = {
    right: 'right-0 h-full w-96',
    left: 'left-0 h-full w-96',
    top: 'top-0 left-0 w-full h-96',
    bottom: 'bottom-0 left-0 w-full h-96',
  }

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
      onClick={(e) => { if (e.target === overlayRef.current) onClose() }}
    >
      <div className={`fixed ${positionClasses[position]} bg-surface shadow-2xl border-l border-border animate-slideIn`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h3 className="text-lg font-semibold text-textPrimary">{title}</h3>
          <button onClick={onClose} className="p-1 hover:bg-surfaceElevated rounded-lg transition-colors">
            <X size={20} className="text-textMuted" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto h-[calc(100%-64px)]">
          {children}
        </div>
      </div>
    </div>
  )
}
