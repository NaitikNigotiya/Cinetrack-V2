export const tmdbKeys = {
  all: ['tmdb'] as const,
  search: (query: string, type?: string, year?: string) =>
    [...tmdbKeys.all, 'search', { query, type, year }] as const,
  trending: (type = 'all', window = 'week') =>
    [...tmdbKeys.all, 'trending', type, window] as const,
  movieDetails: (id: number) =>
    [...tmdbKeys.all, 'movie', id] as const,
  tvDetails: (id: number) =>
    [...tmdbKeys.all, 'tv', id] as const,
  details: (titleKey: string) =>
    [...tmdbKeys.all, 'details', titleKey] as const,
  season: (tvId: number, seasonNumber: number) =>
    [...tmdbKeys.all, 'tv', tvId, 'season', seasonNumber] as const,
  episode: (tvId: number, seasonNumber: number, episodeNumber: number) =>
    [...tmdbKeys.all, 'tv', tvId, 'season', seasonNumber, 'episode', episodeNumber] as const,
  recommendations: (titleKey: string) =>
    [...tmdbKeys.all, 'recommendations', titleKey] as const,
  watchProviders: (titleKey: string, region: string) =>
    [...tmdbKeys.all, 'providers', titleKey, region] as const,
  discover: (type: 'movie' | 'tv', params: Record<string, string>) =>
    [...tmdbKeys.all, 'discover', type, params] as const,
  genres: (type: 'movie' | 'tv') =>
    [...tmdbKeys.all, 'genres', type] as const,
  configuration: () =>
    [...tmdbKeys.all, 'configuration'] as const,
}
