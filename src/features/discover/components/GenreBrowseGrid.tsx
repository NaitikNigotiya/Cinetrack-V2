import { POPULAR_GENRES, type GenreItem } from '../constants/genres'
import styles from './GenreBrowseGrid.module.css'

interface GenreBrowseGridProps {
  selectedGenreId?: number | null | undefined
  onSelectGenre: (genre: GenreItem) => void
}

export function GenreBrowseGrid({ selectedGenreId, onSelectGenre }: GenreBrowseGridProps) {
  return (
    <section className={styles.section}>
      <h2 className={styles.title}>Browse by Genre</h2>
      <div className={styles.grid}>
        {POPULAR_GENRES.map((g) => {
          const isSelected = selectedGenreId === g.id
          return (
            <button
              key={g.id}
              type="button"
              className={`${styles.genreBtn} ${isSelected ? styles.selectedGenre : ''}`}
              onClick={() => onSelectGenre(g)}
            >
              <span className={styles.emoji}>{g.emoji}</span>
              <span className={styles.name}>{g.name}</span>
            </button>
          )
        })}
      </div>
    </section>
  )
}
