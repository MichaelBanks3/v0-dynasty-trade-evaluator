"use client"

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@clerk/nextjs'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TradeResultCard } from '@/components/TradeResultCard'

interface Player {
  id: number
  name: string
  position: string
  team: string
  value: number
}

interface EvaluationResult {
  totalA: number
  totalB: number
  diff: number
  verdict: string
  teamAPlayers: Player[]
  teamBPlayers: Player[]
  saved: boolean
}

export default function TradePage() {
  const { isSignedIn } = useAuth()
  const [players, setPlayers] = useState<Player[]>([])
  const [selectedTeamA, setSelectedTeamA] = useState<number[]>([])
  const [selectedTeamB, setSelectedTeamB] = useState<number[]>([])
  const [result, setResult] = useState<EvaluationResult | null>(null)
  const [loading, setLoading] = useState(false)
  const teamASelectRef = useRef<HTMLSelectElement>(null)

  // Load players on mount
  useEffect(() => {
    fetch('/api/players')
      .then(res => res.json())
      .then(data => setPlayers(data))
      .catch(console.error)
  }, [])

  const handleSubmit = async () => {
    if (selectedTeamA.length === 0 && selectedTeamB.length === 0) {
      alert('Please select at least one player for one team')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/trades/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamA: selectedTeamA,
          teamB: selectedTeamB
        })
      })

      if (!response.ok) {
        throw new Error('Evaluation failed')
      }

      const data = await response.json()
      setResult(data)
    } catch (error) {
      console.error('Error:', error)
      alert('Failed to evaluate trade')
    } finally {
      setLoading(false)
    }
  }

  const handleEvaluateAnother = () => {
    setSelectedTeamA([])
    setSelectedTeamB([])
    setResult(null)
    // Focus the first select for quick re-entry
    setTimeout(() => {
      teamASelectRef.current?.focus()
    }, 100)
  }

  const isEvaluateDisabled = (selectedTeamA.length === 0 && selectedTeamB.length === 0) || loading

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation */}
      <nav className="border-b border-border bg-background">
        <div className="max-w-4xl mx-auto px-8 py-4">
          <div className="flex items-center justify-center space-x-6">
            <Link 
              href="/" 
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-md px-3 py-2 hover:bg-accent"
              data-testid="nav-home"
            >
              Home
            </Link>
            <Link 
              href="/trade" 
              className="text-sm font-medium text-foreground bg-accent rounded-md px-3 py-2"
              data-testid="nav-trade"
            >
              Trade
            </Link>
            <Link 
              href="/dashboard" 
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-md px-3 py-2 hover:bg-accent"
              data-testid="nav-dashboard"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </nav>

      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Trade Evaluator</h1>
          
          {!isSignedIn && (
            <div className="mb-6 p-4 bg-yellow-100 border border-yellow-300 rounded-md">
              <p className="text-yellow-800">Note: Trades will not be saved unless you sign in.</p>
            </div>
          )}

          <Card data-testid="trade-form">
            <CardHeader>
              <CardTitle>Select Players</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Team A</label>
                  <select
                    ref={teamASelectRef}
                    multiple
                    className="w-full h-40 border rounded-md p-2"
                    data-testid="select-team-a"
                    value={selectedTeamA.map(String)}
                    onChange={(e) => setSelectedTeamA(Array.from(e.target.selectedOptions, option => parseInt(option.value)))}
                  >
                    {players.map(player => (
                      <option key={player.id} value={player.id}>
                        {player.name} ({player.position}, {player.team}) - {player.value}
                      </option>
                    ))}
                  </select>
                  <p className="text-sm text-muted-foreground mt-1">
                    Hold Ctrl/Cmd to select multiple players
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Team B</label>
                  <select
                    multiple
                    className="w-full h-40 border rounded-md p-2"
                    data-testid="select-team-b"
                    value={selectedTeamB.map(String)}
                    onChange={(e) => setSelectedTeamB(Array.from(e.target.selectedOptions, option => parseInt(option.value)))}
                  >
                    {players.map(player => (
                      <option key={player.id} value={player.id}>
                        {player.name} ({player.position}, {player.team}) - {player.value}
                      </option>
                    ))}
                  </select>
                  <p className="text-sm text-muted-foreground mt-1">
                    Hold Ctrl/Cmd to select multiple players
                  </p>
                </div>
              </div>

              <div className="mt-6">
                <Button
                  onClick={handleSubmit}
                  disabled={isEvaluateDisabled}
                  data-testid="submit-eval"
                  className="w-full"
                >
                  {loading ? 'Evaluating...' : 'Evaluate Trade'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {result && (
            <div className="mt-6">
              <TradeResultCard result={result} />
              
              {/* Post-evaluation button group */}
              <div className="mt-6 pt-6 border-t border-border">
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button
                    onClick={handleEvaluateAnother}
                    variant="outline"
                    className="rounded-md border hover:bg-accent hover:text-accent-foreground"
                    data-testid="evaluate-another-button"
                    aria-label="Clear current selections and start a new trade evaluation"
                  >
                    Evaluate Another Trade
                  </Button>
                  <Link href="/dashboard">
                    <Button
                      variant="outline"
                      className="rounded-md border hover:bg-accent hover:text-accent-foreground w-full sm:w-auto"
                      data-testid="go-to-dashboard-button"
                      aria-label="View your trade history on the dashboard"
                    >
                      Go to Dashboard
                    </Button>
                  </Link>
                  <Link href="/">
                    <Button
                      variant="outline"
                      className="rounded-md border hover:bg-accent hover:text-accent-foreground w-full sm:w-auto"
                      data-testid="back-home-button"
                      aria-label="Return to the homepage"
                    >
                      Back to Home
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
