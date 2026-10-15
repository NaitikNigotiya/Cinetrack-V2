import {
  collection,
  doc,
  type CollectionReference,
  type DocumentReference,
} from 'firebase/firestore'
import { db } from './db'
import { createZodConverter } from './converters'
import {
  UserProfileSchema,
  LibraryEntrySchema,
  SeasonDocSchema,
  HistoryEventSchema,
  ReviewSchema,
  NoteSchema,
  CollectionSchema,
  PlannedWatchSchema,
  UserPreferencesSchema,
  PushSettingsSchema,
  StatsSummarySchema,
  MonthlyStatsSchema,
  type UserProfile,
  type LibraryEntry,
  type SeasonDoc,
  type HistoryEvent,
  type Review,
  type Note,
  type Collection,
  type PlannedWatch,
  type UserPreferences,
  type PushSettings,
  type StatsSummary,
  type MonthlyStats,
} from '@/shared/schemas'

export const userConverter = createZodConverter(UserProfileSchema, 'users')
export const libraryConverter = createZodConverter(LibraryEntrySchema, 'library')
export const seasonConverter = createZodConverter(SeasonDocSchema, 'seasons')
export const historyConverter = createZodConverter(HistoryEventSchema, 'history')
export const reviewConverter = createZodConverter(ReviewSchema, 'reviews')
export const noteConverter = createZodConverter(NoteSchema, 'notes')
export const collectionConverter = createZodConverter(CollectionSchema, 'collections')
export const plannedWatchConverter = createZodConverter(PlannedWatchSchema, 'plannedWatches')
export const preferencesConverter = createZodConverter(UserPreferencesSchema, 'preferences')
export const pushSettingsConverter = createZodConverter(PushSettingsSchema, 'push')
export const statsSummaryConverter = createZodConverter(StatsSummarySchema, 'statsSummary')
export const monthlyStatsConverter = createZodConverter(MonthlyStatsSchema, 'monthlyStats')

export function getUserDocRef(uid: string): DocumentReference<UserProfile> {
  return doc(db, 'users', uid).withConverter(userConverter)
}

export function getLibraryCollection(uid: string): CollectionReference<LibraryEntry> {
  return collection(db, 'users', uid, 'library').withConverter(libraryConverter)
}

export function getLibraryDocRef(uid: string, titleKey: string): DocumentReference<LibraryEntry> {
  return doc(db, 'users', uid, 'library', titleKey).withConverter(libraryConverter)
}

export function getSeasonCollection(uid: string, titleKey: string): CollectionReference<SeasonDoc> {
  return collection(db, 'users', uid, 'library', titleKey, 'seasons').withConverter(seasonConverter)
}

export function getSeasonDocRef(uid: string, titleKey: string, seasonNumber: number): DocumentReference<SeasonDoc> {
  return doc(db, 'users', uid, 'library', titleKey, 'seasons', seasonNumber.toString()).withConverter(seasonConverter)
}

export function getHistoryCollection(uid: string): CollectionReference<HistoryEvent> {
  return collection(db, 'users', uid, 'history').withConverter(historyConverter)
}

export function getHistoryDocRef(uid: string, eventId: string): DocumentReference<HistoryEvent> {
  return doc(db, 'users', uid, 'history', eventId).withConverter(historyConverter)
}

export function getReviewsCollection(uid: string): CollectionReference<Review> {
  return collection(db, 'users', uid, 'reviews').withConverter(reviewConverter)
}

export function getNotesCollection(uid: string): CollectionReference<Note> {
  return collection(db, 'users', uid, 'notes').withConverter(noteConverter)
}

export function getCollectionsCollection(uid: string): CollectionReference<Collection> {
  return collection(db, 'users', uid, 'collections').withConverter(collectionConverter)
}

export function getPlannedWatchesCollection(uid: string): CollectionReference<PlannedWatch> {
  return collection(db, 'users', uid, 'plannedWatches').withConverter(plannedWatchConverter)
}

export function getPreferencesDocRef(uid: string): DocumentReference<UserPreferences> {
  return doc(db, 'users', uid, 'settings', 'preferences').withConverter(preferencesConverter)
}

export function getPushSettingsDocRef(uid: string): DocumentReference<PushSettings> {
  return doc(db, 'users', uid, 'settings', 'push').withConverter(pushSettingsConverter)
}

export function getStatsSummaryDocRef(uid: string): DocumentReference<StatsSummary> {
  return doc(db, 'users', uid, 'stats', 'summary').withConverter(statsSummaryConverter)
}

export function getMonthlyStatsDocRef(uid: string, monthKey: string): DocumentReference<MonthlyStats> {
  return doc(db, 'users', uid, 'stats', `monthly_${monthKey}`).withConverter(monthlyStatsConverter)
}
