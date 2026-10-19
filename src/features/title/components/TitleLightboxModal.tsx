import { useEffect, useRef } from 'react'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import { getBackdropUrl, getPosterUrl, getImageUrl } from '@/services/tmdb/images'

export interface LightboxImageItem {
  filePath: string
  group?: 'backdrop' | 'poster' | 'logo' | string
  width?: number
  height?: number
  aspectRatio?: number
  file_path?: string
}

interface TitleLightboxModalProps {
  lightboxIndex: number | null
  setLightboxIndex: (idx: number | null) => void
  images: LightboxImageItem[]
}

export function TitleLightboxModal({
  lightboxIndex,
  setLightboxIndex,
  images,
}: TitleLightboxModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const closeBtnRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (lightboxIndex === null || images.length === 0) return

    // Auto focus close button on open
    closeBtnRef.current?.focus()

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        setLightboxIndex(null)
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        setLightboxIndex((lightboxIndex - 1 + images.length) % images.length)
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        setLightboxIndex((lightboxIndex + 1) % images.length)
      } else if (e.key === 'Tab') {
        // Focus trap inside lightbox dialog
        const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
        if (!focusable || focusable.length === 0) return

        const first = focusable[0]
        const last = focusable[focusable.length - 1]

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last?.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first?.focus()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [lightboxIndex, images.length, setLightboxIndex])

  if (lightboxIndex === null || !images[lightboxIndex]) return null

  const currentImg = images[lightboxIndex]
  const path = currentImg.filePath || currentImg.file_path || ''
  const isPoster = currentImg.group === 'poster'

  const fullUrl = isPoster
    ? getPosterUrl(path, 'original') || getImageUrl(path, 'original')
    : getBackdropUrl(path, 'original') || getImageUrl(path, 'original')

  return (
    <div
      className="title-lightbox-overlay"
      onClick={() => setLightboxIndex(null)}
      role="dialog"
      aria-modal="true"
      aria-label="Image Lightbox"
      ref={dialogRef}
    >
      <button
        ref={closeBtnRef}
        className="title-lightbox-close-btn"
        onClick={() => setLightboxIndex(null)}
        type="button"
        aria-label="Close lightbox"
      >
        <X size={20} />
      </button>

      <div className="title-lightbox-dialog" onClick={(e) => e.stopPropagation()}>
        <img
          src={fullUrl || ''}
          alt={`Gallery item ${lightboxIndex + 1}`}
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
