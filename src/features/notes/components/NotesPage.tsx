import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/features/auth/store/authStore'
import { fetchNotes, togglePinNote, deleteNote } from '../api/notesApi'
import { NoteCard } from './NoteCard'
import { NoteDialog } from './NoteDialog'
import { Button, Input, Skeleton, EmptyState, ConfirmDialog, toast } from '@/shared/ui'
import { Plus, StickyNote, Search } from 'lucide-react'
import type { Note } from '@/shared/schemas'
import styles from './NotesPage.module.css'

export default function NotesPage() {
  const { user } = useAuthStore()
  const uid = user?.uid

  const [searchQuery, setSearchQuery] = useState('')
  const [editingNote, setEditingNote] = useState<Note | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [deletingNote, setDeletingNote] = useState<Note | null>(null)

  const notesQuery = useQuery({
    queryKey: ['notes', uid],
    queryFn: () => (uid ? fetchNotes(uid) : []),
    enabled: Boolean(uid),
  })

  const rawNotes = notesQuery.data

  const filteredNotes = useMemo(() => {
    if (!rawNotes) return []
    const q = searchQuery.toLowerCase().trim()
    return rawNotes
      .filter((n) => {
        if (!q) return true
        const inTitle = n.title?.toLowerCase().includes(q)
        const inBody = n.body.toLowerCase().includes(q)
        return inTitle || inBody
      })
      .sort((a, b) => {
        // Pinned notes come first
        if (a.pinned && !b.pinned) return -1
        if (!a.pinned && b.pinned) return 1
        return 0
      })
  }, [rawNotes, searchQuery])

  const handleTogglePin = async (note: Note) => {
    if (!uid || !note.id) return
    try {
      await togglePinNote(uid, note.id, !note.pinned)
      notesQuery.refetch()
    } catch {
      toast.error('Failed to update pin.')
    }
  }

  const handleDeleteConfirm = async () => {
    if (!uid || !deletingNote || !deletingNote.id) return
    try {
      await deleteNote(uid, deletingNote.id)
      toast.success('Note deleted.')
      notesQuery.refetch()
    } catch {
      toast.error('Failed to delete note.')
    } finally {
      setDeletingNote(null)
    }
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.pageTitle}>Notes</h1>
          <p className={styles.subtitle}>
            Personal thoughts, watch-lists, and viewing logs
          </p>
        </div>

        <div className={styles.topActions}>
          <div className={styles.searchWrapper}>
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search notes..."
              startIcon={<Search size={16} />}
            />
          </div>
          <Button
            variant="primary"
            startIcon={<Plus size={16} />}
            onClick={() => {
              setEditingNote(null)
              setIsDialogOpen(true)
            }}
          >
            New Note
          </Button>
        </div>
      </header>

      {notesQuery.isLoading ? (
        <div className={styles.grid}>
          <Skeleton height={160} />
          <Skeleton height={160} />
          <Skeleton height={160} />
        </div>
      ) : filteredNotes.length === 0 ? (
        <EmptyState
          icon={<StickyNote size={48} />}
          title={searchQuery ? 'No notes matched your search' : 'No notes yet'}
          description={
            searchQuery
              ? 'Try adjusting your search terms.'
              : 'Keep notes about your favorite movies, actors, thoughts or watch plans.'
          }
          action={
            !searchQuery ? (
              <Button
                variant="primary"
                startIcon={<Plus size={16} />}
                onClick={() => {
                  setEditingNote(null)
                  setIsDialogOpen(true)
                }}
              >
                Create First Note
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className={styles.grid}>
          {filteredNotes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              onTogglePin={handleTogglePin}
              onEdit={(n) => {
                setEditingNote(n)
                setIsDialogOpen(true)
              }}
              onDelete={setDeletingNote}
            />
          ))}
        </div>
      )}

      {isDialogOpen && uid && (
        <NoteDialog
          isOpen={isDialogOpen}
          onClose={() => {
            setIsDialogOpen(false)
            setEditingNote(null)
          }}
          uid={uid}
          initialNote={editingNote}
          onSaved={() => notesQuery.refetch()}
        />
      )}

      <ConfirmDialog
        isOpen={Boolean(deletingNote)}
        title="Delete Note"
        message="Are you sure you want to delete this note? This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeletingNote(null)}
      />
    </div>
  )
}
