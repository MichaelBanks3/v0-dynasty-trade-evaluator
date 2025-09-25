"use client"

import { useTradeStore } from "@/lib/store"
import { Button } from "@/components/ui/button"

export function ActiveSideControl() {
  const { activeSide, setActiveSide } = useTradeStore()

  return (
    <div className="flex items-center gap-2 p-1 bg-muted rounded-lg">
      <Button
        variant={activeSide === "A" ? "default" : "ghost"}
        size="sm"
        onClick={() => setActiveSide("A")}
        className="flex-1"
        data-testid="active-side-a"
      >
        Team A
      </Button>
      <Button
        variant={activeSide === "B" ? "default" : "ghost"}
        size="sm"
        onClick={() => setActiveSide("B")}
        className="flex-1"
        data-testid="active-side-b"
      >
        Team B
      </Button>
    </div>
  )
}
