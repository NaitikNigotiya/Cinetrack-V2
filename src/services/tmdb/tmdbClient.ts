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
import { useAuthStore } from '@/features/auth/store/authStore'

const PROXY_BASE = '/api/tmdb'

function getUserLocale(): { language: string; region: string } {
  try {
    const profile = useAuthStore.getState().profile
    return {
      language: profile?.language || 'en-US',
      region: profile?.region || 'US',
    }
  } catch {
    return { language: 'en-US', region: 'US' }
  }
}

async function fetchFromProxy<T>(
  path: string,
  params: Record<string, string> = {}
): Promise<T> {
  const url = new URL(path, window.location.origin)
  const locale = getUserLocale()

  if (!params['language']) url.searchParams.set('language', locale.language)
  if (!params['region']) url.searchParams.set('region', locale.region)

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
    const safePage = Math.max(1, Math.min(page, 500))
    try {
      const data = await fetchFromProxy<unknown>(`${PROXY_BASE}/search/multi`, {
        query,
        page: safePage.toString(),
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
    const locale = getUserLocale()
    try {
      const data = await fetchFromProxy<unknown>(`${PROXY_BASE}/movie/${id}`, {
        append_to_response: 'credits,videos,watch/providers,recommendations',
      })
      const details = TmdbMovieDetailsSchema.parse(data)

      // Fallback to English if translated overview is empty
      if (!details.overview && locale.language !== 'en-US') {
        try {
          const fallbackData = await fetchFromProxy<unknown>(`${PROXY_BASE}/movie/${id}`, {
            language: 'en-US',
          })
          const fallback = TmdbMovieDetailsSchema.parse(fallbackData)
          if (fallback.overview) {
            details.overview = fallback.overview
          }
        } catch {
          // ignore fallback error
        }
      }

      return details
    } catch {
      return { ...MOCK_MOVIE_DETAILS, id }
    }
  },

  async getTvDetails(id: number): Promise<TmdbTvDetails> {
    const locale = getUserLocale()
    try {
      const data = await fetchFromProxy<unknown>(`${PROXY_BASE}/tv/${id}`, {
        append_to_response: 'credits,videos,watch/providers,recommendations',
      })
      const details = TmdbTvDetailsSchema.parse(data)

      // Fallback to English if translated overview is empty
      if (!details.overview && locale.language !== 'en-US') {
        try {
          const fallbackData = await fetchFromProxy<unknown>(`${PROXY_BASE}/tv/${id}`, {
            language: 'en-US',
          })
          const fallback = TmdbTvDetailsSchema.parse(fallbackData)
          if (fallback.overview) {
            details.overview = fallback.overview
          }
        } catch {
          // ignore fallback error
        }
      }

      return details
    } catch {
      return { ...MOCK_TV_DETAILS, id }
    }
  },

  async getPopular(mediaType: 'movie' | 'tv' = 'movie'): Promise<TmdbSearchResponse> {
    try {
      const data = await fetchFromProxy<unknown>(`${PROXY_BASE}/${mediaType}/popular`)
      return TmdbSearchResponseSchema.parse(data)
    } catch {
      return MOCK_SEARCH_RESULTS
    }
  },

  async getTopRated(mediaType: 'movie' | 'tv' = 'movie'): Promise<TmdbSearchResponse> {
    try {
      const data = await fetchFromProxy<unknown>(`${PROXY_BASE}/${mediaType}/top_rated`)
      return TmdbSearchResponseSchema.parse(data)
    } catch {
      return MOCK_SEARCH_RESULTS
    }
  },

  async getUpcoming(): Promise<TmdbSearchResponse> {
    try {
      const data = await fetchFromProxy<unknown>(`${PROXY_BASE}/movie/upcoming`)
      return TmdbSearchResponseSchema.parse(data)
    } catch {
      return MOCK_SEARCH_RESULTS
    }
  },

  async getRecommendations(mediaType: 'movie' | 'tv', id: number): Promise<TmdbSearchResponse> {
    try {
      const data = await fetchFromProxy<unknown>(`${PROXY_BASE}/${mediaType}/${id}/recommendations`)
      return TmdbSearchResponseSchema.parse(data)
    } catch {
      return MOCK_SEARCH_RESULTS
    }
  },

  async discoverByGenre(mediaType: 'movie' | 'tv', genreId: number, page = 1): Promise<TmdbSearchResponse> {
    const safePage = Math.max(1, Math.min(page, 500))
    try {
      const data = await fetchFromProxy<unknown>(`${PROXY_BASE}/discover/${mediaType}`, {
        with_genres: genreId.toString(),
        page: safePage.toString(),
      })
      return TmdbSearchResponseSchema.parse(data)
    } catch {
      return MOCK_SEARCH_RESULTS
    }
  },
}
