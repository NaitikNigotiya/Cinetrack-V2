import type { WatchProvidersSection } from '@/shared/schemas/title'
import { getPosterUrl } from '@/shared/lib/tmdbImage'
import { Tv, ExternalLink } from 'lucide-react'

interface TitleWatchProvidersProps {
  providers?: WatchProvidersSection | null | undefined
}

export function TitleWatchProviders({ providers }: TitleWatchProvidersProps) {
  if (!providers) return null

  const streamProviders = providers.flatrate ?? []
  const rentProviders = providers.rent ?? []
  const buyProviders = providers.buy ?? []
  const freeProviders = providers.free ?? []

  const hasAny =
    streamProviders.length > 0 ||
    rentProviders.length > 0 ||
    buyProviders.length > 0 ||
    freeProviders.length > 0

  if (!hasAny) {
    return null
  }

  const renderBadgeList = (list: typeof streamProviders) => (
    <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-2)', flexWrap: 'wrap' }}>
      {list.map((p) => {
        const logo = getPosterUrl(p.logoPath, 'w92')
        return (
          <div
            key={p.id}
            title={p.name}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '4px 10px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--surface-overlay)',
              border: '1px solid var(--border-subtle)',
              fontSize: 'var(--font-size-xs)',
              fontWeight: 500,
            }}
          >
            {logo && (
              <img
                src={logo}
                alt=""
                style={{ width: '22px', height: '22px', borderRadius: '4px', objectFit: 'cover' }}
              />
            )}
            <span>{p.name}</span>
          </div>
        )
      })}
    </div>
  )

  return (
    <section
      style={{
        padding: 'var(--space-6)',
        backgroundColor: 'var(--surface-raised)',
        borderRadius: 'var(--radius-xl)',
        border: '1px solid var(--border-subtle)',
        marginBottom: 'var(--space-8)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Tv size={20} color="var(--accent)" />
          <h2 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700 }}>Where to Watch</h2>
        </div>
        {providers.link && (
          <a
            href={providers.link}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: 'var(--font-size-xs)',
              color: 'var(--accent)',
              textDecoration: 'none',
            }}
          >
            <span>JustWatch</span>
            <ExternalLink size={12} />
          </a>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        {streamProviders.length > 0 && (
          <div>
            <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase' }}>
              Stream
            </span>
            {renderBadgeList(streamProviders)}
          </div>
        )}

        {freeProviders.length > 0 && (
          <div>
            <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase' }}>
              Free
            </span>
            {renderBadgeList(freeProviders)}
          </div>
        )}

        {(rentProviders.length > 0 || buyProviders.length > 0) && (
          <div>
            <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase' }}>
              Rent / Buy
            </span>
            {renderBadgeList([...rentProviders, ...buyProviders.filter(b => !rentProviders.some(r => r.id === b.id))].slice(0, 8))}
          </div>
        )}

        <div style={{ fontSize: '11px', color: 'var(--text-3)', marginTop: 'var(--space-2)' }}>
          Streaming availability data Powered by JustWatch via TMDB ({providers.region}).
        </div>
      </div>
    </section>
  )
}
