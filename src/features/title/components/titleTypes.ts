import type { Timestamp } from 'firebase/firestore'
import type { LibraryStatus } from '@/shared/schemas'

export interface UserReview {
  id: string
  titleKey: string
  title: string
  year?: string
  rating: number
  reviewText: string
  tags: string[]
  createdAt?: Timestamp
}

export const STATUS_OPTS: { value: LibraryStatus; label: string; emoji: string; desc: string; color: string }[] = [
  { value: 'watching', label: 'Watching', emoji: '👁', desc: 'Actively watching this title', color: 'var(--status-watching, #3b82f6)' },
  { value: 'completed', label: 'Completed', emoji: '✓', desc: 'Finished watching this title', color: 'var(--status-completed, #10b981)' },
  { value: 'plan_to_watch', label: 'Plan to Watch', emoji: '🕐', desc: 'Want to watch in the future', color: 'var(--status-plan, #f59e0b)' },
  { value: 'on_hold', label: 'On Hold', emoji: '⏸', desc: 'Paused watching for now', color: 'var(--status-on-hold, #f39c12)' },
  { value: 'dropped', label: 'Dropped', emoji: '✗', desc: 'Decided to stop watching', color: 'var(--status-dropped, #ef4444)' },
]

export const TRIVIA_DATABASE: Record<number, string[]> = {
  550: [
    'Brad Pitt and Edward Norton actually learned how to make real soap for the film.',
    'The warning screen at the beginning of the movie contains a hidden message from Tyler Durden.',
    'Brad Pitt chipped his front tooth for the role to match Tyler\'s chaotic look.',
    'Fight Club\'s author, Chuck Palahniuk, has stated that he thinks the movie is an improvement on his novel.',
    'A CGI coffee cup is hidden in almost every single scene of the movie.',
  ],
  278: [
    'Though it was a box office disappointment initially, it became one of the most beloved films of all time through home rentals.',
    'The mugshots of young Red are actually photos of Morgan Freeman\'s son, Alfonso.',
    'Clint Eastwood, Harrison Ford, and Paul Newman were all considered for the role of Red.',
    'Stephen King sold the film rights to his novella for $5,600, but he never cashed the check.',
    'The iconic sewer crawl was actually done in chocolate syrup diluted with water.',
  ],
  238: [
    'Marlon Brando wanted to make Don Corleone look like a bulldog, so he wore a custom mouthpiece.',
    'Al Pacino boycotted the Academy Awards because he was nominated for Supporting Actor while Marlon Brando got Best Actor.',
    'The horse head used in the film was real; the production got it from a dog food company.',
    'The cat held by Marlon Brando in the opening scene was a stray found in the studio lot.',
    'The term "Godfather" was not widely used by actual mobsters before the book and movie popularized it.',
  ],
  155: [
    'Heath Ledger lived alone in a hotel room for a month to formulate the Joker\'s psychotic personality.',
    'This was the first comic book film to reach the billion-dollar milestone at the box office.',
    'Christopher Nolan chose to shoot several key sequences in IMAX format.',
    'Christian Bale did all of his own stunt driving during the Batpod chases.',
    'The Joker\'s makeup design was based on Ledger\'s own collaboration with makeup artists.',
  ],
  496243: [
    'It became the first non-English language film to win the Academy Award for Best Picture.',
    'The wealthy family\'s house was entirely constructed on an outdoor set by a production designer.',
    'Director Bong Joon Ho drew inspiration from his own college years working as a tutor.',
    'The famous "Jessica Song" was adapted from a real Korean school mnemonic.',
    'Bong Joon Ho initially conceived the idea as a stage play.',
  ],
  872585: [
    'No CGI was used for the recreation of the Trinity nuclear test scene.',
    'Cillian Murphy lost significant weight to match J. Robert Oppenheimer\'s famously thin physique.',
    'The film was shot on large-format IMAX film, including custom-developed black-and-white IMAX stock.',
    'Christopher Nolan\'s screenplay was uniquely written in the first-person perspective.',
    'It is the highest-grossing biographical film of all time.',
  ],
}

export const FALLBACK_PROVIDERS = [
  { name: 'Netflix', color: '#E50914' },
  { name: 'Prime Video', color: '#00A8E1' },
  { name: 'Apple TV', color: '#A3A3A3' },
  { name: 'Disney+', color: '#113CCF' },
]
