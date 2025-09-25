"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Lightbulb, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown,
  ArrowRight,
  CheckCircle
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { trackEvent, generatePayloadHash } from '@/lib/analytics'

interface Recommendation {
  type: 'add' | 'remove' | 'swap'
  description: string
  reasoning: string
  assets: {
    add?: string[]
    remove?: string[]
  }
  priority: 'critical' | 'high' | 'medium' | 'low'
}

interface RecommendationPanelProps {
  teamAAssets: string[]
  teamBAssets: string[]
  settings: any
  onApplyRecommendation?: (recommendation: Recommendation) => void
  className?: string
}

export function RecommendationPanel({ 
  teamAAssets, 
  teamBAssets, 
  settings, 
  onApplyRecommendation,
  className 
}: RecommendationPanelProps) {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [loading, setLoading] = useState(false)
  const [appliedRecommendations, setAppliedRecommendations] = useState<Set<string>>(new Set())
  const { toast } = useToast()

  useEffect(() => {
    if (teamAAssets.length > 0 || teamBAssets.length > 0) {
      generateRecommendations()
    }
  }, [teamAAssets, teamBAssets, settings])

  const generateRecommendations = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/team/recommendations', {
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
        setRecommendations(data.recommendations || [])
        
        // Track recommendation generation
        await trackEvent('advisor_recommendations', {
          payloadHash: generatePayloadHash({ 
            count: data.recommendations?.length || 0,
            assetCount: teamAAssets.length + teamBAssets.length 
          })
        })
      }
    } catch (error) {
      console.error('Error generating recommendations:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApplyRecommendation = async (recommendation: Recommendation) => {
    try {
      // Track recommendation application
      await trackEvent('advisor_apply_suggestion', {
        payloadHash: generatePayloadHash({ 
          type: recommendation.type,
          priority: recommendation.priority 
        })
      })

      // Mark as applied
      setAppliedRecommendations(prev => new Set([...prev, recommendation.description]))
      
      // Call parent handler if provided
      if (onApplyRecommendation) {
        onApplyRecommendation(recommendation)
      }

      toast({
        title: "Recommendation applied!",
        description: "The trade has been updated with the suggested changes.",
      })
    } catch (error) {
      console.error('Error applying recommendation:', error)
      toast({
        title: "Failed to apply recommendation",
        description: "Please try again.",
        variant: "destructive",
      })
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'destructive'
      case 'high': return 'default'
      case 'medium': return 'secondary'
      case 'low': return 'outline'
      default: return 'secondary'
    }
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'critical': return <AlertTriangle className="h-4 w-4" />
      case 'high': return <TrendingUp className="h-4 w-4" />
      case 'medium': return <TrendingDown className="h-4 w-4" />
      case 'low': return <Lightbulb className="h-4 w-4" />
      default: return <Lightbulb className="h-4 w-4" />
    }
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

  if (recommendations.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="p-6 text-center">
          <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Recommendations</h3>
          <p className="text-muted-foreground">
            This trade looks well-balanced for your team profile.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5" />
          Trade Recommendations
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {recommendations.map((recommendation, index) => {
          const isApplied = appliedRecommendations.has(recommendation.description)
          
          return (
            <div
              key={index}
              className={`p-4 border rounded-lg ${
                isApplied ? 'bg-green-50 border-green-200' : 'bg-background'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  {getPriorityIcon(recommendation.priority)}
                  <h4 className="font-medium">{recommendation.description}</h4>
                  <Badge variant={getPriorityColor(recommendation.priority)}>
                    {recommendation.priority}
                  </Badge>
                </div>
                {isApplied && (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                )}
              </div>

              <p className="text-sm text-muted-foreground mb-3">
                {recommendation.reasoning}
              </p>

              {/* Asset Changes */}
              <div className="flex items-center gap-2 text-sm mb-3">
                {recommendation.assets.remove && recommendation.assets.remove.length > 0 && (
                  <div className="flex items-center gap-1">
                    <span className="text-red-600">Remove:</span>
                    {recommendation.assets.remove.map((asset, i) => (
                      <Badge key={i} variant="destructive" className="text-xs">
                        {asset}
                      </Badge>
                    ))}
                  </div>
                )}
                
                {recommendation.assets.remove && recommendation.assets.add && (
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                )}
                
                {recommendation.assets.add && recommendation.assets.add.length > 0 && (
                  <div className="flex items-center gap-1">
                    <span className="text-green-600">Add:</span>
                    {recommendation.assets.add.map((asset, i) => (
                      <Badge key={i} variant="default" className="text-xs">
                        {asset}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {!isApplied && (
                <Button
                  size="sm"
                  onClick={() => handleApplyRecommendation(recommendation)}
                  className="w-full"
                >
                  Apply Suggestion
                </Button>
              )}
            </div>
          )
        })}

        {/* Too Lopsided Warning */}
        {recommendations.length === 0 && (teamAAssets.length > 0 || teamBAssets.length > 0) && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              This trade is too lopsided to balance with small changes. 
              Consider a more significant restructuring.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}
