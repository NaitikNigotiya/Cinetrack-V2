import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import { getBackdropUrl } from '@/services/tmdb/images'

interface TitleLightboxModalProps {
  lightboxIndex: number | null
  setLightboxIndex: (idx: number | null) => void
  images: any[]
}

export function TitleLightboxModal({
  lightboxIndex,
  setLightboxIndex,
  images,
}: TitleLightboxModalProps) {
  if (lightboxIndex === null || !images[lightboxIndex]) return null

  return (
    <div className="title-lightbox-overlay" onClick={() => setLightboxIndex(null)}>
      <button
        className="title-lightbox-close-btn"
        onClick={() => setLightboxIndex(null)}
        type="button"
        aria-label="Close lightbox"
      >
        <X size={20} />
      </button>

      <div className="title-lightbox-dialog" onClick={(e) => e.stopPropagation()}>
        <img
          src={getBackdropUrl(images[lightboxIndex].file_path || images[lightboxIndex].filePath, 'original') || ''}
          alt="Backdrop Lightbox"
          className="title-lightbox-img"
        />

        {images.length > 1 && (
          <div className="title-lightbox-controls">
            <button
              type="button"
              className="title-lightbox-nav-btn"
              onClick={() => setLightboxIndex((lightboxIndex - 1 + images.length) % images.length)}
              aria-label="Previous image"
            >
              <ChevronLeft size={18} /> Prev
            </button>
            <span className="title-lightbox-index-text">
              {lightboxIndex + 1} / {images.length}
            </span>
            <button
              type="button"
              className="title-lightbox-nav-btn"
              onClick={() => setLightboxIndex((lightboxIndex + 1) % images.length)}
              aria-label="Next image"
            >
              Next <ChevronRight size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
