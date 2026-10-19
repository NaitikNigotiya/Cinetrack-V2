import { request } from '../client'
import {
  TmdbMovieDetailsSchema,
  TmdbTvDetailsSchema,
  TmdbTvSeasonSchema,
  TmdbTvEpisodeSchema,
  TmdbImagesResponseSchema,
  TmdbReviewsResponseSchema,
  type TmdbMovieDetails,
  type TmdbTvDetails,
  type TmdbTvSeason,
  type TmdbTvEpisode,
  type TmdbImagesResponse,
  type TmdbReviewsResponse,
} from '../schemas'
import { MOCK_MOVIE_DETAILS, MOCK_TV_DETAILS } from '../mockData'

export async function getMovieDetails(id: number, signal?: AbortSignal): Promise<TmdbMovieDetails> {
  try {
    const data = await request<unknown>(`movie/${id}`, {
      params: {
        append_to_response: 'credits,videos,images,recommendations,similar,release_dates,watch/providers,external_ids',
        include_image_language: 'en,null',
      },
      signal,
    })
    return TmdbMovieDetailsSchema.parse(data)
  } catch (err) {
    if (import.meta.env.DEV || import.meta.env.MODE === 'test') {
      return { ...MOCK_MOVIE_DETAILS, id }
    }
    throw err
  }
}

export async function getTvDetails(id: number, signal?: AbortSignal): Promise<TmdbTvDetails> {
  try {
    const data = await request<unknown>(`tv/${id}`, {
      params: {
        append_to_response: 'credits,aggregate_credits,videos,images,recommendations,similar,release_dates,watch/providers,external_ids',
        include_image_language: 'en,null',
      },
      signal,
    })
    const details = TmdbTvDetailsSchema.parse(data)
    if (details.seasons) {
      details.seasons.sort((a, b) => {
        if (a.season_number === 0) return 1
        if (b.season_number === 0) return -1
        return a.season_number - b.season_number
      })
      details.seasons.forEach((s) => {
        if (s.season_number === 0 && !s.name) s.name = 'Specials'
      })
    }
    return details
  } catch (err) {
    if (import.meta.env.DEV || import.meta.env.MODE === 'test') {
      return { ...MOCK_TV_DETAILS, id }
    }
    throw err
  }
}

export async function getMovieImages(id: number, signal?: AbortSignal): Promise<TmdbImagesResponse> {
  const data = await request<unknown>(`movie/${id}/images`, {
    params: { include_image_language: 'en,null' },
    signal,
  })
  return TmdbImagesResponseSchema.parse(data)
}

export async function getTvImages(id: number, signal?: AbortSignal): Promise<TmdbImagesResponse> {
  const data = await request<unknown>(`tv/${id}/images`, {
    params: { include_image_language: 'en,null' },
    signal,
  })
  return TmdbImagesResponseSchema.parse(data)
}

export async function getMovieReviews(id: number, page = 1, signal?: AbortSignal): Promise<TmdbReviewsResponse> {
  const data = await request<unknown>(`movie/${id}/reviews`, {
    params: { page: String(page) },
    signal,
  })
  return TmdbReviewsResponseSchema.parse(data)
}

export async function getTvReviews(id: number, page = 1, signal?: AbortSignal): Promise<TmdbReviewsResponse> {
  const data = await request<unknown>(`tv/${id}/reviews`, {
    params: { page: String(page) },
    signal,
  })
  return TmdbReviewsResponseSchema.parse(data)
}

export async function getTvSeason(
  id: number,
  seasonNumber: number,
  signal?: AbortSignal
): Promise<TmdbTvSeason> {
  const data = await request<unknown>(`tv/${id}/season/${seasonNumber}`, { signal })
  return TmdbTvSeasonSchema.parse(data)
}

export async function getTvEpisode(
  id: number,
  seasonNumber: number,
  episodeNumber: number,
  signal?: AbortSignal
): Promise<TmdbTvEpisode> {
  const data = await request<unknown>(
    `tv/${id}/season/${seasonNumber}/episode/${episodeNumber}`,
    { signal }
  )
  return TmdbTvEpisodeSchema.parse(data)
}
