import { PosterCard } from '@/shared/ui'
import clsx from 'clsx'
import styles from './SearchPage.module.css'
import type { NormalisedMediaItem } from '@/services/tmdb/normalize'
import type { LibraryEntry } from '@/shared/schemas'

export interface SearchResultsGridProps {
  results: NormalisedMediaItem[]
  highlightedIndex: number
  libraryMap: Map<string, LibraryEntry>
  onCardClick: (titleKey: string) => void
  onQuickAdd: (item: NormalisedMediaItem) => void
  hasNextPage: boolean
  isFetchingNextPage: boolean
  onFetchNextPage: () => void
  observerRef: React.RefObject<HTMLDivElement | null>
}

export function SearchResultsGrid({
  results,
  highlightedIndex,
  libraryMap,
  onCardClick,
  onQuickAdd,
  hasNextPage,
  isFetchingNextPage,
  onFetchNextPage,
  observerRef,
}: SearchResultsGridProps) {
  return (
    <>
      <div className={styles.grid}>
        {results.map((item, idx) => {
          const isHighlighted = idx === highlightedIndex
          const existing = libraryMap.get(item.titleKey)
          const status = existing?.status

          return (
            <div
              key={`${item.type}-${item.id}`}
              className={clsx(styles.itemWrapper, isHighlighted && styles.itemHighlighted)}
            >
              <PosterCard
                title={item.title}
                posterPath={item.posterPath}
                year={item.year}
                type={item.type}
                rating={item.voteAverage}
                status={status}
                quickAction={
                  !status
                    ? {
                        label: '+ Add',
                        onClick: () => onQuickAdd(item),
                      }
                    : undefined
                }
                onClick={() => onCardClick(item.titleKey)}
              />
            </div>
          )
        })}
      </div>

      {hasNextPage && (
        <div className={styles.loadMoreWrapper}>
          <button
            type="button"
            className={styles.loadMoreBtn}
            onClick={onFetchNextPage}
            disabled={isFetchingNextPage}
          >
            {isFetchingNextPage ? 'Loading more...' : 'Load more'}
          </button>
        </div>
      )}
      <div ref={observerRef} style={{ height: 1 }} />
    </>
  )
}
