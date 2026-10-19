import type { TmdbMovieDetails, TmdbTvDetails, TmdbSearchResponse } from './tmdb.schema'

export const MOCK_SEARCH_RESULTS: TmdbSearchResponse = {
  page: 1,
  total_pages: 1,
  total_results: 6,
  results: [
    {
      id: 550,
      title: 'Fight Club',
      media_type: 'movie',
      poster_path: '/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg',
      backdrop_path: '/hZkgoQYus5vegHoetLkCJzb17zJ.jpg',
      release_date: '1999-10-15',
      overview: 'A ticking-time-bomb insomniac and a slippery soap salesman channel primal male aggression into a shocking new form of therapy.',
      vote_average: 8.4,
      vote_count: 26000,
      genre_ids: [18],
    },
    {
      id: 157336,
      title: 'Interstellar',
      media_type: 'movie',
      poster_path: '/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
      backdrop_path: '/xJHokMbljvjADYdit5fK5VQsXEG.jpg',
      release_date: '2014-11-05',
      overview: 'The adventures of a group of explorers who make use of a newly discovered wormhole to surpass the limitations on human space travel.',
      vote_average: 8.4,
      vote_count: 32000,
      genre_ids: [12, 18, 878],
    },
    {
      id: 438631,
      title: 'Dune',
      media_type: 'movie',
      poster_path: '/d5NXSklXo0qyIYkgV94XAgMIckC.jpg',
      backdrop_path: '/lzWHmYdfeFiMIY4JaMmtR7GEli3.jpg',
      release_date: '2021-09-15',
      overview: "Paul Atreides, a brilliant and gifted young man born into a great destiny beyond his understanding, must travel to the most dangerous planet in the universe.",
      vote_average: 7.9,
      vote_count: 11000,
      genre_ids: [878, 12],
    },
    {
      id: 1396,
      name: 'Breaking Bad',
      media_type: 'tv',
      poster_path: '/ztkUQFLlC19CCMYHW9o1zWhJRNq.jpg',
      backdrop_path: '/9faGSFi5jam6pDWGNd0p8J2qgjr.jpg',
      first_air_date: '2008-01-20',
      overview: 'Walter White, a New Mexico chemistry teacher, is diagnosed with Stage III cancer and given a prognosis of only two years left to live.',
      vote_average: 8.9,
      vote_count: 14000,
      genre_ids: [18, 80],
    },
    {
      id: 66732,
      name: 'Stranger Things',
      media_type: 'tv',
      poster_path: '/49WJfeN0moxb9IPfGn8AIqMGskD.jpg',
      backdrop_path: '/56v2KjBlU4XaOv9rVYEQypROD7P.jpg',
      first_air_date: '2016-07-15',
      overview: 'When a young boy vanishes, a small town uncovers a mystery involving secret experiments, terrifying supernatural forces and one strange little girl.',
      vote_average: 8.6,
      vote_count: 17000,
      genre_ids: [18, 9648, 878],
    },
    {
      id: 94605,
      name: 'Arcane',
      media_type: 'tv',
      poster_path: '/fqldf2t8ztc9aiwn3k6mlX3tvRT.jpg',
      backdrop_path: '/2OMB0ynKlyIenMJWI2Dy9IWT4c.jpg',
      first_air_date: '2021-11-06',
      overview: 'Amid the stark discord of twin cities Piltover and Zaun, two sisters fight on rival sides of a war between magic technologies and incompatible convictions.',
      vote_average: 8.7,
      vote_count: 4200,
      genre_ids: [16, 10765, 18],
    },
  ],
}

export const MOCK_MOVIE_DETAILS: TmdbMovieDetails = {
  id: 550,
  title: 'Fight Club',
  original_title: 'Fight Club',
  overview: 'A ticking-time-bomb insomniac and a slippery soap salesman channel primal male aggression into a shocking new form of therapy. Their concept catches on, with underground "fight clubs" forming in every town, until an eccentric gets in the way and ignites an out-of-control spiral toward oblivion.',
  poster_path: '/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg',
  backdrop_path: '/hZkgoQYus5vegHoetLkCJzb17zJ.jpg',
  release_date: '1999-10-15',
  runtime: 139,
  vote_average: 8.43,
  vote_count: 26280,
  tagline: 'Mischief. Mayhem. Soap.',
  genres: [
    { id: 18, name: 'Drama' },
    { id: 53, name: 'Thriller' },
  ],
  credits: {
    cast: [
      { id: 819, name: 'Edward Norton', character: 'The Narrator', profile_path: '/5XBzD5WuTyVQZeS4VI25z2moMeY.jpg' },
      { id: 287, name: 'Brad Pitt', character: 'Tyler Durden', profile_path: '/cckcYc2v0yh1tc9QjRelptsqqo.jpg' },
      { id: 1283, name: 'Helena Bonham Carter', character: 'Marla Singer', profile_path: '/mW1NolxQmAUasSaqWi8fN3JqR41.jpg' },
      { id: 7470, name: 'Meat Loaf', character: 'Robert Paulson', profile_path: '/7mNs1O4Wc1kR4vO0bK78v2d51Gj.jpg' },
    ],
  },
  videos: {
    results: [
      { id: '5c9294240e0a267cd516835a', key: 'O1nDozs-Lda', name: 'Official Trailer', site: 'YouTube', type: 'Trailer' },
    ],
  },
  'watch/providers': {
    results: {
      US: {
        link: 'https://www.themoviedb.org/movie/550-fight-club/watch',
        flatrate: [
          { provider_id: 8, provider_name: 'Netflix', logo_path: '/pbpMk2JmcoNnQwx5JGpXngfoWtp.jpg' },
          { provider_id: 9, provider_name: 'Amazon Prime Video', logo_path: '/emthp39XA2AqDHujZ0Y23Xd3GQA.jpg' },
        ],
      },
    },
  },
    recommendations: {
    results: [
      {
        id: 157336,
        title: 'Interstellar',
        media_type: 'movie',
        poster_path: '/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
        backdrop_path: '/xJHokMbljvjADYdit5fK5VQsXEG.jpg',
        release_date: '2014-11-05',
        overview: 'Interstellar exploration.',
        vote_average: 8.4,
        vote_count: 32000,
        genre_ids: [18, 878],
      },
    ],
  },
  similar: {
    results: [
      {
        id: 157336,
        title: 'Interstellar',
        media_type: 'movie',
        poster_path: '/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
        backdrop_path: '/xJHokMbljvjADYdit5fK5VQsXEG.jpg',
        release_date: '2014-11-05',
        overview: 'Interstellar exploration.',
        vote_average: 8.4,
        vote_count: 32000,
        genre_ids: [18, 878],
      },
    ],
  },
  images: {
    backdrops: [
      {
        file_path: '/hZkgoQYus5vegHoetLkCJzb17zJ.jpg',
        width: 1920,
        height: 1080,
        iso_639_1: null,
        vote_average: 5.3,
        vote_count: 10,
      },
    ],
    posters: [
      {
        file_path: '/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg',
        width: 1000,
        height: 1500,
        iso_639_1: 'en',
        vote_average: 5.4,
        vote_count: 12,
      },
    ],
    logos: [],
  },
  reviews: {
    page: 1,
    total_pages: 1,
    total_results: 1,
    results: [
      {
        id: 'mock-rev-1',
        author: 'MovieBuff',
        author_details: { rating: 9 },
        content: 'An incredible classic that stands the test of time.',
        created_at: '2020-01-01T00:00:00Z',
      },
    ],
  },
}

