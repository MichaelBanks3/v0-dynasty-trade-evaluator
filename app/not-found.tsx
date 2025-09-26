import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { SiteShell } from '@/components/layout/SiteShell'

export default function NotFound() {
  return (
    <SiteShell
      title="Page Not Found"
      subtitle="The page you're looking for doesn't exist."
      right={
        <Button asChild>
          <Link href="/">Go Home</Link>
        </Button>
      }
    >
      <div className="text-center py-16">
        <div className="text-6xl font-bold text-muted mb-4">404</div>
        <p className="text-muted">
          The page you're looking for might have been moved, deleted, or doesn't exist.
        </p>
      </div>
    </SiteShell>
  )
}
