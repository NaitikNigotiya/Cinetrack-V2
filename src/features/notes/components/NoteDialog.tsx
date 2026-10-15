import { useState } from 'react'
import { Dialog, Button, Input } from '@/shared/ui'
import { toast } from '@/shared/ui'
import { MarkdownLite } from './MarkdownLite'
import { saveNote } from '../api/notesApi'
import type { Note } from '@/shared/schemas'
import styles from './NoteDialog.module.css'

interface NoteDialogProps {
  isOpen: boolean
  onClose: () => void
  uid: string
  initialNote?: Note | null
  onSaved?: () => void
}

export function NoteDialog({
  isOpen,
  onClose,
  uid,
  initialNote,
  onSaved,
}: NoteDialogProps) {
  const [title, setTitle] = useState(initialNote?.title ?? '')
  const titleKey = initialNote?.titleKey ?? null
  const [body, setBody] = useState(initialNote?.body ?? '')
  const [pinned, setPinned] = useState(initialNote?.pinned ?? false)
  const [mode, setMode] = useState<'write' | 'preview'>('write')
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    if (!body.trim()) {
      toast.error('Note body cannot be empty.')
      return
    }
    if (body.length > 5000) {
      toast.error('Note body must be 5000 characters or fewer.')
      return
    }

    setIsSaving(true)
    try {
      await saveNote(uid, {
        ...(initialNote?.id ? { id: initialNote.id } : {}),
        title: title.trim() || null,
        titleKey: titleKey ? titleKey.trim() || null : null,
        body: body.trim(),
        pinned,
      })
      toast.success(initialNote?.id ? 'Note updated!' : 'Note created!')
      onSaved?.()
      onClose()
    } catch {
      toast.error('Failed to save note.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={initialNote?.id ? 'Edit Note' : 'New Note'}
    >
      <div className={styles.form}>
        <Input
          label="Optional Title or Linked Subject"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Breaking Bad Season 5 thoughts"
        />

        <div className={styles.tabsRow}>
          <div className={styles.modeToggle}>
            <button
              type="button"
              className={`${styles.modeBtn} ${mode === 'write' ? styles.activeMode : ''}`}
              onClick={() => setMode('write')}
            >
              Write
            </button>
            <button
              type="button"
              className={`${styles.modeBtn} ${mode === 'preview' ? styles.activeMode : ''}`}
              onClick={() => setMode('preview')}
            >
              Preview
            </button>
          </div>
          <span className={`${styles.counter} ${body.length > 5000 ? styles.counterLimit : ''}`}>
            {body.length} / 5000
          </span>
        </div>

        {mode === 'write' ? (
          <textarea
            className={styles.textarea}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write your note with markdown (e.g. **bold**, *italic*, - list)..."
            rows={8}
          />
        ) : (
          <div className={styles.previewBox}>
            {body.trim() ? (
              <MarkdownLite content={body} />
            ) : (
              <span className={styles.emptyPreview}>Nothing to preview</span>
            )}
          </div>
        )}

        <div className={styles.pinnedRow}>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={pinned}
              onChange={(e) => setPinned(e.target.checked)}
              className={styles.checkbox}
            />
            Pin to top
          </label>
        </div>

        <div className={styles.actions}>
          <Button variant="secondary" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Note'}
          </Button>
        </div>
      </div>
    </Dialog>
  )
}
