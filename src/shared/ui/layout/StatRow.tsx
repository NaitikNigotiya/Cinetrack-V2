import React from 'react'
import clsx from 'clsx'
import styles from './StatRow.module.css'

export interface StatRowProps {
  children: React.ReactNode
  className?: string
  columns?: number
  style?: React.CSSProperties
}

export function StatRow({ children, className, columns, style }: StatRowProps) {
  const customStyle: React.CSSProperties = {
    ...(columns ? { gridTemplateColumns: `repeat(${columns}, 1fr)` } : {}),
    ...style,
  }
  return (
    <div className={clsx(styles.statRow, className)} style={customStyle}>
      {children}
    </div>
  )
}
