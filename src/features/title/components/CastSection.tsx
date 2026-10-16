import type { CastMember, CrewMember } from '@/shared/schemas/title'
import { getProfileUrl } from '@/services/tmdb/images'
import { User } from 'lucide-react'

interface CastSectionProps {
  cast: CastMember[]
  crew?: CrewMember[]
}

export function CastSection({ cast, crew = [] }: CastSectionProps) {
  if (cast.length === 0 && crew.length === 0) {
    return <div style={{ color: 'var(--text-3)', padding: 'var(--space-4) 0' }}>No cast or crew details available.</div>
  }

  // Group crew by key roles
  const directors = crew.filter((c) => c.job === 'Director')
  const writers = crew.filter((c) => c.job === 'Screenplay' || c.job === 'Writer')
  const creators = crew.filter((c) => c.job === 'Creator')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
      {/* Key Crew Bar if present */}
      {(directors.length > 0 || creators.length > 0 || writers.length > 0) && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 'var(--space-6)',
            padding: 'var(--space-4)',
            backgroundColor: 'var(--surface-raised)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          {directors.length > 0 && (
            <div>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-3)', fontWeight: 600 }}>
                Director{directors.length > 1 ? 's' : ''}
              </div>
              <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 500, color: 'var(--text-1)' }}>
                {directors.map((d) => d.name).join(', ')}
              </div>
            </div>
          )}
          {creators.length > 0 && (
            <div>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-3)', fontWeight: 600 }}>
                Created by
              </div>
              <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 500, color: 'var(--text-1)' }}>
                {creators.map((c) => c.name).join(', ')}
              </div>
            </div>
          )}
          {writers.length > 0 && (
            <div>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-3)', fontWeight: 600 }}>
                Writer{writers.length > 1 ? 's' : ''}
              </div>
              <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 500, color: 'var(--text-1)' }}>
                {writers.map((w) => w.name).join(', ')}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Cast Grid */}
      {cast.length > 0 && (
        <div>
          <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700, marginBottom: 'var(--space-4)' }}>
            Top Cast
          </h3>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
              gap: 'var(--space-3)',
            }}
          >
            {cast.map((actor) => {
              const profileUrl = getProfileUrl(actor.profilePath, 'w185')

              return (
                <div
                  key={actor.id}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--surface-raised)',
                    padding: 'var(--space-2)',
                    border: '1px solid var(--border-subtle)',
                    transition: 'transform 0.15s ease',
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
                        alt={actor.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        loading="lazy"
                      />
                    ) : (
                      <User size={28} color="var(--text-3)" />
                    )}
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: 'var(--font-size-xs)',
                        fontWeight: 600,
                        color: 'var(--text-1)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                      title={actor.name}
                    >
                      {actor.name}
                    </div>
                    {actor.character && (
                      <div
                        style={{
                          fontSize: '11px',
                          color: 'var(--text-3)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                        title={actor.character}
                      >
                        {actor.character}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
