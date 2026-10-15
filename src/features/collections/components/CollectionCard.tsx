import { Link } from 'react-router-dom'
import { getPosterUrl } from '@/shared/lib/tmdbImage'
import { IconButton } from '@/shared/ui'
import { Edit2, Trash2, Folder } from 'lucide-react'
import type { Collection } from '@/shared/schemas'
import styles from './CollectionCard.module.css'

interface CollectionCardProps {
  collection: Collection
  onEdit: (col: Collection) => void
  onDelete: (col: Collection) => void
}

export function CollectionCard({ collection, onEdit, onDelete }: CollectionCardProps) {
  const previewPosters = collection.items.slice(0, 4)

  return (
    <article className={styles.card}>
      <Link to={`/collections/${collection.id}`} className={styles.link}>
        <div className={styles.mosaic}>
          {previewPosters.length > 0 ? (
            <div className={styles.mosaicGrid}>
              {previewPosters.map((item, idx) => (
                <div key={idx} className={styles.mosaicCell}>
                  {item.posterPath ? (
                    <img
                      src={getPosterUrl(item.posterPath, 'w185') ?? ''}
                      alt={item.title}
                      className={styles.posterImg}
                      loading="lazy"
                    />
                  ) : (
                    <div className={styles.posterFallback} />
                  )}
                </div>
              ))}
              {/* Fill remaining cells if fewer than 4 */}
              {Array.from({ length: Math.max(0, 4 - previewPosters.length) }).map((_, i) => (
                <div key={`empty-${i}`} className={styles.mosaicCellEmpty} />
              ))}
            </div>
          ) : (
            <div className={styles.emptyMosaic}>
              <Folder size={40} className={styles.emptyIcon} />
            </div>
          )}
        </div>

        <div className={styles.info}>
          <div className={styles.titleRow}>
            <span className={styles.emoji}>{collection.emoji || '🎬'}</span>
            <h3 className={styles.name}>{collection.name}</h3>
          </div>
          <p className={styles.count}>
            {collection.items.length} {collection.items.length === 1 ? 'title' : 'titles'}
          </p>
          {collection.description && (
            <p className={styles.desc}>{collection.description}</p>
          )}
        </div>
      </Link>

      <div className={styles.actions}>
        <IconButton
          icon={<Edit2 size={16} />}
          aria-label={`Edit ${collection.name}`}
          onClick={(e) => {
            e.preventDefault()
            onEdit(collection)
          }}
        />
        <IconButton
          icon={<Trash2 size={16} />}
          aria-label={`Delete ${collection.name}`}
          onClick={(e) => {
            e.preventDefault()
            onDelete(collection)
          }}
        />
      </div>
    </article>
  )
}
