import { useState, useMemo } from 'react'
import { Link as LinkIcon, Plus, FileText, Layers } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/features/auth/store/authStore'
import { fetchNotes, saveNote, deleteNote } from '../api/notesApi'
import { useLibrary } from '@/features/library/hooks/useLibrary'
import { toast } from '@/shared/ui'
import { PageShell } from '@/shared/ui/layout/PageShell'
import { PageHeader } from '@/shared/ui/layout/PageHeader'
import { SearchField } from '@/shared/ui/layout/SearchField'
import { StatRow } from '@/shared/ui/layout/StatRow'
import { StatTile } from '@/shared/ui/layout/StatTile'
import { FilterBar } from '@/shared/ui/layout/FilterBar'
import { Section } from '@/shared/ui/layout/Section'
import { Card } from '@/shared/ui/layout/Card'
import { EmptyStateCard } from '@/shared/ui/layout/EmptyStateCard'
import { Button } from '@/shared/ui/Button/Button'
import { NoteEditorModal, CATEGORIES, type ColorKey } from './NoteEditorModal'
import { NOTE_TEMPLATES } from './notesTemplates'
import { NoteItemCard } from './NoteItemCard'
import { useNoteEditorState } from '../hooks/useNoteEditorState'
import type { Note } from '@/shared/schemas'

import './NotesPage.css'

