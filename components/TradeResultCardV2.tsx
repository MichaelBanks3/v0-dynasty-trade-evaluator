import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ResultsHeader } from '@/components/ResultsHeader'
import { BalancingSuggestion } from '@/components/BalancingSuggestion'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@clerk/nextjs'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronDown, ChevronUp, Info, Copy } from 'lucide-react'

interface AssetBreakdown {
  id: string
  type: 'player' | 'pick'
  label: string
  marketValue?: number
  projNow?: number
  projFuture?: number
  ageAdjustment?: number
  riskAdjustment?: number
  nowScore: number
  futureScore: number
  compositeValue: number
}

interface EvaluationResult {
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
    teamA: AssetBreakdown[]
    teamB: AssetBreakdown[]
  }
  saved: boolean
  slug?: string
}

interface TradeResultCardV2Props {
  result: EvaluationResult
  settings?: any
}

export function TradeResultCardV2({ result, settings }: TradeResultCardV2Props) {
  const { isSignedIn } = useAuth()
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [expandedAsset, setExpandedAsset] = useState<string | null>(null)
  const { toast } = useToast()

  const getVerdictColor = (verdict: string) => {
    switch (verdict) {
      case 'FAIR':
        return 'bg-green-100 text-green-800'
      case 'FAVORS_A':
        return 'bg-blue-100 text-blue-800'
      case 'FAVORS_B':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const handleSaveTrade = async () => {
    if (!isSignedIn) {
      router.push('/sign-in')
      return
    }

    setSaving(true)
    try {
      // Extract team assets from the result
      const teamA = result.assets.teamA.map(asset => asset.id)
      const teamB = result.assets.teamB.map(asset => asset.id)
      
      const response = await fetch('/api/trades/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          teamA,
          teamB,
          settings: settings || {},
          evaluationResult: result
        }),
      })

      if (response.ok) {
        const data = await response.json()
        // Update the result with the slug
        result.slug = data.slug
        result.saved = true
        // Force re-render by updating state
        setSaving(false)
        
        toast({
          title: "Trade saved!",
          description: `Share link: /t/${data.slug}`,
        })
      } else {
        console.error('Failed to save trade:', await response.json())
        toast({
          title: "Failed to save trade",
          description: "Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error saving trade:', error)
      alert('An unexpected error occurred while saving the trade.')
    } finally {
      setSaving(false)
    }
  }

  const toggleAssetExpansion = (assetId: string) => {
    setExpandedAsset(expandedAsset === assetId ? null : assetId)
  }

  const copyAssetBreakdown = async (asset: AssetBreakdown) => {
    const breakdown = `${asset.label} (${asset.type.toUpperCase()})
Market Value: ${asset.marketValue?.toLocaleString() || 'N/A'}
Projections: Now ${asset.projNow?.toLocaleString() || 'N/A'}, Future ${asset.projFuture?.toLocaleString() || 'N/A'}
Age Adjustment: ${(asset.ageAdjustment || 1.0).toFixed(2)}x
Risk Adjustment: ${(asset.riskAdjustment || 1.0).toFixed(2)}x
${asset.settingsAdjustments ? `
Settings Adjustments:
- QB Multiplier: ${asset.settingsAdjustments.qbMultiplier.toFixed(2)}x
- TE Multiplier: ${asset.settingsAdjustments.teMultiplier.toFixed(2)}x
- Scoring Factor: ${asset.settingsAdjustments.scoringFactor.toFixed(2)}x
- VOR Multiplier: ${asset.settingsAdjustments.vorMultiplier.toFixed(2)}x
- Combined: ${asset.settingsAdjustments.combinedMultiplier.toFixed(3)}x
` : ''}
Final Scores:
- Now: ${asset.nowScore.toLocaleString()}
- Future: ${asset.futureScore.toLocaleString()}
- Composite: ${asset.compositeValue.toLocaleString()}`
    
    try {
      await navigator.clipboard.writeText(breakdown)
      // You could add a toast notification here
    } catch (error) {
      console.error('Failed to copy breakdown:', error)
    }
  }

  const renderAssetBreakdown = (asset: AssetBreakdown) => {
    const isExpanded = expandedAsset === asset.id
    
    return (
      <div key={asset.id} className="border rounded-lg p-3 mb-2">
        <div 
          className="flex items-center justify-between cursor-pointer"
          onClick={() => toggleAssetExpansion(asset.id)}
        >
          <div className="flex items-center space-x-3">
            <div>
              <p className="font-medium">{asset.label}</p>
              <div className="flex items-center space-x-2 mt-1">
                <Badge variant={asset.type === "player" ? "default" : "secondary"} className="text-xs">
                  {asset.type === "player" ? "Player" : "Pick"}
                </Badge>
                <span className="text-sm font-medium text-muted-foreground">
                  {asset.compositeValue} pts
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground">
              Now: {asset.nowScore} | Future: {asset.futureScore}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                copyAssetBreakdown(asset)
              }}
              className="h-6 w-6 p-0"
              title="Copy breakdown"
            >
              <Copy className="h-3 w-3" />
            </Button>
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
        </div>
        
        {isExpanded && (
          <div className="mt-3 pt-3 border-t space-y-2">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Market Value</p>
                <p className="font-medium">{asset.marketValue || 0}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Current Projection</p>
                <p className="font-medium">{asset.projNow || 0}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Future Projection</p>
                <p className="font-medium">{asset.projFuture || 0}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Age Adjustment</p>
                <p className="font-medium">{(asset.ageAdjustment || 1.0).toFixed(2)}x</p>
              </div>
              <div>
                <p className="text-muted-foreground">Risk Adjustment</p>
                <p className="font-medium">{(asset.riskAdjustment || 1.0).toFixed(2)}x</p>
              </div>
              {asset.settingsAdjustments && (
                <>
                  <div>
                    <p className="text-muted-foreground">QB Multiplier</p>
                    <p className="font-medium">{asset.settingsAdjustments.qbMultiplier.toFixed(2)}x</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">TE Multiplier</p>
                    <p className="font-medium">{asset.settingsAdjustments.teMultiplier.toFixed(2)}x</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Scoring Factor</p>
                    <p className="font-medium">{asset.settingsAdjustments.scoringFactor.toFixed(2)}x</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">VOR Multiplier</p>
                    <p className="font-medium">{asset.settingsAdjustments.vorMultiplier.toFixed(2)}x</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Combined Settings</p>
                    <p className="font-medium">{asset.settingsAdjustments.combinedMultiplier.toFixed(3)}x</p>
                  </div>
                </>
              )}
              <div>
                <p className="text-muted-foreground">Composite Value</p>
                <p className="font-medium">{asset.compositeValue}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    )
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
        {/* Trade Summary */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="space-y-2">
            <h4 className="font-medium">Team A</h4>
            <div className="space-y-1 text-sm">
              <p>Now: {result.totals.teamA.nowScore} pts</p>
              <p>Future: {result.totals.teamA.futureScore} pts</p>
              <p className="font-medium">Total: {result.totals.teamA.compositeValue} pts</p>
            </div>
          </div>
          <div className="space-y-2">
            <h4 className="font-medium">Team B</h4>
            <div className="space-y-1 text-sm">
              <p>Now: {result.totals.teamB.nowScore} pts</p>
              <p>Future: {result.totals.teamB.futureScore} pts</p>
              <p className="font-medium">Total: {result.totals.teamB.compositeValue} pts</p>
            </div>
          </div>
        </div>

        {/* Explanation */}
        <div className="mb-4 p-3 bg-muted rounded-lg">
          <div className="flex items-start space-x-2">
            <Info className="h-4 w-4 mt-0.5 text-muted-foreground" />
            <p className="text-sm">{result.explanation}</p>
          </div>
        </div>

        {/* Suggestion */}
        {result.suggestion && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Suggestion:</strong> {result.suggestion}
            </p>
          </div>
        )}

        {/* Asset Breakdown */}
        <div className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Team A Assets</h4>
            {result.assets.teamA.map(renderAssetBreakdown)}
          </div>
          <div>
            <h4 className="font-medium mb-2">Team B Assets</h4>
            {result.assets.teamB.map(renderAssetBreakdown)}
          </div>
        </div>

        {/* Save Trade Button */}
        <div className="mt-6 pt-4 border-t">
          <p className="text-sm text-muted-foreground mb-4">
            Difference: {Math.abs(result.totals.teamA.compositeValue - result.totals.teamB.compositeValue)} points
            {result.saved && ' • Trade saved to your history'}
            {result.slug && (
              <span className="block mt-1">
                Share link: <code className="bg-muted px-1 py-0.5 rounded text-xs">/t/{result.slug}</code>
              </span>
            )}
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
