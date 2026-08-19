import { useToastStore } from '../../../store/notifications/useToastStore'

export function Toaster() {
  const toasts = useToastStore((s) => s.toasts)
  const removeToast = useToastStore((s) => s.removeToast)

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`px-4 py-3 rounded-lg shadow-lg border text-sm font-medium animate-slideIn ${toast.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : toast.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' : 'bg-surface border-border text-textPrimary'}`}
        >
          <div className="flex items-center gap-2">
            <span>{toast.message}</span>
            <button onClick={() => removeToast(toast.id)} className="ml-2 text-textMuted hover:text-textPrimary">×</button>
          </div>
        </div>
      ))}
    </div>
  )
}
