import { useState, useEffect, useMemo, useRef } from 'react'
import { X, Trash2, Link as LinkIcon, Film, Check } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/features/auth/store/authStore'
import { fetchNotes, saveNote, deleteNote } from '../api/notesApi'
import { useLibrary } from '@/features/library/hooks/useLibrary'
import { tmdbClient } from '@/services/tmdb/tmdbClient'
import { getImageUrl } from '@/services/tmdb/images'
import { toast } from '@/shared/ui'
import type { Note } from '@/shared/schemas'

import './NotesPage.css'

// ─── Color Swatch Palette ─────────────────────────────────────────────────────

const COLOR_PALETTE = {
  yellow: { bg: '#FFF9C4', text: '#1a1a1a', border: '#e8dc7d' },
  green: { bg: '#C8E6C9', text: '#1a1a1a', border: '#a5d6a7' },
  blue: { bg: '#BBDEFB', text: '#1a1a1a', border: '#90caf9' },
  pink: { bg: '#F8BBD0', text: '#1a1a1a', border: '#f48fb1' },
  dark: { bg: '#2A2A2A', text: '#f5f5f5', border: '#444444' },
  white: { bg: '#FFFFFF', text: '#1a1a1a', border: '#e0dfd8' },
} as const

type ColorKey = keyof typeof COLOR_PALETTE

const CATEGORIES = ['General', 'Watchlist', 'Recommendations', 'Reviews', 'Trivia', 'Marathon']

const NOTE_TEMPLATES = [
  {
    icon: '🎥',
    title: 'Watch Party Checklist',
    content: '• Snacks & drinks ready\n• Friends invited\n• Sound setup checked\n• Movie selected:\n• Start time:',
    category: 'Marathon',
    color: 'yellow' as ColorKey,
  },
  {
    icon: '🍿',
    title: 'Weekend Marathon Plan',
    content: 'Theme: \n1. \n2. \n3. \nTotal runtime: ~ hours',
    category: 'Marathon',
    color: 'blue' as ColorKey,
  },
  {
    icon: '📝',
    title: 'Film Review Notes',
    content: 'Cinematography: \nActing / Performance: \nPlot & Pacing: \nKey takeaway / Rating:',
    category: 'Reviews',
    color: 'green' as ColorKey,
  },
  {
    icon: '💡',
    title: 'Theory & Analysis',
    content: 'Hidden details noticed: \nSymbolism: \nOpen questions:',
    category: 'Trivia',
    color: 'pink' as ColorKey,
  },
]

