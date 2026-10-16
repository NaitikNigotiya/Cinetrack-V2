import { Star, Clock, Calendar } from 'lucide-react'
import {
  getBackdropUrl,
  getBackdropSrcSet,
  getPosterUrl,
  getPosterSrcSet,
} from '@/shared/lib/tmdbImage'
import styles from './TitleHero.module.css'

interface TitleHeroProps {
  title: string
  tagline?: string | undefined
  posterPath?: string | null | undefined
  backdropPath?: string | null | undefined
  year?: number | null | undefined
  runtimeMinutes?: number | null | undefined
  runtimeString?: string | undefined
  genres?: { id: number; name: string }[] | undefined
  voteAverage?: number | undefined
  certification?: string | undefined
  status?: string | undefined
  type: 'movie' | 'tv'
  episodesCount?: number | null | undefined
  nextAirDate?: string | undefined
}

export function TitleHero({
  title,
  tagline,
  posterPath,
  backdropPath,
  year,
  runtimeMinutes,
  runtimeString,
  genres = [],
  voteAverage,
  certification,
  status,
  type,
  episodesCount,
  nextAirDate,
}: TitleHeroProps) {
  const backdropUrl = getBackdropUrl(backdropPath, 'w1280')
  const backdropSrcSet = getBackdropSrcSet(backdropPath)
  const posterUrl = getPosterUrl(posterPath, 'w500')
  const posterSrcSet = getPosterSrcSet(posterPath)

  const displayRuntime = runtimeString ?? (runtimeMinutes ? `${runtimeMinutes}m` : null)

  return (
    <div className={styles.hero}>
      {backdropUrl && (
        <img
          src={backdropUrl}
          srcSet={backdropSrcSet}
          sizes="100vw"
          alt=""
          role="presentation"
          className={styles.backdrop}
        />
      )}
      <div className={styles.scrim} aria-hidden="true" />

      <div className={styles.heroContent}>
        <div className={styles.posterWrapper}>
          {posterUrl ? (
            <img
              src={posterUrl}
              srcSet={posterSrcSet}
              sizes="(max-width: 640px) 150px, 200px"
              alt={title}
              className={styles.posterImg}
            />
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

            {certification && (
              <span style={{
                padding: '2px 6px',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                fontSize: 'var(--font-size-xs)',
                fontWeight: 600,
                color: 'var(--text-2)',
              }}>
                {certification}
              </span>
            )}

            {year && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <Calendar size={14} />
                {year}
              </span>
            )}

            {displayRuntime ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <Clock size={14} />
                {displayRuntime}
              </span>
            ) : null}

            {type === 'tv' && episodesCount ? (
              <span>{episodesCount} episodes</span>
            ) : null}

            {status && (
              <span style={{
                fontSize: 'var(--font-size-xs)',
                color: 'var(--text-3)',
              }}>
                • {status}
              </span>
            )}

            {nextAirDate && (
              <span style={{
                fontSize: 'var(--font-size-xs)',
                color: 'var(--accent, #6366f1)',
                fontWeight: 500,
              }}>
                • Next: {new Date(nextAirDate).toLocaleDateString()}
              </span>
            )}
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
