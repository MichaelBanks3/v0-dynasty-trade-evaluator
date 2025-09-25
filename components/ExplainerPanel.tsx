"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Info, 
  Copy, 
  CheckCircle,
  Settings,
  Users,
  TrendingUp,
  AlertTriangle
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { trackEvent, generatePayloadHash } from '@/lib/analytics'

interface ExplainerPanelProps {
  analysis: any
  settings: any
  className?: string
}

export function ExplainerPanel({ analysis, settings, className }: ExplainerPanelProps) {
  const [copied, setCopied] = useState(false)
  const { toast } = useToast()

  const generateExplainerText = (): string => {
    if (!analysis) return ""

    const { preTrade, postTrade, deltas } = analysis
    const lines = []

    // Header
    lines.push("📊 Trade Analysis Breakdown")
    lines.push("")

    // Settings context
    lines.push("⚙️ League Settings:")
    if (settings?.superflex) {
      lines.push("• Superflex league: QBs are 1.3× more valuable")
    }
    if (settings?.tePremium) {
      lines.push(`• TE Premium: TEs get ${settings.tePremiumMultiplier || 1.5}× multiplier`)
    }
    if (settings?.scoring) {
      lines.push(`• Scoring: ${settings.scoring}`)
    }
    lines.push(`• League size: ${settings?.leagueSize || 12} teams`)
    lines.push("")

    // Team impact
    lines.push("📈 Team Impact:")
    const nowChange = deltas.nowIndex
    const futureChange = deltas.futureIndex
    
    if (nowChange > 0) {
      lines.push(`• Win-now improvement: +${nowChange} Now Index`)
    } else if (nowChange < 0) {
      lines.push(`• Win-now reduction: ${nowChange} Now Index`)
    } else {
      lines.push("• No change to win-now outlook")
    }

    if (futureChange > 0) {
      lines.push(`• Future improvement: +${futureChange} Future Index`)
    } else if (futureChange < 0) {
      lines.push(`• Future reduction: ${futureChange} Future Index`)
    } else {
      lines.push("• No change to future outlook")
    }
    lines.push("")

    // Depth coverage changes
    lines.push("🏈 Depth Coverage Changes:")
    Object.entries(deltas.coverage).forEach(([position, change]) => {
      if (change !== 0) {
        const changePercent = Math.round(change * 100)
        if (change > 0) {
          lines.push(`• ${position}: +${changePercent}% coverage`)
        } else {
          lines.push(`• ${position}: ${changePercent}% coverage`)
        }
      }
    })
    lines.push("")

    // Critical flags
    if (postTrade.flags.qbGap || postTrade.flags.criticalGaps.length > 0) {
      lines.push("⚠️ Critical Issues:")
      if (postTrade.flags.qbGap) {
        lines.push("• QB gap in Superflex league")
      }
      postTrade.flags.criticalGaps.forEach(gap => {
        lines.push(`• Critical depth gap at ${gap}`)
      })
      lines.push("")
    }

    // Additional considerations
    if (postTrade.flags.thinDepth.length > 0 || postTrade.flags.riskFlags.length > 0 || postTrade.flags.ageSkew.length > 0) {
      lines.push("📋 Additional Considerations:")
      
      postTrade.flags.thinDepth.forEach(thin => {
        lines.push(`• Thin depth at ${thin.position} (${Math.round(thin.coverage * 100)}% coverage)`)
      })
      
      postTrade.flags.riskFlags.forEach(risk => {
        lines.push(`• ${risk}`)
      })
      
      postTrade.flags.ageSkew.forEach(skew => {
        lines.push(`• ${skew}`)
      })
      lines.push("")
    }

    // Timeline fit
    lines.push("🎯 Timeline Fit:")
    if (nowChange > futureChange) {
      lines.push("• Aligned with Contend timeline (Now > Future)")
    } else if (futureChange > nowChange) {
      lines.push("• Aligned with Rebuild timeline (Future > Now)")
    } else {
      lines.push("• Balanced impact on both timelines")
    }
    lines.push("")

    // Footer
    lines.push("💡 This analysis considers:")
    lines.push("• Market values and projections")
    lines.push("• Age curves and risk adjustments")
    lines.push("• League settings and positional scarcity")
    lines.push("• Your team's current roster depth")

    return lines.join('\n')
  }

  const copyExplainer = async () => {
    const explainerText = generateExplainerText()
    
    try {
      await navigator.clipboard.writeText(explainerText)
      setCopied(true)
      
      toast({
        title: "Explainer copied!",
        description: "Paste this into your league chat to explain the trade.",
      })

      // Track explainer copy
      await trackEvent('advisor_explainer_copy', {
        payloadHash: generatePayloadHash({ textLength: explainerText.length })
      })

      // Reset copied state after 2 seconds
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy explainer:', error)
      toast({
        title: "Failed to copy",
        description: "Please try again.",
        variant: "destructive",
      })
    }
  }

  if (!analysis) {
    return (
      <Card className={className}>
        <CardContent className="p-6 text-center">
          <Info className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Analysis Available</h3>
          <p className="text-muted-foreground">
            Complete a trade evaluation to see the explainer.
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
          <Info className="h-5 w-5" />
          What am I missing?
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Key Factors */}
        <div>
          <h4 className="font-semibold mb-3">Key Analysis Factors</h4>
          <div className="grid grid-cols-1 gap-2 text-sm">
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4 text-blue-600" />
              <span>League settings impact valuations</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-green-600" />
              <span>Roster depth and starting lineup strength</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-purple-600" />
              <span>Age curves and timeline alignment</span>
            </div>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <span>Risk factors and injury concerns</span>
            </div>
          </div>
        </div>

        {/* Quick Summary */}
        <div>
          <h4 className="font-semibold mb-3">Quick Summary</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Now Index Change:</span>
              <Badge variant={deltas.nowIndex > 0 ? "default" : deltas.nowIndex < 0 ? "destructive" : "secondary"}>
                {deltas.nowIndex > 0 ? '+' : ''}{deltas.nowIndex}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span>Future Index Change:</span>
              <Badge variant={deltas.futureIndex > 0 ? "default" : deltas.futureIndex < 0 ? "destructive" : "secondary"}>
                {deltas.futureIndex > 0 ? '+' : ''}{deltas.futureIndex}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span>Critical Issues:</span>
              <Badge variant={postTrade.flags.qbGap || postTrade.flags.criticalGaps.length > 0 ? "destructive" : "secondary"}>
                {postTrade.flags.qbGap ? 1 : 0 + postTrade.flags.criticalGaps.length}
              </Badge>
            </div>
          </div>
        </div>

        {/* Copy Button */}
        <div className="pt-4 border-t">
          <Button
            variant="outline"
            onClick={copyExplainer}
            className="w-full gap-2"
            disabled={copied}
          >
            {copied ? (
              <>
                <CheckCircle className="h-4 w-4" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Copy Breakdown
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
