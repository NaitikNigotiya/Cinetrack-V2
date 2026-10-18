import React, { forwardRef } from 'react'
import clsx from 'clsx'
import { Search, X } from 'lucide-react'
import styles from './SearchField.module.css'

export interface SearchFieldProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value: string
  onChange: (value: string) => void
  onClear?: () => void
  showShortcutHint?: boolean
  className?: string
}

export const SearchField = forwardRef<HTMLInputElement, SearchFieldProps>(function SearchField(
  {
    value,
    onChange,
    onClear,
    showShortcutHint = true,
    placeholder = 'Search...',
    className,
    ...rest
  },
  ref
) {
  const handleClear = () => {
    onChange('')
    onClear?.()
  }

  return (
    <div className={clsx(styles.searchWrapper, className)}>
      <span className={styles.searchIcon} aria-hidden="true">
        <Search size={16} />
      </span>

      <input
        ref={ref}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={styles.searchInput}
        {...rest}
      />

      {value ? (
        <button
          type="button"
          onClick={handleClear}
          className={styles.clearSearchBtn}
          aria-label="Clear search"
        >
          <X size={15} />
        </button>
      ) : showShortcutHint ? (
        <div className={styles.kbdHint} aria-hidden="true">
          /
        </div>
      ) : null}
    </div>
  )
})
