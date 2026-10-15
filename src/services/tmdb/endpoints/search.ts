import { request } from '../client'
import {
  TmdbSearchResponseSchema,
  TmdbFindResponseSchema,
  type TmdbSearchResponse,
  type TmdbFindResponse,
} from '../schemas'
import { MOCK_SEARCH_RESULTS } from '../mockData'

export async function searchMulti(
  query: string,
  page = 1,
  signal?: AbortSignal
): Promise<TmdbSearchResponse> {
  const trimmed = query.trim()
  if (trimmed.length < 2) {
    return { page: 1, total_pages: 1, total_results: 0, results: [] }
  }
  const safePage = Math.max(1, Math.min(page, 500))

  try {
    const data = await request<unknown>('search/multi', {
      params: { query: trimmed, page: safePage },
      signal,
    })
    const parsed = TmdbSearchResponseSchema.parse(data)
    const filtered = parsed.results.filter(
      (i) => i.media_type === 'movie' || i.media_type === 'tv' || (!i.media_type && (i.title || i.name))
    )
    return { ...parsed, results: filtered }
  } catch (err) {
    if (import.meta.env.DEV || import.meta.env.MODE === 'test') {
      const filtered = MOCK_SEARCH_RESULTS.results.filter((r) =>
        (r.title || r.name || '').toLowerCase().includes(trimmed.toLowerCase())
      )
      return { page: 1, total_pages: 1, total_results: filtered.length, results: filtered }
    }
    throw err
  }
}

export async function searchMovie(
  query: string,
  options: { year?: string; primaryReleaseYear?: string; region?: string; page?: number } = {},
  signal?: AbortSignal
): Promise<TmdbSearchResponse> {
  const trimmed = query.trim()
  if (trimmed.length < 2) {
    return { page: 1, total_pages: 1, total_results: 0, results: [] }
  }
  const safePage = Math.max(1, Math.min(options.page ?? 1, 500))
  const params: Record<string, string | number> = { query: trimmed, page: safePage }
  if (options.year) params['year'] = options.year
  if (options.primaryReleaseYear) params['primary_release_year'] = options.primaryReleaseYear
  if (options.region) params['region'] = options.region

  const data = await request<unknown>('search/movie', { params, signal })
  const parsed = TmdbSearchResponseSchema.parse(data)
  const tagged = parsed.results.map((r) => ({ ...r, media_type: 'movie' as const }))
  return { ...parsed, results: tagged }
}

export async function searchTv(
  query: string,
  options: { firstAirDateYear?: string; page?: number } = {},
  signal?: AbortSignal
): Promise<TmdbSearchResponse> {
  const trimmed = query.trim()
  if (trimmed.length < 2) {
    return { page: 1, total_pages: 1, total_results: 0, results: [] }
  }
  const safePage = Math.max(1, Math.min(options.page ?? 1, 500))
  const params: Record<string, string | number> = { query: trimmed, page: safePage }
  if (options.firstAirDateYear) params['first_air_date_year'] = options.firstAirDateYear

  const data = await request<unknown>('search/tv', { params, signal })
  const parsed = TmdbSearchResponseSchema.parse(data)
  const tagged = parsed.results.map((r) => ({ ...r, media_type: 'tv' as const }))
  return { ...parsed, results: tagged }
}

export async function findByExternalId(
  externalId: string,
  source: 'imdb_id' = 'imdb_id',
  signal?: AbortSignal
): Promise<TmdbFindResponse> {
  const data = await request<unknown>(`find/${encodeURIComponent(externalId)}`, {
    params: { external_source: source },
    signal,
  })
  return TmdbFindResponseSchema.parse(data)
}
