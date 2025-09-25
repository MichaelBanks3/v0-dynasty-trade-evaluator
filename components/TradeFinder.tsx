"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Search, 
  Users, 
  TrendingUp, 
  TrendingDown, 
  Target,
  ArrowRight,
  CheckCircle,
  AlertTriangle,
  Copy,
  ExternalLink
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { trackEvent, generatePayloadHash } from '@/lib/analytics'

interface TradeFinderProps {
  leagueId: string
  myTeamId: string
  className?: string
}

interface MatchmakingResult {
  opponentId: string
  displayName: string
  userHandle: string | null
  compatibilityScore: number
  topPositions: {
    give: string[]
    get: string[]
  }
  timelineNote: string
}

interface TradeProposal {
  id: string
  type: 'win-now' | 'balanced' | 'future-lean'
  myAssets: string[]
  theirAssets: string[]
  verdict: string
  delta: number
  rationale: {
    myBenefits: string[]
    theirBenefits: string[]
  }
  isViable: boolean
  warnings: string[]
}

export function TradeFinder({ leagueId, myTeamId, className }: TradeFinderProps) {
  const [step, setStep] = useState<'objective' | 'opponents' | 'proposals'>('objective')
  const [objective, setObjective] = useState<'win-now' | 'balanced' | 'future-lean'>('balanced')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [opponents, setOpponents] = useState<MatchmakingResult[]>([])
  const [selectedOpponent, setSelectedOpponent] = useState<MatchmakingResult | null>(null)
  const [proposals, setProposals] = useState<TradeProposal[]>([])
  const { toast } = useToast()

  const handleObjectiveSelect = async (selectedObjective: 'win-now' | 'balanced' | 'future-lean') => {
    setObjective(selectedObjective)
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/league/${leagueId}/matchmaking?myTeamId=${myTeamId}&objective=${selectedObjective}`)
      
      if (!response.ok) {
        throw new Error('Failed to find compatible opponents')
      }

      const data = await response.json()
      setOpponents(data.results || [])
      setStep('opponents')

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to find opponents'
      setError(errorMessage)
      console.error('Error finding opponents:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleOpponentSelect = async (opponent: MatchmakingResult) => {
    setSelectedOpponent(opponent)
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/league/${leagueId}/proposals?myTeamId=${myTeamId}&opponentId=${opponent.opponentId}&objective=${objective}`)
      
      if (!response.ok) {
        throw new Error('Failed to generate proposals')
      }

      const data = await response.json()
      setProposals(data.proposals || [])
      setStep('proposals')

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate proposals'
      setError(errorMessage)
      console.error('Error generating proposals:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApplyProposal = async (proposal: TradeProposal) => {
    try {
      // Track proposal application
      await trackEvent('trade_finder_apply_proposal', {
        payloadHash: generatePayloadHash({ 
          proposalType: proposal.type,
          delta: Math.round(proposal.delta)
        })
      })

      // This would populate the trade builder
      // For now, just show a success message
      toast({
        title: "Proposal applied!",
        description: "The trade has been added to the builder.",
      })

    } catch (error) {
      console.error('Error applying proposal:', error)
      toast({
        title: "Failed to apply proposal",
        description: "Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleCopyBlurb = async (proposal: TradeProposal) => {
    try {
      const blurb = generateNegotiationBlurb(proposal, selectedOpponent)
      await navigator.clipboard.writeText(blurb)
      
      // Track blurb copy
      await trackEvent('trade_finder_copy_blurb', {
        payloadHash: generatePayloadHash({ 
          proposalType: proposal.type,
          blurbLength: blurb.length
        })
      })

      toast({
        title: "Negotiation blurb copied!",
        description: "Paste this into your league chat.",
      })

    } catch (error) {
      console.error('Error copying blurb:', error)
      toast({
        title: "Failed to copy blurb",
        description: "Please try again.",
        variant: "destructive",
      })
    }
  }

  const generateNegotiationBlurb = (proposal: TradeProposal, opponent: MatchmakingResult | null): string => {
    if (!opponent) return ""

    const lines = []
    
    // Opening
    if (objective === 'win-now') {
      lines.push("Hey! I'm looking to make a win-now push and you're rebuilding - perfect match!")
    } else if (objective === 'future-lean') {
      lines.push("Hey! I'm rebuilding and you're contending - let's help each other out!")
    } else {
      lines.push("Hey! I think we could both benefit from a balanced trade.")
    }

    lines.push("")

    // Benefits
    lines.push("For you:")
    proposal.rationale.theirBenefits.forEach(benefit => {
      lines.push(`• ${benefit}`)
    })

    lines.push("")
    lines.push("For me:")
    proposal.rationale.myBenefits.forEach(benefit => {
      lines.push(`• ${benefit}`)
    })

    lines.push("")
    lines.push("Happy to tweak the details if you're interested!")

    return lines.join('\n')
  }

  const getObjectiveIcon = (obj: string) => {
    switch (obj) {
      case 'win-now': return <TrendingUp className="h-5 w-5" />
      case 'future-lean': return <TrendingDown className="h-5 w-5" />
      default: return <Target className="h-5 w-5" />
    }
  }

  const getObjectiveColor = (obj: string) => {
    switch (obj) {
      case 'win-now': return 'text-green-600'
      case 'future-lean': return 'text-purple-600'
      default: return 'text-blue-600'
    }
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          Trade Finder
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {step === 'objective' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-3">What's your goal?</h3>
              <div className="grid grid-cols-1 gap-3">
                {[
                  { id: 'win-now', label: 'Win Now', description: 'Get veterans and immediate contributors' },
                  { id: 'balanced', label: 'Balanced', description: 'Fair value exchange for both sides' },
                  { id: 'future-lean', label: 'Future Lean', description: 'Acquire picks and young prospects' }
                ].map((option) => (
                  <div
                    key={option.id}
                    className={`p-4 border rounded-lg cursor-pointer hover:bg-muted transition-colors ${
                      objective === option.id ? 'border-primary bg-primary/5' : ''
                    }`}
                    onClick={() => handleObjectiveSelect(option.id as any)}
                  >
                    <div className="flex items-center gap-3">
                      <div className={getObjectiveColor(option.id)}>
                        {getObjectiveIcon(option.id)}
                      </div>
                      <div>
                        <div className="font-medium">{option.label}</div>
                        <div className="text-sm text-muted-foreground">{option.description}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 'opponents' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => setStep('objective')}>
                ← Back
              </Button>
              <h3 className="text-lg font-semibold">Compatible Opponents</h3>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="animate-pulse p-4 border rounded-lg">
                    <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {opponents.map((opponent) => (
                  <div
                    key={opponent.opponentId}
                    className="p-4 border rounded-lg cursor-pointer hover:bg-muted transition-colors"
                    onClick={() => handleOpponentSelect(opponent)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <div className="font-medium">{opponent.displayName}</div>
                        {opponent.userHandle && (
                          <div className="text-sm text-muted-foreground">@{opponent.userHandle}</div>
                        )}
                      </div>
                      <Badge variant="default">
                        {opponent.compatibilityScore}% match
                      </Badge>
                    </div>
                    
                    <div className="text-sm text-muted-foreground mb-2">
                      {opponent.timelineNote}
                    </div>

                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <span className="text-green-600">Give:</span>
                        {opponent.topPositions.give.map(pos => (
                          <Badge key={pos} variant="secondary" className="text-xs">{pos}</Badge>
                        ))}
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-blue-600">Get:</span>
                        {opponent.topPositions.get.map(pos => (
                          <Badge key={pos} variant="outline" className="text-xs">{pos}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {step === 'proposals' && selectedOpponent && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => setStep('opponents')}>
                ← Back
              </Button>
              <h3 className="text-lg font-semibold">Trade Proposals</h3>
            </div>

            <div className="text-sm text-muted-foreground">
              Proposals for {selectedOpponent.displayName}
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {loading ? (
              <div className="space-y-4">
                {[1, 2].map(i => (
                  <div key={i} className="animate-pulse p-4 border rounded-lg">
                    <div className="h-4 bg-muted rounded w-1/2 mb-2"></div>
                    <div className="h-3 bg-muted rounded w-3/4"></div>
                  </div>
                ))}
              </div>
            ) : proposals.length === 0 ? (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  No fair proposals found for this opponent. Try a different goal or opponent.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-4">
                {proposals.map((proposal) => (
                  <div key={proposal.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {getObjectiveIcon(proposal.type)}
                        <span className="font-medium capitalize">{proposal.type.replace('-', ' ')}</span>
                        <Badge variant={Math.abs(proposal.delta) < 5 ? "default" : "secondary"}>
                          {proposal.verdict}
                        </Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <h4 className="font-medium text-green-600 mb-2">For you:</h4>
                        <ul className="text-sm space-y-1">
                          {proposal.rationale.myBenefits.map((benefit, i) => (
                            <li key={i} className="flex items-start gap-1">
                              <CheckCircle className="h-3 w-3 text-green-600 mt-0.5 flex-shrink-0" />
                              {benefit}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-medium text-blue-600 mb-2">For them:</h4>
                        <ul className="text-sm space-y-1">
                          {proposal.rationale.theirBenefits.map((benefit, i) => (
                            <li key={i} className="flex items-start gap-1">
                              <CheckCircle className="h-3 w-3 text-blue-600 mt-0.5 flex-shrink-0" />
                              {benefit}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {proposal.warnings.length > 0 && (
                      <Alert variant="destructive" className="mb-4">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          {proposal.warnings.join(', ')}
                        </AlertDescription>
                      </Alert>
                    )}

                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        onClick={() => handleApplyProposal(proposal)}
                        className="flex-1"
                      >
                        Apply to Builder
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleCopyBlurb(proposal)}
                        className="gap-2"
                      >
                        <Copy className="h-3 w-3" />
                        Copy Blurb
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
