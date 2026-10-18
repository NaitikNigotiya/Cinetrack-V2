import { useState, useEffect, useRef } from 'react'
import { tmdbClient } from '@/services/tmdb/tmdbClient'
import type { Note } from '@/shared/schemas'
import type { ColorKey } from '../components/NoteEditorModal'

interface UseNoteEditorStateProps {
  uid: string | undefined
  activeNote: Note | null
  onSaveNote: (noteData: Partial<Note> & { title: string; body: string }) => Promise<any>
}

export function useNoteEditorState({ activeNote, onSaveNote }: UseNoteEditorStateProps) {
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [localTitle, setLocalTitle] = useState('')
  const [localContent, setLocalContent] = useState('')
  const [localCategory, setLocalCategory] = useState('General')
  const [localColor, setLocalColor] = useState<ColorKey>('dark')
  const [localTitleKey, setLocalTitleKey] = useState<string | null>(null)
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'dirty'>('saved')

  const [isLinkPopoverOpen, setIsLinkPopoverOpen] = useState(false)
  const [linkSearchQuery, setLinkSearchQuery] = useState('')
  const [linkSearchResults, setLinkSearchResults] = useState<any[]>([])

  useEffect(() => {
    if (!linkSearchQuery.trim() || linkSearchQuery.length < 2) {
      setLinkSearchResults([])
      return
    }
    const timer = setTimeout(async () => {
      try {
        const res = await tmdbClient.searchMulti(linkSearchQuery)
        setLinkSearchResults(
          (res.results || []).filter(
            (i: any) => i.media_type === 'movie' || i.media_type === 'tv'
          )
        )
      } catch {
        // silent
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [linkSearchQuery])

  const openEditorForNote = (note: Note) => {
    setLocalTitle(note.title ?? '')
    setLocalContent(note.body ?? '')
    setLocalCategory((note as any).category || 'General')
    setLocalColor((note as any).color || 'dark')
    setLocalTitleKey(note.titleKey ?? null)
    setSaveStatus('saved')
    setIsEditorOpen(true)
  }

  const openEditorNew = (
    templateTitle?: string,
    templateContent?: string,
    templateCat?: string,
    templateCol?: ColorKey
  ) => {
    setLocalTitle(templateTitle || '')
    setLocalContent(templateContent || '')
    setLocalCategory(templateCat || 'General')
    setLocalColor(templateCol || 'dark')
    setLocalTitleKey(null)
    setSaveStatus('saved')
    setIsEditorOpen(true)
  }

  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!isEditorOpen) return
    if (!localTitle.trim() && !localContent.trim()) return

    setSaveStatus('saving')
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        if (activeNote?.id) {
          await onSaveNote({
            id: activeNote.id,
            title: localTitle.trim() || 'Untitled Note',
            body: localContent,
            titleKey: localTitleKey,
            pinned: activeNote.pinned,
            updatedAt: new Date(),
          })
        } else {
          const id = `note_${Date.now()}`
          await onSaveNote({
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
      } catch {
        setSaveStatus('dirty')
      }
    }, 800)

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    }
  }, [localTitle, localContent, localTitleKey, isEditorOpen, activeNote, onSaveNote])

  return {
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
  }
}
