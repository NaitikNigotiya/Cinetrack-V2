import { useState } from 'react'
import { ChevronDown, Film } from 'lucide-react'
import { useSeason } from '@/services/tmdb/hooks'
import { Skeleton } from '@/shared/ui'
import { getPosterUrl, getStillUrl } from '@/services/tmdb/images'
import styles from './TvSeasonsAccordion.module.css'

export interface SeasonItem {
  seasonNumber: number
  name: string
  episodeCount: number
  airDate: string | null
  posterPath: string | null
}

interface TvSeasonsAccordionProps {
  tvId: number
  seasons: SeasonItem[]
  totalEpisodes: number | null
  episodesWatched?: number | undefined
}

function SeasonRow({
  tvId,
  season,
  isOpen,
  onToggle,
}: {
  tvId: number
  season: SeasonItem
  isOpen: boolean
  onToggle: () => void
}) {
  const { data, isLoading } = useSeason(isOpen ? tvId : null, isOpen ? season.seasonNumber : null)

  const posterUrl = getPosterUrl(season.posterPath, 'w185')
  const airYear = season.airDate ? new Date(season.airDate).getFullYear() : null

  return (
    <div className={styles.season}>
      <button type="button" className={styles.seasonHeader} onClick={onToggle} aria-expanded={isOpen}>
        {posterUrl ? (
          <img src={posterUrl} alt={`Season ${season.seasonNumber}`} className={styles.seasonPoster} loading="lazy" />
        ) : (
          <div className={styles.seasonPosterFallback}><Film size={18} /></div>
        )}
        <div className={styles.seasonInfo}>
          <div className={styles.seasonName}>{season.name}</div>
          <div className={styles.seasonMeta}>
            {season.episodeCount} episodes{airYear ? ` · ${airYear}` : ''}
          </div>
        </div>
        <ChevronDown
          size={20}
          className={styles.chevron}
          style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
        />
      </button>

      {isOpen && (
        <div className={styles.episodeList}>
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className={styles.episodeSkeleton}>
                <Skeleton width={96} height={56} />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <Skeleton width="60%" height={14} />
                  <Skeleton width="80%" height={12} />
                </div>
              </div>
            ))
          ) : data?.episodes.length === 0 ? (
            <div className={styles.noEpisodes}>No episode data available.</div>
          ) : (
            data?.episodes.map((ep) => {
              const stillUrl = ep.stillUrl || (ep.stillPath ? getStillUrl(ep.stillPath, 'w300') : null)
              const airDate = ep.airDate ? new Date(ep.airDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : null
              return (
                <div key={`${ep.seasonNumber}x${ep.episodeNumber}`} className={styles.episode}>
                  {stillUrl ? (
                    <img src={stillUrl} alt={ep.name} className={styles.still} loading="lazy" />
                  ) : (
                    <div className={styles.stillFallback}><Film size={16} /></div>
                  )}
                  <div className={styles.episodeInfo}>
                    <div className={styles.episodeTitle}>
                      <span className={styles.epNum}>E{String(ep.episodeNumber).padStart(2, '0')}</span>
                      {ep.name}
                    </div>
                    {ep.overview && (
                      <p className={styles.episodeOverview}>{ep.overview}</p>
                    )}
                    <div className={styles.episodeMeta}>
                      {ep.runtimeMinutes && <span>⏱ {ep.runtimeMinutes}m</span>}
                      {airDate && <span>📅 {airDate}</span>}
                      {ep.voteAverage && ep.voteAverage > 0 && (
                        <span style={{ color: 'var(--color-star)' }}>★ {ep.voteAverage.toFixed(1)}</span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}

export function TvSeasonsAccordion({ tvId, seasons, totalEpisodes, episodesWatched }: TvSeasonsAccordionProps) {
  const regularSeasons = seasons.filter((s) => s.seasonNumber > 0)
  const specials = seasons.filter((s) => s.seasonNumber === 0)
  const orderedSeasons = [...regularSeasons, ...specials]

  const [openSeason, setOpenSeason] = useState<number | null>(regularSeasons[0]?.seasonNumber ?? null)

  const toggle = (num: number) => setOpenSeason((prev) => (prev === num ? null : num))

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <div className={styles.headerTitle}>
            {regularSeasons.length} Season{regularSeasons.length !== 1 ? 's' : ''}
            {totalEpisodes ? ` · ${totalEpisodes} Episodes` : ''}
          </div>
          {typeof episodesWatched === 'number' && (
            <div className={styles.watched}>{episodesWatched} episodes watched</div>
          )}
        </div>
      </div>
      {orderedSeasons.map((season) => (
        <SeasonRow
          key={season.seasonNumber}
          tvId={tvId}
          season={season}
          isOpen={openSeason === season.seasonNumber}
          onToggle={() => toggle(season.seasonNumber)}
        />
      ))}
    </div>
  )
}
