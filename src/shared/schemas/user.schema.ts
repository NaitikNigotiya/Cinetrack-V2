import { z } from 'zod'

export const UserProfileSchema = z.object({
  displayName: z.string().min(1).max(100),
  email: z.string().email(),
  photoURL: z.string().nullable().optional(),
  region: z.string().length(2).default('US'), // ISO 3166-1
  language: z.string().default('en-US'),      // BCP-47
  timezone: z.string().default('UTC'),        // IANA e.g. "Asia/Kolkata"
  onboarded: z.boolean().default(false),
  createdAt: z.any(), // Timestamp
  updatedAt: z.any(), // Timestamp
  schemaVersion: z.literal(1).default(1),
})

export type UserProfile = z.infer<typeof UserProfileSchema>
