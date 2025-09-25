"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { 
  User, 
  Settings, 
  LogOut, 
  BarChart3, 
  Plus,
  Menu,
  X
} from "lucide-react"

interface AppShellProps {
  children: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname()
  const { user, isSignedIn } = useUser()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navItems = [
    { href: "/trade", label: "Create Trade", icon: Plus },
    { href: "/dashboard", label: "Dashboard", icon: BarChart3 },
  ]

  const isActive = (href: string) => pathname === href

  return (
    <div className="min-h-screen bg-bg">
      {/* Sticky Top Navigation */}
      <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Left: App Name/Logo */}
            <div className="flex items-center">
              <Link href="/" className="flex items-center space-x-2">
                <div className="h-8 w-8 rounded-lg bg-accent flex items-center justify-center">
                  <BarChart3 className="h-5 w-5 text-accent-contrast" />
                </div>
                <span className="text-xl font-bold text-text">Dynasty Trade Evaluator</span>
              </Link>
            </div>

            {/* Center: Navigation Tabs (md+) */}
            <nav className="hidden md:flex items-center space-x-1">
              {navItems.map((item) => {
                const Icon = item.icon
                return (
                  <Link key={item.href} href={item.href}>
                    <Button
                      variant={isActive(item.href) ? "default" : "ghost"}
                      size="sm"
                      className={`h-9 px-4 ${
                        isActive(item.href)
                          ? "bg-accent text-accent-contrast hover:bg-accent/90"
                          : "text-subtext hover:text-text hover:bg-muted/50"
                      }`}
                    >
                      <Icon className="h-4 w-4 mr-2" />
                      {item.label}
                    </Button>
                  </Link>
                )
              })}
            </nav>

            {/* Right: User Menu */}
            <div className="flex items-center space-x-4">
              {isSignedIn ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-9 px-3">
                      <div className="flex items-center space-x-2">
                        <div className="h-6 w-6 rounded-full bg-accent flex items-center justify-center">
                          <User className="h-4 w-4 text-accent-contrast" />
                        </div>
                        <span className="hidden sm:block text-sm text-text">
                          {user?.firstName || user?.emailAddresses[0]?.emailAddress}
                        </span>
                      </div>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard" className="flex items-center">
                        <BarChart3 className="h-4 w-4 mr-2" />
                        Dashboard
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/team" className="flex items-center">
                        <Settings className="h-4 w-4 mr-2" />
                        Team Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/sign-out" className="flex items-center text-destructive">
                        <LogOut className="h-4 w-4 mr-2" />
                        Sign Out
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/sign-in">Sign In</Link>
                  </Button>
                  <Button size="sm" className="bg-accent text-accent-contrast hover:bg-accent/90" asChild>
                    <Link href="/sign-up">Sign Up</Link>
                  </Button>
                </div>
              )}

              {/* Mobile menu button */}
              <Button
                variant="ghost"
                size="sm"
                className="md:hidden h-9 px-2"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>

          {/* Mobile Navigation Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-border/50 bg-surface">
              <div className="px-2 pt-2 pb-3 space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon
                  return (
                    <Link key={item.href} href={item.href} onClick={() => setMobileMenuOpen(false)}>
                      <Button
                        variant={isActive(item.href) ? "default" : "ghost"}
                        size="sm"
                        className={`w-full justify-start h-10 ${
                          isActive(item.href)
                            ? "bg-accent text-accent-contrast"
                            : "text-subtext hover:text-text hover:bg-muted/50"
                        }`}
                      >
                        <Icon className="h-4 w-4 mr-3" />
                        {item.label}
                      </Button>
                    </Link>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>
    </div>
  )
}
