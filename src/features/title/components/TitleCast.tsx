import { getPosterUrl } from '@/shared/lib/tmdbImage'
import { User } from 'lucide-react'
import type { TmdbCastMember } from '@/services/tmdb/tmdb.schema'

export function TitleCast({ cast }: { cast: TmdbCastMember[] }) {
  if (cast.length === 0) return null

  const topCast = cast.slice(0, 12)

  return (
    <section style={{ marginBottom: 'var(--space-8)' }}>
      <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, marginBottom: 'var(--space-4)' }}>
        Cast & Crew
      </h2>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
          gap: 'var(--space-3)',
        }}
      >
        {topCast.map((c) => {
          const profileUrl = getPosterUrl(c.profile_path, 'w185')
          return (
            <div
              key={c.id}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--surface-raised)',
                padding: 'var(--space-2)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div
                style={{
                  width: '100%',
                  aspectRatio: '2/3',
                  borderRadius: 'var(--radius-sm)',
                  overflow: 'hidden',
                  backgroundColor: 'var(--surface-overlay)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {profileUrl ? (
                  <img
                    src={profileUrl}
                    alt={c.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    loading="lazy"
                  />
                ) : (
                  <User size={28} color="var(--text-3)" />
                )}
              </div>
              <div>
                <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600, color: 'var(--text-1)' }}>
                  {c.name}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>{c.character}</div>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
