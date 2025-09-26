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
        <AlertCircle className="h-16 w-16 theme-muted mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">Error Loading Dashboard</h1>
        <p className="theme-muted mb-6">{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="btn-ghost focus-ring"
        >
          Try Again
        </button>
      </div>
    </div>
  )
}
