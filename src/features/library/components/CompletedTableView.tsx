import { Film } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { getPosterUrl } from '@/shared/lib/tmdbImage'
import type { LibraryEntry } from '@/shared/schemas'

export type SortColumn = 'date' | 'title' | 'rating' | 'runtime'

interface CompletedTableViewProps {
  sortedList: Array<LibraryEntry & { completionDate: Date }>
  sortCol: SortColumn
  sortAsc: boolean
  onSortChange: (col: SortColumn) => void
}

export function CompletedTableView({
  sortedList,
  sortCol,
  sortAsc,
  onSortChange,
}: CompletedTableViewProps) {
  const navigate = useNavigate()

  return (
    <div
      style={{
        overflowX: 'auto',
        background: 'var(--surface-card)',
        borderRadius: 'var(--radius-card)',
        border: '1px solid var(--border-card)',
      }}
    >
      <table className="list-view-table">
        <thead>
          <tr>
            <th className="sortable-th" onClick={() => onSortChange('title')}>
              Title {sortCol === 'title' ? (sortAsc ? '▲' : '▼') : ''}
            </th>
            <th className="sortable-th" onClick={() => onSortChange('date')}>
              Date Finished {sortCol === 'date' ? (sortAsc ? '▲' : '▼') : ''}
            </th>
            <th className="sortable-th" onClick={() => onSortChange('rating')}>
              Rating {sortCol === 'rating' ? (sortAsc ? '▲' : '▼') : ''}
            </th>
            <th className="sortable-th" onClick={() => onSortChange('runtime')}>
              Runtime {sortCol === 'runtime' ? (sortAsc ? '▲' : '▼') : ''}
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedList.map((entry) => {
            const poster = getPosterUrl(entry.posterPath, 'w92')
            return (
              <tr
                key={entry.titleKey}
                className="list-view-row"
                onClick={() => navigate(`/title/${entry.titleKey}`)}
              >
                <td>
                  <div className="list-title-cell">
                    {poster ? (
                      <img src={poster} alt={entry.title} className="list-row-thumb" />
                    ) : (
                      <div className="list-row-thumb-ph">
                        <Film size={12} />
                      </div>
                    )}
                    <div>
                      <div style={{ fontWeight: 600 }}>{entry.title}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        {entry.year || '—'} · {entry.type === 'tv' ? 'TV' : 'Movie'}
                      </div>
                    </div>
                  </div>
                </td>
                <td>
                  {entry.completionDate.toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </td>
                <td>
                  {entry.rating ? (
                    <span style={{ color: 'var(--star-filled, #f5c518)', fontWeight: 600 }}>
                      ⭐ {entry.rating.toFixed(1)}
                    </span>
                  ) : (
                    <span style={{ color: 'var(--text-muted)' }}>—</span>
                  )}
                </td>
                <td>{entry.runtimeMinutes ? `${entry.runtimeMinutes} min` : '—'}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
