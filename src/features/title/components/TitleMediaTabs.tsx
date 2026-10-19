import { Film, Lightbulb, Image as ImageIcon, RotateCcw } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Card } from '@/shared/ui/layout/Card'
import { Button } from '@/shared/ui/Button/Button'
import { EmptyStateCard } from '@/shared/ui/layout/EmptyStateCard'
import { PosterCard } from '@/shared/ui'
import { getBackdropUrl, getPosterUrl, getImageUrl } from '@/services/tmdb/images'
import type { TitleSummary, ImageRef } from '@/shared/schemas/title'

export function TitleSimilarTab({
  titles,
  isLoading = false,
  isError = false,
  onRetry,
  onAddTitle,
}: {
  titles: TitleSummary[]
  isLoading?: boolean
  isError?: boolean
  onRetry?: () => void
  onAddTitle?: (title: TitleSummary) => void
}) {
  const navigate = useNavigate()

  if (isLoading) {
    return (
      <div className="title-similar-tab-pane">
        <div className="poster-grid" role="status" aria-label="Loading similar titles">
          {Array.from({ length: 12 }).map((_, idx) => (
            <div key={idx} className="title-similar-skeleton-card">
              <div className="title-similar-skeleton-poster title-skeleton" />
              <div className="title-similar-skeleton-text title-skeleton" />
              <div className="title-similar-skeleton-sub title-skeleton" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <EmptyStateCard
        icon={<Film size={32} />}
        title="Could not load similar titles"
        description="There was an issue fetching recommendations from TMDB."
        action={
          onRetry && (
            <Button variant="secondary" leftIcon={<RotateCcw size={15} />} onClick={onRetry}>
              Retry
            </Button>
          )
        }
      />
    )
  }

  if (titles.length === 0) {
    return (
      <EmptyStateCard
        icon={<Film size={32} />}
        title="No similar titles found"
        description="TMDB does not have similar recommendations for this title yet."
      />
    )
  }

  return (
    <div className="title-similar-tab-pane">
      <div className="poster-grid">
        {titles.map((item) => (
          <PosterCard
            key={item.titleKey}
            title={item.title}
            titleKey={item.titleKey}
            detailHref={`/title/${item.titleKey}`}
            year={item.year}
            posterPath={item.posterPath}
            rating={item.voteAverage}
            type={item.type}
            showAddButton={true}
            onAddClick={() => onAddTitle?.(item)}
            onClick={() => navigate(`/title/${item.titleKey}`)}
          />
        ))}
      </div>
    </div>
  )
}

export interface TitleImagesTabProps {
  images: {
    backdrops?: ImageRef[]
    posters?: ImageRef[]
    logos?: ImageRef[]
  } | ImageRef[]
  onSelectImage: (index: number) => void
}

export function TitleImagesTab({ images, onSelectImage }: TitleImagesTabProps) {
  // Support both multi-group object and legacy array
  const isGrouped = images && typeof images === 'object' && !Array.isArray(images)

  const backdrops = isGrouped ? (images.backdrops || []).slice(0, 12) : (Array.isArray(images) ? images.slice(0, 12) : [])
  const posters = isGrouped ? (images.posters || []).slice(0, 12) : []
  const logos = isGrouped ? (images.logos || []).slice(0, 12) : []

  const totalCount = backdrops.length + posters.length + logos.length

  if (totalCount === 0) {
    return (
      <EmptyStateCard
        icon={<ImageIcon size={32} />}
        title="No Images Available"
        description="No high-resolution posters, backdrops, or logos are currently available for this title."
      />
    )
  }

  // Precompute global indexes for seamless lightbox navigation across groups
  const backdropOffset = 0
  const posterOffset = backdrops.length
  const logoOffset = backdrops.length + posters.length

  return (
    <div className="title-images-tab-container">
      {/* 1. Backdrops Group (16:9) */}
      {backdrops.length > 0 && (
        <section className="title-image-group-section">
          <div className="title-image-group-header">
            <h3 className="title-image-group-title">Backdrops</h3>
            <span className="title-image-group-count">{backdrops.length} image{backdrops.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="title-backdrops-gallery-grid">
            {backdrops.map((img, idx) => {
              const path = img.filePath || (img as any).file_path
              const url = getBackdropUrl(path, 'w780') || getImageUrl(path, 'w780')
              return (
                <div
                  key={`backdrop-${idx}`}
                  className="title-backdrop-gallery-item"
                  onClick={() => onSelectImage(backdropOffset + idx)}
                  role="button"
                  tabIndex={0}
                  aria-label={`View backdrop ${idx + 1}`}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      onSelectImage(backdropOffset + idx)
                    }
                  }}
                >
                  <img src={url || ''} alt={`Backdrop ${idx + 1}`} loading="lazy" />
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* 2. Posters Group (2:3) */}
      {posters.length > 0 && (
        <section className="title-image-group-section">
          <div className="title-image-group-header">
            <h3 className="title-image-group-title">Posters</h3>
            <span className="title-image-group-count">{posters.length} image{posters.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="title-posters-gallery-grid">
            {posters.map((img, idx) => {
              const path = img.filePath || (img as any).file_path
              const url = getPosterUrl(path, 'w780') || getImageUrl(path, 'w780')
              return (
                <div
                  key={`poster-${idx}`}
                  className="title-poster-gallery-item"
                  onClick={() => onSelectImage(posterOffset + idx)}
                  role="button"
                  tabIndex={0}
                  aria-label={`View poster ${idx + 1}`}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      onSelectImage(posterOffset + idx)
                    }
                  }}
                >
                  <img src={url || ''} alt={`Poster ${idx + 1}`} loading="lazy" />
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* 3. Logos Group (Contain) */}
      {logos.length > 0 && (
        <section className="title-image-group-section">
          <div className="title-image-group-header">
            <h3 className="title-image-group-title">Logos</h3>
            <span className="title-image-group-count">{logos.length} image{logos.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="title-logos-gallery-grid">
            {logos.map((img, idx) => {
              const path = img.filePath || (img as any).file_path
              const url = getBackdropUrl(path, 'w780') || getPosterUrl(path, 'w780') || getImageUrl(path, 'w780')
              return (
                <div
                  key={`logo-${idx}`}
                  className="title-logo-gallery-item"
                  onClick={() => onSelectImage(logoOffset + idx)}
                  role="button"
                  tabIndex={0}
                  aria-label={`View logo ${idx + 1}`}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      onSelectImage(logoOffset + idx)
                    }
                  }}
                >
                  <img src={url || ''} alt={`Logo ${idx + 1}`} loading="lazy" />
                </div>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}

export function TitleTriviaTab({ triviaList }: { triviaList: string[] }) {
  return (
    <div className="title-trivia-tab-pane">
      <div className="title-trivia-stack">
        {triviaList.map((fact, idx) => (
          <Card key={idx} className="title-trivia-card">
            <div className="title-trivia-icon-pill">
              <Lightbulb size={18} />
            </div>
            <div className="title-trivia-body">
              <span className="title-trivia-index">FACT #{idx + 1}</span>
              <p className="title-trivia-text">{fact}</p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
