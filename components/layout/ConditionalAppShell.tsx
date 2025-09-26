"use client"

import { usePathname } from 'next/navigation'
import { AppShell } from '@/components/AppShell'

interface ConditionalAppShellProps {
  children: React.ReactNode
}

export function ConditionalAppShell({ children }: ConditionalAppShellProps) {
  const pathname = usePathname()
  
  // Pages that should use SiteShell instead of AppShell
  const siteShellPages = ['/not-found', '/404']
  
  // Check if current page should use SiteShell
  const shouldUseSiteShell = siteShellPages.some(page => pathname === page)
  
  if (shouldUseSiteShell) {
    return <>{children}</>
  }
  
  return <AppShell>{children}</AppShell>
}
