import { describe, it, expect } from 'vitest'
import {
  splitCsvRow,
  parseLetterboxdCsv,
} from '../parsers/letterboxdCsvParser'
import { parseCinetrackJson } from '../parsers/cinetrackJsonParser'

describe('importParsers', () => {
  describe('splitCsvRow', () => {
    it('splits plain comma-separated values', () => {
      const row = 'Date,Name,Year,Rating'
      expect(splitCsvRow(row)).toEqual(['Date', 'Name', 'Year', 'Rating'])
    })

    it('respects quoted cells with embedded commas', () => {
      const row = '2024-01-01,"Everything Everywhere All at Once",2022,5.0'
      expect(splitCsvRow(row)).toEqual([
        '2024-01-01',
        'Everything Everywhere All at Once',
        '2022',
        '5.0',
      ])
    })

    it('handles escaped quotes inside quotes', () => {
      const row = '2023-05-10,"The ""Master"" Piece",2021,4.5'
      expect(splitCsvRow(row)).toEqual([
        '2023-05-10',
        'The "Master" Piece',
        '2021',
        '4.5',
      ])
    })
  })

  describe('parseLetterboxdCsv', () => {
    it('parses Letterboxd ratings.csv format and converts 5-star rating to 10-point scale', () => {
      const csv = `Date,Name,Year,Letterboxd URI,Rating
2024-03-01,Dune: Part Two,2024,https://letterboxd.com/film/dune-part-two/,4.5
2024-02-15,Past Lives,2023,https://letterboxd.com/film/past-lives/,5.0
2024-01-10,Poor Things,2023,https://letterboxd.com/film/poor-things/,3.5`

      const items = parseLetterboxdCsv(csv)
      expect(items).toHaveLength(3)

      expect(items[0]).toEqual({
        title: 'Dune: Part Two',
        year: 2024,
        type: 'movie',
        status: 'completed',
        rating: 9.0, // 4.5 * 2
        watchedAt: '2024-03-01',
      })

      expect(items[1]?.rating).toBe(10.0) // 5.0 * 2
      expect(items[2]?.rating).toBe(7.0) // 3.5 * 2
    })

    it('parses Letterboxd watched.csv format with no ratings', () => {
      const csv = `Date,Name,Year,Letterboxd URI
2024-04-10,Challengers,2024,https://letterboxd.com/film/challengers/`

      const items = parseLetterboxdCsv(csv)
      expect(items).toHaveLength(1)
      expect(items[0]?.title).toBe('Challengers')
      expect(items[0]?.rating).toBeNull()
    })

    it('throws when Name header is missing', () => {
      const csv = `Date,Title,Year\n2024-01-01,Test,2024`
      expect(() => parseLetterboxdCsv(csv)).toThrow('Invalid Letterboxd CSV: Missing "Name" column')
    })
  })

  describe('parseCinetrackJson', () => {
    it('parses full CineTrack backup format', () => {
      const json = JSON.stringify({
        version: '2.0',
        exportedAt: '2026-10-15T12:00:00Z',
        uid: 'test_uid',
        library: [
          {
            title: 'Inception',
            type: 'movie',
            status: 'completed',
            year: 2010,
            rating: 9.5,
          },
          {
            title: 'Severance',
            type: 'tv',
            status: 'watching',
            year: 2022,
          },
        ],
        reviews: [{ id: 'rev_1', body: 'Great' }],
        notes: [{ id: 'note_1', title: 'Watch Notes' }],
        collections: [{ id: 'col_1', name: 'Favorites' }],
      })

      const result = parseCinetrackJson(json)
      expect(result.format).toBe('cinetrack_json')
      expect(result.titles).toHaveLength(2)
      expect(result.titles[0]?.title).toBe('Inception')
      expect(result.titles[0]?.rating).toBe(9.5)
      expect(result.titles[1]?.type).toBe('tv')
      expect(result.reviewsCount).toBe(1)
      expect(result.notesCount).toBe(1)
      expect(result.collectionsCount).toBe(1)
    })

    it('throws error on malformed JSON', () => {
      expect(() => parseCinetrackJson('{ invalid json')).toThrow('Invalid JSON file format')
    })
  })
})
