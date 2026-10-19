import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { TitleSimilarTab } from '../TitleMediaTabs'
import type { TitleSummary } from '@/shared/schemas/title'
import '../TitleDetailPage.css'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>()
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>
  )
}

describe('TitleSimilarTab Component', () => {
  const fixtureTitles: TitleSummary[] = Array.from({ length: 20 }, (_, i) => ({
    titleKey: `movie:${1000 + i}`,
    tmdbId: 1000 + i,
    type: 'movie',
    title: `Similar Movie Title ${i + 1}`,
    originalTitle: `Original Similar Movie Title ${i + 1}`,
    year: 2020 + (i % 5),
    releaseDate: `202${i % 5}-05-12`,
    posterPath: `/poster_${i}.jpg`,
    backdropPath: `/backdrop_${i}.jpg`,
    overview: `Overview for similar movie ${i + 1}`,
    genreIds: [28, 12],
    voteAverage: 7.5,
    voteCount: 150 + i * 10,
    mediaType: 'movie',
    popularity: 15.2,
    originalLanguage: 'en',
    isUnreleased: false,
  }))

  it('renders all 20 cards in a responsive poster-grid container without overflowing', () => {
    const { container } = renderWithProviders(<TitleSimilarTab titles={fixtureTitles} />)

    const grid = container.querySelector('.poster-grid')
    expect(grid).toBeTruthy()

    const cards = container.querySelectorAll('.poster-grid > *')
    expect(cards).toHaveLength(20)

    // Verify first card has title, year, rating, and add action
    const firstTitle = screen.getByText('Similar Movie Title 1')
    expect(firstTitle).toBeTruthy()

    const addButtons = screen.getAllByRole('button', { name: /\+ Add/i })
    expect(addButtons.length).toBe(20)

    // Ensure poster cards do not have unrestricted fixed width styles
    const firstCard = cards[0] as HTMLElement
    expect(firstCard.style.width).not.toBe('100%')
    expect(firstCard.style.width).not.toBe('1530px')
  })

  it('clicking card navigates to title detail page', () => {
    const { container } = renderWithProviders(<TitleSimilarTab titles={fixtureTitles} />)

    const cardLink = container.querySelector('a[href="/title/movie:1000"]')
    expect(cardLink).toBeTruthy()
    expect(cardLink?.getAttribute('href')).toBe('/title/movie:1000')
  })

  it('shows loading skeleton grid while fetching', () => {
    const { container } = renderWithProviders(<TitleSimilarTab titles={[]} isLoading={true} />)

    const loadingGrid = container.querySelector('[aria-label="Loading similar titles"]')
    expect(loadingGrid).toBeTruthy()

    const skeletons = container.querySelectorAll('.title-similar-skeleton-card')
    expect(skeletons.length).toBe(12)
  })

  it('shows empty state when list is empty', () => {
    renderWithProviders(<TitleSimilarTab titles={[]} isLoading={false} />)

    expect(screen.getByText('No similar titles found')).toBeTruthy()
    expect(
      screen.getByText('TMDB does not have similar recommendations for this title yet.')
    ).toBeTruthy()
  })

  it('shows error state with retry button on error', () => {
    const onRetry = vi.fn()
    renderWithProviders(<TitleSimilarTab titles={[]} isError={true} onRetry={onRetry} />)

    expect(screen.getByText('Could not load similar titles')).toBeTruthy()
    const retryBtn = screen.getByRole('button', { name: /retry/i })
    expect(retryBtn).toBeTruthy()
    fireEvent.click(retryBtn)
    expect(onRetry).toHaveBeenCalledTimes(1)
  })
})
