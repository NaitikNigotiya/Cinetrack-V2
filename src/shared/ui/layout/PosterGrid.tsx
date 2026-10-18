import React from 'react'
import clsx from 'clsx'
import styles from './PosterGrid.module.css'

export interface PosterGridProps {
  children: React.ReactNode
  className?: string
}

export function PosterGrid({ children, className }: PosterGridProps) {
  return <div className={clsx(styles.grid, className)}>{children}</div>
}
