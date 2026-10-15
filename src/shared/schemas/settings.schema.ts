import { z } from 'zod'

export const ThemeEnum = z.enum(['light', 'dark', 'system'])
export const RatingScaleEnum = z.enum(['ten', 'five', 'fivehalf'])
export const DefaultStatusEnum = z.enum(['plan_to_watch', 'watching'])

export const UserPreferencesSchema = z.object({
  theme: ThemeEnum.default('dark'),
  ratingScale: RatingScaleEnum.default('ten'),
  defaultStatus: DefaultStatusEnum.default('plan_to_watch'),
  compactCards: z.boolean().default(false),
  showSpoilers: z.boolean().default(false),
  weekStartsOn: z.union([z.literal(0), z.literal(1)]).default(0), // 0: Sunday, 1: Monday
  hiddenTmdbKeys: z.array(z.string()).max(500).default([]),
  updatedAt: z.any(),
})

export type UserPreferences = z.infer<typeof UserPreferencesSchema>

export const PushDeviceTokenSchema = z.object({
  token: z.string().min(1),
  platform: z.string().default('web'),
  createdAt: z.any(),
  lastSeenAt: z.any(),
})

export const PushSettingsSchema = z.object({
  pushEnabled: z.boolean().default(false),
  tokens: z.record(z.string(), PushDeviceTokenSchema).default({}),
  favoriteGenreIds: z.array(z.number().int()).default([]),
  includeTv: z.boolean().default(true),
  digestHourLocal: z.number().int().min(0).max(23).default(20), // 8 PM default
  lastSentAt: z.any().nullable().default(null),
  recentlyNotifiedKeys: z.array(z.string()).max(50).default([]),
})

export type PushSettings = z.infer<typeof PushSettingsSchema>
export type PushDeviceToken = z.infer<typeof PushDeviceTokenSchema>
