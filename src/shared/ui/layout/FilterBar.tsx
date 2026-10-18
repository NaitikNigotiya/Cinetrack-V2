import React from 'react'
import clsx from 'clsx'
import styles from './FilterBar.module.css'

export interface TabOption<T extends string = string> {
  id: T
  label: string
  count?: number
  icon?: React.ReactNode
}

export interface SortOption<T extends string = string> {
  value: T
  label: string
}

export interface FilterBarProps<TabId extends string = string, SortVal extends string = string> {
  tabs?: TabOption<TabId>[]
  activeTab?: TabId
  onTabChange?: (tabId: TabId) => void
  sortOptions?: SortOption<SortVal>[]
  sortValue?: SortVal
  onSortChange?: (value: SortVal) => void
  sortLabel?: string
  viewMode?: 'timeline' | 'grid' | 'compact' | 'list'
  onViewModeChange?: (mode: any) => void
  viewModeOptions?: Array<{ mode: string; icon: React.ReactNode; label: string }>
  children?: React.ReactNode
  rightActions?: React.ReactNode
  className?: string
}

export function FilterBar<TabId extends string = string, SortVal extends string = string>({
  tabs,
  activeTab,
  onTabChange,
  sortOptions,
  sortValue,
  onSortChange,
  sortLabel = 'Sort by',
  viewMode,
  onViewModeChange,
  viewModeOptions,
  children,
  rightActions,
  className,
}: FilterBarProps<TabId, SortVal>) {
  return (
    <div className={clsx(styles.controlBar, className)}>
      <div className={styles.leftArea}>
        {tabs && tabs.length > 0 && (
          <div className={styles.segmentedControl} role="tablist">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  className={clsx(styles.segmentBtn, isActive && styles.segmentBtnActive)}
                  onClick={() => onTabChange?.(tab.id)}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                  {tab.count !== undefined && (
                    <span className={styles.segmentBadge}>{tab.count}</span>
                  )}
                </button>
              )
            })}
          </div>
        )}
        {children}
      </div>

      {(sortOptions || viewModeOptions || rightActions) && (
        <div className={styles.rightArea}>
          {sortOptions && sortOptions.length > 0 && (
            <select
              className={styles.selectInput}
              aria-label={sortLabel}
              value={sortValue}
              onChange={(e) => onSortChange?.(e.target.value as SortVal)}
            >
              {sortOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          )}

          {viewModeOptions && viewModeOptions.length > 0 && (
            <div className={styles.viewModeGroup}>
              {viewModeOptions.map((opt) => {
                const isActive = viewMode === opt.mode
                return (
                  <button
                    key={opt.mode}
                    type="button"
                    aria-label={opt.label}
                    title={opt.label}
                    className={clsx(styles.viewModeBtn, isActive && styles.viewModeBtnActive)}
                    onClick={() => onViewModeChange?.(opt.mode)}
                  >
                    {opt.icon}
                  </button>
                )
              })}
            </div>
          )}

          {rightActions}
        </div>
      )}
    </div>
  )
}
