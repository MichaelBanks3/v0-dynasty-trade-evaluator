"use client"

import { useState, useEffect } from 'react'
import { useAuth } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { PlayerSearch } from '@/components/PlayerSearch'
import { LeagueImportFlow } from '@/components/LeagueImportFlow'
import { useToast } from '@/hooks/use-toast'
import { Settings, Users, Calendar, Save, ArrowLeft, Download } from 'lucide-react'
import { LeagueSettings, DEFAULT_SETTINGS } from '@/lib/settings'

interface TeamProfile {
  id: string
  timeline: 'contend' | 'retool' | 'rebuild'
  riskTolerance: 'low' | 'medium' | 'high'
  leagueSettings: LeagueSettings | null
  roster: string[]
  ownedPicks: string[]
  createdAt: string
  updatedAt: string
}

export default function TeamPage() {
  const { isSignedIn } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  
  const [profile, setProfile] = useState<TeamProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showImport, setShowImport] = useState(false)
  
  // Form state
  const [timeline, setTimeline] = useState<'contend' | 'retool' | 'rebuild'>('contend')
  const [riskTolerance, setRiskTolerance] = useState<'low' | 'medium' | 'high'>('medium')
  const [roster, setRoster] = useState<string[]>([])
  const [ownedPicks, setOwnedPicks] = useState<string[]>([])
  const [leagueSettings, setLeagueSettings] = useState<LeagueSettings | null>(null)

  useEffect(() => {
    if (!isSignedIn) {
      router.push('/sign-in')
      return
    }
    
    loadProfile()
  }, [isSignedIn, router])

  const loadProfile = async () => {
    try {
      const response = await fetch('/api/team/profile')
      if (response.ok) {
        const data = await response.json()
        if (data.profile) {
          setProfile(data.profile)
          setTimeline(data.profile.timeline)
          setRiskTolerance(data.profile.riskTolerance)
          setRoster(data.profile.roster || [])
          setOwnedPicks(data.profile.ownedPicks || [])
          setLeagueSettings(data.profile.leagueSettings)
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/team/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          timeline,
          riskTolerance,
          leagueSettings,
          roster,
          ownedPicks
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setProfile(data.profile)
        toast({
          title: "Team profile saved!",
          description: "Your team context is now available for trade advice.",
        })
      } else {
        throw new Error('Failed to save profile')
      }
    } catch (error) {
      console.error('Error saving profile:', error)
      toast({
        title: "Failed to save profile",
        description: "Please try again.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleUseCurrentSettings = async () => {
    try {
      const response = await fetch('/api/settings')
      if (response.ok) {
        const data = await response.json()
        setLeagueSettings(data.settings || DEFAULT_SETTINGS)
        toast({
          title: "Settings applied",
          description: "Current league settings have been linked to your team profile.",
        })
      }
    } catch (error) {
      console.error('Error loading settings:', error)
    }
  }

  const addToRoster = (playerId: string) => {
    if (!roster.includes(playerId)) {
      setRoster([...roster, playerId])
    }
  }

  const removeFromRoster = (playerId: string) => {
    setRoster(roster.filter(id => id !== playerId))
  }

  const addToPicks = (pickId: string) => {
    if (!ownedPicks.includes(pickId)) {
      setOwnedPicks([...ownedPicks, pickId])
    }
  }

  const removeFromPicks = (pickId: string) => {
    setOwnedPicks(ownedPicks.filter(id => id !== pickId))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-48 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="h-64 bg-muted rounded"></div>
              <div className="h-64 bg-muted rounded"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold">Team Profile</h1>
            <p className="text-muted-foreground">Set up your roster and strategy</p>
          </div>
          <Button 
            variant="outline" 
            onClick={() => setShowImport(!showImport)}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Import from Sleeper
          </Button>
        </div>

        {showImport && (
          <div className="mb-8">
            <LeagueImportFlow 
              onComplete={(leagueId, teamId) => {
                setShowImport(false)
                // Refresh profile data
                fetchProfile()
                toast({
                  title: "Import complete!",
                  description: "Your team profile has been updated with Sleeper data.",
                })
              }}
            />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Profile Settings */}
          <div className="space-y-6">
            {/* Timeline & Risk */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Team Strategy
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="timeline">Timeline</Label>
                  <Select value={timeline} onValueChange={(value: any) => setTimeline(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="contend">Contend (Win Now)</SelectItem>
                      <SelectItem value="retool">Retool (1-2 Years)</SelectItem>
                      <SelectItem value="rebuild">Rebuild (3+ Years)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="risk">Risk Tolerance</Label>
                  <Select value={riskTolerance} onValueChange={(value: any) => setRiskTolerance(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low (Conservative)</SelectItem>
                      <SelectItem value="medium">Medium (Balanced)</SelectItem>
                      <SelectItem value="high">High (Aggressive)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>League Settings</Label>
                  <div className="flex items-center gap-2 mt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleUseCurrentSettings}
                      className="gap-2"
                    >
                      <Settings className="h-4 w-4" />
                      Use Current Settings
                    </Button>
                    {leagueSettings && (
                      <Badge variant="secondary">
                        {leagueSettings.scoring} • {leagueSettings.superflex ? 'SF' : '1QB'} • {leagueSettings.leagueSize}-team
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Save Button */}
            <Button onClick={handleSave} disabled={saving} className="w-full gap-2">
              <Save className="h-4 w-4" />
              {saving ? 'Saving...' : 'Save Team Profile'}
            </Button>
          </div>

          {/* Right Column - Roster & Picks */}
          <div className="space-y-6">
            {/* Roster */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Roster ({roster.length} players)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <PlayerSearch
                  onAssetAdded={(asset) => {
                    if (asset.kind === 'player') {
                      addToRoster(asset.id)
                    }
                  }}
                  placeholder="Search players to add to roster..."
                />
                <div className="mt-4 space-y-2">
                  {roster.map((playerId) => (
                    <div key={playerId} className="flex items-center justify-between p-2 bg-muted rounded">
                      <span className="text-sm">{playerId}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFromRoster(playerId)}
                        className="h-6 w-6 p-0"
                      >
                        ×
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Owned Picks */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Owned Picks ({ownedPicks.length} picks)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <PlayerSearch
                  onAssetAdded={(asset) => {
                    if (asset.kind === 'pick') {
                      addToPicks(asset.id)
                    }
                  }}
                  placeholder="Search picks to add..."
                />
                <div className="mt-4 space-y-2">
                  {ownedPicks.map((pickId) => (
                    <div key={pickId} className="flex items-center justify-between p-2 bg-muted rounded">
                      <span className="text-sm">{pickId}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFromPicks(pickId)}
                        className="h-6 w-6 p-0"
                      >
                        ×
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
