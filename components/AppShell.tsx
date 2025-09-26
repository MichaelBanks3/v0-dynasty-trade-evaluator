"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User, Settings, LogOut, BarChart3, Plus, Menu, X } from "lucide-react";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const { user, isSignedIn } = useUser();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { href: "/trade", label: "Create Trade", icon: Plus },
    { href: "/dashboard", label: "Dashboard", icon: BarChart3 },
  ];

  const isActive = (href: string) => pathname === href;

  return (
    <div className="min-h-screen bg-bg">
      {/* Sticky Top Navigation */}
      <header className="sticky top-0 z-40 bg-surface/95 backdrop-blur border-b border-[color:var(--border)]" style={{position:'relative', zIndex:50}}>
        <div className="h-1 w-full bg-[color:var(--primary)]" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex items-center justify-between h-14">
          {/* Left: App Name/Logo */}
          <span className="font-semibold tracking-wide">
            Dynasty Trade Evaluator
          </span>

          {/* Center: Navigation Tabs (md+) */}
          <nav className="hidden md:flex items-center gap-6 text-sm">
            {navItems.map((item) => {
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="btn-ghost focus-ring"
                >
                  {item.label}
                </Link>
              );
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
                        {user?.firstName ||
                          user?.emailAddresses[0]?.emailAddress}
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
                    <Link
                      href="/sign-out"
                      className="flex items-center text-destructive"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center space-x-2">
                <Link href="/sign-in" className="btn-ghost focus-ring">Sign In</Link>
                <Link href="/sign-up" className="btn-primary focus-ring">Sign Up</Link>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              className="md:hidden h-9 px-2 btn-ghost focus-ring"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t theme-border theme-card">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`w-full justify-start h-10 flex items-center px-3 py-2 rounded-md transition-colors ${
                      isActive(item.href)
                        ? "btn-primary"
                        : "btn-ghost focus-ring"
                    }`}
                  >
                    <Icon className="h-4 w-4 mr-3" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>
    </div>
  );
}
