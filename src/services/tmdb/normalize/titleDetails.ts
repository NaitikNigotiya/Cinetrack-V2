import type {
  TitleDetails,
  Episode,
  CastMember,
  CrewMember,
  VideoRef,
  WatchProvidersSection,
  TitleReview,
} from '@/shared/schemas/title'
import {
  computeMedian,
  emptyToNull,
  pickBestTrailer,
  filterAndCapImages,
  extractCertification,
  roundVoteAverage,
} from './helpers'
import { toTitleSummary, toTitleSummaryList, type RawMediaSummary } from './summary'

export interface RawFullDetails extends RawMediaSummary {
  tagline?: string | null
  homepage?: string | null
  imdb_id?: string | null
  external_ids?: { imdb_id?: string | null }
  runtime?: number | null
  episode_run_time?: number[]
  status?: string | null
  genres?: { id: number; name: string }[]
  credits?: {
    cast?: Array<{ id: number; name: string; character?: string | null; profile_path?: string | null; order?: number }>
    crew?: Array<{ id: number; name: string; job?: string }>
  }
  aggregate_credits?: {
    cast?: Array<{
      id: number
      name: string
      order?: number
      profile_path?: string | null
      roles?: Array<{ character?: string | null; episode_count?: number }>
    }>
  }
  created_by?: Array<{ id: number; name: string }>
  videos?: { results?: Array<{ key: string; site?: string; type?: string; name?: string; official?: boolean; published_at?: string; iso_639_1?: string }> }
  images?: { posters?: Array<unknown>; backdrops?: Array<unknown>; logos?: Array<unknown> }
  recommendations?: { results?: RawMediaSummary[] }
  similar?: { results?: RawMediaSummary[] }
  reviews?: {
    results?: Array<{
      id: string
      author?: string
      author_details?: { rating?: number | null }
      content?: string
      created_at?: string
      url?: string
    }>
  }
  'watch/providers'?: { results?: Record<string, { link?: string | null; flatrate?: Array<{ provider_id: number; provider_name: string; logo_path?: string | null }>; rent?: Array<{ provider_id: number; provider_name: string; logo_path?: string | null }>; buy?: Array<{ provider_id: number; provider_name: string; logo_path?: string | null }>; free?: Array<{ provider_id: number; provider_name: string; logo_path?: string | null }> }> }
  belongs_to_collection?: { id: number; name: string } | null
  number_of_seasons?: number
  number_of_episodes?: number | null
  in_production?: boolean
  type?: string | null
  seasons?: Array<{ season_number: number; name: string; episode_count?: number; air_date?: string | null; poster_path?: string | null }>
  last_episode_to_air?: { episode_number: number; season_number: number; name: string; air_date?: string | null; overview?: string } | null
  next_episode_to_air?: { episode_number: number; season_number: number; name: string; air_date?: string | null; overview?: string } | null
  networks?: Array<{ id: number; name: string; logo_path?: string | null }>
  release_dates?: unknown
  content_ratings?: unknown
}

export interface NormaliseOptions {
  userRegion?: string
  userLanguage?: string
  userTimezone?: string
  fallbackEnglishOverview?: string
}

/**
 * Normalises raw TMDB movie or TV details into TitleDetails.
 */
