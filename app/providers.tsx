"use client"

import { ClerkProvider } from '@clerk/nextjs'
import { AppNav } from '@/components/AppNav'
import { EnsureUser } from '@/components/EnsureUser'

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <AppNav />
      <EnsureUser />
      <main className="pt-16">
        {children}
      </main>
    </ClerkProvider>
  )
}
