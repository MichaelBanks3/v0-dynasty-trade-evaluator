"use client"

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'
import { TradeResultCardV2 } from '@/components/TradeResultCardV2'
import { WinNowFutureChart } from '@/components/WinNowFutureChart'
import { SettingsDrawer } from '@/components/SettingsDrawer'
import { ActiveSettings } from '@/components/ActiveSettings'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, RefreshCw, Share2, Calendar } from 'lucide-react'
import { LeagueSettings, DEFAULT_SETTINGS } from '@/lib/settings'
import { isValidSlug } from '@/lib/slug'

interface TradeSnapshot {
  totals: {
    teamA: {
      nowScore: number
      futureScore: number
      compositeValue: number
    }
    teamB: {
      nowScore: number
      futureScore: number
      compositeValue: number
    }
  }
  verdict: string
  explanation: string
  suggestion?: string
  assets: {
    teamA: any[]
    teamB: any[]
  }
}

interface TradeData {
  id: string
  slug: string
  userId: string
  teamA: string[]
  teamB: string[]
  settings: LeagueSettings
  verdict: string
  nowDelta: number
  futureDelta: number
  evaluationSnapshot: TradeSnapshot
  createdAt: string
}

export default function SharedTradePage() {
  const params = useParams()
  const { userId } = useAuth()
  const [trade, setTrade] = useState<TradeData | null>(null)
  const [currentEvaluation, setCurrentEvaluation] = useState<TradeSnapshot | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reEvaluating, setReEvaluating] = useState(false)
  const [settings, setSettings] = useState<LeagueSettings>(DEFAULT_SETTINGS)

  const slug = params.slug as string

  useEffect(() => {
    if (!slug || !isValidSlug(slug)) {
      setError('Invalid trade link')
      setLoading(false)
      return
    }

    const fetchTrade = async () => {
      try {
        const response = await fetch(`/api/trades/${slug}`)
        if (!response.ok) {
          throw new Error('Trade not found')
        }
        
        const tradeData = await response.json()
        setTrade(tradeData)
        setSettings(tradeData.settings)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load trade')
      } finally {
        setLoading(false)
      }
    }

    fetchTrade()
  }, [slug])

  const handleReEvaluate = async () => {
    if (!trade) return

    setReEvaluating(true)
    try {
      const response = await fetch('/api/evaluate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          teamA: trade.teamA,
          teamB: trade.teamB,
          settings: settings
        }),
      })

      if (response.ok) {
        const result = await response.json()
        setCurrentEvaluation(result)
      } else {
        throw new Error('Failed to re-evaluate trade')
      }
    } catch (err) {
      console.error('Re-evaluation failed:', err)
    } finally {
      setReEvaluating(false)
    }
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Fantasy Trade Evaluation',
          text: 'Check out this fantasy football trade evaluation',
          url: window.location.href,
        })
      } catch (err) {
        // Fallback to clipboard
        navigator.clipboard.writeText(window.location.href)
      }
    } else {
      // Fallback to clipboard
      navigator.clipboard.writeText(window.location.href)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading trade...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !trade) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-16">
            <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-foreground mb-2">Trade Not Found</h1>
            <p className="text-muted-foreground mb-6">{error}</p>
            <Button asChild>
              <a href="/trade">Create New Trade</a>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const isOwner = userId === trade.userId
  const displayEvaluation = currentEvaluation || trade.evaluationSnapshot

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Shared Trade Evaluation</h1>
            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                {new Date(trade.createdAt).toLocaleDateString()}
              </div>
              {isOwner && (
                <Badge variant="secondary">Your Trade</Badge>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleShare}>
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
            {isOwner && (
              <SettingsDrawer onSettingsChange={setSettings} currentSettings={settings} />
            )}
          </div>
        </div>

        {/* Active Settings */}
        <div className="mb-6">
          <ActiveSettings settings={settings} />
        </div>

        {/* Re-evaluate Button */}
        <div className="mb-6">
          <Button 
            onClick={handleReEvaluate} 
            disabled={reEvaluating}
            variant="outline"
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${reEvaluating ? 'animate-spin' : ''}`} />
            {reEvaluating ? 'Re-evaluating...' : 'Re-evaluate with Current Market'}
          </Button>
          <p className="text-sm text-muted-foreground mt-2">
            Compare the original evaluation with current market values and settings
          </p>
        </div>

        {/* Evaluation Results */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Original Evaluation */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {currentEvaluation ? 'Original Evaluation' : 'Trade Evaluation'}
                  <Badge variant="outline">Snapshot</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <TradeResultCardV2 result={trade.evaluationSnapshot} />
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Current Evaluation (if re-evaluated) */}
          {currentEvaluation && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    Current Evaluation
                    <Badge variant="default">Live</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <TradeResultCardV2 result={currentEvaluation} />
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Comparison Chart */}
        {currentEvaluation && (
          <div className="mt-8">
            <Card>
              <CardHeader>
                <CardTitle>Evaluation Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div>
                    <h4 className="font-medium mb-4">Original (Snapshot)</h4>
                    <WinNowFutureChart 
                      teamANow={trade.evaluationSnapshot.totals.teamA.nowScore}
                      teamAFuture={trade.evaluationSnapshot.totals.teamA.futureScore}
                      teamBNow={trade.evaluationSnapshot.totals.teamB.nowScore}
                      teamBFuture={trade.evaluationSnapshot.totals.teamB.futureScore}
                    />
                  </div>
                  <div>
                    <h4 className="font-medium mb-4">Current (Live)</h4>
                    <WinNowFutureChart 
                      teamANow={currentEvaluation.totals.teamA.nowScore}
                      teamAFuture={currentEvaluation.totals.teamA.futureScore}
                      teamBNow={currentEvaluation.totals.teamB.nowScore}
                      teamBFuture={currentEvaluation.totals.teamB.futureScore}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
