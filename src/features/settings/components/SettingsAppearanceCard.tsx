import { Palette } from 'lucide-react'
import { Card } from '@/shared/ui/layout/Card'
import { Button } from '@/shared/ui/Button/Button'

interface SettingsAppearanceCardProps {
  theme: 'light' | 'dark' | 'system'
  setTheme: (t: 'light' | 'dark' | 'system') => void
  accentColor: string
  setAccentColor: (c: string) => void
  ratingSystem: string
  setRatingSystem: (r: string) => void
}

export function SettingsAppearanceCard({
  theme,
  setTheme,
  accentColor,
  setAccentColor,
  ratingSystem,
  setRatingSystem,
}: SettingsAppearanceCardProps) {
  return (
    <Card variant="default">
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
        <Palette size={18} color="var(--brand-primary)" />
        <span style={{ fontSize: 'var(--fs-card-title)', fontWeight: 700 }}>Appearance</span>
      </div>

      {/* Row 1: Theme */}
      <div className="settings-row">
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 'var(--fs-body)', fontWeight: 600 }}>Theme</div>
          <div style={{ fontSize: 'var(--fs-small)', color: 'var(--text-muted)', marginTop: '2px' }}>
            {theme === 'light' && 'IMDb-inspired warm theme'}
            {theme === 'dark' && 'Netflix-inspired dark theme'}
            {theme === 'system' && 'Follows system device settings'}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '4px' }}>
          {[
            { value: 'light', label: '☀️ Light' },
            { value: 'system', label: '🌓 System' },
            { value: 'dark', label: '🌙 Dark' },
          ].map((opt) => (
            <Button
              key={opt.value}
              variant={theme === opt.value ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setTheme(opt.value as 'light' | 'dark' | 'system')}
            >
              {opt.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Row 2: Accent Color */}
      <div className="settings-row">
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 'var(--fs-body)', fontWeight: 600 }}>Accent Color</div>
          <div style={{ fontSize: 'var(--fs-small)', color: 'var(--text-muted)', marginTop: '2px' }}>
            Customize the app's brand theme color
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          {['#E50914', '#F5C518', '#8B5CF6', '#2ECC71', '#00B4D8', '#FF6B6B'].map((color) => {
            const isSelected = accentColor === color
            return (
              <button
                key={color}
                onClick={() => setAccentColor(color)}
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: color,
                  border: 'none',
                  cursor: 'pointer',
                  outline: isSelected ? '2px solid var(--text-primary)' : 'none',
                  outlineOffset: isSelected ? '2px' : '0px',
                  transform: isSelected ? 'scale(1.2)' : 'none',
                  transition: 'all 150ms ease',
                }}
                type="button"
                aria-label={`Select accent color ${color}`}
              />
            )
          })}
        </div>
      </div>

      {/* Row 3: Rating System */}
      <div className="settings-row" style={{ borderBottom: 'none' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 'var(--fs-body)', fontWeight: 600 }}>Rating Scale</div>
          <div style={{ fontSize: 'var(--fs-small)', color: 'var(--text-muted)', marginTop: '2px' }}>
            How ratings are displayed
          </div>
        </div>

        <div style={{ display: 'flex', gap: '4px' }}>
          {[
            { value: 'ten', label: '/10' },
            { value: 'five', label: '/5' },
            { value: 'half', label: '/5½' },
          ].map((opt) => (
            <Button
              key={opt.value}
              variant={ratingSystem === opt.value ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => {
                setRatingSystem(opt.value)
                localStorage.setItem('cinetrack-rating-system', opt.value)
              }}
            >
              {opt.label}
            </Button>
          ))}
        </div>
      </div>
    </Card>
  )
}
