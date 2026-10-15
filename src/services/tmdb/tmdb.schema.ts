import { z } from 'zod'

/**
 * Tolerant array parser:
 * Filters out malformed elements, logs a warning, and prevents
 * a single malformed item from breaking the whole list.
 */
export function tolerantArray<T extends z.ZodTypeAny>(schema: T, itemName = 'item') {
  return z
    .array(z.unknown())
    .default([])
    .transform((items) => {
      const valid: z.infer<T>[] = []
      for (const item of items) {
        const result = schema.safeParse(item)
        if (result.success) {
          valid.push(result.data)
        } else {
          console.warn(`[TMDB Parser] Dropped malformed ${itemName}:`, result.error.issues)
        }
      }
      return valid
    })
}

export const TmdbMediaItemSchema = z.object({
  id: z.number(),
  title: z.string().optional(),
  name: z.string().optional(), // For TV
  media_type: z.enum(['movie', 'tv']).optional(),
  poster_path: z.string().nullable().optional(),
  backdrop_path: z.string().nullable().optional(),
  release_date: z.string().optional(),
  first_air_date: z.string().optional(),
  overview: z.string().default(''),
  vote_average: z.number().default(0),
  vote_count: z.number().default(0),
  genre_ids: z.array(z.number()).default([]),
})

export const TmdbSearchResponseSchema = z.object({
  page: z.number().default(1),
  total_pages: z.number().default(1),
  total_results: z.number().default(0),
  results: tolerantArray(TmdbMediaItemSchema, 'search result'),
})

export const TmdbCastMemberSchema = z.object({
  id: z.number(),
  name: z.string(),
  character: z.string().default(''),
  profile_path: z.string().nullable().optional(),
})

export const TmdbVideoSchema = z.object({
  id: z.string(),
  key: z.string(),
  name: z.string(),
  site: z.string(),
  type: z.string(),
})

export const TmdbWatchProviderItemSchema = z.object({
  provider_id: z.number(),
  provider_name: z.string(),
  logo_path: z.string().nullable().optional(),
})

export const TmdbWatchProvidersResponseSchema = z.object({
  results: z
    .record(
      z.string(),
      z.object({
        link: z.string().optional(),
        flatrate: tolerantArray(TmdbWatchProviderItemSchema, 'watch provider').optional(),
        rent: tolerantArray(TmdbWatchProviderItemSchema, 'watch provider').optional(),
        buy: tolerantArray(TmdbWatchProviderItemSchema, 'watch provider').optional(),
      })
    )
    .default({}),
})

export const TmdbMovieDetailsSchema = z.object({
  id: z.number(),
  title: z.string(),
  original_title: z.string().optional(),
  overview: z.string().default(''),
  poster_path: z.string().nullable().optional(),
  backdrop_path: z.string().nullable().optional(),
  release_date: z.string().optional(),
  runtime: z.number().nullable().optional(),
  vote_average: z.number().default(0),
  vote_count: z.number().default(0),
  tagline: z.string().optional(),
  genres: tolerantArray(z.object({ id: z.number(), name: z.string() }), 'genre'),
  credits: z
    .object({
      cast: tolerantArray(TmdbCastMemberSchema, 'cast member'),
    })
    .optional(),
  videos: z
    .object({
      results: tolerantArray(TmdbVideoSchema, 'video'),
    })
    .optional(),
  'watch/providers': TmdbWatchProvidersResponseSchema.optional(),
  recommendations: z
    .object({
      results: tolerantArray(TmdbMediaItemSchema, 'recommendation'),
    })
    .optional(),
})

export const TmdbTvDetailsSchema = z.object({
  id: z.number(),
  name: z.string(),
  original_name: z.string().optional(),
  overview: z.string().default(''),
  poster_path: z.string().nullable().optional(),
  backdrop_path: z.string().nullable().optional(),
  first_air_date: z.string().optional(),
  episode_run_time: z.array(z.number()).optional(),
  number_of_episodes: z.number().nullable().optional(),
  number_of_seasons: z.number().nullable().optional(),
  status: z.string().optional(),
  vote_average: z.number().default(0),
  vote_count: z.number().default(0),
  tagline: z.string().optional(),
  genres: tolerantArray(z.object({ id: z.number(), name: z.string() }), 'genre'),
  credits: z
    .object({
      cast: tolerantArray(TmdbCastMemberSchema, 'cast member'),
    })
    .optional(),
  videos: z
    .object({
      results: tolerantArray(TmdbVideoSchema, 'video'),
    })
    .optional(),
  'watch/providers': TmdbWatchProvidersResponseSchema.optional(),
  recommendations: z
    .object({
      results: tolerantArray(TmdbMediaItemSchema, 'recommendation'),
    })
    .optional(),
  next_episode_to_air: z
    .object({
      air_date: z.string(),
      episode_number: z.number(),
      season_number: z.number(),
    })
    .nullable()
    .optional(),
})

export type TmdbMediaItem = z.infer<typeof TmdbMediaItemSchema>
export type TmdbSearchResult = TmdbMediaItem
export type TmdbSearchResponse = z.infer<typeof TmdbSearchResponseSchema>
export type TmdbMovieDetails = z.infer<typeof TmdbMovieDetailsSchema>
export type TmdbTvDetails = z.infer<typeof TmdbTvDetailsSchema>
export type TmdbCastMember = z.infer<typeof TmdbCastMemberSchema>
export type TmdbVideo = z.infer<typeof TmdbVideoSchema>
