import {
  TmdbSearchResponseSchema,
  TmdbMovieDetailsSchema,
  TmdbTvDetailsSchema,
  TmdbFindResponseSchema,
  TmdbTvSeasonSchema,
  TmdbTvEpisodeSchema,
  TmdbGenreListResponseSchema,
  TmdbConfigurationSchema,
  TmdbWatchProviderCatalogSchema,
  type TmdbSearchResponse,
  type TmdbMovieDetails,
  type TmdbTvDetails,
  type TmdbFindResponse,
  type TmdbTvSeason,
  type TmdbTvEpisode,
  type TmdbGenreListResponse,
  type TmdbConfiguration,
  type TmdbWatchProviderCatalog,
} from './tmdb.schema'
import {
  MOCK_SEARCH_RESULTS,
  MOCK_MOVIE_DETAILS,
  MOCK_TV_DETAILS,
} from './mockData'
import {
  PROXY_BASE,
  getUserLocale,
  dedupeByTitleKey,
  fetchFromProxy,
} from './tmdbProxy'

export const tmdbClient = {
  async searchMulti(query: string, page = 1): Promise<TmdbSearchResponse> {
    const trimmed = query.trim()
    if (trimmed.length < 2) {
      return { page: 1, total_pages: 1, total_results: 0, results: [] }
    }
    const safePage = Math.max(1, Math.min(page, 500))
    try {
      const data = await fetchFromProxy<unknown>(`${PROXY_BASE}/search/multi`, {
        query: trimmed,
        page: safePage.toString(),
      })
      const parsed = TmdbSearchResponseSchema.parse(data)
      const filtered = parsed.results.filter(
        (i) => i.media_type === 'movie' || i.media_type === 'tv' || (!i.media_type && (i.title || i.name))
      )
      return { ...parsed, results: dedupeByTitleKey(filtered) }
    } catch {
      const filtered = MOCK_SEARCH_RESULTS.results.filter((r) =>
        (r.title || r.name || '').toLowerCase().includes(trimmed.toLowerCase())
      )
      return { page: 1, total_pages: 1, total_results: filtered.length, results: filtered }
    }
  },

  async searchMovie(
    query: string,
    options: { year?: string; primaryReleaseYear?: string; region?: string; page?: number } = {}
  ): Promise<TmdbSearchResponse> {
    const trimmed = query.trim()
    if (trimmed.length < 2) {
      return { page: 1, total_pages: 1, total_results: 0, results: [] }
    }
    const safePage = Math.max(1, Math.min(options.page ?? 1, 500))
    const params: Record<string, string> = { query: trimmed, page: safePage.toString() }
    if (options.year) params['year'] = options.year
    if (options.primaryReleaseYear) params['primary_release_year'] = options.primaryReleaseYear
    if (options.region) params['region'] = options.region
    const data = await fetchFromProxy<unknown>(`${PROXY_BASE}/search/movie`, params)
    const parsed = TmdbSearchResponseSchema.parse(data)
    const tagged = parsed.results.map((r) => ({ ...r, media_type: 'movie' as const }))
    return { ...parsed, results: dedupeByTitleKey(tagged) }
  },

  async searchTv(
    query: string,
    options: { firstAirDateYear?: string; page?: number } = {}
  ): Promise<TmdbSearchResponse> {
    const trimmed = query.trim()
    if (trimmed.length < 2) {
      return { page: 1, total_pages: 1, total_results: 0, results: [] }
    }
    const safePage = Math.max(1, Math.min(options.page ?? 1, 500))
    const params: Record<string, string> = { query: trimmed, page: safePage.toString() }
    if (options.firstAirDateYear) params['first_air_date_year'] = options.firstAirDateYear
    const data = await fetchFromProxy<unknown>(`${PROXY_BASE}/search/tv`, params)
    const parsed = TmdbSearchResponseSchema.parse(data)
    const tagged = parsed.results.map((r) => ({ ...r, media_type: 'tv' as const }))
    return { ...parsed, results: dedupeByTitleKey(tagged) }
  },

  async findByExternalId(externalId: string, source: 'imdb_id' = 'imdb_id'): Promise<TmdbFindResponse> {
    const data = await fetchFromProxy<unknown>(`${PROXY_BASE}/find/${encodeURIComponent(externalId)}`, {
      external_source: source,
    })
    return TmdbFindResponseSchema.parse(data)
  },

  async getMovieDetails(id: number): Promise<TmdbMovieDetails> {
    const locale = getUserLocale()
    try {
      const data = await fetchFromProxy<unknown>(`${PROXY_BASE}/movie/${id}`, {
        append_to_response: 'credits,videos,images,recommendations,similar,release_dates,watch/providers,external_ids,keywords',
        include_image_language: `en,null,${locale.language}`,
      })
      const details = TmdbMovieDetailsSchema.parse(data)
      if (!details.overview && locale.language !== 'en-US') {
        try {
          const fallback = TmdbMovieDetailsSchema.parse(
            await fetchFromProxy<unknown>(`${PROXY_BASE}/movie/${id}`, { language: 'en-US' })
          )
          if (fallback.overview) details.overview = fallback.overview
        } catch {
          // ignore
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
        append_to_response: 'aggregate_credits,videos,images,recommendations,similar,content_ratings,watch/providers,external_ids,keywords',
        include_image_language: `en,null,${locale.language}`,
      })
      const details = TmdbTvDetailsSchema.parse(data)
      if (!details.overview && locale.language !== 'en-US') {
        try {
          const fallback = TmdbTvDetailsSchema.parse(
            await fetchFromProxy<unknown>(`${PROXY_BASE}/tv/${id}`, { language: 'en-US' })
          )
          if (fallback.overview) details.overview = fallback.overview
        } catch {
          // ignore
        }
      }
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
    } catch {
      return { ...MOCK_TV_DETAILS, id }
    }
  },

  async getTvSeason(id: number, seasonNumber: number): Promise<TmdbTvSeason> {
    const data = await fetchFromProxy<unknown>(`${PROXY_BASE}/tv/${id}/season/${seasonNumber}`)
    return TmdbTvSeasonSchema.parse(data)
  },

  async getTvEpisode(id: number, seasonNumber: number, episodeNumber: number): Promise<TmdbTvEpisode> {
    const data = await fetchFromProxy<unknown>(`${PROXY_BASE}/tv/${id}/season/${seasonNumber}/episode/${episodeNumber}`)
    return TmdbTvEpisodeSchema.parse(data)
  },

  async getTrending(mediaType: 'movie' | 'tv' | 'all' = 'all', timeWindow: 'day' | 'week' = 'week'): Promise<TmdbSearchResponse> {
    try {
      const data = await fetchFromProxy<unknown>(`${PROXY_BASE}/trending/${mediaType}/${timeWindow}`)
      const parsed = TmdbSearchResponseSchema.parse(data)
      const filtered = parsed.results.filter(
        (i) => i.media_type === 'movie' || i.media_type === 'tv' || (!i.media_type && (i.title || i.name))
      )
      return { ...parsed, results: dedupeByTitleKey(filtered) }
    } catch {
      return MOCK_SEARCH_RESULTS
    }
  },

  async getPopular(mediaType: 'movie' | 'tv' = 'movie', page = 1): Promise<TmdbSearchResponse> {
    const safePage = Math.max(1, Math.min(page, 500))
    const data = await fetchFromProxy<unknown>(`${PROXY_BASE}/${mediaType}/popular`, { page: safePage.toString() })
    const parsed = TmdbSearchResponseSchema.parse(data)
    const tagged = parsed.results.map((r) => ({ ...r, media_type: mediaType }))
    return { ...parsed, results: dedupeByTitleKey(tagged) }
  },

  async getTopRated(mediaType: 'movie' | 'tv' = 'movie', page = 1): Promise<TmdbSearchResponse> {
    const safePage = Math.max(1, Math.min(page, 500))
    const data = await fetchFromProxy<unknown>(`${PROXY_BASE}/${mediaType}/top_rated`, { page: safePage.toString() })
    const parsed = TmdbSearchResponseSchema.parse(data)
    const tagged = parsed.results.map((r) => ({ ...r, media_type: mediaType }))
    return { ...parsed, results: dedupeByTitleKey(tagged) }
  },

  async getNowPlaying(page = 1): Promise<TmdbSearchResponse> {
    const safePage = Math.max(1, Math.min(page, 500))
    const data = await fetchFromProxy<unknown>(`${PROXY_BASE}/movie/now_playing`, { page: safePage.toString() })
    const parsed = TmdbSearchResponseSchema.parse(data)
    const tagged = parsed.results.map((r) => ({ ...r, media_type: 'movie' as const }))
    return { ...parsed, results: dedupeByTitleKey(tagged) }
  },

  async getUpcoming(page = 1): Promise<TmdbSearchResponse> {
    const safePage = Math.max(1, Math.min(page, 500))
    const data = await fetchFromProxy<unknown>(`${PROXY_BASE}/movie/upcoming`, { page: safePage.toString() })
    const parsed = TmdbSearchResponseSchema.parse(data)
    const today = new Date().toISOString().slice(0, 10)
    const upcomingOnly = parsed.results
      .filter((i) => i.release_date && i.release_date >= today)
      .map((r) => ({ ...r, media_type: 'movie' as const }))
    return { ...parsed, results: dedupeByTitleKey(upcomingOnly) }
  },

  async getOnTheAir(page = 1): Promise<TmdbSearchResponse> {
    const safePage = Math.max(1, Math.min(page, 500))
    const data = await fetchFromProxy<unknown>(`${PROXY_BASE}/tv/on_the_air`, { page: safePage.toString() })
    const parsed = TmdbSearchResponseSchema.parse(data)
    const tagged = parsed.results.map((r) => ({ ...r, media_type: 'tv' as const }))
    return { ...parsed, results: dedupeByTitleKey(tagged) }
  },

  async getAiringToday(page = 1): Promise<TmdbSearchResponse> {
    const safePage = Math.max(1, Math.min(page, 500))
    const data = await fetchFromProxy<unknown>(`${PROXY_BASE}/tv/airing_today`, { page: safePage.toString() })
    const parsed = TmdbSearchResponseSchema.parse(data)
    const tagged = parsed.results.map((r) => ({ ...r, media_type: 'tv' as const }))
    return { ...parsed, results: dedupeByTitleKey(tagged) }
  },

  async discoverMovies(params: Record<string, string> = {}): Promise<TmdbSearchResponse> {
    const queryParams = { ...params }
    if (queryParams['sort_by'] === 'vote_average.desc' && !queryParams['vote_count.gte']) {
      queryParams['vote_count.gte'] = '200'
    }
    const data = await fetchFromProxy<unknown>(`${PROXY_BASE}/discover/movie`, queryParams)
    const parsed = TmdbSearchResponseSchema.parse(data)
    const tagged = parsed.results.map((r) => ({ ...r, media_type: 'movie' as const }))
    return { ...parsed, results: dedupeByTitleKey(tagged) }
  },

  async discoverTv(params: Record<string, string> = {}): Promise<TmdbSearchResponse> {
    const queryParams = { ...params }
    if (queryParams['sort_by'] === 'vote_average.desc' && !queryParams['vote_count.gte']) {
      queryParams['vote_count.gte'] = '100'
    }
    const data = await fetchFromProxy<unknown>(`${PROXY_BASE}/discover/tv`, queryParams)
    const parsed = TmdbSearchResponseSchema.parse(data)
    const tagged = parsed.results.map((r) => ({ ...r, media_type: 'tv' as const }))
    return { ...parsed, results: dedupeByTitleKey(tagged) }
  },

  async discoverByGenre(mediaType: 'movie' | 'tv', genreId: number, page = 1): Promise<TmdbSearchResponse> {
    return mediaType === 'movie'
      ? this.discoverMovies({ with_genres: genreId.toString(), page: page.toString() })
      : this.discoverTv({ with_genres: genreId.toString(), page: page.toString() })
  },

  async getRecommendations(mediaType: 'movie' | 'tv', id: number): Promise<TmdbSearchResponse> {
    const data = await fetchFromProxy<unknown>(`${PROXY_BASE}/${mediaType}/${id}/recommendations`)
    const parsed = TmdbSearchResponseSchema.parse(data)
    const tagged = parsed.results.map((r) => ({ ...r, media_type: mediaType }))
    return { ...parsed, results: dedupeByTitleKey(tagged) }
  },

  async getSimilar(mediaType: 'movie' | 'tv', id: number): Promise<TmdbSearchResponse> {
    const data = await fetchFromProxy<unknown>(`${PROXY_BASE}/${mediaType}/${id}/similar`)
    const parsed = TmdbSearchResponseSchema.parse(data)
    const tagged = parsed.results.map((r) => ({ ...r, media_type: mediaType }))
    return { ...parsed, results: dedupeByTitleKey(tagged) }
  },

  async getGenreList(mediaType: 'movie' | 'tv'): Promise<TmdbGenreListResponse> {
    const data = await fetchFromProxy<unknown>(`${PROXY_BASE}/genre/${mediaType}/list`)
    return TmdbGenreListResponseSchema.parse(data)
  },

  async getMergedGenreMap(): Promise<Record<number, string>> {
    const [movieGenres, tvGenres] = await Promise.all([
      this.getGenreList('movie').catch(() => ({ genres: [] })),
      this.getGenreList('tv').catch(() => ({ genres: [] })),
    ])
    const map: Record<number, string> = {}
    movieGenres.genres.forEach((g) => { map[g.id] = g.name })
    tvGenres.genres.forEach((g) => { map[g.id] = g.name })
    return map
  },

  async getConfiguration(): Promise<TmdbConfiguration> {
    const data = await fetchFromProxy<unknown>(`${PROXY_BASE}/configuration`)
    return TmdbConfigurationSchema.parse(data)
  },

  async getWatchProvidersCatalog(mediaType: 'movie' | 'tv'): Promise<TmdbWatchProviderCatalog> {
    const data = await fetchFromProxy<unknown>(`${PROXY_BASE}/watch/providers/${mediaType}`)
    return TmdbWatchProviderCatalogSchema.parse(data)
  },
}
