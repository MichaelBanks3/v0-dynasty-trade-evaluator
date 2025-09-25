"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { X, HelpCircle, TrendingUp, Users, Settings } from 'lucide-react'
import { exampleTrades, type ExampleTrade } from '@/lib/example-trades'
import { useTradeStore } from '@/lib/store'
import { LeagueSettings } from '@/lib/settings'

interface OnboardingPanelProps {
  onDismiss?: () => void
  onExampleTrade?: (trade: ExampleTrade) => void
}

export function OnboardingPanel({ onDismiss, onExampleTrade }: OnboardingPanelProps) {
  const [isVisible, setIsVisible] = useState(false)
  const { setTeamAAssets, setTeamBAssets, setLeagueSettings } = useTradeStore()

  useEffect(() => {
    // Check if user has seen onboarding before
    const hasSeenOnboarding = localStorage.getItem('hasSeenOnboarding')
    if (!hasSeenOnboarding) {
      setIsVisible(true)
    }
  }, [])

  const handleDismiss = () => {
    setIsVisible(false)
    localStorage.setItem('hasSeenOnboarding', 'true')
    onDismiss?.()
  }

  const handleExampleTrade = async (trade: ExampleTrade) => {
    try {
      // Fetch actual player/pick data for the example trade
      const teamAAssets = await Promise.all(
        trade.teamA.map(async (id) => {
          if (id.startsWith('pick:')) {
            // Handle pick format: pick:2025:1
            const [, year, round] = id.split(':')
            return {
              id,
              kind: 'pick' as const,
              label: `${year} Round ${round}`,
              value: 0,
              meta: {
                year: parseInt(year),
                round: parseInt(round)
              }
            }
          } else {
            // Handle player ID - fetch from API
            try {
              const response = await fetch(`/api/players/${id}`)
              if (response.ok) {
                const player = await response.json()
                return {
                  id,
                  kind: 'player' as const,
                  label: player.name || `Player ${id}`,
                  value: 0,
                  meta: {
                    position: player.position,
                    team: player.team,
                    age: player.age
                  }
                }
              }
            } catch (error) {
              console.error('Error fetching player:', error)
            }
            // Fallback for failed fetch
            return {
              id,
              kind: 'player' as const,
              label: `Player ${id}`,
              value: 0,
              meta: {}
            }
          }
        })
      )

      const teamBAssets = await Promise.all(
        trade.teamB.map(async (id) => {
          if (id.startsWith('pick:')) {
            // Handle pick format: pick:2025:1
            const [, year, round] = id.split(':')
            return {
              id,
              kind: 'pick' as const,
              label: `${year} Round ${round}`,
              value: 0,
              meta: {
                year: parseInt(year),
                round: parseInt(round)
              }
            }
          } else {
            // Handle player ID - fetch from API
            try {
              const response = await fetch(`/api/players/${id}`)
              if (response.ok) {
                const player = await response.json()
                return {
                  id,
                  kind: 'player' as const,
                  label: player.name || `Player ${id}`,
                  value: 0,
                  meta: {
                    position: player.position,
                    team: player.team,
                    age: player.age
                  }
                }
              }
            } catch (error) {
              console.error('Error fetching player:', error)
            }
            // Fallback for failed fetch
            return {
              id,
              kind: 'player' as const,
              label: `Player ${id}`,
              value: 0,
              meta: {}
            }
          }
        })
      )

      // Load example trade into the builder
      setTeamAAssets(teamAAssets)
      setTeamBAssets(teamBAssets)
      setLeagueSettings(trade.settings)
      
      onExampleTrade?.(trade)
      handleDismiss()
    } catch (error) {
      console.error('Error loading example trade:', error)
      // Fallback to simple implementation
      setTeamAAssets(trade.teamA.map(id => ({ id, kind: 'player', label: id, value: 0 })))
      setTeamBAssets(trade.teamB.map(id => ({ id, kind: 'player', label: id, value: 0 })))
      setLeagueSettings(trade.settings)
      onExampleTrade?.(trade)
      handleDismiss()
    }
  }

  if (!isVisible) {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsVisible(true)}
        className="gap-2"
      >
        <HelpCircle className="h-4 w-4" />
        How this works
      </Button>
    )
  }

  return (
    <Card className="mb-6 border-blue-200 bg-blue-50/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-blue-900">
            <HelpCircle className="h-5 w-5" />
            How Dynasty Trade Evaluator Works
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="h-6 w-6 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="flex items-start gap-3">
            <TrendingUp className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900">Market + Projections</h4>
              <p className="text-blue-700">Combines current market values with season projections for accurate valuations</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Users className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900">Age Curves</h4>
              <p className="text-blue-700">Adjusts future value based on player age and position-specific decline curves</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Settings className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900">League Settings</h4>
              <p className="text-blue-700">Superflex, TE Premium, and scoring settings affect player values in real-time</p>
            </div>
          </div>
        </div>

        <div className="border-t border-blue-200 pt-4">
          <h4 className="font-medium text-blue-900 mb-3">Try Example Trades</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {exampleTrades.map((trade) => (
              <Button
                key={trade.id}
                variant="outline"
                onClick={() => handleExampleTrade(trade)}
                className="h-auto p-3 text-left justify-start border-blue-200 hover:bg-blue-100"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">{trade.title}</span>
                    <Badge variant="secondary" className="text-xs">
                      {trade.category.replace('-', ' ')}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{trade.description}</p>
                </div>
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
