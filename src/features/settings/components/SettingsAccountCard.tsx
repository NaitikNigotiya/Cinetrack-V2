import { User, Info, LogOut } from 'lucide-react'
import { Card } from '@/shared/ui/layout/Card'
import { Button } from '@/shared/ui/Button/Button'

interface SettingsAccountCardProps {
  user: {
    photoURL?: string | null | undefined
    displayName?: string | null | undefined
    email?: string | null | undefined
  } | null
  onSignOut: () => void
}

export function SettingsAccountCard({ user, onSignOut }: SettingsAccountCardProps) {
  return (
    <>
      <Card variant="default">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <User size={18} color="var(--brand-primary)" />
          <span style={{ fontSize: 'var(--fs-card-title)', fontWeight: 700 }}>Account</span>
        </div>

        <div className="settings-row" style={{ borderBottom: 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {user?.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName || 'User'}
                style={{ width: '40px', height: '40px', borderRadius: '50%' }}
              />
            ) : (
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: 'var(--surface-page)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '16px',
                  color: 'var(--text-primary)',
                }}
              >
                {(user?.displayName || user?.email || '?').charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <div style={{ fontSize: 'var(--fs-body)', fontWeight: 600 }}>
                {user?.displayName || 'CineTrack User'}
              </div>
              <div style={{ fontSize: 'var(--fs-small)', color: 'var(--text-muted)' }}>
                {user?.email || 'Anonymous Session'}
              </div>
            </div>
          </div>

          <Button variant="danger" size="sm" onClick={onSignOut}>
            <LogOut size={15} style={{ marginRight: '6px' }} /> Sign Out
          </Button>
        </div>
      </Card>

      <Card variant="default">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <Info size={18} color="var(--brand-primary)" />
          <span style={{ fontSize: 'var(--fs-card-title)', fontWeight: 700 }}>About</span>
        </div>

        <div className="settings-row">
          <div style={{ fontSize: 'var(--fs-body)', fontWeight: 600 }}>Version</div>
          <div style={{ fontSize: 'var(--fs-small)', color: 'var(--text-muted)' }}>Cinetrack V2.0</div>
        </div>

        <div className="settings-row">
          <div style={{ fontSize: 'var(--fs-body)', fontWeight: 600 }}>Tech Stack</div>
          <div style={{ fontSize: 'var(--fs-small)', color: 'var(--text-muted)' }}>
            React 19 · TypeScript · Firebase · TMDb · Vite PWA
          </div>
        </div>

        <p style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.6, margin: '16px 0 0 0' }}>
          This product uses the TMDB API but is not endorsed or certified by TMDB. All movie and TV show data & imagery are provided by TMDB.
        </p>
      </Card>
    </>
  )
}