export default function NotesPage() {
  const { user } = useAuthStore()
  const uid = user?.uid
  const queryClient = useQueryClient()

  const { data: notes = [], isLoading } = useQuery({
    queryKey: ['notes', uid],
    queryFn: () => (uid ? fetchNotes(uid) : []),
    enabled: Boolean(uid),
  })

  const { entries } = useLibrary('all')
  const libraryMap = useMemo(() => new Map(entries.map((e) => [e.titleKey, e])), [entries])

  const saveMutation = useMutation({
    mutationFn: (noteData: Partial<Note> & { title: string; body: string }) => {
      if (!uid) throw new Error('Not authenticated')
      return saveNote(uid, noteData)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes', uid] })
    },
    onError: () => toast.error('Failed to save note.'),
  })

  const deleteMutation = useMutation({
    mutationFn: (noteId: string) => {
      if (!uid) throw new Error('Not authenticated')
      return deleteNote(uid, noteId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes', uid] })
      toast.success('Note deleted.')
    },
    onError: () => toast.error('Failed to delete note.'),
  })

  const [noteSearch, setNoteSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [activeNote, setActiveNote] = useState<Note | null>(null)

  const {
    isEditorOpen,
    setIsEditorOpen,
    localTitle,
    setLocalTitle,
    localContent,
    setLocalContent,
    localCategory,
    setLocalCategory,
    localColor,
    setLocalColor,
    localTitleKey,
    setLocalTitleKey,
    saveStatus,
    isLinkPopoverOpen,
    setIsLinkPopoverOpen,
    linkSearchQuery,
    setLinkSearchQuery,
    linkSearchResults,
    openEditorForNote,
    openEditorNew,
  } = useNoteEditorState({
    uid,
    activeNote,
    onSaveNote: (data) => saveMutation.mutateAsync(data),
  })

  const noteStats = useMemo(() => {
    const total = notes.length
    const linked = notes.filter((n) => Boolean(n.titleKey)).length
    return { total, linked, templatesCount: NOTE_TEMPLATES.length }
  }, [notes])

  const filteredNotes = useMemo(() => {
    let list = notes
    if (selectedCategory !== 'All') {
      list = list.filter((n) => (n as any).category === selectedCategory)
    }
    if (noteSearch.trim()) {
      const q = noteSearch.toLowerCase()
      list = list.filter(
        (n) => (n.title ?? '').toLowerCase().includes(q) || (n.body ?? '').toLowerCase().includes(q)
      )
    }
    return list
  }, [notes, selectedCategory, noteSearch])

  const handleOpenEditor = (note: Note) => {
    setActiveNote(note)
    openEditorForNote(note)
  }

  const handleCreateNew = (
    templateTitle?: string,
    templateContent?: string,
    templateCat?: string,
    templateCol?: ColorKey
  ) => {
    setActiveNote(null)
    openEditorNew(templateTitle, templateContent, templateCat, templateCol)
  }

  const handleDelete = async (noteId: string) => {
    if (window.confirm('Delete this note?')) {
      await deleteMutation.mutateAsync(noteId)
      if (activeNote?.id === noteId) {
        setIsEditorOpen(false)
        setActiveNote(null)
      }
    }
  }

  const selectedEntry = localTitleKey ? libraryMap.get(localTitleKey) : null

  const categoryTabs = useMemo(() => {
    return ['All', ...CATEGORIES].map((c) => ({
      id: c,
      label: c,
    }))
  }, [])

  return (
    <PageShell>
      <PageHeader
        eyebrow="THOUGHTS"
        title="Notes & Scratchpad"
        subtitle="Jot down thoughts, theories, and watch party plans"
        actions={
          <Button variant="primary" size="sm" onClick={() => handleCreateNew()}>
            <Plus size={16} style={{ marginRight: '6px' }} /> New Note
          </Button>
        }
      >
        <SearchField
          value={noteSearch}
          onChange={setNoteSearch}
          placeholder="Search your notes by title or content..."
          showShortcutHint={false}
          aria-label="Search notes"
        />
      </PageHeader>

      <StatRow>
        <StatTile
          icon={<FileText size={20} />}
          value={noteStats.total}
          label="Notes Stored"
        />
        <StatTile
          icon={<LinkIcon size={20} />}
          value={noteStats.linked}
          label="Linked to Titles"
        />
        <StatTile
          icon={<Layers size={20} />}
          value={noteStats.templatesCount}
          label="Starter Templates"
        />
      </StatRow>

      <FilterBar
        tabs={categoryTabs}
        activeTab={selectedCategory}
        onTabChange={setSelectedCategory}
      />

      <Section title="Quick Starter Templates">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--card-gap)' }}>
          {NOTE_TEMPLATES.map((tmpl, idx) => (
            <Card
              key={idx}
              variant="interactive"
              onClick={() => handleCreateNew(tmpl.title, tmpl.content, tmpl.category, tmpl.color)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: 'var(--space-3) var(--space-4)',
                cursor: 'pointer',
              }}
            >
              <span style={{ fontSize: '1.5rem' }}>{tmpl.icon}</span>
              <span style={{ fontSize: 'var(--fs-card-title)', fontWeight: 600 }}>{tmpl.title}</span>
            </Card>
          ))}
        </div>
      </Section>

      {isLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 'var(--card-gap)' }}>
          {[...Array(4)].map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 180, borderRadius: 'var(--radius-card)' }} />
          ))}
        </div>
      ) : filteredNotes.length === 0 ? (
        <EmptyStateCard
          title={noteSearch ? 'No notes match your search' : 'No notes yet'}
          description={
            noteSearch
              ? 'Try a different keyword or category.'
              : 'Click one of the starter templates above or create a blank note.'
          }
          action={
            !noteSearch ? (
              <Button variant="primary" size="sm" onClick={() => handleCreateNew()}>
                <Plus size={16} style={{ marginRight: '6px' }} /> Create First Note
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 'var(--card-gap)' }}>
          {filteredNotes.map((note) => (
            <NoteItemCard
              key={note.id}
              note={note}
              linked={note.titleKey ? libraryMap.get(note.titleKey) : null}
              onOpen={handleOpenEditor}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      <NoteEditorModal
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        activeNote={activeNote}
        localTitle={localTitle}
        setLocalTitle={setLocalTitle}
        localContent={localContent}
        setLocalContent={setLocalContent}
        localCategory={localCategory}
        setLocalCategory={setLocalCategory}
        localColor={localColor}
        setLocalColor={setLocalColor}
        localTitleKey={localTitleKey}
        setLocalTitleKey={setLocalTitleKey}
        saveStatus={saveStatus}
        selectedEntry={selectedEntry}
        isLinkPopoverOpen={isLinkPopoverOpen}
        setIsLinkPopoverOpen={setIsLinkPopoverOpen}
        linkSearchQuery={linkSearchQuery}
        setLinkSearchQuery={setLinkSearchQuery}
        linkSearchResults={linkSearchResults}
        onDelete={handleDelete}
      />
    </PageShell>
  )
}