export function toTitleDetails(
  raw: RawFullDetails,
  type: 'movie' | 'tv',
  options: NormaliseOptions = {}
): TitleDetails {
  const summary = toTitleSummary(raw, type)!
  const userRegion = options.userRegion || 'US'
  const userLanguage = options.userLanguage || 'en-US'

  let overview = summary.overview
  if (!overview && options.fallbackEnglishOverview) {
    overview = options.fallbackEnglishOverview.trim()
  }

  let runtimeMinutes: number | null = null
  if (type === 'movie') {
    runtimeMinutes = raw.runtime && raw.runtime > 0 ? raw.runtime : null
  } else {
    if (raw.episode_run_time && raw.episode_run_time.length > 0) {
      runtimeMinutes = computeMedian(raw.episode_run_time)
    }
  }

  const certification = extractCertification(
    raw.release_dates as never,
    raw.content_ratings as never,
    type,
    userRegion
  )

  const trailerKey = pickBestTrailer(raw.videos?.results as never, userLanguage)

  let cast: CastMember[] = []
  if (type === 'tv' && raw.aggregate_credits?.cast && raw.aggregate_credits.cast.length > 0) {
    cast = raw.aggregate_credits.cast.map((c) => {
      const topRole = [...(c.roles || [])].sort((a, b) => (b.episode_count ?? 0) - (a.episode_count ?? 0))[0]
      return {
        id: c.id,
        name: c.name,
        character: emptyToNull(topRole?.character),
        profilePath: emptyToNull(c.profile_path),
        order: c.order ?? 999,
      }
    })
  } else if (raw.credits?.cast) {
    cast = raw.credits.cast.map((c) => ({
      id: c.id,
      name: c.name,
      character: emptyToNull(c.character),
      profilePath: emptyToNull(c.profile_path),
      order: c.order ?? 999,
    }))
  }
  cast.sort((a, b) => a.order - b.order)
  cast = cast.slice(0, 12)

  const crew: CrewMember[] = []
  if (type === 'movie' && raw.credits?.crew) {
    const validJobs = new Set(['Director', 'Screenplay', 'Writer'])
    for (const member of raw.credits.crew) {
      if (member.job && validJobs.has(member.job)) {
        crew.push({ id: member.id, name: member.name, job: member.job })
      }
    }
  } else if (type === 'tv' && raw.created_by) {
    for (const creator of raw.created_by) {
      crew.push({ id: creator.id, name: creator.name, job: 'Creator' })
    }
  }

  const rawVideos = raw.videos?.results || []
  const videos: VideoRef[] = rawVideos
    .filter((v): v is typeof v & { site: 'YouTube' } => v.site === 'YouTube' && Boolean(v.key))
    .map((v) => ({
      key: v.key,
      site: 'YouTube' as const,
      type: v.type || 'Trailer',
      name: v.name || 'Video',
      official: Boolean(v.official),
    }))

  const rawImages = raw.images || {}
  const images = {
    posters: filterAndCapImages(rawImages.posters as never, 12),
    backdrops: filterAndCapImages(rawImages.backdrops as never, 12),
    logos: filterAndCapImages(rawImages.logos as never, 12),
  }

  const recCandidates = [...(raw.recommendations?.results || []), ...(raw.similar?.results || [])]
  const recommendations = toTitleSummaryList(recCandidates, type, true, 20)

  const similarCandidates = (raw.similar?.results && raw.similar.results.length > 0)
    ? raw.similar.results
    : (raw.recommendations?.results || [])
  const similar = toTitleSummaryList(similarCandidates, type, true, 20)

  const rawReviews = raw.reviews?.results || []
  const reviews: TitleReview[] = rawReviews.map((r) => ({
    id: r.id,
    author: r.author || 'Anonymous',
    rating: typeof r.author_details?.rating === 'number' ? r.author_details.rating : null,
    content: (r.content || '').trim(),
    createdAt: emptyToNull(r.created_at),
    url: emptyToNull(r.url),
  }))

  let providers: WatchProvidersSection | null = null
  const regionData = raw['watch/providers']?.results?.[userRegion.toUpperCase()]
  if (regionData) {
    const mapProv = (list?: Array<{ provider_id: number; provider_name: string; logo_path?: string | null }>) =>
      (list || []).map((p) => ({
        id: p.provider_id,
        name: p.provider_name,
        logoPath: emptyToNull(p.logo_path),
      }))
    providers = {
      region: userRegion.toUpperCase(),
      link: emptyToNull(regionData.link),
      flatrate: mapProv(regionData.flatrate),
      rent: mapProv(regionData.rent),
      buy: mapProv(regionData.buy),
      free: mapProv(regionData.free),
    }
  }

  let tvMeta: TitleDetails['tv'] = null
  if (type === 'tv') {
    const rawSeasons = raw.seasons || []
    const regularSeasonsTotal = rawSeasons
      .filter((s) => s.season_number > 0)
      .reduce((sum, s) => sum + (s.episode_count ?? 0), 0)
    const totalEpisodes = regularSeasonsTotal > 0 ? regularSeasonsTotal : (raw.number_of_episodes ?? null)

    const seasons = rawSeasons.map((s) => ({
      seasonNumber: s.season_number,
      name: s.season_number === 0 && !s.name ? 'Specials' : s.name,
      episodeCount: s.episode_count ?? 0,
      airDate: emptyToNull(s.air_date),
      posterPath: emptyToNull(s.poster_path),
    }))

    tvMeta = {
      totalSeasons: raw.number_of_seasons ?? seasons.filter((s) => s.seasonNumber > 0).length,
      totalEpisodes,
      seasons,
      inProduction: Boolean(raw.in_production),
      type: emptyToNull(raw.type),
      lastEpisodeToAir: raw.last_episode_to_air
        ? {
            seasonNumber: raw.last_episode_to_air.season_number,
            episodeNumber: raw.last_episode_to_air.episode_number,
            name: raw.last_episode_to_air.name,
            airDate: emptyToNull(raw.last_episode_to_air.air_date),
            overview: raw.last_episode_to_air.overview || '',
          }
        : null,
      nextEpisodeToAir: raw.next_episode_to_air
        ? {
            seasonNumber: raw.next_episode_to_air.season_number,
            episodeNumber: raw.next_episode_to_air.episode_number,
            name: raw.next_episode_to_air.name,
            airDate: emptyToNull(raw.next_episode_to_air.air_date),
            overview: raw.next_episode_to_air.overview || '',
          }
        : null,
      networks: (raw.networks || []).map((n) => ({
        id: n.id,
        name: n.name,
        logoPath: emptyToNull(n.logo_path),
      })),
      creators: (raw.created_by || []).map((c) => ({ id: c.id, name: c.name })),
    }
  }

  const imdbId = emptyToNull(raw.imdb_id || raw.external_ids?.imdb_id)

  return {
    ...summary,
    overview,
    tagline: emptyToNull(raw.tagline),
    genres: raw.genres || [],
    runtimeMinutes,
    status: emptyToNull(raw.status),
    homepage: emptyToNull(raw.homepage),
    imdbId,
    certification,
    cast,
    crew,
    videos,
    trailerKey,
    images,
    recommendations,
    similar,
    reviews,
    providers,
    belongsToCollection: raw.belongs_to_collection
      ? { id: raw.belongs_to_collection.id, name: raw.belongs_to_collection.name }
      : null,
    tv: tvMeta,
  }
}

export interface RawEpisode {
  episode_number: number
  season_number: number
  name?: string
  overview?: string | null
  air_date?: string | null
  runtime?: number | null
  still_path?: string | null
  vote_average?: number | null
}

/**
 * Normalises a raw TV episode.
 */
export function toEpisode(raw: RawEpisode, _userTimezone?: string): Episode {
  const airDate = emptyToNull(raw.air_date)
  const today = new Date().toISOString().slice(0, 10)
  const isAired = Boolean(airDate && airDate <= today)

  return {
    episodeNumber: raw.episode_number,
    seasonNumber: raw.season_number,
    name: (raw.name || `Episode ${raw.episode_number}`).trim(),
    overview: raw.overview?.trim() || '',
    airDate,
    runtimeMinutes: raw.runtime && raw.runtime > 0 ? raw.runtime : null,
    stillPath: emptyToNull(raw.still_path),
    voteAverage: roundVoteAverage(raw.vote_average, 1),
    isAired,
  }
}
