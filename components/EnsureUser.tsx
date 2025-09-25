"use client"

import { SignedIn } from "@clerk/nextjs"
import { useEffect } from "react"

export function EnsureUser() {
  useEffect(() => {
    // Ensure user exists in database when signed in
    fetch('/api/users/ensure', { method: 'POST' }).catch(() => {})
  }, [])

  return (
    <SignedIn>
      <span hidden />
    </SignedIn>
  )
}
