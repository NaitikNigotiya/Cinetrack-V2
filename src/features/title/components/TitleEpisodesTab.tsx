import { useSeason } from '@/services/tmdb/hooks'
import { getPosterUrl, getStillUrl } from '@/services/tmdb/images'
import { ListChecks, ChevronDown, Clock, Calendar, Star, Film } from 'lucide-react'
import { Card } from '@/shared/ui/layout/Card'
import { Button } from '@/shared/ui/Button/Button'

interface SeasonItem {
  seasonNumber: number
  name: string
  episodeCount: number
  airDate: string | null
  posterPath: string | null
}

interface TitleEpisodesTabProps {
  tmdbId: number
  titleKey: string
  totalSeasons: number
  totalEpisodes: number | null
  seasons: SeasonItem[]
  openSeasonNumber: number | null
  onToggleSeason: (seasonNumber: number) => void
  onNavigateTracker: () => void
}

function SeasonAccordionRow({
  tmdbId,
  season,
  isOpen,
  onToggle,
}: {
  tmdbId: number
  season: SeasonItem
  isOpen: boolean
  onToggle: () => void
}) {
  const { data: seasonDetail, isLoading } = useSeason(isOpen ? tmdbId : null, isOpen ? season.seasonNumber : null)
  const episodes = seasonDetail?.episodes || []

  return (
    <div className={`title-season-accordion ${isOpen ? 'title-season-accordion--open' : ''}`}>
      <button
        type="button"
        className="title-season-header-btn"
        onClick={onToggle}
        aria-expanded={isOpen}
      >
        <div className="title-season-poster-wrap">
          {season.posterPath ? (
            <img
              src={getPosterUrl(season.posterPath, 'w185') || ''}
              alt={season.name}
              className="title-season-poster-img"
            />
          ) : (
            <div className="title-season-poster-fallback">
              <Film size={18} />
            </div>
          )}
        </div>

        <div className="title-season-meta">
          <div className="title-season-name">{season.name || `Season ${season.seasonNumber}`}</div>
          <div className="title-season-sub">
            {season.episodeCount} episode{season.episodeCount !== 1 ? 's' : ''}
            {season.airDate && ` · ${new Date(season.airDate).getFullYear()}`}
          </div>
        </div>

        <ChevronDown
          size={18}
          className={`title-season-chevron ${isOpen ? 'title-season-chevron--expanded' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="title-season-episodes-list">
          {isLoading ? (
            <div className="title-episodes-loading">Loading episodes...</div>
          ) : episodes.length === 0 ? (
            <div className="title-episodes-empty">No episode details available for this season.</div>
          ) : (
            episodes.map((ep) => (
              <div key={ep.episodeNumber} className="title-episode-row">
                <div className="title-episode-thumb-box">
                  {ep.stillPath ? (
                    <img
                      src={getStillUrl(ep.stillPath, 'w300') || ''}
                      alt={ep.name}
                      className="title-episode-thumb-img"
                      loading="lazy"
                    />
                  ) : (
                    <div className="title-episode-thumb-fallback">
                      <Film size={20} />
                    </div>
                  )}
                  <span className="title-episode-code-badge">
                    E{String(ep.episodeNumber).padStart(2, '0')}
                  </span>
                </div>

                <div className="title-episode-info">
                  <div className="title-episode-title-row">
                    <span className="title-episode-name">{ep.name}</span>
                    {ep.voteAverage && ep.voteAverage > 0 ? (
                      <span className="title-episode-rating">
                        <Star size={12} fill="#f59e0b" color="#f59e0b" />
                        {ep.voteAverage.toFixed(1)}
                      </span>
                    ) : null}
                  </div>

                  {ep.overview && (
                    <p className="title-episode-overview">{ep.overview}</p>
                  )}

                  <div className="title-episode-meta-badges">
                    {ep.runtimeMinutes && (
                      <span className="title-ep-meta-item">
                        <Clock size={12} /> {ep.runtimeMinutes}m
                      </span>
                    )}
                    {ep.airDate && (
                      <span className="title-ep-meta-item">
                        <Calendar size={12} /> {new Date(ep.airDate).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

export function TitleEpisodesTab({
  tmdbId,
  totalSeasons,
  totalEpisodes,
  seasons,
  openSeasonNumber,
  onToggleSeason,
  onNavigateTracker,
}: TitleEpisodesTabProps) {
  const validSeasons = seasons.filter((s) => s.seasonNumber > 0)

  return (
    <div className="title-episodes-tab-container">
      {/* Episodes Banner Card */}
      <Card className="title-section-card title-episodes-banner-card">
        <div className="title-episodes-banner-info">
          <h3 className="title-card-heading">Season Directory</h3>
          <p className="title-card-sub">
            {totalSeasons} Season{totalSeasons !== 1 ? 's' : ''}
            {totalEpisodes ? ` · ${totalEpisodes} Total Episodes` : ''}
          </p>
        </div>

        <Button
          variant="primary"
          leftIcon={<ListChecks size={16} />}
          onClick={onNavigateTracker}
        >
          Track Episodes
        </Button>
      </Card>

      {/* Accordion Seasons List */}
      <div className="title-seasons-stack">
        {validSeasons.map((s) => (
          <SeasonAccordionRow
            key={s.seasonNumber}
            tmdbId={tmdbId}
            season={s}
            isOpen={openSeasonNumber === s.seasonNumber}
            onToggle={() => onToggleSeason(s.seasonNumber)}
          />
        ))}
      </div>
    </div>
  )
}
