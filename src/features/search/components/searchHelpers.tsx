import type { NormalisedMediaItem } from '@/services/tmdb/normalize'

export const FILTER_TABS = [
  { id: 'all', label: 'All' },
  { id: 'movie', label: 'Movies' },
  { id: 'tv', label: 'TV Shows' },
]

export function filterAndSortSearchResults(
  results: NormalisedMediaItem[],
  year: string,
  rating: string,
  sortBy: string
): NormalisedMediaItem[] {
  let list = [...results]

  if (year !== 'All') {
    if (year.endsWith('s')) {
      const decade = parseInt(year.slice(0, 4), 10)
      list = list.filter((r) => r.year && r.year >= decade && r.year < decade + 10)
    } else {
      const y = parseInt(year, 10)
      list = list.filter((r) => r.year === y)
    }
  }

  if (rating !== 'All') {
    const min = parseFloat(rating.replace('+', ''))
    list = list.filter((r) => r.voteAverage != null && r.voteAverage >= min)
  }

  if (sortBy === 'Rating') {
    list.sort((a, b) => (b.voteAverage ?? 0) - (a.voteAverage ?? 0))
  } else if (sortBy === 'Latest') {
    list.sort((a, b) => (b.year ?? 0) - (a.year ?? 0))
  } else if (sortBy === 'Title A-Z') {
    list.sort((a, b) => a.title.localeCompare(b.title))
  }

  return list
}

export function SkeletonGrid() {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
        gap: 'var(--card-gap)',
      }}
      aria-label="Loading results…"
    >
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="sp-skeleton-card">
          <div className="skeleton sp-skeleton-poster" />
          <div className="skeleton sp-skeleton-line" />
          <div className="skeleton sp-skeleton-line sp-skeleton-line--short" />
        </div>
      ))}
    </div>
  )
}
