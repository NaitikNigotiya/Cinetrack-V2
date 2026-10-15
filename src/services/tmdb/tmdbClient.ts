import {
  TmdbSearchResponseSchema,
  TmdbMovieDetailsSchema,
  TmdbTvDetailsSchema,
  type TmdbSearchResponse,
  type TmdbMovieDetails,
  type TmdbTvDetails,
} from './tmdb.schema'
import {
  MOCK_SEARCH_RESULTS,
  MOCK_MOVIE_DETAILS,
  MOCK_TV_DETAILS,
} from './mockData'
import { auth } from '@/services/firebase/auth'

const PROXY_BASE = '/api/tmdb'

async function fetchFromProxy<T>(
  path: string,
  params: Record<string, string> = {}
): Promise<T> {
  const url = new URL(path, window.location.origin)
  Object.entries(params).forEach(([k, v]) => {
    if (v) url.searchParams.set(k, v)
  })

  const headers: HeadersInit = {
    Accept: 'application/json',
  }

  // Attach Firebase ID token if user is signed in
  const currentUser = auth.currentUser
  if (currentUser) {
    try {
      const idToken = await currentUser.getIdToken()
      headers['Authorization'] = `Bearer ${idToken}`
    } catch {
      // Continue without token
    }
  }

  const response = await fetch(url.toString(), { headers })

  if (!response.ok) {
    throw new Error(`TMDB Proxy error: ${response.status} ${response.statusText}`)
  }

  return response.json()
}

export const tmdbClient = {
  async searchMulti(query: string, page = 1): Promise<TmdbSearchResponse> {
    if (!query.trim()) {
      return { page: 1, total_pages: 1, total_results: 0, results: [] }
    }
    try {
      const data = await fetchFromProxy<unknown>(`${PROXY_BASE}/search/multi`, {
        query,
        page: page.toString(),
      })
      return TmdbSearchResponseSchema.parse(data)
    } catch {
      // Fallback in dev/offline mode
      const filtered = MOCK_SEARCH_RESULTS.results.filter((r) =>
        (r.title || r.name || '').toLowerCase().includes(query.toLowerCase())
      )
      return {
        page: 1,
        total_pages: 1,
        total_results: filtered.length,
        results: filtered.length > 0 ? filtered : MOCK_SEARCH_RESULTS.results,
      }
    }
  },

  async getTrending(mediaType = 'all', timeWindow = 'week'): Promise<TmdbSearchResponse> {
    try {
      const data = await fetchFromProxy<unknown>(
        `${PROXY_BASE}/trending/${mediaType}/${timeWindow}`
      )
      return TmdbSearchResponseSchema.parse(data)
    } catch {
      return MOCK_SEARCH_RESULTS
    }
  },

  async getMovieDetails(id: number): Promise<TmdbMovieDetails> {
    try {
      const data = await fetchFromProxy<unknown>(`${PROXY_BASE}/movie/${id}`, {
        append_to_response: 'credits,videos,watch/providers,recommendations',
      })
      return TmdbMovieDetailsSchema.parse(data)
    } catch {
      return { ...MOCK_MOVIE_DETAILS, id }
    }
  },

  async getTvDetails(id: number): Promise<TmdbTvDetails> {
    try {
      const data = await fetchFromProxy<unknown>(`${PROXY_BASE}/tv/${id}`, {
        append_to_response: 'credits,videos,watch/providers,recommendations',
      })
      return TmdbTvDetailsSchema.parse(data)
    } catch {
      return { ...MOCK_TV_DETAILS, id }
    }
  },
}
