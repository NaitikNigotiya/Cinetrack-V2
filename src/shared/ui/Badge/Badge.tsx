import React from 'react'
import clsx from 'clsx'
import styles from './Badge.module.css'

export type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'accent' | 'neutral'

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
  children: React.ReactNode
}

export function Badge({ variant = 'default', children, className, ...rest }: BadgeProps) {
  const variantClass = {
    default: styles.variantDefault,
    neutral: styles.variantDefault,
    primary: styles.variantPrimary,
    accent: styles.variantPrimary,
    success: styles.variantSuccess,
    warning: styles.variantWarning,
    danger: styles.variantDanger,
    info: styles.variantInfo,
  }[variant]

  return (
    <span className={clsx(styles.badge, variantClass, className)} {...rest}>
      {children}
    </span>
  )
}
