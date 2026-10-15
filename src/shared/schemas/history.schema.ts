import { z } from 'zod'

export const HistoryEventTypeEnum = z.enum(['movie', 'tv_episode'])
export type HistoryEventType = z.infer<typeof HistoryEventTypeEnum>

export const HistorySourceEnum = z.enum(['manual', 'season_bulk', 'import'])
export type HistorySource = z.infer<typeof HistorySourceEnum>

export const HistoryEventSchema = z.object({
  eventId: z.string().min(1),
  titleKey: z.string().regex(/^(movie|tv):[0-9]+$/),
  title: z.string().min(1),
  type: HistoryEventTypeEnum,
  season: z.number().int().optional(),
  episode: z.number().int().optional(),
  episodeLabel: z.string().optional(), // "S01E03"
  watchedAt: z.any(),
  runtimeMinutes: z.number().int().min(0).default(0),
  rating: z.number().min(0.5).max(10).nullable().optional(),
  posterPath: z.string().nullable().default(null),
  genreIds: z.array(z.number().int()).default([]),
  source: HistorySourceEnum.default('manual'),
  createdAt: z.any(),
  schemaVersion: z.literal(1).default(1),
})

export type HistoryEvent = z.infer<typeof HistoryEventSchema>