export default function NotesPage() {
  const { user } = useAuthStore()
  const uid = user?.uid
  const queryClient = useQueryClient()
  const { entries: libraryEntries } = useLibrary('all')

  // Map of titleKey -> LibraryEntry to easily render posters
  const libraryMap = useMemo(() => {
    const map = new Map<string, (typeof libraryEntries)[0]>()
    libraryEntries.forEach((e) => map.set(e.titleKey, e))
    return map
  }, [libraryEntries])

  // Queries
  const { data: notes = [], isLoading } = useQuery({
    queryKey: ['notes', uid],
    queryFn: () => (uid ? fetchNotes(uid) : []),
    enabled: Boolean(uid),
  })

  // Mutations
  const saveMutation = useMutation({
    mutationFn: async (noteData: {
      id?: string | undefined
      titleKey?: string | null | undefined
      title?: string | null | undefined
      body: string
      pinned?: boolean | undefined
    }) => {
      if (!uid) throw new Error('Not authenticated')
      return saveNote(uid, noteData)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes', uid] })
    },
    onError: () => toast.error('Failed to save note.'),
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!uid) throw new Error('Not authenticated')
      return deleteNote(uid, id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes', uid] })
      toast.success('Note deleted.')
    },
    onError: () => toast.error('Failed to delete note.'),
  })

  // Selected note for editing
  const [activeNote, setActiveNote] = useState<Note | null>(null)
  const [isEditorOpen, setIsEditorOpen] = useState(false)

  // Editor states
  const [localTitle, setLocalTitle] = useState('')
  const [localContent, setLocalContent] = useState('')
  const [localCategory, setLocalCategory] = useState('General')
  const [localColor, setLocalColor] = useState<ColorKey>('yellow')
  const [localTitleKey, setLocalTitleKey] = useState<string | null>(null)

  // Autosave status state
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'dirty'>('saved')
  const saveTimeoutRef = useRef<any>(null)

  // Movie Link popover state within editor
  const [isLinkPopoverOpen, setIsLinkPopoverOpen] = useState(false)
  const [linkSearchQuery, setLinkSearchQuery] = useState('')

  const { data: linkSearchData } = useQuery({
    queryKey: ['note-link-search', linkSearchQuery],
    queryFn: () =>
      linkSearchQuery.trim().length >= 2 ? tmdbClient.searchMulti(linkSearchQuery) : null,
    enabled: linkSearchQuery.trim().length >= 2,
    staleTime: 30 * 1000,
  })

  const linkSearchResults = (linkSearchData?.results ?? []).filter(
    (r: any) => r.media_type === 'movie' || r.media_type === 'tv'
  )

  // Open note in editor
  const handleOpenEditor = (note: Note) => {
    setActiveNote(note)
    setLocalTitle(note.title ?? '')
    setLocalContent(note.body ?? '')
    setLocalTitleKey(note.titleKey ?? null)
    setLocalColor('yellow')
    setLocalCategory('General')
    setSaveStatus('saved')
    setIsEditorOpen(true)
  }

  // Create new note
  const handleCreateNew = (
    title = '',
    content = '',
    category = 'General',
    color: ColorKey = 'yellow'
  ) => {
    setActiveNote(null)
    setLocalTitle(title)
    setLocalContent(content)
    setLocalCategory(category)
    setLocalColor(color)
    setLocalTitleKey(null)
    setSaveStatus('dirty')
    setIsEditorOpen(true)
  }

  // Trigger autosave debounced loop
  useEffect(() => {
    if (!isEditorOpen) return
    if (!localTitle.trim() && !localContent.trim()) return

    setSaveStatus('dirty')

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    // Debounce save request by 800ms
    saveTimeoutRef.current = setTimeout(async () => {
      setSaveStatus('saving')
      try {
        const id = await saveMutation.mutateAsync({
          id: activeNote?.id,
          title: localTitle.trim() || 'Untitled Note',
          body: localContent,
          titleKey: localTitleKey,
        })
        if (!activeNote && id) {
          setActiveNote({
            id,
            title: localTitle.trim() || 'Untitled Note',
            body: localContent,
            titleKey: localTitleKey,
            pinned: false,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
        }
        setSaveStatus('saved')
      } catch (err) {
        console.error('[Cinetrack] Autosave error:', err)
        setSaveStatus('dirty')
      }
    }, 800)

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [localTitle, localContent, localTitleKey, isEditorOpen])

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

  return (
    <div className="unified-page-container notes-page">
      <header className="unified-page-header notes-header">
        <div>
          <h1 className="page-title">Notes</h1>
          <p className="page-subtitle">Jot down thoughts, theories, and watch party plans</p>
        </div>
        <button
          onClick={() => handleCreateNew()}
          className="page-header-btn"
          type="button"
        >
          + New Note
        </button>
      </header>

      {/* Templates section */}
      <section className="templates-container">
        <span className="templates-title">Quick Templates</span>
        <div className="templates-grid">
          {NOTE_TEMPLATES.map((tmpl, idx) => (
            <button
              key={idx}
              className="template-card-btn"
              onClick={() => handleCreateNew(tmpl.title, tmpl.content, tmpl.category, tmpl.color)}
              type="button"
            >
              <span>{tmpl.icon}</span>
              <span>{tmpl.title}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Loading */}
      {isLoading ? (
        <div className="notes-masonry-grid">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="note-card-wrapper">
              <div
                className="skeleton"
                style={{ height: 180, borderRadius: 'var(--radius-lg, 12px)' }}
              />
            </div>
          ))}
        </div>
      ) : notes.length === 0 ? (
        <div className="col-empty-placeholder">
          <div style={{ fontSize: 48, marginBottom: 16 }}>📝</div>
          <h3 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 8px 0' }}>No notes yet</h3>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: '0 0 16px 0' }}>
            Click one of the templates above or start a blank note to get started.
          </p>
          <button
            onClick={() => handleCreateNew()}
            className="page-header-btn"
            type="button"
          >
            Create First Note
          </button>
        </div>
      ) : (
        /* Notes Masonry Grid */
        <div className="notes-masonry-grid">
          {notes.map((note) => {
            const linked = note.titleKey ? libraryMap.get(note.titleKey) : null
            const poster = linked?.posterPath ? getImageUrl(linked.posterPath, 'w200') : null
            const color = COLOR_PALETTE.yellow

            return (
              <div key={note.id} className="note-card-wrapper">
                <article
                  className="note-card"
                  style={{
                    backgroundColor: color.bg,
                    color: color.text,
                    borderColor: color.border,
                  }}
                  onClick={() => handleOpenEditor(note)}
                >
                  <div className="note-card-header">
                    <span className="note-card-category">General</span>
                    <button
                      className="btn-delete-note"
                      onClick={(e) => {
                        e.stopPropagation()
                        if (note.id) handleDelete(note.id)
                      }}
                      title="Delete note"
                      type="button"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>

                  <h3 className="note-card-title">{note.title || 'Untitled Note'}</h3>

                  <p className="note-card-content">{note.body}</p>

                  <div className="note-card-footer">
                    <span className="note-card-date">
                      {note.updatedAt?.toDate
                        ? note.updatedAt.toDate().toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                          })
                        : 'Today'}
                    </span>

                    {linked && (
                      <div className="note-card-link-badge">
                        {poster ? (
                          <img
                            src={poster}
                            alt={linked.title}
                            className="note-card-poster-tiny"
                          />
                        ) : (
                          <Film size={12} />
                        )}
                        <span>{linked.title}</span>
                      </div>
                    )}
                  </div>
                </article>
              </div>
            )
          })}
        </div>
      )}

      {/* Note Editor Modal */}
      {isEditorOpen && (
        <div
          className="note-editor-overlay"
          onClick={() => {
            setIsEditorOpen(false)
            setActiveNote(null)
          }}
        >
          <div
            className="note-editor-modal"
            style={{
              backgroundColor: COLOR_PALETTE[localColor].bg,
              color: COLOR_PALETTE[localColor].text,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="note-editor-header">
              <button
                className="btn-close-editor"
                onClick={() => {
                  setIsEditorOpen(false)
                  setActiveNote(null)
                }}
                type="button"
                aria-label="Close editor"
              >
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <div className="note-editor-body">
              {/* Linked Movie Badge */}
              {localTitleKey && (
                <div className="note-editor-linked-movie">
                  <Film size={14} />
                  <span>
                    Linked to: <strong>{selectedEntry?.title || localTitleKey}</strong>
                  </span>
                  <button
                    onClick={() => setLocalTitleKey(null)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'inherit',
                      padding: 2,
                    }}
                    type="button"
                  >
                    <X size={12} />
                  </button>
                </div>
              )}

              {/* Title Input */}
              <input
                type="text"
                className="note-editor-title-input"
                placeholder="Note Title..."
                value={localTitle}
                onChange={(e) => setLocalTitle(e.target.value)}
                autoFocus
              />

              {/* Content Textarea */}
              <textarea
                className="note-editor-content-textarea"
                placeholder="Start typing your note, review, theories, or checklist..."
                value={localContent}
                onChange={(e) => setLocalContent(e.target.value)}
              />
            </div>

            {/* Toolbar */}
            <div className="note-editor-toolbar">
              <div className="note-editor-tools-group">
                {/* Color Swatches */}
                <div className="note-color-picker">
                  {(Object.keys(COLOR_PALETTE) as ColorKey[]).map((cKey) => (
                    <button
                      key={cKey}
                      className={`color-swatch-circle swatch-${cKey} ${
                        localColor === cKey ? 'color-swatch-circle--active' : ''
                      }`}
                      onClick={() => setLocalColor(cKey)}
                      title={`Color: ${cKey}`}
                      type="button"
                    />
                  ))}
                </div>

                {/* Category select */}
                <select
                  value={localCategory}
                  onChange={(e) => setLocalCategory(e.target.value)}
                  className="note-select-tool"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>

                {/* Link movie button */}
                <button
                  type="button"
                  className="btn-link-movie-tool"
                  onClick={() => setIsLinkPopoverOpen(true)}
                >
                  <LinkIcon size={12} />
                  <span>Link Title</span>
                </button>
              </div>

              {/* Autosave Indicator */}
              <div className="autosave-status-lbl">
                {saveStatus === 'saving' ? (
                  'Saving…'
                ) : saveStatus === 'saved' ? (
                  <>
                    <Check size={12} /> Saved
                  </>
                ) : (
                  'Unsaved changes'
                )}
              </div>
            </div>

            {/* Link Search Popover */}
            {isLinkPopoverOpen && (
              <div
                className="movie-link-popover-overlay"
                onClick={() => setIsLinkPopoverOpen(false)}
              >
                <div className="movie-link-popover" onClick={(e) => e.stopPropagation()}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <span style={{ fontSize: 13, fontWeight: 700 }}>Link a Movie or Show</span>
                    <button
                      onClick={() => setIsLinkPopoverOpen(false)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--text-muted)',
                      }}
                      type="button"
                    >
                      <X size={14} />
                    </button>
                  </div>

                  <input
                    type="search"
                    placeholder="Search movie or TV show..."
                    value={linkSearchQuery}
                    onChange={(e) => setLinkSearchQuery(e.target.value)}
                    style={{
                      padding: '8px 10px',
                      borderRadius: 6,
                      background: 'var(--bg-elevated, #1a1c28)',
                      border: '1px solid var(--border-default, #2a2c3d)',
                      color: 'var(--text-primary, #ffffff)',
                      fontSize: 13,
                    }}
                    autoFocus
                  />

                  {linkSearchResults.length > 0 && (
                    <div className="movie-link-search-results">
                      {linkSearchResults.map((res: any) => {
                        const name = res.title ?? res.name ?? 'Untitled'
                        const poster = getImageUrl(res.poster_path, 'w200')
                        const key = `${res.media_type || 'movie'}:${res.id}`
                        return (
                          <div
                            key={key}
                            className="movie-link-result-item"
                            onClick={() => {
                              setLocalTitleKey(key)
                              setIsLinkPopoverOpen(false)
                            }}
                          >
                            {poster ? (
                              <img
                                src={poster}
                                alt={name}
                                style={{ width: 18, height: 26, objectFit: 'cover', borderRadius: 2 }}
                              />
                            ) : (
                              <Film size={12} />
                            )}
                            <span>{name}</span>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
