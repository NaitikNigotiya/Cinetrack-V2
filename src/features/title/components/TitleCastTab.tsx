import { Users, UserCheck } from 'lucide-react'
import type { CastMember, CrewMember } from '@/shared/schemas/title'
import { getProfileUrl } from '@/services/tmdb/images'
import { Card } from '@/shared/ui/layout/Card'
import { EmptyStateCard } from '@/shared/ui/layout/EmptyStateCard'

interface TitleCastTabProps {
  cast: CastMember[]
  crew: CrewMember[]
}

export function TitleCastTab({ cast, crew }: TitleCastTabProps) {
  const directors = crew.filter((c) => c.job === 'Director')
  const writers = crew.filter((c) => c.job === 'Writer' || c.job === 'Screenplay')
  const producers = crew.filter((c) => c.job === 'Producer' || c.job === 'Executive Producer').slice(0, 4)

  if (cast.length === 0 && crew.length === 0) {
    return (
      <EmptyStateCard
        icon={<Users size={32} />}
        title="No Cast & Crew Information"
        description="Detailed billing is not yet listed for this title on TMDB."
      />
    )
  }

  return (
    <div className="title-cast-tab-container">
      {/* Key Crew Overview */}
      {(directors.length > 0 || writers.length > 0 || producers.length > 0) && (
        <Card className="title-section-card title-key-crew-card">
          <div className="title-card-header">
            <h3 className="title-card-heading">Key Crew</h3>
          </div>
          <div className="title-crew-grid">
            {directors.length > 0 && (
              <div className="title-crew-item">
                <span className="title-crew-role">Director{directors.length > 1 ? 's' : ''}</span>
                <span className="title-crew-name">{directors.map((d) => d.name).join(', ')}</span>
              </div>
            )}
            {writers.length > 0 && (
              <div className="title-crew-item">
                <span className="title-crew-role">Writing / Screenplay</span>
                <span className="title-crew-name">{writers.map((w) => w.name).join(', ')}</span>
              </div>
            )}
            {producers.length > 0 && (
              <div className="title-crew-item">
                <span className="title-crew-role">Producers</span>
                <span className="title-crew-name">{producers.map((p) => p.name).join(', ')}</span>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Main Cast Grid */}
      <div className="title-cast-section">
        <div className="title-section-title-row">
          <h3 className="title-section-title">Cast ({cast.length})</h3>
        </div>

        <div className="title-cast-full-grid">
          {cast.map((member) => {
            const avatar = member.profilePath ? getProfileUrl(member.profilePath, 'w185') : null
            return (
              <div key={member.id} className="title-cast-card">
                <div className="title-cast-avatar-wrapper">
                  {avatar ? (
                    <img
                      src={avatar}
                      alt={member.name}
                      className="title-cast-avatar-img"
                      loading="lazy"
                    />
                  ) : (
                    <div className="title-cast-avatar-fallback">
                      <UserCheck size={28} />
                    </div>
                  )}
                </div>
                <div className="title-cast-meta">
                  <div className="title-cast-actor-name">{member.name}</div>
                  <div className="title-cast-character-name">{member.character || 'Cast'}</div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
