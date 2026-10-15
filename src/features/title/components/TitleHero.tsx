import { Star, Clock, Calendar } from 'lucide-react'
import { getBackdropUrl, getPosterUrl } from '@/shared/lib/tmdbImage'
import styles from './TitleHero.module.css'

interface TitleHeroProps {
  title: string
  tagline?: string | undefined
  posterPath?: string | null | undefined
  backdropPath?: string | null | undefined
  year?: number | null | undefined
  runtimeMinutes?: number | null | undefined
  genres?: { id: number; name: string }[] | undefined
  voteAverage?: number | undefined
  type: 'movie' | 'tv'
  episodesCount?: number | null | undefined
}

export function TitleHero({
  title,
  tagline,
  posterPath,
  backdropPath,
  year,
  runtimeMinutes,
  genres = [],
  voteAverage,
  type,
  episodesCount,
}: TitleHeroProps) {
  const backdropUrl = getBackdropUrl(backdropPath, 'w1280')
  const posterUrl = getPosterUrl(posterPath, 'w500')

  return (
    <div className={styles.hero}>
      {backdropUrl && (
        <img
          src={backdropUrl}
          alt=""
          role="presentation"
          className={styles.backdrop}
        />
      )}
      <div className={styles.scrim} aria-hidden="true" />

      <div className={styles.heroContent}>
        <div className={styles.posterWrapper}>
          {posterUrl ? (
            <img src={posterUrl} alt={title} className={styles.posterImg} />
          ) : (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-3)' }}>
              No Poster
            </div>
          )}
        </div>

        <div className={styles.info}>
          <h1 className={styles.title}>{title}</h1>
          {tagline && <p className={styles.tagline}>"{tagline}"</p>}

          <div className={styles.metaRow}>
            {voteAverage ? (
              <span className={styles.ratingBadge}>
                <Star size={14} fill="currentColor" />
                {voteAverage.toFixed(1)} TMDB
              </span>
            ) : null}

            {year && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <Calendar size={14} />
                {year}
              </span>
            )}

            {runtimeMinutes ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <Clock size={14} />
                {runtimeMinutes}m
              </span>
            ) : null}

            {type === 'tv' && episodesCount ? (
              <span>{episodesCount} episodes</span>
            ) : null}
          </div>

          {genres.length > 0 && (
            <div className={styles.genres}>
              {genres.map((g) => (
                <span key={g.id} className={styles.genreTag}>
                  {g.name}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
