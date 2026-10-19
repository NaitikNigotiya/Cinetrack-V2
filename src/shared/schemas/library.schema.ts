import { z } from 'zod'

export const LibraryStatusEnum = z.enum([
  'plan_to_watch',
  'watching',
  'completed',
  'on_hold',
  'dropped',
])

export type LibraryStatus = z.infer<typeof LibraryStatusEnum>

export const MediaTypeEnum = z.enum(['movie', 'tv'])
export type MediaType = z.infer<typeof MediaTypeEnum>

export const GenreItemSchema = z.object({
  id: z.number(),
  name: z.string(),
})

export const NextEpisodeSchema = z.object({
  season: z.number().int().min(1),
  episode: z.number().int().min(1),
})

export const TvProgressMetaSchema = z.object({
  totalEpisodes: z.number().int().nullable().default(null),
  totalSeasons: z.number().int().nullable().default(null),
  episodesWatched: z.number().int().min(0).default(0),
  currentSeason: z.number().int().nullable().default(null),
  nextEpisodeToWatch: NextEpisodeSchema.nullable().default(null),
  tmdbStatus: z.string().nullable().default(null),
  nextAirDate: z.string().nullable().default(null), // YYYY-MM-DD
})

export const LibraryEntrySchema = z.object({
  titleKey: z.string().regex(/^(movie|tv):[0-9]+$/),
  tmdbId: z.number().int().positive(),
  type: MediaTypeEnum,
  title: z.string().min(1),
  originalTitle: z.string().optional(),
  year: z.number().int().nullable().default(null),
  posterPath: z.string().nullable().default(null),
  backdropPath: z.string().nullable().default(null),
  genres: z.array(GenreItemSchema).default([]),
  runtimeMinutes: z.number().int().nullable().default(null),
  releaseDate: z.string().nullable().optional(),
  status: LibraryStatusEnum.default('plan_to_watch'),
  priority: z.enum(['high', 'normal', 'low']).default('normal'),
  rating: z.number().min(0.5).max(10).nullable().default(null),
  isFavorite: z.boolean().default(false),
  watchCount: z.number().int().min(0).default(0),
  lastWatchedAt: z.any().nullable().default(null),
  totalMinutesWatched: z.number().int().min(0).default(0),
  tv: TvProgressMetaSchema.optional(),
  tags: z.array(z.string().max(40)).max(20).default([]),
  addedAt: z.any(),
  startedAt: z.any().nullable().default(null),
  completedAt: z.any().nullable().default(null),
  updatedAt: z.any(),
  schemaVersion: z.literal(1).default(1),
})

export type LibraryEntry = z.infer<typeof LibraryEntrySchema>
