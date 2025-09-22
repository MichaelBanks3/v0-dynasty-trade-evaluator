"use client"

import { AlertTriangle } from "lucide-react"

export function AuthEnvBanner() {
  const hasKeys = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY)
  if (hasKeys) return null

  return (
    <div className="w-full bg-yellow-100 text-yellow-900 px-4 py-3 rounded-md border border-yellow-300">
      <div className="flex items-center space-x-2 text-sm">
        <AlertTriangle className="h-4 w-4" />
        <span>
          Clerk keys missing. Add NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY and CLERK_SECRET_KEY to .env.local to enable
          authentication.
        </span>
      </div>
    </div>
  )
}


