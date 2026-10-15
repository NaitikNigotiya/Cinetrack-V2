import { z } from 'zod'

export const PlannedWatchSchema = z.object({
  id: z.string().optional(),
  titleKey: z.string().regex(/^(movie|tv):[0-9]+$/),
  title: z.string().min(1),
  posterPath: z.string().nullable().default(null),
  type: z.enum(['movie', 'tv']),
  plannedFor: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD local day key
  plannedTime: z.string().regex(/^\d{2}:\d{2}$/).optional(), // HH:mm
  note: z.string().max(500).optional(),
  reminder: z.boolean().default(false),
  done: z.boolean().default(false),
  createdAt: z.any(),
  updatedAt: z.any(),
})

export type PlannedWatch = z.infer<typeof PlannedWatchSchema>
