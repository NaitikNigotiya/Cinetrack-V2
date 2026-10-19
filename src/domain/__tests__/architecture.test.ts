import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

describe('Architectural Boundary Rules (Section 6)', () => {
  const pageFiles = [
    'src/features/home/components/HomePage.tsx',
    'src/features/library/components/WatchingPage.tsx',
    'src/features/library/components/WatchlistPage.tsx',
    'src/features/library/components/CompletedPage.tsx',
    'src/features/library/components/FavoritesPage.tsx',
    'src/features/history/components/HistoryPage.tsx',
    'src/features/analytics/components/AnalyticsPage.tsx',
    'src/features/collections/components/CollectionsPage.tsx',
  ]

  for (const relPath of pageFiles) {
    it(`page ${path.basename(relPath)} should not import firebase/firestore directly`, () => {
      const fullPath = path.resolve(process.cwd(), relPath)
      if (!fs.existsSync(fullPath)) {
        throw new Error(`File does not exist: ${relPath}`)
      }
      const content = fs.readFileSync(fullPath, 'utf-8')

      // Pages must read from the shared store / domain selectors rather than executing Firestore queries directly
      const importsFirestore = /from\s+['"]firebase\/firestore['"]/.test(content)
      expect(importsFirestore, `${relPath} imports firebase/firestore directly`).toBe(false)
    })
  }
})
