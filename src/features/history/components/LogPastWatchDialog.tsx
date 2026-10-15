import { useState } from 'react'
import { Timestamp } from 'firebase/firestore'
import { useAuthStore } from '@/features/auth/store/authStore'
import { logPastWatch } from '../api/historyApi'
import { makeTitleKey } from '@/shared/lib/ids'
import { Dialog, Input, Button, toast } from '@/shared/ui'

interface LogPastWatchDialogProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function LogPastWatchDialog({ isOpen, onClose, onSuccess }: LogPastWatchDialogProps) {
  const { user } = useAuthStore()
  const uid = user?.uid

  const [title, setTitle] = useState('')
  const [type, setType] = useState<'movie' | 'tv_episode'>('movie')
  const [dateStr, setDateStr] = useState(() => new Date().toISOString().slice(0, 10))
  const [runtime, setRuntime] = useState('120')
  const [rating, setRating] = useState('8')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!uid || !title.trim()) return

    setIsSubmitting(true)
    try {
      const watchedDate = new Date(`${dateStr}T12:00:00Z`)
      const titleKey = makeTitleKey(type === 'movie' ? 'movie' : 'tv', Date.now() % 1000000)
      const eventId = `manual_${Date.now()}`

      await logPastWatch(uid, {
        eventId,
        titleKey,
        title: title.trim(),
        type,
        watchedAt: Timestamp.fromDate(watchedDate),
        runtimeMinutes: parseInt(runtime, 10) || 90,
        rating: rating ? parseFloat(rating) : null,
        posterPath: null,
        genreIds: [],
      })

      toast.success(`Logged watch for "${title}"`)
      onSuccess()
      onClose()
    } catch {
      toast.error('Failed to log past watch')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Log Past Watch"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} isLoading={isSubmitting}>
            Log Watch
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <Input
          label="Title"
          placeholder="e.g. Inception"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        <div style={{ display: 'flex', gap: '1rem' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: 500, color: 'var(--text-2)', marginBottom: '4px' }}>
              Media Type
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as 'movie' | 'tv_episode')}
              style={{
                width: '100%',
                height: '42px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--surface-overlay)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-1)',
                padding: '0 12px',
              }}
            >
              <option value="movie">Movie</option>
              <option value="tv_episode">TV Episode</option>
            </select>
          </div>

          <div style={{ flex: 1 }}>
            <Input
              label="Date Watched"
              type="date"
              value={dateStr}
              onChange={(e) => setDateStr(e.target.value)}
              required
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <Input
            label="Runtime (minutes)"
            type="number"
            value={runtime}
            onChange={(e) => setRuntime(e.target.value)}
          />
          <Input
            label="Rating (0.5 - 10)"
            type="number"
            step="0.5"
            min="0.5"
            max="10"
            value={rating}
            onChange={(e) => setRating(e.target.value)}
          />
        </div>
      </form>
    </Dialog>
  )
}
