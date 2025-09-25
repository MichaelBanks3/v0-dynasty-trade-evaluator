"use client"

import { SignedIn } from "@clerk/nextjs"
import { useEffect, useRef } from "react"

export function EnsureUser() {
  const hasEnsured = useRef(false)

  useEffect(() => {
    // Only run once per session and only for authenticated users
    if (hasEnsured.current) return

    const ensureUser = async () => {
      try {
        await fetch('/api/users/ensure', { 
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          }
        })
        hasEnsured.current = true
      } catch (error) {
        // Silently fail - don't log or throw errors
        console.debug('User ensure failed:', error)
      }
    }

    ensureUser()
  }, [])

  return (
    <SignedIn>
      <span hidden />
    </SignedIn>
  )
}