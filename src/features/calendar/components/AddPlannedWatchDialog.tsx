import { useState } from 'react'
import { Dialog, Button, Input } from '@/shared/ui'
import { toast } from '@/shared/ui'
import { savePlannedWatch } from '../api/calendarApi'
import styles from './AddPlannedWatchDialog.module.css'

interface AddPlannedWatchDialogProps {
  isOpen: boolean
  onClose: () => void
  uid: string
  titleKey: string
  title: string
  posterPath: string | null
  type: 'movie' | 'tv'
  initialDate?: string // YYYY-MM-DD
  onSaved?: () => void
}

export function AddPlannedWatchDialog({
  isOpen,
  onClose,
  uid,
  titleKey,
  title,
  posterPath,
  type,
  initialDate,
  onSaved,
}: AddPlannedWatchDialogProps) {
  const todayStr = () => new Date().toISOString().slice(0, 10)

  const [date, setDate] = useState(() => initialDate || todayStr())
  const [time, setTime] = useState('20:00')
  const [note, setNote] = useState('')
  const [reminder, setReminder] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    if (!date) {
      toast.error('Please pick a date.')
      return
    }

    setIsSaving(true)
    try {
      await savePlannedWatch(uid, {
        titleKey,
        title,
        posterPath,
        type,
        plannedFor: date,
        plannedTime: time || undefined,
        note: note.trim() || undefined,
        reminder,
      })
      toast.success(`Planned watch scheduled!`)
      onSaved?.()
      onClose()
    } catch {
      toast.error('Failed to schedule planned watch.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title={`Plan to Watch: ${title}`}>
      <div className={styles.form}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="planned-date">
            Date
          </label>
          <input
            id="planned-date"
            type="date"
            className={styles.dateInput}
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="planned-time">
            Time (optional)
          </label>
          <input
            id="planned-time"
            type="time"
            className={styles.dateInput}
            value={time}
            onChange={(e) => setTime(e.target.value)}
          />
        </div>

        <Input
          label="Note (e.g. Movie night with friends)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Optional note"
          maxLength={500}
        />

        <div className={styles.reminderRow}>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={reminder}
              onChange={(e) => setReminder(e.target.checked)}
              className={styles.checkbox}
            />
            Remind me before watch time
          </label>
        </div>

        <div className={styles.actions}>
          <Button variant="secondary" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Scheduling...' : 'Schedule Watch'}
          </Button>
        </div>
      </div>
    </Dialog>
  )
}
