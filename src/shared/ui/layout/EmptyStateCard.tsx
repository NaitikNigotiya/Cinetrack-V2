import React from 'react'
import clsx from 'clsx'
import { Card } from './Card'
import styles from './EmptyStateCard.module.css'

export interface EmptyStateCardProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}

export function EmptyStateCard({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateCardProps) {
  return (
    <Card className={clsx(styles.wrapper, className)}>
      <div className={styles.inner}>
        {icon && <div className={styles.icon}>{icon}</div>}
        <h3 className={styles.title}>{title}</h3>
        {description && <p className={styles.description}>{description}</p>}
        {action && <div className={styles.action}>{action}</div>}
      </div>
    </Card>
  )
}
