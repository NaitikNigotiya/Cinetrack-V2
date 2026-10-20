import { z } from 'zod'

export const SeasonDocSchema = z.object({
  season: z.number().int().min(0),
  totalEpisodes: z.number().int().nullable().default(null),
  watched: z.record(z.string(), z.any()).default({}), // map "3": Timestamp
  watchedCount: z.number().int().min(0).default(0),
  minutesWatched: z.number().int().min(0).default(0),
  completed: z.boolean().default(false),
  updatedAt: z.any(),
  source: z.string().optional(),
  approximate: z.boolean().optional(),
})

export type SeasonDoc = z.infer<typeof SeasonDocSchema>
