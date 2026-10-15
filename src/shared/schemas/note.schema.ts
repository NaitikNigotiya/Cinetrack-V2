import { z } from 'zod'

export const NoteSchema = z.object({
  id: z.string().optional(),
  titleKey: z.string().nullable().default(null),
  title: z.string().nullable().default(null),
  body: z.string().max(5000).default(''),
  pinned: z.boolean().default(false),
  createdAt: z.any(),
  updatedAt: z.any(),
})

export type Note = z.infer<typeof NoteSchema>
