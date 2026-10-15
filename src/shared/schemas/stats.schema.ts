import { z } from 'zod'

export const StatsSummarySchema = z.object({
  moviesWatched: z.number().int().min(0).default(0),
  episodesWatched: z.number().int().min(0).default(0),
  minutesWatched: z.number().int().min(0).default(0),
  titlesCompleted: z.number().int().min(0).default(0),
  ratingSum: z.number().min(0).default(0),
  ratingCount: z.number().int().min(0).default(0),
  genreCounts: z.record(z.string(), z.number().int().min(0)).default({}),
  statusCounts: z.record(z.string(), z.number().int().min(0)).default({}),
  currentStreak: z.number().int().min(0).default(0),
  longestStreak: z.number().int().min(0).default(0),
  lastActiveDay: z.string().nullable().default(null), // YYYY-MM-DD
  updatedAt: z.any(),
})

export type StatsSummary = z.infer<typeof StatsSummarySchema>

export const MonthlyStatsSchema = z.object({
  monthKey: z.string().regex(/^\d{4}-\d{2}$/), // YYYY-MM
  movies: z.number().int().min(0).default(0),
  episodes: z.number().int().min(0).default(0),
  movieMinutes: z.number().int().min(0).default(0),
  tvMinutes: z.number().int().min(0).default(0),
  genreCounts: z.record(z.string(), z.number().int().min(0)).default({}),
})

export type MonthlyStats = z.infer<typeof MonthlyStatsSchema>
