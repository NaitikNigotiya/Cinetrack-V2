import { useNavigate } from 'react-router-dom'
import { PageShell } from '@/shared/ui/layout/PageShell'
import { PageHeader } from '@/shared/ui/layout/PageHeader'
import { EmptyStateCard } from '@/shared/ui/layout/EmptyStateCard'
import { Button } from '@/shared/ui/Button/Button'

export default function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <PageShell>
      <PageHeader
        eyebrow="404"
        title="Page Not Found"
        subtitle="The page you were looking for doesn't exist or has moved."
      />

      <EmptyStateCard
        icon="🎬"
        title="Lost in the Reels?"
        description="We couldn't find the page you're looking for. Let's get you back on track."
        action={
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <Button variant="primary" onClick={() => navigate('/')}>
              Go to Dashboard
            </Button>
            <Button variant="secondary" onClick={() => navigate('/discover')}>
              Discover Movies
            </Button>
          </div>
        }
      />
    </PageShell>
  )
}
