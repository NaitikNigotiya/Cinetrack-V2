import { z } from 'zod'

export const ReviewSchema = z.object({
  titleKey: z.string().regex(/^(movie|tv):[0-9]+$/),
  title: z.string().min(1),
  posterPath: z.string().nullable().default(null),
  rating: z.number().min(0.5).max(10).nullable().default(null),
  body: z.string().max(5000).default(''),
  containsSpoilers: z.boolean().default(false),
  createdAt: z.any(),
  updatedAt: z.any(),
})

export type Review = z.infer<typeof ReviewSchema>
