import React from 'react'
import clsx from 'clsx'
import styles from './Section.module.css'

export interface SectionProps extends Omit<React.HTMLAttributes<HTMLElement>, 'title'> {
  title?: React.ReactNode
  action?: React.ReactNode
  children: React.ReactNode
  className?: string
  headerClassName?: string
}

export function Section({
  title,
  action,
  children,
  className,
  headerClassName,
  ...rest
}: SectionProps) {
  return (
    <section className={clsx(styles.section, className)} {...rest}>
      {(title || action) && (
        <div className={clsx(styles.header, headerClassName)}>
          {title && (
            <div className={styles.titleArea}>
              {typeof title === 'string' ? <h2 className={styles.title}>{title}</h2> : title}
            </div>
          )}
          {action && <div className={styles.action}>{action}</div>}
        </div>
      )}
      <div className={styles.content}>{children}</div>
    </section>
  )
}
