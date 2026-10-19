import { makeTitleKey } from '@/shared/lib/ids'
import {
  getPosterUrl,
  getPosterSrcSet,
  getBackdropUrl,
  getBackdropSrcSet,
  getProfileUrl,
  getStillUrl,
} from '../images'
import type {
  TmdbMovieDetails,
  TmdbTvDetails,
  TmdbTvSeason,
} from '../schemas'
import { normaliseMediaList } from './media'
import { parseYear } from './helpers'
import type {
  NormalisedTitleDetails,
  NormalisedTvSeason,
} from './types'

/**
 * Normalises raw movie details from TMDB.
 */
export function normaliseMovieDetails(raw: TmdbMovieDetails): NormalisedTitleDetails {
  const posterPath = raw.poster_path || null
  const backdropPath = raw.backdrop_path || null
  const releaseDate = raw.release_date || null

  const cast = (raw.credits?.cast || []).map((c) => ({
    id: c.id,
    name: c.name,
    character: c.character,
    profileUrl: getProfileUrl(c.profile_path),
  }))

  const videos = (raw.videos?.results || []).map((v) => ({
    id: v.id,
    key: v.key,
    name: v.name,
    site: v.site,
    type: v.type,
  }))

  const recommendations = normaliseMediaList(raw.recommendations?.results || [], 'movie')
  const similar = normaliseMediaList(raw.similar?.results || [], 'movie')

  const details: NormalisedTitleDetails = {
    id: raw.id,
    titleKey: makeTitleKey('movie', raw.id),
    type: 'movie',
    title: raw.title,
    overview: raw.overview || '',
    posterPath,
    backdropPath,
    posterUrl: getPosterUrl(posterPath),
    backdropUrl: getBackdropUrl(backdropPath),
    releaseDate,
    year: parseYear(releaseDate),
    runtimeMinutes: raw.runtime || null,
    voteAverage: raw.vote_average || 0,
    voteCount: raw.vote_count || 0,
    genres: raw.genres || [],
    cast,
    videos,
    recommendations,
    similar,
  }

  if (raw.original_title) details.originalTitle = raw.original_title
  if (raw.tagline) details.tagline = raw.tagline

  const posterSrcSet = getPosterSrcSet(posterPath)
  if (posterSrcSet) details.posterSrcSet = posterSrcSet

  const backdropSrcSet = getBackdropSrcSet(backdropPath)
  if (backdropSrcSet) details.backdropSrcSet = backdropSrcSet

  if (raw['watch/providers']?.results) {
    details.watchProviders = raw['watch/providers'].results
    details['watch/providers'] = raw['watch/providers']
  }
  if (raw.credits) details.credits = raw.credits
  if (raw.images) (details as any).images = raw.images
  if (raw.reviews) (details as any).reviews = raw.reviews

  return details
}

/**
 * Normalises raw TV details from TMDB.
 */
export function normaliseTvDetails(raw: TmdbTvDetails): NormalisedTitleDetails {
  const posterPath = raw.poster_path || null
  const backdropPath = raw.backdrop_path || null
  const releaseDate = raw.first_air_date || null

  const castList = raw.aggregate_credits?.cast || raw.credits?.cast || []
  const cast = castList.map((c) => ({
    id: c.id,
    name: c.name,
    character: c.character,
    profileUrl: getProfileUrl(c.profile_path),
  }))

  const videos = (raw.videos?.results || []).map((v) => ({
    id: v.id,
    key: v.key,
    name: v.name,
    site: v.site,
    type: v.type,
  }))

  const sortedSeasons = [...(raw.seasons || [])].sort((a, b) => {
    if (a.season_number === 0) return 1
    if (b.season_number === 0) return -1
    return a.season_number - b.season_number
  })

  const seasons = sortedSeasons.map((s) => ({
    id: s.id,
    name: s.season_number === 0 && !s.name ? 'Specials' : s.name,
    seasonNumber: s.season_number,
    episodeCount: s.episode_count,
    posterPath: s.poster_path || null,
    posterUrl: getPosterUrl(s.poster_path),
    airDate: s.air_date || null,
  }))

  const recommendations = normaliseMediaList(raw.recommendations?.results || [], 'tv')
  const similar = normaliseMediaList(raw.similar?.results || [], 'tv')

  const details: NormalisedTitleDetails = {
    id: raw.id,
    titleKey: makeTitleKey('tv', raw.id),
    type: 'tv',
    title: raw.name,
    overview: raw.overview || '',
    posterPath,
    backdropPath,
    posterUrl: getPosterUrl(posterPath),
    backdropUrl: getBackdropUrl(backdropPath),
    releaseDate,
    year: parseYear(releaseDate),
    runtimeMinutes: raw.episode_run_time?.[0] || null,
    numberOfEpisodes: raw.number_of_episodes || null,
    numberOfSeasons: raw.number_of_seasons || null,
    voteAverage: raw.vote_average || 0,
    voteCount: raw.vote_count || 0,
    genres: raw.genres || [],
    seasons,
    cast,
    videos,
    recommendations,
    similar,
  }

  if (raw.original_name) details.originalTitle = raw.original_name
  if (raw.tagline) details.tagline = raw.tagline
  if (raw.status) details.status = raw.status

  const posterSrcSet = getPosterSrcSet(posterPath)
  if (posterSrcSet) details.posterSrcSet = posterSrcSet

  const backdropSrcSet = getBackdropSrcSet(backdropPath)
  if (backdropSrcSet) details.backdropSrcSet = backdropSrcSet

  if (raw['watch/providers']?.results) {
    details.watchProviders = raw['watch/providers'].results
    details['watch/providers'] = raw['watch/providers']
  }
  if (raw.credits) details.credits = raw.credits
  if (raw.images) (details as any).images = raw.images
  if (raw.reviews) (details as any).reviews = raw.reviews

  if (raw.next_episode_to_air) {
    details.nextEpisodeToAir = {
      airDate: raw.next_episode_to_air.air_date || null,
      episodeNumber: raw.next_episode_to_air.episode_number,
      seasonNumber: raw.next_episode_to_air.season_number,
    }
  }

  return details
}

/**
 * Normalises raw TV season and its episodes.
 */
export function normaliseTvSeason(raw: TmdbTvSeason): NormalisedTvSeason {
  const episodes = (raw.episodes || []).map((ep) => ({
    id: ep.id,
    episodeNumber: ep.episode_number,
    seasonNumber: ep.season_number,
    name: ep.name,
    overview: ep.overview,
    airDate: ep.air_date || null,
    runtimeMinutes: ep.runtime || null,
    stillPath: ep.still_path || null,
    stillUrl: getStillUrl(ep.still_path),
    voteAverage: ep.vote_average,
  }))

  return {
    id: raw.id,
    seasonNumber: raw.season_number,
    name: raw.name,
    overview: raw.overview,
    posterPath: raw.poster_path || null,
    posterUrl: getPosterUrl(raw.poster_path),
    airDate: raw.air_date || null,
    episodes,
  }
}
