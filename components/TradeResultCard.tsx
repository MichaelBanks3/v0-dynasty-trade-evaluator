import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

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

interface TradeResultCardProps {
  result: EvaluationResult
}

export function TradeResultCard({ result }: TradeResultCardProps) {
  const getVerdictColor = (verdict: string) => {
    switch (verdict) {
      case 'FAIR': return 'bg-green-100 text-green-800'
      case 'FAVORS_A': return 'bg-blue-100 text-blue-800'
      case 'FAVORS_B': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
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
          <p className="text-sm text-muted-foreground">
            Difference: {result.diff} points
            {result.saved && ' • Trade saved to your history'}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
