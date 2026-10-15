import { describe, it, expect } from 'vitest'
import {
  toTitleSummary,
  toTitleSummaryList,
  toTitleDetails,
  toEpisode,
} from '../normalize/models'
import {
  parseYear,
  roundVoteAverage,
  computeMedian,
  pickBestTrailer,
  filterAndCapImages,
  extractCertification,
  isTitleUnreleased,
} from '../normalize/helpers'
import { buildLibraryEntryFromTitle, isMetadataStale } from '../libraryMapping'
import { Timestamp } from 'firebase/firestore'

describe('Section 5.1 Normalisation Rules', () => {
  it('rule 1 & 2: titleKey and Title mapping (movies use title, TV uses name)', () => {
    const movieSummary = toTitleSummary({ id: 550, title: 'Fight Club', original_title: 'Fight Club Orig' }, 'movie')
    expect(movieSummary?.titleKey).toBe('movie:550')
    expect(movieSummary?.title).toBe('Fight Club')
    expect(movieSummary?.originalTitle).toBe('Fight Club Orig')

    const tvSummary = toTitleSummary({ id: 1396, name: 'Breaking Bad', original_name: 'Breaking Bad Orig' }, 'tv')
    expect(tvSummary?.titleKey).toBe('tv:1396')
    expect(tvSummary?.title).toBe('Breaking Bad')
    expect(tvSummary?.originalTitle).toBe('Breaking Bad Orig')
  })

  it('rule 3: year extraction never returns NaN, 0, or invalid dates', () => {
    expect(parseYear('2024-03-01')).toBe(2024)
    expect(parseYear('1999-10-15')).toBe(1999)
    expect(parseYear('')).toBeNull()
    expect(parseYear('invalid-date')).toBeNull()
    expect(parseYear(null)).toBeNull()
    expect(parseYear(undefined)).toBeNull()
    expect(parseYear('0000-01-01')).toBeNull()
  })

  it('rule 4: voteAverage rounds to 1 decimal and returns null when voteCount === 0', () => {
    expect(roundVoteAverage(8.46, 100)).toBe(8.5)
    expect(roundVoteAverage(7.123, 50)).toBe(7.1)
    expect(roundVoteAverage(9.0, 0)).toBeNull()
    expect(roundVoteAverage(null, 100)).toBeNull()
  })

  it('rule 5: runtime for movies (0 treated as null) and TV median runtime', () => {
    const movieDetails = toTitleDetails(
      { id: 101, title: 'Zero Runtime', runtime: 0, vote_count: 10 },
      'movie'
    )
    expect(movieDetails.runtimeMinutes).toBeNull()

    const validMovie = toTitleDetails(
      { id: 102, title: 'Valid Runtime', runtime: 125, vote_count: 10 },
      'movie'
    )
    expect(validMovie.runtimeMinutes).toBe(125)

    // TV median calculation from episode_run_time[]
    expect(computeMedian([45, 50, 55])).toBe(50)
    expect(computeMedian([40, 60])).toBe(50)
    expect(computeMedian([])).toBeNull()

    const tvDetails = toTitleDetails(
      { id: 201, name: 'Show', episode_run_time: [42, 48, 45], vote_count: 5 },
      'tv'
    )
    expect(tvDetails.runtimeMinutes).toBe(45)
  })

  it('rule 6: TV episode counts calculate progress from seasons > 0', () => {
    const tvDetails = toTitleDetails(
      {
        id: 1396,
        name: 'Show With Specials',
        number_of_episodes: 65,
        seasons: [
          { season_number: 0, name: 'Specials', episode_count: 5 },
          { season_number: 1, name: 'Season 1', episode_count: 7 },
          { season_number: 2, name: 'Season 2', episode_count: 13 },
        ],
      },
      'tv'
    )
    // Progress episodes = 7 + 13 = 20 (excluding Specials)
    expect(tvDetails.tv?.totalEpisodes).toBe(20)
    expect(tvDetails.tv?.seasons[0]?.name).toBe('Specials')
  })

  it('rule 7: certification fallback order (user region, then US, else null)', () => {
    const movieReleaseDates = {
      results: {
        IN: { release_dates: [{ certification: 'UA', type: 3 }] },
        US: { release_dates: [{ certification: 'PG-13', type: 3 }] },
      },
    }
    expect(extractCertification(movieReleaseDates, null, 'movie', 'IN')).toBe('UA')
    expect(extractCertification(movieReleaseDates, null, 'movie', 'FR')).toBe('PG-13') // Fallback to US

    const tvContentRatings = {
      results: [
        { iso_3166_1: 'US', rating: 'TV-MA' },
        { iso_3166_1: 'GB', rating: '15' },
      ],
    }
    expect(extractCertification(null, tvContentRatings, 'tv', 'GB')).toBe('15')
    expect(extractCertification(null, tvContentRatings, 'tv', 'JP')).toBe('TV-MA')
  })

  it('rule 8: trailer pick prioritizes official YouTube Trailer in user language', () => {
    const videos = [
      { key: 'teaser1', site: 'YouTube', type: 'Teaser', official: true, published_at: '2023-01-01' },
      { key: 'trailer_unofficial', site: 'YouTube', type: 'Trailer', official: false, published_at: '2023-05-01' },
      { key: 'trailer_official', site: 'YouTube', type: 'Trailer', official: true, iso_639_1: 'en', published_at: '2023-06-01' },
    ]
    expect(pickBestTrailer(videos, 'en')).toBe('trailer_official')
    expect(pickBestTrailer([{ key: 'vimeo1', site: 'Vimeo', type: 'Trailer' }])).toBeNull()
  })

  it('rule 9 & 10: cast top 12 sorted by order and crew filtered for key roles', () => {
    const rawCast = Array.from({ length: 20 }, (_, i) => ({
      id: i + 1,
      name: `Actor ${i + 1}`,
      order: 20 - i, // Reverse order
    }))
    const rawCrew = [
      { id: 101, name: 'Director A', job: 'Director' },
      { id: 102, name: 'Writer B', job: 'Screenplay' },
      { id: 103, name: 'Gaffer C', job: 'Gaffer' }, // Should be dropped
    ]

    const details = toTitleDetails(
      { id: 50, title: 'Cast Crew Test', credits: { cast: rawCast, crew: rawCrew } },
      'movie'
    )
    expect(details.cast).toHaveLength(12)
    expect(details.cast[0]?.order).toBe(1) // Sorted ascending
    expect(details.crew).toHaveLength(2)
    expect(details.crew.map((c) => c.name)).toEqual(['Director A', 'Writer B'])
  })

  it('rule 12: images filtered and capped at 12 sorted by vote_average desc', () => {
    const rawImages = Array.from({ length: 20 }, (_, i) => ({
      file_path: `/img${i}.jpg`,
      width: 500,
      height: 750,
      vote_average: i,
    }))
    const capped = filterAndCapImages(rawImages, 12)
    expect(capped).toHaveLength(12)
    expect(capped[0]?.voteAverage).toBe(19) // Highest vote_average first
  })

  it('rule 13 & 14: overview fallback and empty strings converted to null', () => {
    const details = toTitleDetails(
      {
        id: 77,
        title: 'Empty Fields Title',
        overview: '',
        tagline: '',
        homepage: '   ',
        imdb_id: '',
      },
      'movie',
      { fallbackEnglishOverview: 'English fallback overview.' }
    )
    expect(details.overview).toBe('English fallback overview.')
    expect(details.tagline).toBeNull()
    expect(details.homepage).toBeNull()
    expect(details.imdbId).toBeNull()
  })

  it('rule 15: list de-duplication and recommendation dropping of empty items', () => {
    const items = [
      { id: 1, title: 'Item 1', poster_path: '/poster1.jpg' },
      { id: 1, title: 'Item 1 Duplicate', poster_path: '/poster1.jpg' },
      { id: 2, title: 'No Poster No Overview', poster_path: null, overview: '' },
      { id: 3, title: 'Item 3 With Overview', poster_path: null, overview: 'Has text' },
    ]

    // In recommendations: item 2 (no poster, no overview) is dropped
    const recs = toTitleSummaryList(items, 'movie', true)
    expect(recs).toHaveLength(2)
    expect(recs.map((r) => r.tmdbId)).toEqual([1, 3])

    // In regular search: item 2 is kept so obscure titles can be found
    const searchResults = toTitleSummaryList(items, 'movie', false)
    expect(searchResults).toHaveLength(3)
  })

  it('rule 16: isUnreleased flags future release date or missing release date', () => {
    expect(isTitleUnreleased(null)).toBe(true)
    expect(isTitleUnreleased('2099-01-01')).toBe(true)
    expect(isTitleUnreleased('1999-10-15')).toBe(false)
  })

  it('rule 17: Episode normalisation sets isAired based on airDate', () => {
    const airedEp = toEpisode({ episode_number: 1, season_number: 1, name: 'Pilot', air_date: '2008-01-20' })
    expect(airedEp.isAired).toBe(true)

    const futureEp = toEpisode({ episode_number: 2, season_number: 1, name: 'Future', air_date: '2099-01-01' })
    expect(futureEp.isAired).toBe(false)
  })
})

