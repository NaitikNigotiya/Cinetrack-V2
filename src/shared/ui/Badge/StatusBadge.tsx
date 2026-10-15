import clsx from 'clsx'
import styles from './Badge.module.css'

export type LibraryStatus = 'watching' | 'completed' | 'plan_to_watch' | 'on_hold' | 'dropped'

export interface StatusBadgeProps {
  status: LibraryStatus
  className?: string
  showDot?: boolean
}

const STATUS_LABELS: Record<LibraryStatus, string> = {
  watching: 'Watching',
  completed: 'Completed',
  plan_to_watch: 'Plan to Watch',
  on_hold: 'On Hold',
  dropped: 'Dropped',
}

export function StatusBadge({ status, className, showDot = true }: StatusBadgeProps) {
  const statusClass = {
    watching: styles.statusWatching,
    completed: styles.statusCompleted,
    plan_to_watch: styles.statusPlan,
    on_hold: styles.statusOnHold,
    dropped: styles.statusDropped,
  }[status]

  return (
    <span className={clsx(styles.badge, statusClass, className)}>
      {showDot && <span className={styles.dot} aria-hidden="true" />}
      {STATUS_LABELS[status]}
    </span>
  )
}
