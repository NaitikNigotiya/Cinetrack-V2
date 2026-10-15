import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button, PosterCard, Skeleton } from '@/shared/ui'
import { SurpriseMeDialog } from './SurpriseMeDialog'
import { Sparkles } from 'lucide-react'
import type { LibraryEntry } from '@/shared/schemas'
import styles from './PlanShortlistSection.module.css'

interface PlanShortlistSectionProps {
  entries: LibraryEntry[]
  isLoading?: boolean
}

export function PlanShortlistSection({ entries, isLoading }: PlanShortlistSectionProps) {
  const [isSurpriseOpen, setIsSurpriseOpen] = useState(false)

  const planTitles = entries.filter((e) => e.status === 'plan_to_watch').slice(0, 8)

  if (isLoading) {
    return (
      <section className={styles.section}>
        <div className={styles.header}>
          <Skeleton width={180} height={28} />
        </div>
        <div className={styles.row}>
          <Skeleton width={140} height={210} />
          <Skeleton width={140} height={210} />
          <Skeleton width={140} height={210} />
        </div>
      </section>
    )
  }

  if (planTitles.length === 0) {
    return null
  }

  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <div className={styles.titleInfo}>
          <h2 className={styles.title}>Up Next: Plan to Watch</h2>
          <Link to="/library?status=plan_to_watch" className={styles.viewAll}>
            View all ({entries.filter((e) => e.status === 'plan_to_watch').length})
          </Link>
        </div>

        <Button
          variant="secondary"
          size="sm"
          startIcon={<Sparkles size={16} />}
          onClick={() => setIsSurpriseOpen(true)}
        >
          Surprise Me
        </Button>
      </div>

      <div className={styles.row}>
        {planTitles.map((entry) => (
          <div key={entry.titleKey} className={styles.cardWrapper}>
            <PosterCard
              title={entry.title}
              posterPath={entry.posterPath}
              year={entry.year ?? undefined}
              type={entry.type}
              rating={entry.rating ?? undefined}
              detailHref={`/title/${entry.titleKey}`}
            />
          </div>
        ))}
      </div>

      <SurpriseMeDialog
        isOpen={isSurpriseOpen}
        onClose={() => setIsSurpriseOpen(false)}
        candidates={entries.filter((e) => e.status === 'plan_to_watch')}
      />
    </section>
  )
}
