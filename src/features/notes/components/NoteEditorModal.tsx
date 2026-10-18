import { X, Search, Link as LinkIcon, Film, Trash2 } from 'lucide-react'
import { getImageUrl } from '@/services/tmdb/images'
import { Button } from '@/shared/ui/Button/Button'
import type { Note, LibraryEntry } from '@/shared/schemas'

export const COLOR_PALETTE = {
  yellow: { bg: '#FFF9C4', text: '#1a1a1a', border: '#e8dc7d' },
  green: { bg: '#C8E6C9', text: '#1a1a1a', border: '#a5d6a7' },
  blue: { bg: '#BBDEFB', text: '#1a1a1a', border: '#90caf9' },
  pink: { bg: '#F8BBD0', text: '#1a1a1a', border: '#f48fb1' },
  dark: { bg: '#2A2A2A', text: '#f5f5f5', border: '#444444' },
  white: { bg: '#FFFFFF', text: '#1a1a1a', border: '#e0dfd8' },
} as const

export type ColorKey = keyof typeof COLOR_PALETTE
export const CATEGORIES = ['General', 'Watchlist', 'Recommendations', 'Reviews', 'Trivia', 'Marathon']

interface NoteEditorModalProps {
  isOpen: boolean
  onClose: () => void
  activeNote: Note | null
  localTitle: string
  setLocalTitle: (t: string) => void
  localContent: string
  setLocalContent: (c: string) => void
  localCategory: string
  setLocalCategory: (cat: string) => void
  localColor: ColorKey
  setLocalColor: (col: ColorKey) => void
  localTitleKey: string | null
  setLocalTitleKey: (key: string | null) => void
  saveStatus: 'saved' | 'saving' | 'dirty'
  selectedEntry: LibraryEntry | null | undefined
  isLinkPopoverOpen: boolean
  setIsLinkPopoverOpen: (open: boolean) => void
  linkSearchQuery: string
  setLinkSearchQuery: (q: string) => void
  linkSearchResults: any[]
  onDelete: (id: string) => void
}

export function NoteEditorModal({
  isOpen,
  onClose,
  activeNote,
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
  selectedEntry,
  isLinkPopoverOpen,
  setIsLinkPopoverOpen,
  linkSearchQuery,
  setLinkSearchQuery,
  linkSearchResults,
  onDelete,
}: NoteEditorModalProps) {
  if (!isOpen) return null

  return (
    <div className="note-modal-overlay" onClick={onClose}>
      <div
        className="note-modal-sheet"
        style={{
          backgroundColor: COLOR_PALETTE[localColor].bg,
          color: COLOR_PALETTE[localColor].text,
          borderColor: COLOR_PALETTE[localColor].border,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="note-modal-header">
          <div className="note-modal-meta-row">
            <span
              className="note-status-dot"
              style={{
                backgroundColor:
                  saveStatus === 'saving'
                    ? '#f59e0b'
                    : saveStatus === 'saved'
                      ? '#10b981'
                      : '#6b7280',
              }}
            />
            <span className="note-status-text">
              {saveStatus === 'saving'
                ? 'Saving...'
                : saveStatus === 'saved'
                  ? 'All changes saved'
                  : 'Unsaved edits'}
            </span>

            <select
              value={localCategory}
              onChange={(e) => setLocalCategory(e.target.value)}
              className="note-category-select"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="note-modal-actions">
            {activeNote?.id && (
              <button
                className="btn-modal-action"
                onClick={() => onDelete(activeNote.id!)}
                title="Delete note"
                type="button"
              >
                <Trash2 size={16} />
              </button>
            )}
            <button className="btn-modal-action" onClick={onClose} type="button">
              <X size={20} />
            </button>
          </div>
        </header>

        <div className="note-color-picker-row">
          {(Object.keys(COLOR_PALETTE) as ColorKey[]).map((col) => (
            <button
              key={col}
              className={`color-swatch-btn ${localColor === col ? 'color-swatch-btn--active' : ''}`}
              style={{ backgroundColor: COLOR_PALETTE[col].bg }}
              onClick={() => setLocalColor(col)}
              title={col}
              type="button"
            />
          ))}
        </div>

        {/* Linked movie badge */}
        <div className="note-link-bar">
          {localTitleKey ? (
            <div className="note-linked-badge">
              <Film size={14} />
              <span>{selectedEntry?.title || localTitleKey}</span>
              <button
                type="button"
                className="btn-unlink"
                onClick={() => setLocalTitleKey(null)}
              >
                <X size={12} />
              </button>
            </div>
          ) : (
            <div className="note-link-trigger-wrap">
              <button
                type="button"
                className="btn-link-movie"
                onClick={() => setIsLinkPopoverOpen(!isLinkPopoverOpen)}
              >
                <LinkIcon size={13} /> Link to Movie or Show
              </button>

              {isLinkPopoverOpen && (
                <div className="link-search-popover">
                  <div className="popover-search-input-box">
                    <Search size={14} />
                    <input
                      type="text"
                      placeholder="Search title..."
                      value={linkSearchQuery}
                      onChange={(e) => setLinkSearchQuery(e.target.value)}
                      autoFocus
                    />
                  </div>
                  <div className="popover-results-list">
                    {linkSearchResults.map((res) => {
                      const name = res.title ?? res.name ?? 'Untitled'
                      const poster = getImageUrl(res.poster_path, 'w200')
                      const mediaType = res.media_type || 'movie'
                      const titleKey = `${mediaType}:${res.id}`

                      return (
                        <div
                          key={titleKey}
                          className="popover-result-item"
                          onClick={() => {
                            setLocalTitleKey(titleKey)
                            setIsLinkPopoverOpen(false)
                          }}
                        >
                          {poster ? (
                            <img src={poster} alt="" className="popover-thumb" />
                          ) : (
                            <Film size={14} />
                          )}
                          <div>
                            <div className="popover-title">{name}</div>
                            <div className="popover-sub">
                              {mediaType === 'movie' ? 'Movie' : 'TV Show'}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <input
          type="text"
          className="note-input-title"
          placeholder="Note Title"
          value={localTitle}
          onChange={(e) => setLocalTitle(e.target.value)}
          autoFocus={!localTitle}
        />

        <textarea
          className="note-input-body"
          placeholder="Start typing your thoughts, theories, or review snippets..."
          value={localContent}
          onChange={(e) => setLocalContent(e.target.value)}
          rows={12}
        />

        <footer className="note-modal-footer">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Done
          </Button>
        </footer>
      </div>
    </div>
  )
}
