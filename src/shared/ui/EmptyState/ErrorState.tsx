import { AlertCircle } from 'lucide-react'
import clsx from 'clsx'
import { Button } from '../Button/Button'
import styles from './EmptyState.module.css'

export interface ErrorStateProps {
  title?: string
  message?: string
  onRetry?: () => void
  className?: string
}

export function ErrorState({
  title = 'Something went wrong',
  message = 'An unexpected error occurred. Please try again.',
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div className={clsx(styles.errorState, className)} role="alert">
      <div className={styles.errorIcon}>
        <AlertCircle size={32} />
      </div>
      <h3 className={styles.title}>{title}</h3>
      <p className={styles.description}>{message}</p>
      {onRetry && (
        <div className={styles.action}>
          <Button variant="primary" onClick={onRetry}>
            Try again
          </Button>
        </div>
      )}
    </div>
  )
}
