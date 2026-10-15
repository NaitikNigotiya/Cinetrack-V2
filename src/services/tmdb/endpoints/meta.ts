import { request } from '../client'
import {
  TmdbGenreListResponseSchema,
  TmdbConfigurationSchema,
  TmdbWatchProviderCatalogSchema,
  type TmdbGenreListResponse,
  type TmdbConfiguration,
  type TmdbWatchProviderCatalog,
} from '../schemas'

export async function getGenreList(
  mediaType: 'movie' | 'tv',
  signal?: AbortSignal
): Promise<TmdbGenreListResponse> {
  const data = await request<unknown>(`genre/${mediaType}/list`, { signal })
  return TmdbGenreListResponseSchema.parse(data)
}

export async function getConfiguration(signal?: AbortSignal): Promise<TmdbConfiguration> {
  const data = await request<unknown>('configuration', { signal })
  return TmdbConfigurationSchema.parse(data)
}

export async function getWatchProvidersCatalog(
  mediaType: 'movie' | 'tv',
  signal?: AbortSignal
): Promise<TmdbWatchProviderCatalog> {
  const data = await request<unknown>(`watch/providers/${mediaType}`, { signal })
  return TmdbWatchProviderCatalogSchema.parse(data)
}
