import { z } from 'zod'

export const CollectionItemSchema = z.object({
  titleKey: z.string().regex(/^(movie|tv):[0-9]+$/),
  title: z.string().min(1),
  posterPath: z.string().nullable().default(null),
  type: z.enum(['movie', 'tv']),
  addedAt: z.any(),
})

export const CollectionSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1).max(80),
  description: z.string().max(500).default(''),
  emoji: z.string().max(8).optional(),
  items: z.array(CollectionItemSchema).max(500).default([]),
  isPublic: z.boolean().default(false),
  shareSlug: z.string().optional(),
  createdAt: z.any(),
  updatedAt: z.any(),
})

export type Collection = z.infer<typeof CollectionSchema>
export type CollectionItem = z.infer<typeof CollectionItemSchema>
