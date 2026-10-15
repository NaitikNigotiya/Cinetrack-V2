import React, { forwardRef } from 'react'
import clsx from 'clsx'
import styles from './Button.module.css'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline'
export type ButtonSize = 'sm' | 'md' | 'lg'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  isLoading?: boolean
  iconOnly?: boolean
  leftIcon?: React.ReactNode
  startIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    children,
    className,
    variant = 'secondary',
    size = 'md',
    isLoading = false,
    iconOnly = false,
    leftIcon,
    startIcon,
    rightIcon,
    disabled,
    type = 'button',
    ...rest
  },
  ref
) {
  const effectiveLeftIcon = leftIcon ?? startIcon
  const variantClass = {
    primary: styles.variantPrimary,
    secondary: styles.variantSecondary,
    ghost: styles.variantGhost,
    danger: styles.variantDanger,
    outline: styles.variantOutline,
  }[variant]

  const sizeClass = {
    sm: styles.sizeSm,
    md: styles.sizeMd,
    lg: styles.sizeLg,
  }[size]

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || isLoading}
      aria-busy={isLoading}
      className={clsx(
        styles.btn,
        variantClass,
        sizeClass,
        iconOnly && styles.iconOnly,
        className
      )}
      {...rest}
    >
      {isLoading ? (
        <span className={styles.spinner} aria-hidden="true" />
      ) : (
        effectiveLeftIcon && <span aria-hidden="true">{effectiveLeftIcon}</span>
      )}
      {children}
      {!isLoading && rightIcon && <span aria-hidden="true">{rightIcon}</span>}
    </button>
  )
})
