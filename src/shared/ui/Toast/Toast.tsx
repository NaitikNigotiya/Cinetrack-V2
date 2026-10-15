import { X } from 'lucide-react'
import clsx from 'clsx'
import { useToastStore, type ToastItem } from './toastStore'
import styles from './Toast.module.css'

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore()

  if (toasts.length === 0) return null

  return (
    <div
      className={styles.toastContainer}
      role="region"
      aria-live="polite"
      aria-label="Notifications"
    >
      {toasts.map((t) => (
        <ToastCard key={t.id} toast={t} onClose={() => removeToast(t.id)} />
      ))}
    </div>
  )
}

function ToastCard({ toast, onClose }: { toast: ToastItem; onClose: () => void }) {
  const typeClass = {
    info: styles.toastInfo,
    success: styles.toastSuccess,
    warning: styles.toastWarning,
    error: styles.toastError,
  }[toast.type ?? 'info']

  return (
    <div className={clsx(styles.toast, typeClass)}>
      <span className={styles.message}>{toast.message}</span>
      <div className={styles.actions}>
        {toast.action && (
          <button
            type="button"
            className={styles.undoBtn}
            onClick={() => {
              toast.action?.onClick()
              onClose()
            }}
          >
            {toast.action.label}
          </button>
        )}
        <button
          type="button"
          className={styles.closeBtn}
          onClick={onClose}
          aria-label="Dismiss notification"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  )
}