export const MOCK_TV_DETAILS: TmdbTvDetails = {
  id: 1396,
  name: 'Breaking Bad',
  original_name: 'Breaking Bad',
  overview: 'Walter White, a New Mexico chemistry teacher, is diagnosed with Stage III cancer and given a prognosis of only two years left to live. He becomes filled with a sense of fearlessness and an unrelenting desire to secure his family’s financial future at any cost as he enters the dangerous world of drugs and crime.',
  poster_path: '/ztkUQFLlC19CCMYHW9o1zWhJRNq.jpg',
  backdrop_path: '/9faGSFi5jam6pDWGNd0p8J2qgjr.jpg',
  first_air_date: '2008-01-20',
  number_of_episodes: 62,
  number_of_seasons: 5,
  status: 'Ended',
  vote_average: 8.9,
  vote_count: 14500,
  tagline: 'Change the equation.',
  genres: [
    { id: 18, name: 'Drama' },
    { id: 80, name: 'Crime' },
  ],
  credits: {
    cast: [
      { id: 17419, name: 'Bryan Cranston', character: 'Walter White', profile_path: '/7Jahy5LZX2Fo8fGJltMreAI49hC.jpg' },
      { id: 84497, name: 'Aaron Paul', character: 'Jesse Pinkman', profile_path: '/8pvhjJk53f2nO42U95oHj44U05Z.jpg' },
      { id: 134531, name: 'Anna Gunn', character: 'Skyler White', profile_path: '/adppzygg98k86s01.jpg' },
    ],
  },
  videos: {
    results: [
      { id: 'trailer1', key: 'HhesaQXLuRY', name: 'Series Trailer', site: 'YouTube', type: 'Trailer' },
    ],
  },
  'watch/providers': {
    results: {
      US: {
        flatrate: [
          { provider_id: 8, provider_name: 'Netflix', logo_path: '/pbpMk2JmcoNnQwx5JGpXngfoWtp.jpg' },
        ],
      },
    },
  },
  recommendations: {
    results: [
      {
        id: 94605,
        name: 'Arcane',
        media_type: 'tv',
        poster_path: '/fqldf2t8ztc9aiwn3k6mlX3tvRT.jpg',
        backdrop_path: '/2OMB0ynKlyIenMJWI2Dy9IWT4c.jpg',
        first_air_date: '2021-11-06',
        overview: 'Animated fantasy.',
        vote_average: 8.7,
        vote_count: 4200,
        genre_ids: [16, 18],
      },
    ],
  },
  similar: {
    results: [
      {
        id: 94605,
        name: 'Arcane',
        media_type: 'tv',
        poster_path: '/fqldf2t8ztc9aiwn3k6mlX3tvRT.jpg',
        backdrop_path: '/2OMB0ynKlyIenMJWI2Dy9IWT4c.jpg',
        first_air_date: '2021-11-06',
        overview: 'Animated fantasy.',
        vote_average: 8.7,
        vote_count: 4200,
        genre_ids: [16, 18],
      },
    ],
  },
  images: {
    backdrops: [
      {
        file_path: '/9faGSFi5jam6pDWGNd0p8J2qgjr.jpg',
        width: 1920,
        height: 1080,
        iso_639_1: null,
        vote_average: 5.5,
        vote_count: 20,
      },
    ],
    posters: [
      {
        file_path: '/ztkUQFLlC19CCMYHW9o1zWhJRNq.jpg',
        width: 1000,
        height: 1500,
        iso_639_1: 'en',
        vote_average: 5.6,
        vote_count: 22,
      },
    ],
    logos: [],
  },
  reviews: {
    page: 1,
    total_pages: 1,
    total_results: 1,
    results: [
      {
        id: 'tv-rev-1',
        author: 'TvCritic',
        author_details: { rating: 10 },
        content: 'One of the greatest television dramas of all time.',
        created_at: '2021-01-01T00:00:00Z',
      },
    ],
  },
}
