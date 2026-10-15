import { Link } from 'react-router-dom'
import { Star } from 'lucide-react'
import type { LibraryInsights } from '../api/analyticsApi'
import styles from './TopRatedSection.module.css'

interface TopRatedSectionProps {
  titles: LibraryInsights['topRatedTitles']
}

export function TopRatedSection({ titles }: TopRatedSectionProps) {
  if (titles.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h2 className={styles.title}>Highest Rated</h2>
          <span className={styles.subtitle}>Your top scoring library picks</span>
        </div>
        <div className={styles.empty}>No rated titles yet. Rate titles to see them here!</div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Highest Rated</h2>
        <span className={styles.subtitle}>Your top scoring library picks</span>
      </div>

      <div className={styles.list}>
        {titles.map((item, index) => {
          const posterUrl = item.posterPath
            ? `https://image.tmdb.org/t/p/w92${item.posterPath}`
            : null

          return (
            <Link
              key={item.titleKey}
              to={`/title/${item.titleKey}`}
              className={styles.item}
            >
              <span className={styles.rank}>#{index + 1}</span>
              {posterUrl ? (
                <img
                  src={posterUrl}
                  alt={item.title}
                  className={styles.posterThumb}
                  loading="lazy"
                />
              ) : (
                <div className={styles.posterThumb} />
              )}
              <div className={styles.info}>
                <span className={styles.itemTitle}>{item.title}</span>
                <span className={styles.meta}>
                  {item.type === 'movie' ? 'Movie' : 'TV'}
                  {item.year ? ` • ${item.year}` : ''}
                </span>
              </div>
              <div className={styles.ratingBadge}>
                <Star size={14} fill="currentColor" />
                <span>{item.rating}</span>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
