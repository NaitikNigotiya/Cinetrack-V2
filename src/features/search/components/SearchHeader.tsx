import { X, Search, ExternalLink } from 'lucide-react'
import clsx from 'clsx'
import styles from './SearchPage.module.css'
import type { SpecialMatchState } from '../hooks/useSearch'

export interface SearchHeaderProps {
  query: string
  onQueryChange: (val: string) => void
  typeFilter: 'all' | 'movie' | 'tv'
  onTypeFilterChange: (type: 'all' | 'movie' | 'tv') => void
  yearFilter: string
  onYearFilterChange: (year: string) => void
  recentSearches: string[]
  onSelectRecent: (term: string) => void
  onRemoveRecent: (term: string) => void
  onClearRecent: () => void
  specialMatch: SpecialMatchState | null
  onOpenSpecialMatch: (titleKey: string) => void
  inputRef?: React.RefObject<HTMLInputElement | null>
}

export function SearchHeader({
  query,
  onQueryChange,
  typeFilter,
  onTypeFilterChange,
  yearFilter,
  onYearFilterChange,
  recentSearches,
  onSelectRecent,
  onRemoveRecent,
  onClearRecent,
  specialMatch,
  onOpenSpecialMatch,
  inputRef,
}: SearchHeaderProps) {
  return (
    <div className={styles.searchHeader}>
      <div className={styles.searchBarWrapper}>
        <span className={styles.searchIcon} aria-hidden="true">
          <Search size={20} />
        </span>
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Search movies, TV shows, or paste TMDB / IMDb URL..."
          className={styles.searchInput}
          aria-label="Search titles"
        />
        {query && (
          <button
            type="button"
            className={styles.clearBtn}
            onClick={() => onQueryChange('')}
            aria-label="Clear search"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* Special Direct Match Banner (IMDb / TMDB URL) */}
      {specialMatch && (
        <div
          className={styles.specialMatchBanner}
          onClick={() => onOpenSpecialMatch(specialMatch.titleKey)}
          role="button"
          tabIndex={0}
        >
          <div className={styles.specialMatchContent}>
            <span className={styles.specialMatchTitle}>{specialMatch.label}</span>
            <span className={styles.specialMatchSub}>Press Enter or click to open title details directly</span>
          </div>
          <button type="button" className={styles.specialMatchBtn}>
            <ExternalLink size={14} style={{ marginRight: 4, verticalAlign: 'middle' }} />
            Open
          </button>
        </div>
      )}

      {/* Filters */}
      <div className={styles.filtersRow}>
        <div className={styles.typePills} role="group" aria-label="Filter by type">
          <button
            type="button"
            className={clsx(styles.pill, typeFilter === 'all' && styles.pillActive)}
            onClick={() => onTypeFilterChange('all')}
          >
            All
          </button>
          <button
            type="button"
            className={clsx(styles.pill, typeFilter === 'movie' && styles.pillActive)}
            onClick={() => onTypeFilterChange('movie')}
          >
            Movies
          </button>
          <button
            type="button"
            className={clsx(styles.pill, typeFilter === 'tv' && styles.pillActive)}
            onClick={() => onTypeFilterChange('tv')}
          >
            TV Shows
          </button>
        </div>

        <select
          className={styles.yearSelect}
          value={yearFilter}
          onChange={(e) => onYearFilterChange(e.target.value)}
          aria-label="Filter by release year"
        >
          <option value="">All Years</option>
          {Array.from({ length: 35 }).map((_, i) => {
            const yr = 2026 - i
            return (
              <option key={yr} value={yr.toString()}>
                {yr}
              </option>
            )
          })}
        </select>
      </div>

      {/* Recent Searches */}
      {!query && recentSearches.length > 0 && (
        <div className={styles.recentSection}>
          <span className={styles.recentLabel}>Recent:</span>
          {recentSearches.map((term) => (
            <span key={term} className={styles.recentChip}>
              <span className={styles.recentChipText} onClick={() => onSelectRecent(term)}>
                {term}
              </span>
              <button
                type="button"
                className={styles.removeRecentBtn}
                onClick={(e) => {
                  e.stopPropagation()
                  onRemoveRecent(term)
                }}
                aria-label={`Remove ${term}`}
              >
                <X size={12} />
              </button>
            </span>
          ))}
          <button type="button" className={styles.clearRecentBtn} onClick={onClearRecent}>
            Clear
          </button>
        </div>
      )}
    </div>
  )
}
