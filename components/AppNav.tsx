"use client"

import { useAuth } from '@clerk/nextjs'
import { UserButton } from '@clerk/nextjs'
import Link from 'next/link'

export function AppNav() {
  const { isSignedIn } = useAuth()

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Site title/logo */}
          <div className="flex-shrink-0">
            <Link href="/" className="text-xl font-bold text-foreground hover:text-primary transition-colors">
              Dynasty Trade Evaluator
            </Link>
          </div>

          {/* Center: Navigation links */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              <Link
                href="/"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-md px-3 py-2 hover:bg-accent"
              >
                Home
              </Link>
              <Link
                href="/trade"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-md px-3 py-2 hover:bg-accent"
              >
                Create Trade
              </Link>
              <Link
                href="/dashboard"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-md px-3 py-2 hover:bg-accent"
              >
                Dashboard
              </Link>
            </div>
          </div>

          {/* Right: Clerk controls */}
          <div className="flex items-center space-x-4">
            {isSignedIn ? (
              <UserButton afterSignOutUrl="/" />
            ) : (
              <Link
                href="/sign-in"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-md px-3 py-2 hover:bg-accent"
              >
                Sign in
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className="md:hidden">
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t border-border">
          <Link
            href="/"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors block px-3 py-2 rounded-md hover:bg-accent"
          >
            Home
          </Link>
          <Link
            href="/trade"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors block px-3 py-2 rounded-md hover:bg-accent"
          >
            Create Trade
          </Link>
          <Link
            href="/dashboard"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors block px-3 py-2 rounded-md hover:bg-accent"
          >
            Dashboard
          </Link>
        </div>
      </div>
    </nav>
  )
}
