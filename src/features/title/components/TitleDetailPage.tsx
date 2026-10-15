import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { parseTitleKey, makeTitleKey } from '@/shared/lib/ids'
import { tmdbClient } from '@/services/tmdb/tmdbClient'
import { tmdbKeys } from '@/services/tmdb/queryKeys'
import { TitleHero } from './TitleHero'
import { TitleActionBar } from './TitleActionBar'
import { TitleCast } from './TitleCast'
import { TitleWatchProviders } from './TitleWatchProviders'
import { TitleTrailerModal } from './TitleTrailerModal'
import { PosterCard, Skeleton, ErrorState } from '@/shared/ui'
import type { TmdbMovieDetails, TmdbTvDetails } from '@/services/tmdb/tmdb.schema'

export default function TitleDetailPage() {
  const { titleKey } = useParams<{ titleKey: string }>()
  const navigate = useNavigate()
  const [isTrailerOpen, setIsTrailerOpen] = useState(false)

  const parsed = titleKey ? parseTitleKey(titleKey) : null

  const detailsQuery = useQuery({
    queryKey: parsed ? (parsed.type === 'movie' ? tmdbKeys.movieDetails(parsed.tmdbId) : tmdbKeys.tvDetails(parsed.tmdbId)) : ['empty'],
    queryFn: async () => {
      if (!parsed) throw new Error('Invalid title key')
      if (parsed.type === 'movie') {
        return tmdbClient.getMovieDetails(parsed.tmdbId)
      }
      return tmdbClient.getTvDetails(parsed.tmdbId)
    },
    enabled: Boolean(parsed),
  })

  if (!parsed) {
    return (
      <ErrorState
        title="Invalid Title"
        message="The title identifier provided in the URL is invalid."
        onRetry={() => navigate('/search')}
      />
    )
  }

  if (detailsQuery.isLoading) {
    return (
      <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <Skeleton width="100%" height={380} style={{ borderRadius: 'var(--radius-2xl)' }} />
        <Skeleton width="100%" height={60} style={{ borderRadius: 'var(--radius-xl)' }} />
        <Skeleton width="100%" height={120} />
      </div>
    )
  }

  if (detailsQuery.isError || !detailsQuery.data) {
    return (
      <ErrorState
        title="Could not load title"
        message="Failed to retrieve movie or TV details from TMDB."
        onRetry={() => detailsQuery.refetch()}
      />
    )
  }

  const isMovie = parsed.type === 'movie'
  const movie = isMovie ? (detailsQuery.data as TmdbMovieDetails) : null
  const tv = !isMovie ? (detailsQuery.data as TmdbTvDetails) : null

  const title = movie?.title || tv?.name || 'Untitled'
  const tagline = movie?.tagline || tv?.tagline
  const posterPath = movie?.poster_path || tv?.poster_path
  const backdropPath = movie?.backdrop_path || tv?.backdrop_path
  const yearStr = movie?.release_date || tv?.first_air_date
  const year = yearStr ? parseInt(yearStr.slice(0, 4), 10) : null
  const runtime = movie?.runtime || (tv?.episode_run_time?.[0] ?? null)
  const overview = movie?.overview || tv?.overview || 'No overview available.'
  const genres = movie?.genres || tv?.genres || []
  const voteAverage = movie?.vote_average || tv?.vote_average || 0
  const cast = (movie?.credits?.cast || tv?.credits?.cast) ?? []
  const watchProviders = movie?.['watch/providers'] || tv?.['watch/providers']
  const recommendations = (movie?.recommendations?.results || tv?.recommendations?.results) ?? []

  const trailerVideo = (movie?.videos?.results || tv?.videos?.results || []).find(
    (v) => v.site === 'YouTube' && v.type === 'Trailer'
  )

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
      <TitleHero
        title={title}
        tagline={tagline}
        posterPath={posterPath}
        backdropPath={backdropPath}
        year={year}
        runtimeMinutes={runtime}
        genres={genres}
        voteAverage={voteAverage}
        type={parsed.type}
        episodesCount={tv?.number_of_episodes}
      />

      <TitleActionBar
        titleKey={titleKey ?? ''}
        title={title}
        posterPath={posterPath}
        type={parsed.type}
        hasTrailer={Boolean(trailerVideo)}
        onOpenTrailer={() => setIsTrailerOpen(true)}
      />

      {/* Storyline / Overview */}
      <section style={{ marginBottom: 'var(--space-8)' }}>
        <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, marginBottom: 'var(--space-3)' }}>
          Storyline
        </h2>
        <p style={{ color: 'var(--text-2)', fontSize: 'var(--font-size-base)', lineHeight: 1.7, maxWidth: '850px' }}>
          {overview}
        </p>
      </section>

      {/* Where to watch streaming availability */}
      <TitleWatchProviders providers={watchProviders} />

      {/* Cast & Crew */}
      <TitleCast cast={cast} />

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <section style={{ marginTop: 'var(--space-8)' }}>
          <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, marginBottom: 'var(--space-4)' }}>
            Recommendations
          </h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))',
              gap: 'var(--space-4)',
            }}
          >
            {recommendations.slice(0, 6).map((rec) => {
              const recType = (rec.media_type || (rec.title ? 'movie' : 'tv')) as 'movie' | 'tv'
              const recTitle = rec.title || rec.name || 'Untitled'
              const recYearStr = rec.release_date || rec.first_air_date
              const recYear = recYearStr ? parseInt(recYearStr.slice(0, 4), 10) : null

              return (
                <PosterCard
                  key={rec.id}
                  title={recTitle}
                  posterPath={rec.poster_path}
                  year={recYear}
                  type={recType}
                  rating={rec.vote_average}
                  onClick={() => navigate(`/title/${makeTitleKey(recType, rec.id)}`)}
                />
              )
            })}
          </div>
        </section>
      )}

      {trailerVideo && (
        <TitleTrailerModal
          isOpen={isTrailerOpen}
          onClose={() => setIsTrailerOpen(false)}
          videoKey={trailerVideo.key}
          title={title}
        />
      )}
    </div>
  )
}
