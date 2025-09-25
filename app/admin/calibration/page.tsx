"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Play, 
  Eye, 
  Settings, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Download,
  Upload
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface CalibrationRun {
  id: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  parameters: any
  metrics?: {
    overallRho: number
    positionRhos: Record<string, number>
    overallMAPE: number
    positionMAPEs: Record<string, number>
  }
  rankShifts?: Array<{
    position: string
    top50Shifts: Array<{
      playerId: number
      playerName: string
      beforeRank: number
      afterRank: number
      shift: number
    }>
    significantShifts: number
  }>
  createdAt: string
  completedAt?: string
  error?: string
}

interface AppConfig {
  id: string
  version: string
  config: any
  isActive: boolean
  isCandidate: boolean
  rolloutPercentage: number
  createdAt: string
}

export default function AdminCalibrationPage() {
  const [runs, setRuns] = useState<CalibrationRun[]>([])
  const [configs, setConfigs] = useState<AppConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [runsResponse, configsResponse] = await Promise.all([
        fetch('/api/admin/calibration/run'),
        fetch('/api/admin/config')
      ])

      if (runsResponse.ok) {
        const runsData = await runsResponse.json()
        setRuns(runsData.recentRuns || [])
      }

      if (configsResponse.ok) {
        const configsData = await configsResponse.json()
        setConfigs(configsData.configs || [])
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      toast({
        title: "Error",
        description: "Failed to fetch calibration data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRunCalibration = async () => {
    setRunning(true)
    try {
      const response = await fetch('/api/admin/calibration/run', {
        method: 'POST'
      })

      if (response.ok) {
        toast({
          title: "Calibration Started",
          description: "The calibration process has been initiated. This may take several minutes.",
        })
        // Refresh data after a delay
        setTimeout(fetchData, 5000)
      } else {
        throw new Error('Failed to start calibration')
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start calibration",
        variant: "destructive",
      })
    } finally {
      setRunning(false)
    }
  }

  const handlePublishConfig = async (configId: string) => {
    try {
      const response = await fetch(`/api/admin/config/${configId}/publish`, {
        method: 'POST'
      })

      if (response.ok) {
        toast({
          title: "Config Published",
          description: "The candidate configuration has been published and is now active.",
        })
        fetchData()
      } else {
        throw new Error('Failed to publish config')
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to publish configuration",
        variant: "destructive",
      })
    }
  }

  const handleRollbackConfig = async (configId: string) => {
    try {
      const response = await fetch(`/api/admin/config/${configId}/rollback`, {
        method: 'POST'
      })

      if (response.ok) {
        toast({
          title: "Config Rolled Back",
          description: "The configuration has been rolled back to the previous version.",
        })
        fetchData()
      } else {
        throw new Error('Failed to rollback config')
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to rollback configuration",
        variant: "destructive",
      })
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'running':
        return <Clock className="h-4 w-4 text-blue-600" />
      case 'failed':
        return <AlertTriangle className="h-4 w-4 text-red-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'running':
        return 'bg-blue-100 text-blue-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="h-64 bg-muted rounded"></div>
            <div className="h-64 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  const activeConfig = configs.find(c => c.isActive)
  const candidateConfig = configs.find(c => c.isCandidate)

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Calibration Console</h1>
            <p className="text-muted-foreground">Manage model calibration and configuration rollouts</p>
          </div>
          <Button 
            onClick={handleRunCalibration}
            disabled={running}
            className="gap-2"
          >
            <Play className="h-4 w-4" />
            {running ? 'Running...' : 'Run Calibration'}
          </Button>
        </div>

        <Tabs defaultValue="run" className="space-y-6">
          <TabsList>
            <TabsTrigger value="run">Run</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
            <TabsTrigger value="rollout">Rollout</TabsTrigger>
          </TabsList>

          {/* Run Tab */}
          <TabsContent value="run" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Play className="h-5 w-5" />
                  Calibration Runs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {runs.length === 0 ? (
                    <p className="text-muted-foreground">No calibration runs found</p>
                  ) : (
                    runs.map((run) => (
                      <div key={run.id} className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {getStatusIcon(run.status)}
                            <div>
                              <div className="font-medium">Run {run.id.slice(-8)}</div>
                              <div className="text-sm text-muted-foreground">
                                {new Date(run.createdAt).toLocaleString()}
                              </div>
                            </div>
                          </div>
                          <Badge className={getStatusColor(run.status)}>
                            {run.status}
                          </Badge>
                        </div>

                        {run.status === 'completed' && run.metrics && (
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <div className="text-muted-foreground">Overall ρ</div>
                              <div className="font-mono">
                                {(run.metrics.overallRho * 100).toFixed(1)}%
                              </div>
                            </div>
                            <div>
                              <div className="text-muted-foreground">Overall MAPE</div>
                              <div className="font-mono">
                                {(run.metrics.overallMAPE * 100).toFixed(1)}%
                              </div>
                            </div>
                            <div>
                              <div className="text-muted-foreground">Duration</div>
                              <div className="font-mono">
                                {run.completedAt ? 
                                  `${Math.round((new Date(run.completedAt).getTime() - new Date(run.createdAt).getTime()) / 1000 / 60)}m` :
                                  'N/A'
                                }
                              </div>
                            </div>
                            <div>
                              <div className="text-muted-foreground">Significant Shifts</div>
                              <div className="font-mono">
                                {run.rankShifts?.reduce((sum, shift) => sum + shift.significantShifts, 0) || 0}
                              </div>
                            </div>
                          </div>
                        )}

                        {run.status === 'failed' && run.error && (
                          <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                            Error: {run.error}
                          </div>
                        )}

                        {run.status === 'completed' && (
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" className="gap-2">
                              <Download className="h-3 w-3" />
                              Download CSV
                            </Button>
                            <Button size="sm" variant="outline" className="gap-2">
                              <Eye className="h-3 w-3" />
                              View Details
                            </Button>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Preview Tab */}
          <TabsContent value="preview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Active Config */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    Active Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {activeConfig ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Badge variant="default">v{activeConfig.version}</Badge>
                        <span className="text-sm text-muted-foreground">
                          {new Date(activeConfig.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Alpha:</span>
                          <span className="font-mono">{activeConfig.config.weights?.alpha?.toFixed(2) || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Market Now:</span>
                          <span className="font-mono">{activeConfig.config.weights?.wM_now?.toFixed(2) || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Projections Now:</span>
                          <span className="font-mono">{activeConfig.config.weights?.wP_now?.toFixed(2) || 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No active configuration</p>
                  )}
                </CardContent>
              </Card>

              {/* Candidate Config */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5 text-blue-600" />
                    Candidate Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {candidateConfig ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary">v{candidateConfig.version}</Badge>
                        <span className="text-sm text-muted-foreground">
                          {new Date(candidateConfig.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Alpha:</span>
                          <span className="font-mono">{candidateConfig.config.weights?.alpha?.toFixed(2) || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Market Now:</span>
                          <span className="font-mono">{candidateConfig.config.weights?.wM_now?.toFixed(2) || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Projections Now:</span>
                          <span className="font-mono">{candidateConfig.config.weights?.wP_now?.toFixed(2) || 'N/A'}</span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          onClick={() => handlePublishConfig(candidateConfig.id)}
                          className="gap-2"
                        >
                          <Upload className="h-3 w-3" />
                          Publish
                        </Button>
                        <Button size="sm" variant="outline" className="gap-2">
                          <Eye className="h-3 w-3" />
                          Preview
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No candidate configuration</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Comparison */}
            {activeConfig && candidateConfig && (
              <Card>
                <CardHeader>
                  <CardTitle>Configuration Comparison</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div className="font-medium">Parameter</div>
                      <div className="font-medium text-green-600">Active</div>
                      <div className="font-medium text-blue-600">Candidate</div>
                    </div>
                    
                    {Object.entries(activeConfig.config.weights || {}).map(([key, value]) => (
                      <div key={key} className="grid grid-cols-3 gap-4 text-sm">
                        <div className="capitalize">{key.replace(/([A-Z])/g, ' $1')}</div>
                        <div className="font-mono text-green-600">
                          {typeof value === 'number' ? value.toFixed(2) : 'N/A'}
                        </div>
                        <div className="font-mono text-blue-600">
                          {typeof candidateConfig.config.weights?.[key] === 'number' 
                            ? candidateConfig.config.weights[key].toFixed(2) 
                            : 'N/A'
                          }
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Rollout Tab */}
          <TabsContent value="rollout" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  A/B Testing & Rollout
                </CardTitle>
              </CardHeader>
              <CardContent>
                {candidateConfig ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Candidate Configuration</div>
                        <div className="text-sm text-muted-foreground">
                          v{candidateConfig.version} • {new Date(candidateConfig.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <Badge variant="secondary">
                        {candidateConfig.rolloutPercentage}% rollout
                      </Badge>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium">Rollout Percentage</label>
                        <div className="flex items-center gap-2 mt-1">
                          <input 
                            type="range" 
                            min="0" 
                            max="100" 
                            value={candidateConfig.rolloutPercentage}
                            className="flex-1"
                            disabled
                          />
                          <span className="text-sm font-mono w-12">
                            {candidateConfig.rolloutPercentage}%
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button 
                          onClick={() => handlePublishConfig(candidateConfig.id)}
                          className="gap-2"
                        >
                          <Upload className="h-4 w-4" />
                          Publish to 100%
                        </Button>
                        <Button 
                          variant="outline"
                          onClick={() => handleRollbackConfig(candidateConfig.id)}
                          className="gap-2"
                        >
                          <Download className="h-4 w-4" />
                          Rollback
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground">No candidate configuration available for rollout</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
