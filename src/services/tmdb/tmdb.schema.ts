import { z } from 'zod'

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
  results: z.array(TmdbMediaItemSchema).default([]),
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
  results: z.record(
    z.string(),
    z.object({
      link: z.string().optional(),
      flatrate: z.array(TmdbWatchProviderItemSchema).optional(),
      rent: z.array(TmdbWatchProviderItemSchema).optional(),
      buy: z.array(TmdbWatchProviderItemSchema).optional(),
    })
  ).default({}),
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
  genres: z.array(z.object({ id: z.number(), name: z.string() })).default([]),
  credits: z.object({
    cast: z.array(TmdbCastMemberSchema).default([]),
  }).optional(),
  videos: z.object({
    results: z.array(TmdbVideoSchema).default([]),
  }).optional(),
  'watch/providers': TmdbWatchProvidersResponseSchema.optional(),
  recommendations: z.object({
    results: z.array(TmdbMediaItemSchema).default([]),
  }).optional(),
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
  genres: z.array(z.object({ id: z.number(), name: z.string() })).default([]),
  credits: z.object({
    cast: z.array(TmdbCastMemberSchema).default([]),
  }).optional(),
  videos: z.object({
    results: z.array(TmdbVideoSchema).default([]),
  }).optional(),
  'watch/providers': TmdbWatchProvidersResponseSchema.optional(),
  recommendations: z.object({
    results: z.array(TmdbMediaItemSchema).default([]),
  }).optional(),
  next_episode_to_air: z.object({
    air_date: z.string(),
    episode_number: z.number(),
    season_number: z.number(),
  }).nullable().optional(),
})

export type TmdbMediaItem = z.infer<typeof TmdbMediaItemSchema>
export type TmdbSearchResult = TmdbMediaItem
export type TmdbSearchResponse = z.infer<typeof TmdbSearchResponseSchema>
export type TmdbMovieDetails = z.infer<typeof TmdbMovieDetailsSchema>
export type TmdbTvDetails = z.infer<typeof TmdbTvDetailsSchema>
export type TmdbCastMember = z.infer<typeof TmdbCastMemberSchema>
export type TmdbVideo = z.infer<typeof TmdbVideoSchema>
