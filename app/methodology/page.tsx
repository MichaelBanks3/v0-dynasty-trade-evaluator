"use client"

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Calculator, 
  TrendingUp, 
  TrendingDown, 
  Database, 
  Calendar,
  Shield,
  ExternalLink,
  Info
} from 'lucide-react'

interface MethodologyData {
  lastDataRefresh: string | null
  lastCalibration: string | null
  currentWeights: {
    alpha: number
    wM_now: number
    wP_now: number
    wM_future: number
    wP_future: number
  }
  ageCurves: {
    QB: { breakpoints: number[], multipliers: number[] }
    RB: { breakpoints: number[], multipliers: number[] }
    WR: { breakpoints: number[], multipliers: number[] }
    TE: { breakpoints: number[], multipliers: number[] }
  }
  scoringMultipliers: {
    PPR: number
    Half: number
    Standard: number
  }
  calibrationMetrics: {
    overallRho: number
    positionRhos: Record<string, number>
  } | null
}

export default function MethodologyPage() {
  const [data, setData] = useState<MethodologyData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMethodologyData()
  }, [])

  const fetchMethodologyData = async () => {
    try {
      const response = await fetch('/api/methodology')
      if (response.ok) {
        const result = await response.json()
        setData(result.data)
      }
    } catch (error) {
      console.error('Error fetching methodology data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="h-64 bg-muted rounded"></div>
            <div className="h-64 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold">Methodology</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            How we calculate dynasty trade values using market data, projections, and age curves
          </p>
        </div>

        {/* Last Updated */}
        {data && (
          <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              Data last updated: {data.lastDataRefresh ? new Date(data.lastDataRefresh).toLocaleDateString() : 'Never'}
            </div>
            <div className="flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              Model last calibrated: {data.lastCalibration ? new Date(data.lastCalibration).toLocaleDateString() : 'Never'}
            </div>
          </div>
        )}

        {/* Core Formula */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              The Composite Formula
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Our dynasty valuation combines current production potential with future upside, 
              weighted by your team's timeline and league settings.
            </p>
            
            <div className="bg-muted p-4 rounded-lg font-mono text-sm">
              <div className="space-y-2">
                <div><span className="text-blue-600">Now Score</span> = (wM_now × Market Value) + (wP_now × Projections)</div>
                <div><span className="text-purple-600">Future Score</span> = (wM_future × Market Value) + (wP_future × Projections) × Age Curve × Risk Adjustment</div>
                <div><span className="text-green-600">Composite</span> = α × Now Score + (1 - α) × Future Score</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold text-blue-600 mb-2">Now Score</h4>
                <p className="text-sm text-muted-foreground">
                  Measures immediate production potential for the current season. 
                  Higher for veterans and established players.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-purple-600 mb-2">Future Score</h4>
                <p className="text-sm text-muted-foreground">
                  Measures long-term dynasty value and upside potential. 
                  Higher for young players with room to grow.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Sources */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Data Sources & Refresh Cadence
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <h4 className="font-semibold">Player Data</h4>
                <p className="text-sm text-muted-foreground">Sleeper API</p>
                <Badge variant="secondary">Daily</Badge>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold">Market Values</h4>
                <p className="text-sm text-muted-foreground">DynastyProcess / ADP</p>
                <Badge variant="secondary">Weekly</Badge>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold">Projections</h4>
                <p className="text-sm text-muted-foreground">FantasyPros / Custom</p>
                <Badge variant="secondary">Weekly</Badge>
              </div>
            </div>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 text-yellow-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-yellow-800">No Affiliation</p>
                  <p className="text-yellow-700">
                    We are not affiliated with Sleeper, DynastyProcess, or any fantasy platform. 
                    We use publicly available data and our own analysis.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Age Curves */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5" />
              Age Curves by Position
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Each position has different aging patterns. We apply position-specific multipliers 
              to the Future Score based on age and expected career trajectory.
            </p>
            
            {data?.ageCurves && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(data.ageCurves).map(([position, curve]) => (
                  <div key={position} className="space-y-2">
                    <h4 className="font-semibold">{position}</h4>
                    <div className="space-y-1 text-sm">
                      {curve.breakpoints.map((breakpoint, i) => (
                        <div key={i} className="flex justify-between">
                          <span>Age ≤ {breakpoint}:</span>
                          <span className="font-mono">{curve.multipliers[i].toFixed(2)}×</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Settings Multipliers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              League Settings Adjustments
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Your league settings affect player values. We apply multipliers to account for 
              scoring systems, roster requirements, and positional scarcity.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Scoring Systems</h4>
                  {data?.scoringMultipliers && (
                    <div className="space-y-1 text-sm">
                      {Object.entries(data.scoringMultipliers).map(([scoring, multiplier]) => (
                        <div key={scoring} className="flex justify-between">
                          <span>{scoring}:</span>
                          <span className="font-mono">{multiplier.toFixed(2)}×</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Position Multipliers</h4>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <div>• Superflex: QB values increased by ~30%</div>
                    <div>• TE Premium: TE values increased by 50%</div>
                    <div>• VOR: Positional scarcity based on league size</div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Current Weights</h4>
                  {data?.currentWeights && (
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Now vs Future (α):</span>
                        <span className="font-mono">{data.currentWeights.alpha.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Market Now:</span>
                        <span className="font-mono">{data.currentWeights.wM_now.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Projections Now:</span>
                        <span className="font-mono">{data.currentWeights.wP_now.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Market Future:</span>
                        <span className="font-mono">{data.currentWeights.wM_future.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Projections Future:</span>
                        <span className="font-mono">{data.currentWeights.wP_future.toFixed(2)}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Calibration Process */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Model Calibration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              We continuously calibrate our model using k-fold cross-validation against market baselines 
              to ensure our valuations stay accurate and relevant.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold mb-2">Calibration Process</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• 5-fold cross-validation by position and age</li>
                  <li>• Optimize for Spearman correlation with market</li>
                  <li>• Maintain dynasty logic (age curves, settings)</li>
                  <li>• Guardrails prevent extreme parameter changes</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Current Performance</h4>
                {data?.calibrationMetrics ? (
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Overall Correlation:</span>
                      <span className="font-mono text-green-600">
                        {(data.calibrationMetrics.overallRho * 100).toFixed(1)}%
                      </span>
                    </div>
                    {Object.entries(data.calibrationMetrics.positionRhos).map(([position, rho]) => (
                      <div key={position} className="flex justify-between">
                        <span>{position}:</span>
                        <span className="font-mono text-green-600">
                          {(rho * 100).toFixed(1)}%
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No calibration data available</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Limitations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              Known Limitations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3 text-sm">
              <div>
                <h4 className="font-semibold">Data Quality</h4>
                <p className="text-muted-foreground">
                  Our valuations depend on the quality of market data and projections. 
                  Incomplete or outdated data may affect accuracy.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold">League Context</h4>
                <p className="text-muted-foreground">
                  While we account for common league settings, unique scoring systems 
                  or roster requirements may not be perfectly captured.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold">Market Volatility</h4>
                <p className="text-muted-foreground">
                  Fantasy markets can be volatile. Our model provides a baseline, 
                  but actual trade values may vary based on league dynamics.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold">User Feedback</h4>
                <p className="text-muted-foreground">
                  We continuously improve based on user feedback and trade outcomes. 
                  Your input helps us refine the model over time.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center space-y-4 pt-8 border-t">
          <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
            <a href="/privacy" className="hover:text-foreground transition-colors">
              Privacy Policy
            </a>
            <a href="/terms" className="hover:text-foreground transition-colors">
              Terms of Service
            </a>
            <a href="/feedback" className="hover:text-foreground transition-colors">
              Feedback
            </a>
          </div>
          <p className="text-xs text-muted-foreground">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>
      </div>
    </div>
  )
}
