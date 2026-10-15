import { useState } from 'react'
import {
  Button,
  IconButton,
  Input,
  Badge,
  StatusBadge,
  RatingControl,
  Skeleton,
  Dialog,
  ConfirmDialog,
  PosterCard,
  Tabs,
  toast,
  ToastContainer,
} from '@/shared/ui'
import { Sun, Moon, Search, Trash2, Heart } from 'lucide-react'
import styles from './UiPlayground.module.css'

export default function UiPlayground() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  const [rating, setRating] = useState<number | null>(7.5)
  const [activeTab, setActiveTab] = useState('all')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    document.documentElement.setAttribute('data-theme', next)
    localStorage.setItem('cinetrack_theme', next)
  }

  return (
    <div className={styles.container}>
      <ToastContainer />
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>CineTrack v2 UI Playground</h1>
          <p style={{ color: 'var(--text-2)', marginTop: '4px' }}>
            Design tokens and UI primitives visual inspection & verification
          </p>
        </div>
        <Button
          variant="secondary"
          onClick={toggleTheme}
          leftIcon={theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        >
          Theme: {theme}
        </Button>
      </header>

      {/* Buttons */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Buttons & IconButtons</h2>
        <div className={styles.row}>
          <Button variant="primary">Primary Action</Button>
          <Button variant="secondary">Secondary Action</Button>
          <Button variant="ghost">Ghost Button</Button>
          <Button variant="danger">Danger Button</Button>
          <Button variant="outline">Outline Button</Button>
          <Button variant="primary" isLoading>
            Loading
          </Button>
          <IconButton
            icon={<Heart size={18} />}
            aria-label="Add to favorites"
            variant="ghost"
          />
        </div>
        <div className={styles.row}>
          <Button size="sm" variant="primary">
            Small
          </Button>
          <Button size="md" variant="primary">
            Medium
          </Button>
          <Button size="lg" variant="primary">
            Large
          </Button>
        </div>
      </section>

      {/* Inputs */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Inputs</h2>
        <div className={styles.row} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <Input
            label="Search title"
            placeholder="e.g. Fight Club, Breaking Bad..."
            startIcon={<Search size={18} />}
          />
          <Input
            label="Input with Error"
            defaultValue="invalid_value"
            error="Please enter a valid format"
          />
        </div>
      </section>

      {/* Badges & StatusBadges */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Badges & Status Badges</h2>
        <div className={styles.row}>
          <Badge variant="primary">HD 4K</Badge>
          <Badge variant="success">Ended</Badge>
          <Badge variant="warning">Upcoming</Badge>
          <Badge variant="info">TMDB 8.9</Badge>
          <Badge variant="default">Movie</Badge>
        </div>
        <div className={styles.row}>
          <StatusBadge status="watching" />
          <StatusBadge status="completed" />
          <StatusBadge status="plan_to_watch" />
          <StatusBadge status="on_hold" />
          <StatusBadge status="dropped" />
        </div>
      </section>

      {/* Rating Controls */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Rating Controls (10-point & 5-point scales)</h2>
        <div className={styles.row}>
          <div>
            <span style={{ fontSize: '13px', color: 'var(--text-3)', display: 'block', marginBottom: '4px' }}>
              10-point scale (canonical value: {rating})
            </span>
            <RatingControl value={rating} onChange={setRating} scale="ten" />
          </div>
          <div>
            <span style={{ fontSize: '13px', color: 'var(--text-3)', display: 'block', marginBottom: '4px' }}>
              5-point half-star scale
            </span>
            <RatingControl value={rating} onChange={setRating} scale="fivehalf" />
          </div>
        </div>
      </section>

      {/* Tabs */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Tabs</h2>
        <Tabs
          tabs={[
            { id: 'all', label: 'All', count: 124 },
            { id: 'watching', label: 'Watching', count: 4 },
            { id: 'plan', label: 'Plan to Watch', count: 48 },
            { id: 'completed', label: 'Completed', count: 72 },
          ]}
          activeTab={activeTab}
          onChange={setActiveTab}
        />
      </section>

      {/* Poster Cards */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Poster Cards</h2>
        <div className={styles.cardGrid}>
          <PosterCard
            title="Fight Club"
            year={1999}
            posterPath="/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg"
            status="completed"
            rating={9.0}
          />
          <PosterCard
            title="Breaking Bad"
            year={2008}
            posterPath="/ztkUQFLlC19CCMYHW9o1zWhJRNq.jpg"
            status="watching"
            progress={{ watched: 32, total: 62 }}
            rating={9.5}
          />
          <PosterCard
            title="Interstellar"
            year={2014}
            posterPath="/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg"
            status="plan_to_watch"
            rating={8.6}
          />
        </div>
      </section>

      {/* Skeletons */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Skeletons (Shimmer loaders)</h2>
        <div className={styles.row}>
          <Skeleton variant="circle" width={48} height={48} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
            <Skeleton width="60%" height={20} />
            <Skeleton width="40%" height={14} />
          </div>
        </div>
      </section>

      {/* Toasts and Dialogs */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Modals & Toasts</h2>
        <div className={styles.row}>
          <Button
            variant="primary"
            onClick={() =>
              toast.success('Removed Fight Club from library', {
                label: 'Undo',
                onClick: () => toast.info('Restored Fight Club'),
              })
            }
          >
            Trigger Toast with Undo
          </Button>
          <Button variant="secondary" onClick={() => setIsDialogOpen(true)}>
            Open Dialog
          </Button>
          <Button
            variant="danger"
            leftIcon={<Trash2 size={16} />}
            onClick={() => setIsConfirmOpen(true)}
          >
            Open Confirm Dialog
          </Button>
        </div>
      </section>

      <Dialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        title="Sample Modal Dialog"
      >
        <p>This is an accessible dialog with focus trap and Esc key support.</p>
      </Dialog>

      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={() => {
          setIsConfirmOpen(false)
          toast.success('Confirmed action successfully!')
        }}
        title="Remove Title?"
        message="Are you sure you want to remove this title from your library? Your watch history will be preserved."
        confirmText="Remove"
      />
    </div>
  )
}
