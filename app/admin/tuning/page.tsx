"use client"

import { useState, useEffect } from 'react'
import { useAuth } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AlertCircle, Save, RotateCcw, TestTube, CheckCircle } from 'lucide-react'

// Admin user IDs (you can add your Clerk user ID here)
const ADMIN_USER_IDS = [
  // Add your Clerk user ID here for testing
  // 'user_2abc123...'
]

interface ValuationConfig {
  weights: {
    now: {
      market: number
      projection: number
    }
    future: {
      market: number
      projection: number
    }
    composite: {
      now: number
      future: number
    }
  }
  multipliers: {
    superflex: {
      qbMultiplier: number
    }
    tePremium: {
      defaultMultiplier: number
      maxMultiplier: number
    }
    scoring: {
      PPR: number
      Half: number
      Standard: number
    }
  }
  ageCurves: {
    QB: {
      peakAge: number
      declineRate: number
    }
    RB: {
      peakAge: number
      declineRate: number
    }
    WR: {
      peakAge: number
      declineRate: number
    }
    TE: {
      peakAge: number
      declineRate: number
    }
  }
  riskAdjustments: {
    ACTIVE: number
    IR: number
    OUT: number
    QUESTIONABLE: number
    DOUBTFUL: number
    SUSPENDED: number
    RETIRED: number
  }
  pickCurves: {
    roundMultipliers: number[]
    yearDiscount: number
  }
}

const DEFAULT_CONFIG: ValuationConfig = {
  weights: {
    now: { market: 0.6, projection: 0.4 },
    future: { market: 0.4, projection: 0.6 },
    composite: { now: 0.4, future: 0.6 }
  },
  multipliers: {
    superflex: { qbMultiplier: 1.3 },
    tePremium: { defaultMultiplier: 1.5, maxMultiplier: 2.0 },
    scoring: { PPR: 1.0, Half: 0.85, Standard: 0.7 }
  },
  ageCurves: {
    QB: { peakAge: 28, declineRate: 0.95 },
    RB: { peakAge: 24, declineRate: 0.85 },
    WR: { peakAge: 26, declineRate: 0.90 },
    TE: { peakAge: 27, declineRate: 0.92 }
  },
  riskAdjustments: {
    ACTIVE: 1.0,
    IR: 0.95,
    OUT: 0.90,
    QUESTIONABLE: 0.98,
    DOUBTFUL: 0.95,
    SUSPENDED: 0.85,
    RETIRED: 0.0
  },
  pickCurves: {
    roundMultipliers: [1.0, 0.6, 0.3, 0.15],
    yearDiscount: 0.85
  }
}

