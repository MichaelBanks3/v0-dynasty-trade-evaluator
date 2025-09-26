"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Target, 
  Lightbulb,
  Copy,
  ExternalLink
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { trackEvent, generatePayloadHash } from '@/lib/analytics'
import { RecommendationPanel } from './RecommendationPanel'
import { ExplainerPanel } from './ExplainerPanel'

interface AdvisorPanelProps {
  teamAAssets: string[]
  teamBAssets: string[]
  settings: any
  className?: string
}

interface RosterAnalysis {
  startingLineup: any
  depthCoverage: any
  flags: {
    qbGap: boolean
    thinDepth: { position: string; coverage: number }[]
    criticalGaps: string[]
    riskFlags: string[]
    ageSkew: string[]
  }
  indices: {
    nowIndex: number
    futureIndex: number
  }
}

interface TradeImpact {
  preTrade: RosterAnalysis
  postTrade: RosterAnalysis
  deltas: {
    nowIndex: number
    futureIndex: number
    coverage: { [position: string]: number }
  }
}

export function AdvisorPanel({ teamAAssets, teamBAssets, settings, className }: AdvisorPanelProps) {
  const [analysis, setAnalysis] = useState<TradeImpact | null>(null)
  const [loading, setLoading] = useState(false)
  const [hasProfile, setHasProfile] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    checkProfileAndAnalyze()
  }, [teamAAssets, teamBAssets, settings])

  const checkProfileAndAnalyze = async () => {
    try {
      // Check if user has a team profile
      const profileResponse = await fetch('/api/team/profile')
      if (profileResponse.ok) {
        const profileData = await profileResponse.json()
        if (profileData.profile) {
          setHasProfile(true)
          await analyzeTrade()
        } else {
          setHasProfile(false)
        }
      }
    } catch (error) {
      console.error('Error checking profile:', error)
    }
  }

  const analyzeTrade = async () => {
    if (teamAAssets.length === 0 && teamBAssets.length === 0) return

    setLoading(true)
    try {
      const response = await fetch('/api/team/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          teamAAssets,
          teamBAssets,
          settings
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setAnalysis(data.analysis)
        
        // Track advisor view
        await trackEvent('advisor_view', {
          payloadHash: generatePayloadHash({ assetCount: teamAAssets.length + teamBAssets.length })
        })
      }
    } catch (error) {
      console.error('Error analyzing trade:', error)
    } finally {
      setLoading(false)
    }
  }

  const copyExplainer = async () => {
    if (!analysis) return

    const explainerText = generateExplainerText(analysis)
    
    try {
      await navigator.clipboard.writeText(explainerText)
      toast({
        title: "Explainer copied!",
        description: "Paste this into your league chat to explain the trade.",
      })

      // Track explainer copy
      await trackEvent('advisor_explainer_copy', {
        payloadHash: generatePayloadHash({ textLength: explainerText.length })
      })
    } catch (error) {
      console.error('Failed to copy explainer:', error)
    }
  }

  const generateExplainerText = (analysis: TradeImpact): string => {
    const { preTrade, postTrade, deltas } = analysis
    const lines = []

    // Settings context
    if (settings?.superflex) {
      lines.push("• Superflex league: QBs are 1.3× more valuable")
    }
    if (settings?.tePremium) {
      lines.push(`• TE Premium: TEs get ${settings.tePremiumMultiplier || 1.5}× multiplier`)
    }

    // Timeline fit
    const nowChange = deltas.nowIndex
    const futureChange = deltas.futureIndex
    if (nowChange > 0) {
      lines.push(`• This trade improves my win-now chances (+${nowChange} Now Index)`)
    } else if (nowChange < 0) {
      lines.push(`• This trade reduces my win-now chances (${nowChange} Now Index)`)
    }

    if (futureChange > 0) {
      lines.push(`• This trade improves my future outlook (+${futureChange} Future Index)`)
    } else if (futureChange < 0) {
      lines.push(`• This trade reduces my future outlook (${futureChange} Future Index)`)
    }

    // Critical flags
    if (postTrade.flags.qbGap) {
      lines.push("• ⚠️ Post-trade I'd have a QB gap in Superflex")
    }

    postTrade.flags.criticalGaps.forEach(gap => {
      lines.push(`• ⚠️ Critical depth gap at ${gap}`)
    })

    postTrade.flags.thinDepth.forEach(thin => {
      lines.push(`• ⚠️ Thin depth at ${thin.position} (${Math.round(thin.coverage * 100)}% coverage)`)
    })

    // Age concerns
    postTrade.flags.ageSkew.forEach(skew => {
      lines.push(`• ${skew}`)
    })

    return lines.join('\n')
  }

  if (!hasProfile) {
    return (
      <Card className={className}>
        <CardContent className="p-6 text-center">
          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Set Your Team Profile</h3>
          <p className="text-muted-foreground mb-4">
            Get personalized trade advice by setting up your team roster and strategy.
          </p>
          <Button asChild>
            <a href="/team">Set Up Team Profile</a>
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="h-4 bg-muted rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!analysis) {
    return (
      <Card className={className}>
        <CardContent className="p-6 text-center">
          <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Add Assets to Get Advice</h3>
          <p className="text-muted-foreground">
            Build your trade to see personalized recommendations and analysis.
          </p>
        </CardContent>
      </Card>
    )
  }

  const { preTrade, postTrade, deltas } = analysis

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5" />
          Trade Advisor
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Must-Fix Flags */}
        {(postTrade.flags.qbGap || postTrade.flags.criticalGaps.length > 0) && (
          <div>
            <h4 className="font-semibold text-red-600 mb-2 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Must-Fix Issues
            </h4>
            <div className="space-y-2">
              {postTrade.flags.qbGap && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Post-trade you would have 1 viable QB for a league that starts 2 (SF). 
                    Consider adding a QB2 or future 1st.
                  </AlertDescription>
                </Alert>
              )}
              {postTrade.flags.criticalGaps.map((gap, index) => (
                <Alert key={index} variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Critical depth gap at {gap}. No viable bench options available.
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </div>
        )}

        {/* Lineup & Depth Deltas */}
        <div>
          <h4 className="font-semibold mb-3">Team Impact</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-muted rounded">
              <div className="text-2xl font-bold flex items-center justify-center gap-1">
                {deltas.nowIndex > 0 ? (
                  <TrendingUp className="h-5 w-5 text-green-600" />
                ) : deltas.nowIndex < 0 ? (
                  <TrendingDown className="h-5 w-5 text-red-600" />
                ) : null}
                {deltas.nowIndex > 0 ? '+' : ''}{deltas.nowIndex}
              </div>
              <div className="text-sm text-muted-foreground">Now Index</div>
            </div>
            <div className="text-center p-3 bg-muted rounded">
              <div className="text-2xl font-bold flex items-center justify-center gap-1">
                {deltas.futureIndex > 0 ? (
                  <TrendingUp className="h-5 w-5 text-green-600" />
                ) : deltas.futureIndex < 0 ? (
                  <TrendingDown className="h-5 w-5 text-red-600" />
                ) : null}
                {deltas.futureIndex > 0 ? '+' : ''}{deltas.futureIndex}
              </div>
              <div className="text-sm text-muted-foreground">Future Index</div>
            </div>
          </div>
        </div>

        {/* Depth Coverage Changes */}
        <div>
          <h4 className="font-semibold mb-3">Depth Coverage</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {Object.entries(deltas.coverage).map(([position, change]) => (
              <div key={position} className="flex justify-between items-center">
                <span>{position}</span>
                <Badge variant={change > 0 ? "default" : change < 0 ? "destructive" : "secondary"}>
                  {change > 0 ? '+' : ''}{Math.round(change * 100)}%
                </Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Timeline Fit */}
        <div>
          <h4 className="font-semibold mb-2">Timeline Fit</h4>
          <div className="p-3 bg-muted rounded">
            {deltas.nowIndex > deltas.futureIndex ? (
              <span className="text-green-600">✓ Aligned with Contend timeline (Now +{deltas.nowIndex} {" > "} Future {deltas.futureIndex})</span>
            ) : deltas.futureIndex > deltas.nowIndex ? (
              <span className="text-blue-600">✓ Aligned with Rebuild timeline (Future +{deltas.futureIndex} {" > "} Now {deltas.nowIndex})</span>
            ) : (
              <span className="text-muted">Balanced impact on both timelines</span>
            )}
          </div>
        </div>

        {/* Additional Flags */}
        {(postTrade.flags.thinDepth.length > 0 || postTrade.flags.riskFlags.length > 0 || postTrade.flags.ageSkew.length > 0) && (
          <div>
            <h4 className="font-semibold mb-2">Additional Considerations</h4>
            <div className="space-y-1 text-sm">
              {postTrade.flags.thinDepth.map((thin, index) => (
                <div key={index} className="text-yellow-600">
                  • Thin depth at {thin.position} ({Math.round(thin.coverage * 100)}% coverage)
                </div>
              ))}
              {postTrade.flags.riskFlags.map((risk, index) => (
                <div key={index} className="text-orange-600">
                  • {risk}
                </div>
              ))}
              {postTrade.flags.ageSkew.map((skew, index) => (
                <div key={index} className="text-purple-600">
                  • {skew}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Explainer Copy */}
        <div className="pt-4 border-t">
          <Button
            variant="outline"
            onClick={copyExplainer}
            className="w-full gap-2"
          >
            <Copy className="h-4 w-4" />
            Copy Trade Explainer
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// Separate component for recommendations and explainer
export function AdvisorWithRecommendations({ teamAAssets, teamBAssets, settings, className }: AdvisorPanelProps) {
  const [analysis, setAnalysis] = useState<TradeImpact | null>(null)

  // Get analysis from the main AdvisorPanel
  useEffect(() => {
    const fetchAnalysis = async () => {
      if (teamAAssets.length === 0 && teamBAssets.length === 0) return

      try {
        const response = await fetch('/api/team/analyze', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            teamAAssets,
            teamBAssets,
            settings
          }),
        })

        if (response.ok) {
          const data = await response.json()
          setAnalysis(data.analysis)
        }
      } catch (error) {
        console.error('Error analyzing trade:', error)
      }
    }

    fetchAnalysis()
  }, [teamAAssets, teamBAssets, settings])

  return (
    <div className="space-y-6">
      <AdvisorPanel 
        teamAAssets={teamAAssets}
        teamBAssets={teamBAssets}
        settings={settings}
        className={className}
      />
      <RecommendationPanel
        teamAAssets={teamAAssets}
        teamBAssets={teamBAssets}
        settings={settings}
        className={className}
      />
      <ExplainerPanel
        analysis={analysis}
        settings={settings}
        className={className}
      />
    </div>
  )
}
