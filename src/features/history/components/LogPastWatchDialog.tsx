import { useState, useEffect } from 'react'
import { Timestamp } from 'firebase/firestore'
import { useAuthStore } from '@/features/auth/store/authStore'
import { logPastWatch } from '../api/historyApi'
import { Dialog, Input, Button, toast } from '@/shared/ui'
import { Film, Tv, Check, X, Loader2 } from 'lucide-react'
import { LogPastWatchAutocomplete } from './LogPastWatchAutocomplete'
import { useTmdbLogAutocomplete } from '../hooks/useTmdbLogAutocomplete'

interface LogPastWatchDialogProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: (() => void) | undefined
  onSaved?: (() => void) | undefined
}

export function LogPastWatchDialog({ isOpen, onClose, onSuccess, onSaved }: LogPastWatchDialogProps) {
  const { user } = useAuthStore()
  const uid = user?.uid

  const [title, setTitle] = useState('')
  const [type, setType] = useState<'movie' | 'tv_episode'>('movie')
  const [dateStr, setDateStr] = useState(() => new Date().toISOString().slice(0, 10))
  const [runtime, setRuntime] = useState('120')
  const [rating, setRating] = useState('8')
  const [seasonNum, setSeasonNum] = useState('1')
  const [episodeNum, setEpisodeNum] = useState('1')
  const [selectedPoster, setSelectedPoster] = useState<string | null>(null)
  const [selectedTitleKey, setSelectedTitleKey] = useState<string | null>(null)
  const [genreIds, setGenreIds] = useState<number[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    searchResults,
    isSearching,
    showSuggestions,
    setShowSuggestions,
    triggerSearch,
    selectTmdbItem,
    resetSearch,
  } = useTmdbLogAutocomplete((data) => {
    setTitle(data.title)
    setType(data.type)
    setSelectedPoster(data.posterPath)
    setSelectedTitleKey(data.titleKey)
    setGenreIds(data.genreIds)
    setRuntime(data.runtime)
  })

  useEffect(() => {
    if (!isOpen) {
      setTitle('')
      setSelectedPoster(null)
      setSelectedTitleKey(null)
      setGenreIds([])
      setRuntime('120')
      setRating('8')
      setSeasonNum('1')
      setEpisodeNum('1')
      resetSearch()
    }
  }, [isOpen])

  const handleTitleChange = (val: string) => {
    setTitle(val)
    triggerSearch(val)
  }

  const handleClearSelection = () => {
    setSelectedPoster(null)
    setSelectedTitleKey(null)
    setGenreIds([])
    setTitle('')
    resetSearch()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!uid || !title.trim()) return

    setIsSubmitting(true)
    try {
      const parts = dateStr.split('-').map(Number)
      const year = parts[0] ?? new Date().getFullYear()
      const month = (parts[1] ?? 1) - 1
      const day = parts[2] ?? 1
      const parsedDate = new Date(year, month, day, 12, 0, 0)
      const watchedAt = Timestamp.fromDate(parsedDate)

      const parsedRuntime = parseInt(runtime, 10) || (type === 'movie' ? 120 : 45)
      const parsedRating = rating ? parseFloat(rating) : undefined
      const isTv = type === 'tv_episode'

      await logPastWatch(uid, {
        eventId: `event_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        titleKey: selectedTitleKey || (isTv ? `custom:tv:${Date.now()}` : `custom:movie:${Date.now()}`),
        title: title.trim(),
        type,
        watchedAt,
        runtimeMinutes: parsedRuntime,
        rating: parsedRating,
        season: isTv ? parseInt(seasonNum, 10) || 1 : undefined,
        episode: isTv ? parseInt(episodeNum, 10) || 1 : undefined,
        posterPath: selectedPoster || null,
        genreIds: genreIds,
      })

      toast.success(`Logged "${title.trim()}" to watch history!`)
      if (onSuccess) onSuccess()
      if (onSaved) onSaved()
      onClose()
    } catch {
      toast.error('Failed to log watch. Try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="Log Past Watch">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button
            type="button"
            variant={type === 'movie' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setType('movie')}
            leftIcon={<Film size={14} />}
            style={{ flex: 1 }}
          >
            Movie
          </Button>
          <Button
            type="button"
            variant={type === 'tv_episode' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setType('tv_episode')}
            leftIcon={<Tv size={14} />}
            style={{ flex: 1 }}
          >
            TV Episode
          </Button>
        </div>

        <div style={{ position: 'relative' }}>
          <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', fontWeight: 600, color: 'var(--text-2)', marginBottom: '6px' }}>
            Title {selectedTitleKey && <span style={{ color: '#4ade80' }}>✓ TMDB Linked</span>}
          </label>
          <div style={{ position: 'relative' }}>
            <Input
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder={type === 'movie' ? 'e.g. Inception, Barbie, Dune...' : 'e.g. Severance, Succession...'}
              style={{
                width: '100%',
                paddingRight: selectedPoster ? '40px' : '12px',
              }}
              onFocus={() => {
                if (searchResults.length > 0) setShowSuggestions(true)
              }}
              required
            />
            {isSearching && (
              <div
                style={{
                  position: 'absolute',
                  right: selectedPoster ? '36px' : '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--accent-text)',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
              </div>
            )}
            {selectedPoster && (
              <button
                type="button"
                onClick={handleClearSelection}
                title="Clear selected poster"
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-3)',
                  padding: '4px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                <X size={16} />
              </button>
            )}
          </div>

          <LogPastWatchAutocomplete
            showSuggestions={showSuggestions}
            searchResults={searchResults}
            onSelect={selectTmdbItem}
          />
        </div>

        {type === 'tv_episode' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', fontWeight: 600, color: 'var(--text-2)', marginBottom: '6px' }}>
                Season
              </label>
              <Input
                type="number"
                min="1"
                value={seasonNum}
                onChange={(e) => setSeasonNum(e.target.value)}
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', fontWeight: 600, color: 'var(--text-2)', marginBottom: '6px' }}>
                Episode
              </label>
              <Input
                type="number"
                min="1"
                value={episodeNum}
                onChange={(e) => setEpisodeNum(e.target.value)}
                style={{ width: '100%' }}
              />
            </div>
          </div>
        )}

        <div>
          <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', fontWeight: 600, color: 'var(--text-2)', marginBottom: '6px' }}>
            Date Watched
          </label>
          <Input
            type="date"
            max={new Date().toISOString().slice(0, 10)}
            value={dateStr}
            onChange={(e) => setDateStr(e.target.value)}
            style={{ width: '100%' }}
            required
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', fontWeight: 600, color: 'var(--text-2)', marginBottom: '6px' }}>
              Runtime (mins)
            </label>
            <Input
              type="number"
              min="1"
              max="600"
              value={runtime}
              onChange={(e) => setRuntime(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', fontWeight: 600, color: 'var(--text-2)', marginBottom: '6px' }}>
              Rating (1-10)
            </label>
            <Input
              type="number"
              min="0"
              max="10"
              step="0.5"
              value={rating}
              onChange={(e) => setRating(e.target.value)}
              placeholder="e.g. 8.5"
              style={{ width: '100%' }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            leftIcon={isSubmitting ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Check size={16} />}
            disabled={isSubmitting || !title.trim()}
          >
            {isSubmitting ? 'Logging...' : 'Log Watch'}
          </Button>
        </div>
      </form>
    </Dialog>
  )
}
