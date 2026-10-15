import type { ParsedImportPayload, ImportedTitleItem } from '../importTypes'

export function parseCinetrackJson(jsonText: string): ParsedImportPayload {
  let parsed: unknown
  try {
    parsed = JSON.parse(jsonText)
  } catch {
    throw new Error('Invalid JSON file format')
  }

  if (typeof parsed !== 'object' || parsed === null) {
    throw new Error('JSON root must be an object')
  }

  const data = parsed as Record<string, unknown>

  const rawLibrary = Array.isArray(data['library']) ? data['library'] : []
  const rawReviews = Array.isArray(data['reviews']) ? data['reviews'] : []
  const rawNotes = Array.isArray(data['notes']) ? data['notes'] : []
  const rawCollections = Array.isArray(data['collections']) ? data['collections'] : []

  const titles: ImportedTitleItem[] = []

  rawLibrary.forEach((item) => {
    if (typeof item === 'object' && item !== null) {
      const entry = item as Record<string, unknown>
      const title = typeof entry['title'] === 'string' ? entry['title'] : ''
      if (!title) return

      const type = entry['type'] === 'tv' ? 'tv' : 'movie'
      const statusRaw = typeof entry['status'] === 'string' ? entry['status'] : 'completed'
      const validStatuses = ['watching', 'completed', 'plan_to_watch', 'on_hold', 'dropped'] as const
      const status = validStatuses.includes(statusRaw as (typeof validStatuses)[number])
        ? (statusRaw as (typeof validStatuses)[number])
        : 'completed'

      const year = typeof entry['year'] === 'number' ? entry['year'] : null
      const rating = typeof entry['rating'] === 'number' ? entry['rating'] : null

      titles.push({
        title,
        year,
        type,
        status,
        rating,
      })
    }
  })

  return {
    format: 'cinetrack_json',
    titles,
    reviewsCount: rawReviews.length,
    notesCount: rawNotes.length,
    collectionsCount: rawCollections.length,
    rawJsonData: data,
  }
}
