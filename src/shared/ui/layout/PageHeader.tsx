import React from 'react'
import clsx from 'clsx'
import styles from './PageHeader.module.css'

export interface PageHeaderProps {
  eyebrow?: React.ReactNode
  title: React.ReactNode
  subtitle?: React.ReactNode
  actions?: React.ReactNode
  meta?: React.ReactNode
  children?: React.ReactNode
  className?: string
}

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  actions,
  meta,
  children,
  className,
}: PageHeaderProps) {
  return (
    <header className={clsx(styles.heroHeader, className)}>
      <div className={styles.titleRow}>
        <div className={styles.titleArea}>
          {eyebrow && <div className={styles.eyebrow}>{eyebrow}</div>}
          {typeof title === 'string' ? <h1 className={styles.pageTitle}>{title}</h1> : title}
          {subtitle && <p className={styles.pageSubtitle}>{subtitle}</p>}
        </div>

        {(actions || meta) && (
          <div className={styles.headerActions}>
            {meta && <div className={styles.headerMeta}>{meta}</div>}
            {actions}
          </div>
        )}
      </div>

      {children && <div className={styles.cardBody}>{children}</div>}
    </header>
  )
}
