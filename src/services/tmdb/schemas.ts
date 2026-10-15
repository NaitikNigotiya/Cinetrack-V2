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

/**
 * Tolerant TMDB date parser:
 * TMDB dates are YYYY-MM-DD or empty string "" for unreleased/unknown titles.
 * Converts empty strings and nullish values to null.
 */
export const TmdbDateSchema = z
  .string()
  .nullish()
  .transform((val) => (val && val.trim().length > 0 ? val : null))
  .optional()

export const TmdbMediaItemSchema = z.object({
  id: z.number(),
  title: z.string().optional(),
  name: z.string().optional(), // For TV
  media_type: z.enum(['movie', 'tv']).optional(),
  poster_path: z.string().nullable().optional(),
  backdrop_path: z.string().nullable().optional(),
  release_date: TmdbDateSchema,
  first_air_date: TmdbDateSchema,
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
  display_priority: z.number().optional(),
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

export const TmdbFindResponseSchema = z.object({
  movie_results: tolerantArray(TmdbMediaItemSchema, 'movie find result'),
  tv_results: tolerantArray(TmdbMediaItemSchema, 'tv find result'),
})

export const TmdbTvEpisodeSchema = z.object({
  id: z.number(),
  episode_number: z.number(),
  season_number: z.number(),
  name: z.string().default(''),
  overview: z.string().default(''),
  air_date: TmdbDateSchema,
  runtime: z.number().nullable().optional(),
  still_path: z.string().nullable().optional(),
  vote_average: z.number().default(0),
})

export const TmdbTvSeasonSchema = z.object({
  id: z.number(),
  season_number: z.number(),
  name: z.string().default(''),
  overview: z.string().default(''),
  poster_path: z.string().nullable().optional(),
  air_date: TmdbDateSchema,
  episodes: tolerantArray(TmdbTvEpisodeSchema, 'tv episode'),
})

export const TmdbGenreListResponseSchema = z.object({
  genres: tolerantArray(z.object({ id: z.number(), name: z.string() }), 'genre item'),
})

export const TmdbConfigurationSchema = z.object({
  images: z.object({
    base_url: z.string().default('http://image.tmdb.org/t/p/'),
    secure_base_url: z.string().default('https://image.tmdb.org/t/p/'),
    backdrop_sizes: z.array(z.string()).default([]),
    poster_sizes: z.array(z.string()).default([]),
    profile_sizes: z.array(z.string()).default([]),
    still_sizes: z.array(z.string()).default([]),
  }),
})

export const TmdbWatchProviderCatalogSchema = z.object({
  results: tolerantArray(TmdbWatchProviderItemSchema, 'watch provider catalog'),
})

export const TmdbMovieDetailsSchema = z.object({
  id: z.number(),
  title: z.string(),
  original_title: z.string().optional(),
  overview: z.string().default(''),
  poster_path: z.string().nullable().optional(),
  backdrop_path: z.string().nullable().optional(),
  release_date: TmdbDateSchema,
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
  similar: z
    .object({
      results: tolerantArray(TmdbMediaItemSchema, 'similar'),
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
  first_air_date: TmdbDateSchema,
  episode_run_time: z.array(z.number()).optional(),
  number_of_episodes: z.number().nullable().optional(),
  number_of_seasons: z.number().nullable().optional(),
  status: z.string().optional(),
  vote_average: z.number().default(0),
  vote_count: z.number().default(0),
  tagline: z.string().optional(),
  genres: tolerantArray(z.object({ id: z.number(), name: z.string() }), 'genre'),
  seasons: tolerantArray(
    z.object({
      id: z.number(),
      name: z.string(),
      season_number: z.number(),
      episode_count: z.number().default(0),
      poster_path: z.string().nullable().optional(),
      air_date: TmdbDateSchema,
    }),
    'tv season summary'
  ).optional(),
  credits: z
    .object({
      cast: tolerantArray(TmdbCastMemberSchema, 'cast member'),
    })
    .optional(),
  aggregate_credits: z
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
  similar: z
    .object({
      results: tolerantArray(TmdbMediaItemSchema, 'similar'),
    })
    .optional(),
  next_episode_to_air: z
    .object({
      air_date: TmdbDateSchema,
      episode_number: z.number(),
      season_number: z.number(),
    })
    .nullable()
    .optional(),
})

export type TmdbMediaItem = z.infer<typeof TmdbMediaItemSchema>
export type TmdbSearchResult = TmdbMediaItem
export type TmdbSearchResponse = z.infer<typeof TmdbSearchResponseSchema>
export type TmdbFindResponse = z.infer<typeof TmdbFindResponseSchema>
export type TmdbMovieDetails = z.infer<typeof TmdbMovieDetailsSchema>
export type TmdbTvDetails = z.infer<typeof TmdbTvDetailsSchema>
export type TmdbTvSeason = z.infer<typeof TmdbTvSeasonSchema>
export type TmdbTvEpisode = z.infer<typeof TmdbTvEpisodeSchema>
export type TmdbCastMember = z.infer<typeof TmdbCastMemberSchema>
export type TmdbVideo = z.infer<typeof TmdbVideoSchema>
export type TmdbGenreListResponse = z.infer<typeof TmdbGenreListResponseSchema>
export type TmdbConfiguration = z.infer<typeof TmdbConfigurationSchema>
export type TmdbWatchProviderCatalog = z.infer<typeof TmdbWatchProviderCatalogSchema>
