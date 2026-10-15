export const tmdbKeys = {
  all: ['tmdb'] as const,
  configuration: () => [...tmdbKeys.all, 'configuration'] as const,
  genres: (type?: 'movie' | 'tv') => [...tmdbKeys.all, 'genres', type ?? 'all'] as const,
  search: (query: string, type?: string, year?: string) =>
    [...tmdbKeys.all, 'search', { query, type, year }] as const,
  searchInfinite: (query: string, type?: string, year?: string) =>
    [...tmdbKeys.all, 'search', 'infinite', { query, type: type ?? 'multi', year }] as const,
  details: (titleKey: string) => [...tmdbKeys.all, 'details', titleKey] as const,
  movieDetails: (id: number) => [...tmdbKeys.all, 'movie', id] as const,
  tvDetails: (id: number) => [...tmdbKeys.all, 'tv', id] as const,
  season: (tvId: number, seasonNumber: number) =>
    [...tmdbKeys.all, 'tv', tvId, 'season', seasonNumber] as const,
  episode: (tvId: number, seasonNumber: number, episodeNumber: number) =>
    [...tmdbKeys.all, 'tv', tvId, 'season', seasonNumber, 'episode', episodeNumber] as const,
  trending: (type = 'all', window = 'week', page?: number) =>
    page !== undefined
      ? ([...tmdbKeys.all, 'trending', type, window, page] as const)
      : ([...tmdbKeys.all, 'trending', type, window] as const),
  trendingInfinite: (type = 'all', window = 'week') =>
    [...tmdbKeys.all, 'trending', 'infinite', type, window] as const,
  popular: (type: 'movie' | 'tv' = 'movie', page = 1) =>
    [...tmdbKeys.all, 'popular', type, page] as const,
  popularInfinite: (type: 'movie' | 'tv' = 'movie') =>
    [...tmdbKeys.all, 'popular', 'infinite', type] as const,
  topRated: (type: 'movie' | 'tv' = 'movie', page = 1) =>
    [...tmdbKeys.all, 'top_rated', type, page] as const,
  topRatedInfinite: (type: 'movie' | 'tv' = 'movie') =>
    [...tmdbKeys.all, 'top_rated', 'infinite', type] as const,
  nowPlaying: (page = 1) => [...tmdbKeys.all, 'movie', 'now_playing', page] as const,
  nowPlayingInfinite: () => [...tmdbKeys.all, 'movie', 'now_playing', 'infinite'] as const,
  upcoming: (page = 1) => [...tmdbKeys.all, 'movie', 'upcoming', page] as const,
  upcomingInfinite: () => [...tmdbKeys.all, 'movie', 'upcoming', 'infinite'] as const,
  onTheAir: (page = 1) => [...tmdbKeys.all, 'tv', 'on_the_air', page] as const,
  onTheAirInfinite: () => [...tmdbKeys.all, 'tv', 'on_the_air', 'infinite'] as const,
  airingToday: (page = 1) => [...tmdbKeys.all, 'tv', 'airing_today', page] as const,
  discover: (type: 'movie' | 'tv', params: Record<string, string>, page = 1) =>
    [...tmdbKeys.all, 'discover', type, params, page] as const,
  discoverInfinite: (type: 'movie' | 'tv', params: Record<string, string>) =>
    [...tmdbKeys.all, 'discover', 'infinite', type, params] as const,
  recommendations: (titleKey: string) => [...tmdbKeys.all, 'recommendations', titleKey] as const,
  similar: (titleKey: string) => [...tmdbKeys.all, 'similar', titleKey] as const,
  watchProviders: (titleKey: string, region: string) =>
    [...tmdbKeys.all, 'providers', titleKey, region] as const,
}
