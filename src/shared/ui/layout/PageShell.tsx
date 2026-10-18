import React from 'react'
import clsx from 'clsx'
import styles from './PageShell.module.css'

export interface PageShellProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  aside?: React.ReactNode
  className?: string
}

export function PageShell({ children, aside, className, ...rest }: PageShellProps) {
  if (aside) {
    return (
      <div className={clsx(styles.shell, className)} {...rest}>
        <div className={styles.withAsideLayout}>
          <div className={styles.mainColumn}>{children}</div>
          <aside className={styles.asideColumn}>{aside}</aside>
        </div>
      </div>
    )
  }

  return (
    <div className={clsx(styles.shell, className)} {...rest}>
      {children}
    </div>
  )
}
