import { collection, getDocs, doc, getDoc } from 'firebase/firestore'
import { firestore } from '@/services/firebase/db'

export interface CinetrackExportData {
  version: '2.0'
  exportedAt: string
  uid: string
  library: unknown[]
  history: unknown[]
  reviews: unknown[]
  notes: unknown[]
  collections: unknown[]
  plannedWatches: unknown[]
  settings: Record<string, unknown>
}

export function downloadBlob(content: string, filename: string, mimeType: string): void {
  if (typeof document === 'undefined') return
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function escapeCsvCell(value: unknown): string {
  if (value === null || value === undefined) return ''
  const str = String(value)
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

/**
 * Exports all user data into a single round-trippable JSON file.
 */
export async function exportCinetrackJson(uid: string): Promise<CinetrackExportData> {
  const fetchCol = async (path: string) => {
    const snap = await getDocs(collection(firestore, `users/${uid}/${path}`))
    return snap.docs.map((d) => ({ ...d.data(), id: d.id }))
  }

  const [
    library,
    history,
    reviews,
    notes,
    collections,
    plannedWatches,
  ] = await Promise.all([
    fetchCol('library'),
    fetchCol('history'),
    fetchCol('reviews'),
    fetchCol('notes'),
    fetchCol('collections'),
    fetchCol('plannedWatches'),
  ])

  // Fetch settings
  const pushSnap = await getDoc(doc(firestore, `users/${uid}/settings/push`))
  const prefSnap = await getDoc(doc(firestore, `users/${uid}/settings/preferences`))

  const exportPayload: CinetrackExportData = {
    version: '2.0',
    exportedAt: new Date().toISOString(),
    uid,
    library,
    history,
    reviews,
    notes,
    collections,
    plannedWatches,
    settings: {
      push: pushSnap.exists() ? pushSnap.data() : null,
      preferences: prefSnap.exists() ? prefSnap.data() : null,
    },
  }

  const dateStr = new Date().toISOString().slice(0, 10)
  downloadBlob(
    JSON.stringify(exportPayload, null, 2),
    `cinetrack_backup_${dateStr}.json`,
    'application/json'
  )

  return exportPayload
}

/**
 * Exports the library to CSV format.
 */
export async function exportLibraryCsv(uid: string): Promise<string> {
  const snap = await getDocs(collection(firestore, `users/${uid}/library`))
  const headers = [
    'TitleKey',
    'Title',
    'Type',
    'Year',
    'Status',
    'Rating',
    'Favorite',
    'RuntimeMinutes',
    'CreatedAt',
  ]

  const rows = snap.docs.map((d) => {
    const data = d.data()
    return [
      escapeCsvCell(data['titleKey']),
      escapeCsvCell(data['title']),
      escapeCsvCell(data['type']),
      escapeCsvCell(data['year']),
      escapeCsvCell(data['status']),
      escapeCsvCell(data['rating']),
      escapeCsvCell(data['favorite'] ? 'true' : 'false'),
      escapeCsvCell(data['totalRuntimeMinutes'] || data['runtimeMinutes'] || 0),
      escapeCsvCell(data['createdAt']),
    ].join(',')
  })

  const csvContent = [headers.join(','), ...rows].join('\n')
  const dateStr = new Date().toISOString().slice(0, 10)
  downloadBlob(csvContent, `cinetrack_library_${dateStr}.csv`, 'text/csv;charset=utf-8;')

  return csvContent
}

/**
 * Exports watch history to CSV format.
 */
export async function exportHistoryCsv(uid: string): Promise<string> {
  const snap = await getDocs(collection(firestore, `users/${uid}/history`))
  const headers = [
    'TitleKey',
    'Title',
    'Type',
    'WatchedAt',
    'Season',
    'Episode',
    'EpisodeTitle',
    'RuntimeMinutes',
  ]

  const rows = snap.docs.map((d) => {
    const data = d.data()
    return [
      escapeCsvCell(data['titleKey']),
      escapeCsvCell(data['title']),
      escapeCsvCell(data['type']),
      escapeCsvCell(data['watchedAt']),
      escapeCsvCell(data['seasonNumber'] ?? data['season']),
      escapeCsvCell(data['episodeNumber'] ?? data['episode']),
      escapeCsvCell(data['episodeTitle']),
      escapeCsvCell(data['runtimeMinutes']),
    ].join(',')
  })

  const csvContent = [headers.join(','), ...rows].join('\n')
  const dateStr = new Date().toISOString().slice(0, 10)
  downloadBlob(csvContent, `cinetrack_history_${dateStr}.csv`, 'text/csv;charset=utf-8;')

  return csvContent
}
