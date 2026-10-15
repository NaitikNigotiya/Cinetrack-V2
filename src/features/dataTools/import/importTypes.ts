export interface ImportedTitleItem {
  title: string
  year: number | null
  type: 'movie' | 'tv'
  status: 'watching' | 'completed' | 'plan_to_watch' | 'on_hold' | 'dropped'
  rating?: number | null
  watchedAt?: string | null
  notes?: string
}

export interface ParsedImportPayload {
  format: 'cinetrack_json' | 'letterboxd_csv' | 'generic_csv'
  titles: ImportedTitleItem[]
  reviewsCount: number
  notesCount: number
  collectionsCount: number
  rawJsonData?: Record<string, unknown>
}
