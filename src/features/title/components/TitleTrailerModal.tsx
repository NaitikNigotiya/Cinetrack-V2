import { Dialog } from '@/shared/ui'

interface TitleTrailerModalProps {
  isOpen: boolean
  onClose: () => void
  videoKey?: string
  title: string
}

export function TitleTrailerModal({
  isOpen,
  onClose,
  videoKey,
  title,
}: TitleTrailerModalProps) {
  if (!videoKey) return null

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title={`${title} — Trailer`}>
      <div
        style={{
          position: 'relative',
          paddingBottom: '56.25%', // 16:9 aspect ratio
          height: 0,
          overflow: 'hidden',
          borderRadius: 'var(--radius-md)',
          backgroundColor: '#000000',
        }}
      >
        {isOpen && (
          <iframe
            src={`https://www.youtube.com/embed/${videoKey}?autoplay=1`}
            title={`${title} Trailer`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              border: 0,
            }}
          />
        )}
      </div>
    </Dialog>
  )
}