describe('Section 5.2 & 5.3 Library Mapping & Metadata Refresh', () => {
  it('builds library entry from TitleDetails storing image paths and never full URLs', () => {
    const details = toTitleDetails(
      {
        id: 550,
        title: 'Fight Club',
        poster_path: '/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg',
        backdrop_path: '/hZkgoQYus5vegHoetLkCJzb17zJ.jpg',
        release_date: '1999-10-15',
        runtime: 139,
        genres: [{ id: 18, name: 'Drama' }],
      },
      'movie'
    )

    const entry = buildLibraryEntryFromTitle(details, 'plan_to_watch')
    expect(entry.titleKey).toBe('movie:550')
    expect(entry.title).toBe('Fight Club')
    expect(entry.posterPath).toBe('/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg')
    expect(entry.posterPath).not.toContain('https://')
    expect(entry.backdropPath).toBe('/hZkgoQYus5vegHoetLkCJzb17zJ.jpg')
    expect(entry.runtimeMinutes).toBe(139)
    expect(entry.status).toBe('plan_to_watch')
    expect(entry.watchCount).toBe(0)
  })

  it('checks metadata staleness correctly for details and returning series tracker', () => {
    const eightDaysAgo = Timestamp.fromMillis(Date.now() - 8 * 24 * 60 * 60 * 1000)
    const twoDaysAgo = Timestamp.fromMillis(Date.now() - 2 * 24 * 60 * 60 * 1000)
    const thirteenHoursAgo = Timestamp.fromMillis(Date.now() - 13 * 60 * 60 * 1000)

    const staleEntry = { updatedAt: eightDaysAgo } as never
    expect(isMetadataStale(staleEntry, 'detail')).toBe(true)

    const freshEntry = { updatedAt: twoDaysAgo } as never
    expect(isMetadataStale(freshEntry, 'detail')).toBe(false)

    // Returning Series tracker checks 12-hour threshold
    const returningSeries = {
      updatedAt: thirteenHoursAgo,
      tv: { tmdbStatus: 'Returning Series' },
    } as never
    expect(isMetadataStale(returningSeries, 'tracker')).toBe(true)
  })
})
