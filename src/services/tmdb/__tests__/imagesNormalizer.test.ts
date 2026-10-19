import { describe, it, expect } from 'vitest'
import { filterAndCapImages } from '../normalize/helpers'
import { toTitleDetails } from '../normalize/models'
import { TmdbImagesResponseSchema } from '../schemas'

describe('TMDB Images Normalizer', () => {
  const sampleBackdrops = [
    {
      aspect_ratio: 1.777,
      height: 1080,
      iso_639_1: null,
      file_path: '/backdrop1.jpg',
      vote_average: 5.384,
      vote_count: 12,
      width: 1920,
    },
    {
      aspect_ratio: 1.778,
      height: 2160,
      iso_639_1: 'en',
      file_path: '/backdrop2.jpg',
      vote_average: 6.892,
      vote_count: 34,
      width: 3840,
    },
  ]

  const samplePosters = Array.from({ length: 15 }, (_, i) => ({
    aspect_ratio: 0.667,
    height: 1500,
    iso_639_1: i % 2 === 0 ? 'en' : null,
    file_path: `/poster_${i}.jpg`,
    vote_average: i * 0.5,
    vote_count: i + 1,
    width: 1000,
  }))

  const sampleLogos = [
    {
      aspect_ratio: 2.5,
      height: 400,
      iso_639_1: 'en',
      file_path: '/logo1.png',
      vote_average: 5.1,
      vote_count: 5,
      width: 1000,
    },
  ]

  it('normalizes a real TMDB images fixture producing expected capped counts and sorting', () => {
    const rawImagesFixture = {
      backdrops: sampleBackdrops,
      posters: samplePosters,
      logos: sampleLogos,
    }

    const backdrops = filterAndCapImages(rawImagesFixture.backdrops, 12)
    const posters = filterAndCapImages(rawImagesFixture.posters, 12)
    const logos = filterAndCapImages(rawImagesFixture.logos, 12)

    expect(backdrops).toHaveLength(2)
    // Sorted by voteAverage descending (6.9 then 5.4)
    expect(backdrops[0]?.filePath).toBe('/backdrop2.jpg')
    expect(backdrops[0]?.voteAverage).toBeCloseTo(6.892)
    expect(backdrops[1]?.filePath).toBe('/backdrop1.jpg')

    // Posters capped at 12 even though 15 were provided
    expect(posters).toHaveLength(12)
    // Highest vote_average was 14 * 0.5 = 7.0
    expect(posters[0]?.filePath).toBe('/poster_14.jpg')
    expect(posters[0]?.voteAverage).toBe(7)

    expect(logos).toHaveLength(1)
    expect(logos[0]?.filePath).toBe('/logo1.png')
    expect(logos[0]?.aspectRatio).toBe(2.5)
  })

  it('drops malformed image items without emptying the list', () => {
    const mixedItems = [
      {
        file_path: '/valid1.jpg',
        width: 1920,
        height: 1080,
        vote_average: 5.2,
      },
      null, // null entry
      undefined,
      {}, // empty object
      { file_path: '' }, // empty path
      { file_path: '   ' }, // whitespace path
      {
        filePath: '/valid2.jpg', // camelCase filePath fallback
        width: 1280,
        height: 720,
        vote_average: 8.1,
      },
      { width: 500, height: 500 }, // missing file path completely
      {
        file_path: '/valid3.jpg',
        width: 800,
        height: 600,
        vote_average: 6.0,
      },
    ]

    // @ts-expect-error testing runtime malformed input tolerance
    const result = filterAndCapImages(mixedItems, 12)

    expect(result).toHaveLength(3)
    // Sorted desc by voteAverage: valid2 (8.1), valid3 (6.0), valid1 (5.2)
    expect(result.map((r) => r.filePath)).toEqual(['/valid2.jpg', '/valid3.jpg', '/valid1.jpg'])
  })

  it('parses TMDB image responses with tolerantArray schema and integrates into toTitleDetails', () => {
    const rawTmdbData = {
      id: 936075,
      title: 'Sample Movie',
      images: {
        backdrops: sampleBackdrops,
        posters: samplePosters,
        logos: sampleLogos,
      },
    }

    const parsed = TmdbImagesResponseSchema.safeParse(rawTmdbData.images)
    expect(parsed.success).toBe(true)

    const details = toTitleDetails(rawTmdbData, 'movie')
    expect(details.images.backdrops).toHaveLength(2)
    expect(details.images.posters).toHaveLength(12)
    expect(details.images.logos).toHaveLength(1)
  })
})
