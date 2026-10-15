import type { z } from 'zod'
import type { TmdbWatchProvidersResponseSchema } from '@/services/tmdb/tmdb.schema'
import { getPosterUrl } from '@/shared/lib/tmdbImage'
import { Tv } from 'lucide-react'

type WatchProvidersData = z.infer<typeof TmdbWatchProvidersResponseSchema>

interface TitleWatchProvidersProps {
  providers?: WatchProvidersData | undefined
  region?: string | undefined
}

export function TitleWatchProviders({ providers, region = 'US' }: TitleWatchProvidersProps) {
  const regionData = providers?.results?.[region] || providers?.results?.['US']
  const streamProviders = regionData?.flatrate || []
  const rentProviders = regionData?.rent || []

  if (streamProviders.length === 0 && rentProviders.length === 0) {
    return null
  }

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
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--space-4)' }}>
        <Tv size={20} color="var(--accent)" />
        <h2 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700 }}>Where to Watch</h2>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        {streamProviders.length > 0 && (
          <div>
            <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase' }}>
              Stream
            </span>
            <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-2)', flexWrap: 'wrap' }}>
              {streamProviders.map((p) => {
                const logo = getPosterUrl(p.logo_path, 'w92')
                return (
                  <div
                    key={p.provider_id}
                    title={p.provider_name}
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
                        style={{ width: '24px', height: '24px', borderRadius: '4px' }}
                      />
                    )}
                    <span>{p.provider_name}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {rentProviders.length > 0 && (
          <div>
            <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase' }}>
              Rent or Buy
            </span>
            <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-2)', flexWrap: 'wrap' }}>
              {rentProviders.slice(0, 5).map((p) => {
                const logo = getPosterUrl(p.logo_path, 'w92')
                return (
                  <div
                    key={p.provider_id}
                    title={p.provider_name}
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
                        style={{ width: '24px', height: '24px', borderRadius: '4px' }}
                      />
                    )}
                    <span>{p.provider_name}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <div style={{ fontSize: '11px', color: 'var(--text-3)', marginTop: 'var(--space-2)' }}>
          Streaming availability data provided by JustWatch via TMDB.
        </div>
      </div>
    </section>
  )
}
