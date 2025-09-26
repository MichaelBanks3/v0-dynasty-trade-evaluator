"use client"

import { Button } from '@/components/ui/button'
import { AlertCircle } from 'lucide-react'

interface DashboardErrorProps {
  error: string
}

export function DashboardError({ error }: DashboardErrorProps) {
  return (
    <div data-testid="dashboard-error" className="space-y-6">
      <div className="text-center py-16">
        <AlertCircle className="h-16 w-16 text-muted mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-fg mb-2">Error Loading Dashboard</h1>
        <p className="text-muted mb-6">{error}</p>
        <Button 
          onClick={() => window.location.reload()} 
          variant="secondary"
        >
          Try Again
        </Button>
      </div>
    </div>
  )
}
