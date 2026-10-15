import type { ImportedTitleItem } from '../importTypes'

/**
 * Splits a CSV line into cells while respecting quotes and escaped quotes.
 */
export function splitCsvRow(row: string): string[] {
  const result: string[] = []
  let insideQuotes = false
  let current = ''

  for (let i = 0; i < row.length; i++) {
    const char = row[i]
    if (char === '"') {
      if (insideQuotes && row[i + 1] === '"') {
        current += '"'
        i++ // Skip escaped quote
      } else {
        insideQuotes = !insideQuotes
      }
    } else if (char === ',' && !insideQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  result.push(current.trim())
  return result
}

/**
 * Parses Letterboxd CSV exports (watched.csv, ratings.csv, or diary.csv).
 */
export function parseLetterboxdCsv(csvText: string): ImportedTitleItem[] {
  const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0)
  if (lines.length < 2) return []

  const headerRow = splitCsvRow(lines[0] ?? '')
  const nameIdx = headerRow.findIndex((h) => /^name$/i.test(h))
  const yearIdx = headerRow.findIndex((h) => /^year$/i.test(h))
  const ratingIdx = headerRow.findIndex((h) => /^rating$/i.test(h))
  const dateIdx = headerRow.findIndex((h) => /^(date|watched date)$/i.test(h))

  if (nameIdx === -1) {
    throw new Error('Invalid Letterboxd CSV: Missing "Name" column')
  }

  const items: ImportedTitleItem[] = []

  for (let i = 1; i < lines.length; i++) {
    const row = splitCsvRow(lines[i] ?? '')
    const name = row[nameIdx]
    if (!name) continue

    const yearStr = yearIdx !== -1 ? row[yearIdx] : ''
    const year = yearStr ? parseInt(yearStr, 10) : null
    const validYear = year && !isNaN(year) && year > 1880 && year < 2100 ? year : null

    // Rating: Letterboxd uses 0.5 - 5.0 scale. Convert to CineTrack 10-point scale (* 2)
    let rating: number | null = null
    if (ratingIdx !== -1 && row[ratingIdx]) {
      const rawRating = parseFloat(row[ratingIdx] ?? '')
      if (!isNaN(rawRating) && rawRating > 0 && rawRating <= 5) {
        rating = Math.round(rawRating * 2 * 2) / 2 // snap to 0.5 step
      }
    }

    const watchedAt = dateIdx !== -1 ? row[dateIdx] || null : null

    items.push({
      title: name,
      year: validYear,
      type: 'movie',
      status: 'completed',
      rating,
      watchedAt,
    })
  }

  return items
}
