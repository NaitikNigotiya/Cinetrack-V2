import React from 'react'
import clsx from 'clsx'
import styles from './Pill.module.css'

export type PillVariant = 'default' | 'brand' | 'filledBrand' | 'success' | 'outline'

export interface PillProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode
  variant?: PillVariant
  active?: boolean
  interactive?: boolean
  clickable?: boolean
  className?: string
}

export function Pill({
  children,
  variant = 'default',
  active = false,
  interactive = false,
  clickable = false,
  className,
  ...rest
}: PillProps) {
  const isInteractive = interactive || clickable
  const variantClass = {
    default: styles.variantDefault,
    brand: styles.variantBrand,
    filledBrand: styles.variantFilledBrand,
    success: styles.variantSuccess,
    outline: styles.variantOutline,
  }[variant]

  return (
    <span
      className={clsx(
        styles.pill,
        variantClass,
        isInteractive && styles.interactive,
        active && styles.interactiveActive,
        className
      )}
      {...(isInteractive ? { role: 'button', tabIndex: 0 } : {})}
      {...rest}
    >
      {children}
    </span>
  )
}
