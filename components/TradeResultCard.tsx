import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useAuth } from '@clerk/nextjs'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

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
  verdict: string
  teamAPlayers: Player[]
  teamBPlayers: Player[]
  saved: boolean
}

interface TradeResultCardProps {
  result: EvaluationResult
}

export function TradeResultCard({ result }: TradeResultCardProps) {
  const { isSignedIn } = useAuth()
  const router = useRouter()
  const [saving, setSaving] = useState(false)

  const getVerdictColor = (verdict: string) => {
    switch (verdict) {
      case 'FAIR': return 'bg-green-100 text-green-800'
      case 'FAVORS_A': return 'bg-blue-100 text-blue-800'
      case 'FAVORS_B': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const handleSaveTrade = async () => {
    if (!isSignedIn) {
      router.push('/sign-in')
      return
    }

    setSaving(true)
    try {
      const response = await fetch('/api/trades/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sideAPlayerIds: result.teamAPlayers.map(p => p.id.toString()),
          sideBPlayerIds: result.teamBPlayers.map(p => p.id.toString()),
          totalA: result.totalA,
          totalB: result.totalB,
          verdict: result.verdict
        })
      })

      if (!response.ok) {
        throw new Error('Failed to save trade')
      }

      // Redirect to dashboard on success
      router.push('/dashboard')
    } catch (error) {
      console.error('Error saving trade:', error)
      alert('Failed to save trade. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card data-testid="result-card">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Trade Evaluation Result
          <Badge className={getVerdictColor(result.verdict)}>
            {result.verdict}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold mb-2">Team A Total: {result.totalA}</h3>
            <div className="space-y-1">
              {result.teamAPlayers.map(player => (
                <div key={player.id} className="text-sm">
                  {player.name} ({player.position}, {player.team}) - {player.value}
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Team B Total: {result.totalB}</h3>
            <div className="space-y-1">
              {result.teamBPlayers.map(player => (
                <div key={player.id} className="text-sm">
                  {player.name} ({player.position}, {player.team}) - {player.value}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t">
          <p className="text-sm text-muted-foreground mb-4">
            Difference: {Math.abs(result.totalA - result.totalB)} points
            {result.saved && ' • Trade saved to your history'}
          </p>
          
          <Button
            onClick={handleSaveTrade}
            disabled={saving}
            className="w-full"
            data-testid="save-trade-button"
          >
            {saving ? 'Saving...' : 'Save Trade'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
