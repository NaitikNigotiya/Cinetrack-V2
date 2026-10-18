import React from 'react'
import clsx from 'clsx'
import styles from './Card.module.css'

export type CardVariant = 'default' | 'interactive' | 'flat'

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  variant?: CardVariant | undefined
  className?: string | undefined
}

export function Card({
  children,
  variant = 'default',
  className,
  ...rest
}: CardProps) {
  const variantClass = {
    default: styles.variantDefault,
    interactive: styles.variantInteractive,
    flat: styles.variantFlat,
  }[variant]

  return (
    <div
      className={clsx(styles.card, variantClass, className)}
      tabIndex={variant === 'interactive' && rest.tabIndex === undefined ? 0 : rest.tabIndex}
      {...rest}
    >
      {children}
    </div>
  )
}
