import { Link } from 'react-router-dom'
import { IconButton } from '@/shared/ui'
import { Pin, Edit2, Trash2, Film } from 'lucide-react'
import { MarkdownLite } from './MarkdownLite'
import type { Note } from '@/shared/schemas'
import styles from './NoteCard.module.css'

interface NoteCardProps {
  note: Note
  onTogglePin: (note: Note) => void
  onEdit: (note: Note) => void
  onDelete: (note: Note) => void
}

export function NoteCard({ note, onTogglePin, onEdit, onDelete }: NoteCardProps) {
  return (
    <article className={`${styles.card} ${note.pinned ? styles.pinnedCard : ''}`}>
      <div className={styles.header}>
        <div className={styles.titleArea}>
          {note.titleKey && note.title ? (
            <Link to={`/title/${note.titleKey}`} className={styles.titleLink}>
              <Film size={14} />
              <span>{note.title}</span>
            </Link>
          ) : (
            <span className={styles.generalBadge}>General Note</span>
          )}
        </div>

        <div className={styles.actions}>
          <IconButton
            icon={<Pin size={16} fill={note.pinned ? 'currentColor' : 'none'} />}
            aria-label={note.pinned ? 'Unpin note' : 'Pin note'}
            onClick={() => onTogglePin(note)}
            className={note.pinned ? styles.pinnedIcon : undefined}
          />
          <IconButton
            icon={<Edit2 size={16} />}
            aria-label="Edit note"
            onClick={() => onEdit(note)}
          />
          <IconButton
            icon={<Trash2 size={16} />}
            aria-label="Delete note"
            onClick={() => onDelete(note)}
          />
        </div>
      </div>

      <div className={styles.body}>
        <MarkdownLite content={note.body} />
      </div>
    </article>
  )
}
