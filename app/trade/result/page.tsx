"use client"

import { useTradeStore } from "@/lib/store"
import { TradeResultCard } from "@/components/TradeResultCard"
import { safeArray } from "@/lib/safe"
import { Button } from "@/components/ui/button"
import { AlertCircle } from "lucide-react"
import { useEffect, useState } from "react"

export default function TradeResultPage() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </div>
    )
  }

  return <TradeResultPageContent />
}

function TradeResultPageContent() {
  const { teamAAssets, teamBAssets } = useTradeStore()
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Safely get arrays
  const safeTeamAAssets = safeArray(teamAAssets)
  const safeTeamBAssets = safeArray(teamBAssets)

  useEffect(() => {
    if (safeTeamAAssets.length === 0 && safeTeamBAssets.length === 0) {
      return
    }

    setLoading(true)
    setError(null)

    // Create a mock result for now since we're using the store data
    const teamATotal = safeTeamAAssets.reduce((sum: number, asset: any) => sum + (asset?.baseValue || 0), 0)
    const teamBTotal = safeTeamBAssets.reduce((sum: number, asset: any) => sum + (asset?.baseValue || 0), 0)
    const difference = Math.abs(teamATotal - teamBTotal)
    
    let verdict = "FAIR"
    if (difference > 50) {
      verdict = teamATotal > teamBTotal ? "FAVORS_A" : "FAVORS_B"
    }

    // Convert store assets to the format expected by TradeResultCard
    const teamAPlayers = safeTeamAAssets.map((asset: any) => ({
      id: parseInt(asset?.id || '0'),
      name: asset?.label || 'Unknown Asset',
      position: asset?.type === "player" ? (asset?.position || 'Unknown') : "PICK",
      team: asset?.type === "player" ? (asset?.team || 'Unknown') : "DRAFT",
      value: asset?.baseValue || 0
    }))

    const teamBPlayers = safeTeamBAssets.map((asset: any) => ({
      id: parseInt(asset?.id || '0'),
      name: asset?.label || 'Unknown Asset',
      position: asset?.type === "player" ? (asset?.position || 'Unknown') : "PICK",
      team: asset?.type === "player" ? (asset?.team || 'Unknown') : "DRAFT",
      value: asset?.baseValue || 0
    }))

    const mockResult = {
      totalA: teamATotal,
      totalB: teamBTotal,
      verdict: verdict,
      teamAPlayers: teamAPlayers,
      teamBPlayers: teamBPlayers,
      saved: false
    }

    setResult(mockResult)
    setLoading(false)
  }, [safeTeamAAssets, safeTeamBAssets])

  if (safeTeamAAssets.length === 0 && safeTeamBAssets.length === 0) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-16">
            <AlertCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-foreground mb-2">No Trade Data</h1>
            <p className="text-muted-foreground mb-6">
              It looks like you haven't created a trade yet. Go back to create your first trade evaluation.
            </p>
            <Button asChild>
              <a href="/trade">Create Trade</a>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Evaluating your trade...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-16">
            <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-foreground mb-2">Evaluation Error</h1>
            <p className="text-muted-foreground mb-6">{error}</p>
            <Button asChild>
              <a href="/trade">Try Again</a>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (!result) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-16">
            <AlertCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-foreground mb-2">No Results</h1>
            <p className="text-muted-foreground mb-6">Unable to evaluate the trade.</p>
            <Button asChild>
              <a href="/trade">Try Again</a>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Trade Evaluation Results</h1>
        <TradeResultCard result={result} />
      </div>
    </div>
  )
}