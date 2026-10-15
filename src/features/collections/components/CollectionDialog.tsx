import { useState } from 'react'
import { Dialog, Button, Input } from '@/shared/ui'
import { toast } from '@/shared/ui'
import { saveCollection } from '../api/collectionsApi'
import type { Collection } from '@/shared/schemas'
import styles from './CollectionDialog.module.css'

const SUGGESTED_EMOJIS = ['🎬', '🍿', '🔥', '❤️', '⭐', '📺', '🚀', '👻', '🏆', '🌙']

interface CollectionDialogProps {
  isOpen: boolean
  onClose: () => void
  uid: string
  initialCollection?: Collection | null
  onSaved?: () => void
}

export function CollectionDialog({
  isOpen,
  onClose,
  uid,
  initialCollection,
  onSaved,
}: CollectionDialogProps) {
  const [name, setName] = useState(initialCollection?.name ?? '')
  const [description, setDescription] = useState(initialCollection?.description ?? '')
  const [emoji, setEmoji] = useState(initialCollection?.emoji ?? '🎬')
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Collection name is required.')
      return
    }
    if (name.length > 80) {
      toast.error('Collection name must be 80 characters or fewer.')
      return
    }
    if (description.length > 500) {
      toast.error('Description must be 500 characters or fewer.')
      return
    }

    setIsSaving(true)
    try {
      await saveCollection(uid, {
        id: initialCollection?.id,
        name: name.trim(),
        description: description.trim(),
        emoji,
      })
      toast.success(initialCollection?.id ? 'Collection updated!' : 'Collection created!')
      onSaved?.()
      onClose()
    } catch {
      toast.error('Failed to save collection.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={initialCollection?.id ? 'Edit Collection' : 'New Collection'}
    >
      <div className={styles.form}>
        <div>
          <label className={styles.label}>Choose Emoji</label>
          <div className={styles.emojiRow}>
            {SUGGESTED_EMOJIS.map((em) => (
              <button
                key={em}
                type="button"
                className={`${styles.emojiBtn} ${emoji === em ? styles.activeEmoji : ''}`}
                onClick={() => setEmoji(em)}
              >
                {em}
              </button>
            ))}
          </div>
        </div>

        <Input
          label="Collection Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Nolan Masterpieces, Cozy Sunday TV"
          maxLength={80}
        />

        <div className={styles.field}>
          <div className={styles.labelRow}>
            <label className={styles.label} htmlFor="col-desc">
              Description (optional)
            </label>
            <span className={styles.counter}>{description.length} / 500</span>
          </div>
          <textarea
            id="col-desc"
            className={styles.textarea}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add an optional note about what belongs in this list..."
            rows={3}
            maxLength={500}
          />
        </div>

        <div className={styles.actions}>
          <Button variant="secondary" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : initialCollection?.id ? 'Save Changes' : 'Create Collection'}
          </Button>
        </div>
      </div>
    </Dialog>
  )
}
