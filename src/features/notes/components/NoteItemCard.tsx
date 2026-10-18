import { useNavigate } from 'react-router-dom'
import { Trash2, Film } from 'lucide-react'
import { Card } from '@/shared/ui/layout/Card'
import { getImageUrl } from '@/services/tmdb/images'
import type { Note, LibraryEntry } from '@/shared/schemas'

interface NoteItemCardProps {
  note: Note
  linked?: LibraryEntry | null | undefined
  onOpen: (note: Note) => void
  onDelete: (id: string) => void
}

export function NoteItemCard({ note, linked, onOpen, onDelete }: NoteItemCardProps) {
  const navigate = useNavigate()
  const poster = linked?.posterPath ? getImageUrl(linked.posterPath, 'w200') : null

  return (
    <Card
      variant="interactive"
      onClick={() => onOpen(note)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-2)',
        cursor: 'pointer',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span
          style={{
            fontSize: '11px',
            textTransform: 'uppercase',
            color: 'var(--brand-primary)',
            fontWeight: 700,
          }}
        >
          {(note as any).category || 'General'}
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation()
            if (note.id) onDelete(note.id)
          }}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: '4px',
          }}
          title="Delete note"
          type="button"
        >
          <Trash2 size={13} />
        </button>
      </div>

      <h3 style={{ fontSize: 'var(--fs-card-title)', fontWeight: 700, margin: 0 }}>
        {note.title || 'Untitled Note'}
      </h3>

      <p
        style={{
          fontSize: 'var(--fs-small)',
          color: 'var(--text-muted)',
          margin: 0,
          overflow: 'hidden',
          display: '-webkit-box',
          WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical',
        }}
      >
        {note.body}
      </p>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: 'auto',
          paddingTop: '8px',
        }}
      >
        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
          {note.updatedAt?.toDate
            ? note.updatedAt.toDate().toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
            : 'Today'}
        </span>

        {linked && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '11px',
              color: 'var(--brand-primary)',
            }}
            onClick={(e) => {
              e.stopPropagation()
              navigate(`/title/${note.titleKey}`)
            }}
            title={`Go to ${linked.title}`}
          >
            {poster ? (
              <img
                src={poster}
                alt=""
                style={{ width: '16px', height: '24px', borderRadius: '2px', objectFit: 'cover' }}
              />
            ) : (
              <Film size={12} />
            )}
            <span>{linked.title}</span>
          </div>
        )}
      </div>
    </Card>
  )
}
