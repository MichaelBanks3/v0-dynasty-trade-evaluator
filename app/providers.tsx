"use client"

import { ClerkProvider } from '@clerk/nextjs'
import { AppNav } from '@/components/AppNav'
import { EnsureUser } from '@/components/EnsureUser'
import { ClientErrorBoundary } from '@/components/ClientErrorBoundary'

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <AppNav />
      <EnsureUser />
      <main className="pt-16">
        <ClientErrorBoundary>
          {children}
        </ClientErrorBoundary>
      </main>
    </ClerkProvider>
  )
}