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
