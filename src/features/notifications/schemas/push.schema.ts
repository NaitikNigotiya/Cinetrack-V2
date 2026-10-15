import { z } from 'zod'

export const PushPreferencesSchema = z.object({
  pushEnabled: z.boolean().default(false),
  genres: z.array(z.number().int()).default([]),
  includeTv: z.boolean().default(true),
  digestHourLocal: z.number().int().min(0).max(23).default(18),
  lastSentAt: z.string().nullable().default(null),
  recentlyNotifiedKeys: z.array(z.string()).default([]),
  timezone: z.string().default('UTC'),
  updatedAt: z.any().optional(),
})

export type PushPreferences = z.infer<typeof PushPreferencesSchema>

export const PushTokenDocSchema = z.object({
  token: z.string().min(1),
  tokenHash: z.string().min(1),
  deviceLabel: z.string().default('Browser Device'),
  userAgent: z.string().default(''),
  createdAt: z.any().optional(),
  lastSeenAt: z.any().optional(),
})

export type PushTokenDoc = z.infer<typeof PushTokenDocSchema>
