"use client"

import { ClerkProvider } from '@clerk/nextjs'
import { EnsureUser } from '@/components/EnsureUser'
import { ClientErrorBoundary } from '@/components/ClientErrorBoundary'

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <EnsureUser />
      <ClientErrorBoundary>
        {children}
      </ClientErrorBoundary>
    </ClerkProvider>
  )
}