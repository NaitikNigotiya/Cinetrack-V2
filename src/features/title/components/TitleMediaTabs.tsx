import { Film, Lightbulb } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Card } from '@/shared/ui/layout/Card'
import { EmptyStateCard } from '@/shared/ui/layout/EmptyStateCard'
import { PosterCard } from '@/shared/ui'
import { getBackdropUrl } from '@/services/tmdb/images'
import type { TitleSummary } from '@/shared/schemas/title'

export function TitleSimilarTab({ titles }: { titles: TitleSummary[] }) {
  const navigate = useNavigate()
  if (titles.length === 0) {
    return (
      <EmptyStateCard
        icon={<Film size={32} />}
        title="No Recommendations"
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
            year={item.year}
            posterPath={item.posterPath}
            rating={item.voteAverage}
            type={item.type}
            onClick={() => navigate(`/title/${item.titleKey}`)}
          />
        ))}
      </div>
    </div>
  )
}

export function TitleImagesTab({
  images,
  onSelectImage,
}: {
  images: any[]
  onSelectImage: (index: number) => void
}) {
  if (images.length === 0) {
    return (
      <EmptyStateCard
        icon={<Film size={32} />}
        title="No Backdrops"
        description="No high-resolution backdrops are currently available for this title."
      />
    )
  }
  return (
    <div className="title-images-tab-pane">
      <div className="title-backdrops-gallery-grid">
        {images.map((img: any, idx: number) => {
          const url = getBackdropUrl(img.file_path || img.filePath, 'w780')
          return (
            <div
              key={idx}
              className="title-backdrop-gallery-item"
              onClick={() => onSelectImage(idx)}
            >
              <img src={url || ''} alt={`Backdrop ${idx + 1}`} loading="lazy" />
            </div>
          )
        })}
      </div>
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
