import { Dialog } from './Dialog'
import { Button } from '../Button/Button'

export interface ConfirmDialogProps {
  isOpen: boolean
  onClose?: () => void
  onCancel?: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText?: string
  confirmLabel?: string
  cancelText?: string
  variant?: 'danger' | 'primary'
  isLoading?: boolean
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onCancel,
  onConfirm,
  title,
  message,
  confirmText,
  confirmLabel,
  cancelText = 'Cancel',
  variant = 'danger',
  isLoading = false,
}: ConfirmDialogProps) {
  const handleClose = onCancel ?? onClose ?? (() => {})
  const effectiveConfirmText = confirmLabel ?? confirmText ?? 'Confirm'

  return (
    <Dialog
      isOpen={isOpen}
      onClose={handleClose}
      title={title}
      footer={
        <>
          <Button variant="secondary" onClick={handleClose} disabled={isLoading}>
            {cancelText}
          </Button>
          <Button
            variant={variant === 'danger' ? 'danger' : 'primary'}
            onClick={onConfirm}
            isLoading={isLoading}
          >
            {effectiveConfirmText}
          </Button>
        </>
      }
    >
      <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>{message}</p>
    </Dialog>
  )
}
