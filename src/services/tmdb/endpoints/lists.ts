import { request } from '../client'
import { TmdbSearchResponseSchema, type TmdbSearchResponse } from '../schemas'

export async function getTrending(
  mediaType: 'movie' | 'tv' | 'all' = 'all',
  timeWindow: 'day' | 'week' = 'week',
  page = 1,
  signal?: AbortSignal
): Promise<TmdbSearchResponse> {
  const safePage = Math.max(1, Math.min(page, 500))
  const data = await request<unknown>(`trending/${mediaType}/${timeWindow}`, {
    params: { page: safePage },
    signal,
  })
  const parsed = TmdbSearchResponseSchema.parse(data)
  const filtered = parsed.results.filter(
    (i) => i.media_type === 'movie' || i.media_type === 'tv' || (!i.media_type && (i.title || i.name))
  )
  return { ...parsed, results: filtered }
}

export async function getPopular(
  mediaType: 'movie' | 'tv' = 'movie',
  page = 1,
  signal?: AbortSignal
): Promise<TmdbSearchResponse> {
  const safePage = Math.max(1, Math.min(page, 500))
  const data = await request<unknown>(`${mediaType}/popular`, {
    params: { page: safePage },
    signal,
  })
  const parsed = TmdbSearchResponseSchema.parse(data)
  const tagged = parsed.results.map((r) => ({ ...r, media_type: mediaType }))
  return { ...parsed, results: tagged }
}

export async function getTopRated(
  mediaType: 'movie' | 'tv' = 'movie',
  page = 1,
  signal?: AbortSignal
): Promise<TmdbSearchResponse> {
  const safePage = Math.max(1, Math.min(page, 500))
  const data = await request<unknown>(`${mediaType}/top_rated`, {
    params: { page: safePage },
    signal,
  })
  const parsed = TmdbSearchResponseSchema.parse(data)
  const tagged = parsed.results.map((r) => ({ ...r, media_type: mediaType }))
  return { ...parsed, results: tagged }
}

export async function getNowPlaying(
  page = 1,
  region?: string,
  signal?: AbortSignal
): Promise<TmdbSearchResponse> {
  const safePage = Math.max(1, Math.min(page, 500))
  const params: Record<string, string | number> = { page: safePage }
  if (region) params['region'] = region
  const data = await request<unknown>('movie/now_playing', { params, signal })
  const parsed = TmdbSearchResponseSchema.parse(data)
  const tagged = parsed.results.map((r) => ({ ...r, media_type: 'movie' as const }))
  return { ...parsed, results: tagged }
}

export async function getUpcoming(
  page = 1,
  region?: string,
  signal?: AbortSignal
): Promise<TmdbSearchResponse> {
  const safePage = Math.max(1, Math.min(page, 500))
  const params: Record<string, string | number> = { page: safePage }
  if (region) params['region'] = region
  const data = await request<unknown>('movie/upcoming', { params, signal })
  const parsed = TmdbSearchResponseSchema.parse(data)
  const today = new Date().toISOString().slice(0, 10)
  const upcomingOnly = parsed.results
    .filter((i) => i.release_date && i.release_date >= today)
    .map((r) => ({ ...r, media_type: 'movie' as const }))
  return { ...parsed, results: upcomingOnly }
}

export async function getOnTheAir(
  page = 1,
  timezone?: string,
  signal?: AbortSignal
): Promise<TmdbSearchResponse> {
  const safePage = Math.max(1, Math.min(page, 500))
  const params: Record<string, string | number> = { page: safePage }
  if (timezone) params['timezone'] = timezone
  const data = await request<unknown>('tv/on_the_air', { params, signal })
  const parsed = TmdbSearchResponseSchema.parse(data)
  const tagged = parsed.results.map((r) => ({ ...r, media_type: 'tv' as const }))
  return { ...parsed, results: tagged }
}

export async function getAiringToday(
  page = 1,
  timezone?: string,
  signal?: AbortSignal
): Promise<TmdbSearchResponse> {
  const safePage = Math.max(1, Math.min(page, 500))
  const params: Record<string, string | number> = { page: safePage }
  if (timezone) params['timezone'] = timezone
  const data = await request<unknown>('tv/airing_today', { params, signal })
  const parsed = TmdbSearchResponseSchema.parse(data)
  const tagged = parsed.results.map((r) => ({ ...r, media_type: 'tv' as const }))
  return { ...parsed, results: tagged }
}

export async function discoverMovies(
  params: Record<string, string> = {},
  signal?: AbortSignal
): Promise<TmdbSearchResponse> {
  const queryParams = { ...params }
  if (queryParams['sort_by'] === 'vote_average.desc' && !queryParams['vote_count.gte']) {
    queryParams['vote_count.gte'] = '200'
  }
  const data = await request<unknown>('discover/movie', { params: queryParams, signal })
  const parsed = TmdbSearchResponseSchema.parse(data)
  const tagged = parsed.results.map((r) => ({ ...r, media_type: 'movie' as const }))
  return { ...parsed, results: tagged }
}

export async function discoverTv(
  params: Record<string, string> = {},
  signal?: AbortSignal
): Promise<TmdbSearchResponse> {
  const queryParams = { ...params }
  if (queryParams['sort_by'] === 'vote_average.desc' && !queryParams['vote_count.gte']) {
    queryParams['vote_count.gte'] = '100'
  }
  const data = await request<unknown>('discover/tv', { params: queryParams, signal })
  const parsed = TmdbSearchResponseSchema.parse(data)
  const tagged = parsed.results.map((r) => ({ ...r, media_type: 'tv' as const }))
  return { ...parsed, results: tagged }
}

export async function getRecommendations(
  mediaType: 'movie' | 'tv',
  id: number,
  page = 1,
  signal?: AbortSignal
): Promise<TmdbSearchResponse> {
  const data = await request<unknown>(`${mediaType}/${id}/recommendations`, {
    params: { page },
    signal,
  })
  const parsed = TmdbSearchResponseSchema.parse(data)
  const tagged = parsed.results.map((r) => ({ ...r, media_type: mediaType }))
  return { ...parsed, results: tagged }
}

export async function getSimilar(
  mediaType: 'movie' | 'tv',
  id: number,
  page = 1,
  signal?: AbortSignal
): Promise<TmdbSearchResponse> {
  const data = await request<unknown>(`${mediaType}/${id}/similar`, {
    params: { page },
    signal,
  })
  const parsed = TmdbSearchResponseSchema.parse(data)
  const tagged = parsed.results.map((r) => ({ ...r, media_type: mediaType }))
  return { ...parsed, results: tagged }
}

export async function discoverByGenre(
  mediaType: 'movie' | 'tv',
  genreId: number,
  page = 1,
  signal?: AbortSignal
): Promise<TmdbSearchResponse> {
  const params: Record<string, string> = {
    with_genres: genreId.toString(),
    page: page.toString(),
  }
  return mediaType === 'movie' ? discoverMovies(params, signal) : discoverTv(params, signal)
}

