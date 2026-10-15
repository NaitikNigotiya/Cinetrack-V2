import type { TmdbWatchProvidersResponseSchema } from '../schemas'
import type { z } from 'zod'

export interface NormalisedMediaItem {
  id: number
  titleKey: string
  type: 'movie' | 'tv'
  title: string
  originalTitle?: string | undefined
  overview: string
  posterPath: string | null
  backdropPath: string | null
  posterUrl: string | null
  posterSrcSet?: string | undefined
  backdropUrl: string | null
  backdropSrcSet?: string | undefined
  releaseDate: string | null
  year: number | null
  voteAverage: number
  voteCount: number
  genreIds: number[]
  // Compatibility fields for legacy consumers
  media_type?: 'movie' | 'tv' | undefined
  poster_path?: string | null | undefined
  backdrop_path?: string | null | undefined
  release_date?: string | null | undefined
  first_air_date?: string | null | undefined
  name?: string | undefined
  vote_average?: number | undefined
  vote_count?: number | undefined
}

export interface NormalisedTitleDetails {
  id: number
  titleKey: string
  type: 'movie' | 'tv'
  title: string
  originalTitle?: string | undefined
  tagline?: string | undefined
  overview: string
  posterPath: string | null
  backdropPath: string | null
  posterUrl: string | null
  posterSrcSet?: string | undefined
  backdropUrl: string | null
  backdropSrcSet?: string | undefined
  releaseDate: string | null
  year: number | null
  runtimeMinutes: number | null
  voteAverage: number
  voteCount: number
  genres: { id: number; name: string }[]
  cast: { id: number; name: string; character: string; profileUrl: string | null }[]
  videos: { id: string; key: string; name: string; site: string; type: string }[]
  watchProviders?: z.infer<typeof TmdbWatchProvidersResponseSchema>['results'] | undefined
  recommendations: NormalisedMediaItem[]
  similar: NormalisedMediaItem[]
  // TV specific
  numberOfEpisodes?: number | null | undefined
  numberOfSeasons?: number | null | undefined
  status?: string | undefined
  seasons?: {
    id: number
    name: string
    seasonNumber: number
    episodeCount: number
    posterPath: string | null
    posterUrl: string | null
    airDate: string | null
  }[] | undefined
  nextEpisodeToAir?: {
    airDate: string | null
    episodeNumber: number
    seasonNumber: number
  } | null | undefined
  // Raw compatibility fields
  credits?: { cast: { id: number; name: string; character: string; profile_path?: string | null | undefined }[] } | undefined
  'watch/providers'?: z.infer<typeof TmdbWatchProvidersResponseSchema> | undefined
}

export interface NormalisedTvEpisode {
  id: number
  episodeNumber: number
  seasonNumber: number
  name: string
  overview: string
  airDate: string | null
  runtimeMinutes: number | null
  stillPath: string | null
  stillUrl: string | null
  voteAverage: number
}

export interface NormalisedTvSeason {
  id: number
  seasonNumber: number
  name: string
  overview: string
  posterPath: string | null
  posterUrl: string | null
  airDate: string | null
  episodes: NormalisedTvEpisode[]
}

export interface NormalisedSearchResponse {
  page: number
  totalPages: number
  totalResults: number
  results: NormalisedMediaItem[]
}
