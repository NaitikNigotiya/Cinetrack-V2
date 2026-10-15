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
  recommendations: (titleKey: string) =>
    [...tmdbKeys.all, 'recommendations', titleKey] as const,
  watchProviders: (titleKey: string, region: string) =>
    [...tmdbKeys.all, 'providers', titleKey, region] as const,
}
