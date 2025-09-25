"use client"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { AlertCircle, RefreshCw, Copy } from "lucide-react"
import { useState } from "react"

interface ErrorBannerProps {
  error: string
  incidentId?: string
  onRetry?: () => void
  className?: string
}

export function ErrorBanner({ error, incidentId, onRetry, className }: ErrorBannerProps) {
  const [copied, setCopied] = useState(false)

  const copyErrorDetails = async () => {
    const details = `Error: ${error}${incidentId ? `\nIncident ID: ${incidentId}` : ''}`
    try {
      await navigator.clipboard.writeText(details)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy error details:', error)
    }
  }

  return (
    <Alert variant="destructive" className={className}>
      <AlertCircle className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between">
        <div className="flex-1">
          <p className="font-medium">{error}</p>
          {incidentId && (
            <p className="text-sm opacity-90 mt-1">
              Incident ID: <code className="bg-red-100 px-1 py-0.5 rounded text-xs">{incidentId}</code>
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 ml-4">
          {incidentId && (
            <Button
              variant="ghost"
              size="sm"
              onClick={copyErrorDetails}
              className="h-6 w-6 p-0"
            >
              <Copy className="h-3 w-3" />
            </Button>
          )}
          {onRetry && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onRetry}
              className="h-6 w-6 p-0"
            >
              <RefreshCw className="h-3 w-3" />
            </Button>
          )}
        </div>
      </AlertDescription>
    </Alert>
  )
}
