import type { LibraryEntry } from '@/shared/schemas'

export interface SmartCollection {
  id: string
  name: string
  description: string
  list: LibraryEntry[]
}

const nolanTitles = [
  'inception',
  'interstellar',
  'dark knight',
  'oppenheimer',
  'tenet',
  'memento',
  'prestige',
  'dunkirk',
  'batman begins',
]

const mcuTitles = [
  'iron man',
  'thor',
  'captain america',
  'avengers',
  'guardians of the galaxy',
  'black panther',
  'doctor strange',
  'spider-man',
  'captain marvel',
  'ant-man',
]

const ghibliTitles = [
  'spirited away',
  'totoro',
  "howl's moving castle",
  'princess mononoke',
  'grave of the fireflies',
  'ponyo',
  "kiki's delivery",
]

export function computeSmartCollections(entries: LibraryEntry[]): SmartCollection[] {
  return [
    {
      id: 'smart:nolan',
      name: 'Christopher Nolan',
      description: 'Masterpieces directed by Christopher Nolan',
      list: entries.filter((e) =>
        nolanTitles.some((t) => e.title.toLowerCase().includes(t))
      ),
    },
    {
      id: 'smart:mcu',
      name: 'Marvel Cinematic Universe',
      description: 'Blockbusters from the Marvel Cinematic Universe',
      list: entries.filter((e) =>
        mcuTitles.some((t) => e.title.toLowerCase().includes(t))
      ),
    },
    {
      id: 'smart:ghibli',
      name: 'Studio Ghibli',
      description: 'Immersive Ghibli animated features',
      list: entries.filter((e) =>
        ghibliTitles.some((t) => e.title.toLowerCase().includes(t))
      ),
    },
    {
      id: 'smart:classics',
      name: '90s Classics',
      description: 'Timeless cinematic gems from 1990-1999',
      list: entries.filter((e) => (e.year ?? 0) >= 1990 && (e.year ?? 0) <= 1999),
    },
    {
      id: 'smart:mindblowing',
      name: 'Mind-blowing Movies',
      description: 'Highly rated titles rated 9+ by you',
      list: entries.filter((e) => e.rating !== null && (e.rating ?? 0) >= 9),
    },
    {
      id: 'smart:comfort',
      name: 'Comfort Movies',
      description: 'Your favorite comfort titles rated 8+',
      list: entries.filter((e) => e.isFavorite && (e.rating ?? 0) >= 8),
    },
    {
      id: 'smart:horror',
      name: 'Weekend Horror',
      description: 'Spooky horror titles for the weekend',
      list: entries.filter((e) =>
        e.genres?.some((g) => g.name.toLowerCase().includes('horror'))
      ),
    },
  ].filter((c) => c.list.length > 0)
}
