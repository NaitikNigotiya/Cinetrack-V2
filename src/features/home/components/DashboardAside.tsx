import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Film, Tv, PenLine, Shuffle } from 'lucide-react'
import { Card } from '@/shared/ui/layout/Card'
import { Button } from '@/shared/ui/Button/Button'

const MOODS = [
  { name: 'Happy', emoji: '😊' },
  { name: 'Dark', emoji: '🌑' },
  { name: 'Mind Bend', emoji: '🌀' },
  { name: 'Chill', emoji: '☕' },
  { name: 'Excited', emoji: '🚀' },
]

interface RecentActivityItem {
  id: string
  type: string
  title: string
  rating?: number
  date: Date
  timeAgo: string
}

interface DashboardAsideProps {
  currentYear: number
  completedMoviesCount: number
  watchGoal: number
  setWatchGoal: (g: number) => void
  mood: string | null
  onSelectMood: (m: string) => void
  recentActivities: RecentActivityItem[]
  dailyQuote: { quote: string; film: string }
  onRandomPick: () => void
}

export function DashboardAside({
  currentYear,
  completedMoviesCount,
  watchGoal,
  setWatchGoal,
  mood,
  onSelectMood,
  recentActivities,
  dailyQuote,
  onRandomPick,
}: DashboardAsideProps) {
  const navigate = useNavigate()
  const [isEditingGoal, setIsEditingGoal] = useState(false)
  const [goalInput, setGoalInput] = useState(String(watchGoal))

  const goalPercent = watchGoal > 0 ? Math.min(Math.round((completedMoviesCount / watchGoal) * 100), 100) : 0

  const saveGoal = useCallback(() => {
    const val = parseInt(goalInput, 10)
    if (!isNaN(val) && val > 0) {
      setWatchGoal(val)
      localStorage.setItem(`cinetrack-watch-goal-${currentYear}`, String(val))
    }
    setIsEditingGoal(false)
  }, [goalInput, currentYear, setWatchGoal])

  const getActivityIcon = (type: string) =>
    ({ rating: '⭐', completed: '✅', added: '🔖', review: '💬' }[type] ?? '🎬')

  const getActivityText = (item: RecentActivityItem) => {
    if (item.type === 'rating') return `You rated ${item.title} ⭐ ${item.rating?.toFixed(1)}`
    if (item.type === 'completed') return `You completed ${item.title} ✅`
    if (item.type === 'added') return `You added ${item.title} 🔖`
    if (item.type === 'review') return `You reviewed ${item.title} 💬`
    return `You watched ${item.title}`
  }

  return (
    <aside style={{ display: 'flex', flexDirection: 'column', gap: 'var(--section-gap)' }}>
      {/* 1. WATCH GOAL CARD */}
      <Card variant="default">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <span style={{ fontSize: 'var(--fs-card-title)', fontWeight: 700 }}>Watch Goal {currentYear}</span>
          <button
            onClick={() => {
              setIsEditingGoal(true)
              setGoalInput(String(watchGoal))
            }}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: 'var(--fs-small)',
              fontWeight: 600,
              color: 'var(--brand-primary)',
            }}
          >
            Edit Goal
          </button>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
          <svg width="140" height="140" viewBox="0 0 140 140">
            <circle cx="70" cy="70" r="54" fill="none" stroke="var(--border-subtle)" strokeWidth="10" />
            <circle
              cx="70"
              cy="70"
              r="54"
              fill="none"
              stroke="var(--brand-primary)"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 54}`}
              strokeDashoffset={`${2 * Math.PI * 54 * (1 - goalPercent / 100)}`}
              transform="rotate(-90 70 70)"
              style={{ transition: 'stroke-dashoffset 800ms ease' }}
            />
            <text
              x="70"
              y="70"
              textAnchor="middle"
              dominantBaseline="middle"
              style={{
                fontSize: '22px',
                fontWeight: 800,
                fill: 'var(--text-primary)',
                fontFamily: 'inherit',
              }}
            >
              {goalPercent}%
            </text>
          </svg>
        </div>

        {isEditingGoal ? (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input
              autoFocus
              type="number"
              value={goalInput}
              onChange={(e) => setGoalInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && saveGoal()}
              min="1"
              max="999"
              style={{
                flex: 1,
                padding: '8px 12px',
                background: 'var(--surface-page)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-control)',
                color: 'var(--text-primary)',
                fontSize: 'var(--fs-small)',
                fontWeight: 600,
              }}
              placeholder="Set goal..."
            />
            <Button variant="primary" size="sm" onClick={saveGoal}>
              Save
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setIsEditingGoal(false)}>
              ✕
            </Button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 'var(--fs-small)', fontWeight: 700 }}>{watchGoal} Movies</span>
              <span style={{ fontSize: 'var(--fs-stat-label)', color: 'var(--text-muted)' }}>Goal</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 'var(--fs-small)', fontWeight: 700, color: 'var(--brand-primary)' }}>
                {completedMoviesCount} Movies
              </span>
              <span style={{ fontSize: 'var(--fs-stat-label)', color: 'var(--text-muted)' }}>Watched</span>
            </div>
            <div style={{ fontSize: 'var(--fs-small)', color: 'var(--text-muted)', marginTop: '2px' }}>
              {watchGoal - completedMoviesCount > 0
                ? `${watchGoal - completedMoviesCount} to go!`
                : '🎉 Goal achieved!'}
            </div>
            <div
              style={{
                marginTop: '8px',
                height: '4px',
                background: 'var(--border-subtle)',
                borderRadius: 'var(--radius-pill)',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  background: 'var(--brand-primary)',
                  borderRadius: 'var(--radius-pill)',
                  width: `${goalPercent}%`,
                  transition: 'width 800ms ease',
                }}
              />
            </div>
          </div>
        )}
      </Card>

      {/* 2. MOOD CARD */}
      <Card variant="default">
        <h3 style={{ fontSize: 'var(--fs-card-title)', fontWeight: 700, marginBottom: '12px' }}>Mood for today?</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px' }}>
          {MOODS.map((m) => (
            <button
              key={m.name}
              className={`hp-mood-btn ${mood === m.name ? 'hp-mood-btn--active' : ''}`}
              onClick={() => onSelectMood(m.name)}
              type="button"
              style={{ width: '100%', minWidth: 0, padding: '8px 2px' }}
            >
              <span className="hp-mood-emoji">{m.emoji}</span>
              <span className="hp-mood-label" style={{ maxWidth: '100%' }}>{m.name}</span>
            </button>
          ))}
        </div>
      </Card>

      {/* 3. RECENT ACTIVITY CARD */}
      <Card variant="default">
        <h3 style={{ fontSize: 'var(--fs-card-title)', fontWeight: 700, marginBottom: '12px' }}>Recent Activity</h3>
        {recentActivities.length > 0 ? (
          <ul className="hp-activity-list" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {recentActivities.map((act) => (
              <li
                key={act.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '8px 0',
                  borderBottom: '1px solid var(--border-subtle)',
                }}
              >
                <span>{getActivityIcon(act.type)}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 'var(--fs-small)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {getActivityText(act)}
                  </p>
                </div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', flexShrink: 0 }}>{act.timeAgo}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p style={{ fontSize: 'var(--fs-small)', color: 'var(--text-muted)', margin: 0 }}>
            No activity yet. Start watching!
          </p>
        )}
      </Card>

      {/* 4. QUICK ACTIONS CARD */}
      <Card variant="default">
        <h3 style={{ fontSize: 'var(--fs-card-title)', fontWeight: 700, marginBottom: '12px' }}>Quick Actions</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
          <Button variant="secondary" size="sm" onClick={() => navigate('/search')} style={{ justifyContent: 'flex-start' }}>
            <Film size={14} style={{ marginRight: '6px' }} /> + Movie
          </Button>
          <Button variant="secondary" size="sm" onClick={() => navigate('/search')} style={{ justifyContent: 'flex-start' }}>
            <Tv size={14} style={{ marginRight: '6px' }} /> + Show
          </Button>
          <Button variant="secondary" size="sm" onClick={() => navigate('/reviews')} style={{ justifyContent: 'flex-start' }}>
            <PenLine size={14} style={{ marginRight: '6px' }} /> Review
          </Button>
          <Button variant="secondary" size="sm" onClick={onRandomPick} style={{ justifyContent: 'flex-start' }}>
            <Shuffle size={14} style={{ marginRight: '6px' }} /> Random
          </Button>
        </div>
      </Card>

      {/* 5. DAILY QUOTE CARD */}
      <Card variant="default">
        <h3 style={{ fontSize: 'var(--fs-card-title)', fontWeight: 700, marginBottom: '12px' }}>Daily Quote</h3>
        <blockquote style={{ margin: 0, fontStyle: 'italic', fontSize: 'var(--fs-small)', color: 'var(--text-muted)' }}>
          <p style={{ margin: '0 0 6px 0', color: 'var(--text-primary)' }}>"{dailyQuote.quote}"</p>
          <cite style={{ fontSize: '11px', display: 'block' }}>— {dailyQuote.film}</cite>
        </blockquote>
      </Card>
    </aside>
  )
}
