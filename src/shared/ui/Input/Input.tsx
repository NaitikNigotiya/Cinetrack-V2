import React, { forwardRef, useId } from 'react'
import clsx from 'clsx'
import styles from './Input.module.css'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  startIcon?: React.ReactNode
  endIcon?: React.ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, hint, startIcon, endIcon, className, id, ...rest },
  ref
) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const errorId = error ? `${inputId}-error` : undefined
  const hintId = hint ? `${inputId}-hint` : undefined

  return (
    <div className={clsx(styles.wrapper, className)}>
      {label && (
        <label htmlFor={inputId} className={styles.label}>
          {label}
        </label>
      )}
      <div className={clsx(styles.inputContainer, error && styles.hasError)}>
        {startIcon && <div className={styles.iconStart}>{startIcon}</div>}
        <input
          ref={ref}
          id={inputId}
          className={styles.input}
          aria-invalid={Boolean(error)}
          aria-describedby={errorId ?? hintId}
          {...rest}
        />
        {endIcon && <div className={styles.iconEnd}>{endIcon}</div>}
      </div>
      {error && (
        <span id={errorId} className={styles.error} role="alert">
          {error}
        </span>
      )}
      {!error && hint && (
        <span id={hintId} className={styles.hint}>
          {hint}
        </span>
      )}
    </div>
  )
})
