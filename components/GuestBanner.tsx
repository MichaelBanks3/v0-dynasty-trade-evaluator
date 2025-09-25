"use client"

import { useState } from "react"
import { useSignIn } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { X, LogIn, Info } from "lucide-react"
import Link from "next/link"

interface GuestBannerProps {
  className?: string
}

export function GuestBanner({ className }: GuestBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false)
  const { openSignIn } = useSignIn()

  if (isDismissed) {
    return null
  }

  const handleSignIn = () => {
    openSignIn?.()
  }

  return (
    <Card className={`bg-muted/50 border-border/50 ${className}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-warn/20 text-warn border-warn/30">
                Guest Mode
              </Badge>
              <Info className="h-4 w-4 text-subtext" />
            </div>
            <div className="text-sm text-text">
              You're in guest mode. Trades won't be saved. Sign in to unlock saving & league suggestions.
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              asChild
              className="text-subtext hover:text-text"
            >
              <Link href="/settings">
                Learn more
              </Link>
            </Button>
            <Button
              size="sm"
              onClick={handleSignIn}
              className="bg-accent text-accent-contrast hover:bg-accent/90"
            >
              <LogIn className="h-4 w-4 mr-2" />
              Sign in
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsDismissed(true)}
              className="text-subtext hover:text-text"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
