import { z } from 'zod'

export type TitleKey = `movie:${number}` | `tv:${number}`

export const TitleKeySchema = z
  .string()
  .regex(/^(movie|tv):[0-9]+$/)
  .transform((val) => val as TitleKey)

export const ImageRefSchema = z.object({
  filePath: z.string(),
  width: z.number().optional().default(0),
  height: z.number().optional().default(0),
  aspectRatio: z.number().optional().default(0),
  iso6391: z.string().nullable().default(null),
  voteAverage: z.number().default(0),
})

export type ImageRef = z.infer<typeof ImageRefSchema>

export const TitleReviewSchema = z.object({
  id: z.string(),
  author: z.string(),
  rating: z.number().nullable().default(null),
  content: z.string().default(''),
  createdAt: z.string().nullable().default(null),
  url: z.string().nullable().default(null),
})

export type TitleReview = z.infer<typeof TitleReviewSchema>

export const ProviderSchema = z.object({
  id: z.number(),
  name: z.string(),
  logoPath: z.string().nullable().default(null),
})

export type Provider = z.infer<typeof ProviderSchema>

export const EpisodeBriefSchema = z.object({
  seasonNumber: z.number(),
  episodeNumber: z.number(),
  name: z.string(),
  airDate: z.string().nullable().default(null),
  overview: z.string().default(''),
})

export type EpisodeBrief = z.infer<typeof EpisodeBriefSchema>

export const TitleSummarySchema = z.object({
  titleKey: TitleKeySchema,
  tmdbId: z.number().int().positive(),
  type: z.enum(['movie', 'tv']),
  title: z.string().min(1),
  originalTitle: z.string().nullable().default(null),
  year: z.number().int().nullable().default(null),
  releaseDate: z.string().nullable().default(null),
  posterPath: z.string().nullable().default(null),
  backdropPath: z.string().nullable().default(null),
  overview: z.string().default(''),
  genreIds: z.array(z.number()).default([]),
  voteAverage: z.number().nullable().default(null),
  voteCount: z.number().default(0),
  popularity: z.number().default(0),
  originalLanguage: z.string().nullable().default(null),
  isUnreleased: z.boolean().default(false),
})

export type TitleSummary = z.infer<typeof TitleSummarySchema>

export const CastMemberSchema = z.object({
  id: z.number(),
  name: z.string(),
  character: z.string().nullable().default(null),
  profilePath: z.string().nullable().default(null),
  order: z.number(),
})

export type CastMember = z.infer<typeof CastMemberSchema>

export const CrewMemberSchema = z.object({
  id: z.number(),
  name: z.string(),
  job: z.string(),
})

export type CrewMember = z.infer<typeof CrewMemberSchema>

export const VideoRefSchema = z.object({
  key: z.string(),
  site: z.literal('YouTube'),
  type: z.string(),
  name: z.string(),
  official: z.boolean().default(false),
})

export type VideoRef = z.infer<typeof VideoRefSchema>

export const WatchProvidersSectionSchema = z.object({
  region: z.string(),
  link: z.string().nullable().default(null),
  flatrate: z.array(ProviderSchema).default([]),
  rent: z.array(ProviderSchema).default([]),
  buy: z.array(ProviderSchema).default([]),
  free: z.array(ProviderSchema).default([]),
})

export type WatchProvidersSection = z.infer<typeof WatchProvidersSectionSchema>

export const TvDetailsMetaSchema = z.object({
  totalSeasons: z.number().default(0),
  totalEpisodes: z.number().nullable().default(null),
  seasons: z.array(
    z.object({
      seasonNumber: z.number(),
      name: z.string(),
      episodeCount: z.number().default(0),
      airDate: z.string().nullable().default(null),
      posterPath: z.string().nullable().default(null),
    })
  ).default([]),
  inProduction: z.boolean().default(false),
  type: z.string().nullable().default(null),
  lastEpisodeToAir: EpisodeBriefSchema.nullable().default(null),
  nextEpisodeToAir: EpisodeBriefSchema.nullable().default(null),
  networks: z.array(
    z.object({
      id: z.number(),
      name: z.string(),
      logoPath: z.string().nullable().default(null),
    })
  ).default([]),
  creators: z.array(
    z.object({
      id: z.number(),
      name: z.string(),
    })
  ).default([]),
})

export type TvDetailsMeta = z.infer<typeof TvDetailsMetaSchema>

export const TitleDetailsSchema = TitleSummarySchema.extend({
  tagline: z.string().nullable().default(null),
  genres: z.array(z.object({ id: z.number(), name: z.string() })).default([]),
  runtimeMinutes: z.number().nullable().default(null),
  status: z.string().nullable().default(null),
  homepage: z.string().nullable().default(null),
  imdbId: z.string().nullable().default(null),
  certification: z.string().nullable().default(null),
  cast: z.array(CastMemberSchema).default([]),
  crew: z.array(CrewMemberSchema).default([]),
  videos: z.array(VideoRefSchema).default([]),
  trailerKey: z.string().nullable().default(null),
  images: z.object({
    posters: z.array(ImageRefSchema).default([]),
    backdrops: z.array(ImageRefSchema).default([]),
    logos: z.array(ImageRefSchema).default([]),
  }).default({ posters: [], backdrops: [], logos: [] }),
  recommendations: z.array(TitleSummarySchema).default([]),
  similar: z.array(TitleSummarySchema).default([]),
  reviews: z.array(TitleReviewSchema).default([]),
  providers: WatchProvidersSectionSchema.nullable().default(null),
  belongsToCollection: z.object({ id: z.number(), name: z.string() }).nullable().default(null),
  tv: TvDetailsMetaSchema.nullable().default(null),
})

export type TitleDetails = z.infer<typeof TitleDetailsSchema>

export const EpisodeSchema = z.object({
  episodeNumber: z.number().int().min(0),
  seasonNumber: z.number().int().min(0),
  name: z.string().default(''),
  overview: z.string().default(''),
  airDate: z.string().nullable().default(null),
  runtimeMinutes: z.number().nullable().default(null),
  stillPath: z.string().nullable().default(null),
  voteAverage: z.number().nullable().default(null),
  isAired: z.boolean().default(false),
})

export type Episode = z.infer<typeof EpisodeSchema>