export default function AdminTuningPage() {
  const { isSignedIn, userId } = useAuth()
  const router = useRouter()
  const [config, setConfig] = useState<ValuationConfig>(DEFAULT_CONFIG)
  const [activeConfig, setActiveConfig] = useState<ValuationConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [previewResult, setPreviewResult] = useState<any>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    if (!isSignedIn) {
      router.push('/sign-in')
      return
    }

    // For now, allow any authenticated user for testing
    // TODO: Add proper admin authentication in production
    // if (!ADMIN_USER_IDS.includes(userId || '')) {
    //   router.push('/')
    //   return
    // }

    loadActiveConfig()
  }, [isSignedIn, userId, router])

  const loadActiveConfig = async () => {
    try {
      const response = await fetch('/api/admin/config')
      if (response.ok) {
        const data = await response.json()
        if (data.config) {
          setActiveConfig(data.config)
          setConfig(data.config)
        }
      }
    } catch (error) {
      console.error('Failed to load config:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePreview = async () => {
    setPreviewLoading(true)
    try {
      const response = await fetch('/api/admin/config/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config })
      })
      
      if (response.ok) {
        const result = await response.json()
        setPreviewResult(result)
      } else {
        throw new Error('Preview failed')
      }
    } catch (error) {
      setError('Failed to preview configuration')
    } finally {
      setPreviewLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    try {
      const response = await fetch('/api/admin/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config })
      })
      
      if (response.ok) {
        setSuccess('Configuration saved and applied successfully!')
        setActiveConfig(config)
        setTimeout(() => setSuccess(null), 5000)
      } else {
        throw new Error('Save failed')
      }
    } catch (error) {
      setError('Failed to save configuration')
    } finally {
      setSaving(false)
    }
  }

  const handleRollback = async (version: string) => {
    try {
      const response = await fetch('/api/admin/config/rollback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ version })
      })
      
      if (response.ok) {
        setSuccess(`Rolled back to version ${version}`)
        loadActiveConfig()
      } else {
        throw new Error('Rollback failed')
      }
    } catch (error) {
      setError('Failed to rollback configuration')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading admin panel...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Admin Tuning Panel</h1>
          <p className="text-muted-foreground mt-2">
            Configure valuation weights, multipliers, and curves
          </p>
        </div>

        {error && (
          <Alert className="mb-6" variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-6" variant="default">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="weights" className="space-y-6">
          <TabsList>
            <TabsTrigger value="weights">Weights</TabsTrigger>
            <TabsTrigger value="multipliers">Multipliers</TabsTrigger>
            <TabsTrigger value="age-curves">Age Curves</TabsTrigger>
            <TabsTrigger value="risk">Risk Adjustments</TabsTrigger>
            <TabsTrigger value="picks">Pick Curves</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>

          <TabsContent value="weights" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Valuation Weights</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label>Now Score Weights</Label>
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <div>
                      <Label className="text-sm">Market Weight</Label>
                      <Slider
                        value={[config.weights.now.market]}
                        onValueChange={([value]) => {
                          setConfig(prev => ({
                            ...prev,
                            weights: {
                              ...prev.weights,
                              now: { ...prev.weights.now, market: value }
                            }
                          }))
                        }}
                        max={1}
                        min={0}
                        step={0.1}
                        className="mt-2"
                      />
                      <p className="text-sm text-muted-foreground mt-1">
                        {config.weights.now.market.toFixed(1)}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm">Projection Weight</Label>
                      <Slider
                        value={[config.weights.now.projection]}
                        onValueChange={([value]) => {
                          setConfig(prev => ({
                            ...prev,
                            weights: {
                              ...prev.weights,
                              now: { ...prev.weights.now, projection: value }
                            }
                          }))
                        }}
                        max={1}
                        min={0}
                        step={0.1}
                        className="mt-2"
                      />
                      <p className="text-sm text-muted-foreground mt-1">
                        {config.weights.now.projection.toFixed(1)}
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <Label>Future Score Weights</Label>
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <div>
                      <Label className="text-sm">Market Weight</Label>
                      <Slider
                        value={[config.weights.future.market]}
                        onValueChange={([value]) => {
                          setConfig(prev => ({
                            ...prev,
                            weights: {
                              ...prev.weights,
                              future: { ...prev.weights.future, market: value }
                            }
                          }))
                        }}
                        max={1}
                        min={0}
                        step={0.1}
                        className="mt-2"
                      />
                      <p className="text-sm text-muted-foreground mt-1">
                        {config.weights.future.market.toFixed(1)}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm">Projection Weight</Label>
                      <Slider
                        value={[config.weights.future.projection]}
                        onValueChange={([value]) => {
                          setConfig(prev => ({
                            ...prev,
                            weights: {
                              ...prev.weights,
                              future: { ...prev.weights.future, projection: value }
                            }
                          }))
                        }}
                        max={1}
                        min={0}
                        step={0.1}
                        className="mt-2"
                      />
                      <p className="text-sm text-muted-foreground mt-1">
                        {config.weights.future.projection.toFixed(1)}
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <Label>Composite Weights</Label>
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <div>
                      <Label className="text-sm">Now Weight</Label>
                      <Slider
                        value={[config.weights.composite.now]}
                        onValueChange={([value]) => {
                          setConfig(prev => ({
                            ...prev,
                            weights: {
                              ...prev.weights,
                              composite: { ...prev.weights.composite, now: value }
                            }
                          }))
                        }}
                        max={1}
                        min={0}
                        step={0.1}
                        className="mt-2"
                      />
                      <p className="text-sm text-muted-foreground mt-1">
                        {config.weights.composite.now.toFixed(1)}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm">Future Weight</Label>
                      <Slider
                        value={[config.weights.composite.future]}
                        onValueChange={([value]) => {
                          setConfig(prev => ({
                            ...prev,
                            weights: {
                              ...prev.weights,
                              composite: { ...prev.weights.composite, future: value }
                            }
                          }))
                        }}
                        max={1}
                        min={0}
                        step={0.1}
                        className="mt-2"
                      />
                      <p className="text-sm text-muted-foreground mt-1">
                        {config.weights.composite.future.toFixed(1)}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="multipliers" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>League Multipliers</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label>Superflex QB Multiplier</Label>
                  <Slider
                    value={[config.multipliers.superflex.qbMultiplier]}
                    onValueChange={([value]) => {
                      setConfig(prev => ({
                        ...prev,
                        multipliers: {
                          ...prev.multipliers,
                          superflex: { ...prev.multipliers.superflex, qbMultiplier: value }
                        }
                      }))
                    }}
                    max={2.0}
                    min={1.0}
                    step={0.1}
                    className="mt-2"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    {config.multipliers.superflex.qbMultiplier.toFixed(1)}x
                  </p>
                </div>

                <div>
                  <Label>TE Premium Default Multiplier</Label>
                  <Slider
                    value={[config.multipliers.tePremium.defaultMultiplier]}
                    onValueChange={([value]) => {
                      setConfig(prev => ({
                        ...prev,
                        multipliers: {
                          ...prev.multipliers,
                          tePremium: { ...prev.multipliers.tePremium, defaultMultiplier: value }
                        }
                      }))
                    }}
                    max={3.0}
                    min={1.0}
                    step={0.1}
                    className="mt-2"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    {config.multipliers.tePremium.defaultMultiplier.toFixed(1)}x
                  </p>
                </div>

                <div>
                  <Label>Scoring Preset Factors</Label>
                  <div className="grid grid-cols-3 gap-4 mt-2">
                    <div>
                      <Label className="text-sm">PPR</Label>
                      <Input
                        value={config.multipliers.scoring.PPR}
                        onChange={(e) => {
                          setConfig(prev => ({
                            ...prev,
                            multipliers: {
                              ...prev.multipliers,
                              scoring: { ...prev.multipliers.scoring, PPR: parseFloat(e.target.value) }
                            }
                          }))
                        }}
                        type="number"
                        step="0.1"
                        min="0.5"
                        max="1.5"
                      />
                    </div>
                    <div>
                      <Label className="text-sm">Half PPR</Label>
                      <Input
                        value={config.multipliers.scoring.Half}
                        onChange={(e) => {
                          setConfig(prev => ({
                            ...prev,
                            multipliers: {
                              ...prev.multipliers,
                              scoring: { ...prev.multipliers.scoring, Half: parseFloat(e.target.value) }
                            }
                          }))
                        }}
                        type="number"
                        step="0.1"
                        min="0.5"
                        max="1.5"
                      />
                    </div>
                    <div>
                      <Label className="text-sm">Standard</Label>
                      <Input
                        value={config.multipliers.scoring.Standard}
                        onChange={(e) => {
                          setConfig(prev => ({
                            ...prev,
                            multipliers: {
                              ...prev.multipliers,
                              scoring: { ...prev.multipliers.scoring, Standard: parseFloat(e.target.value) }
                            }
                          }))
                        }}
                        type="number"
                        step="0.1"
                        min="0.5"
                        max="1.5"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="preview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Configuration Preview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-4">
                  <Button onClick={handlePreview} disabled={previewLoading}>
                    <TestTube className="h-4 w-4 mr-2" />
                    {previewLoading ? 'Testing...' : 'Test Configuration'}
                  </Button>
                  <Button onClick={handleSave} disabled={saving}>
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? 'Saving...' : 'Save & Apply'}
                  </Button>
                </div>

                {previewResult && (
                  <div className="mt-4 p-4 bg-muted rounded-lg">
                    <h4 className="font-medium mb-2">Preview Results</h4>
                    <pre className="text-sm overflow-auto">
                      {JSON.stringify(previewResult, null, 2)}
                    </pre>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
