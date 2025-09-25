"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Download, 
  Users, 
  Settings, 
  CheckCircle, 
  AlertTriangle,
  ExternalLink,
  ArrowRight
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { trackEvent, generatePayloadHash } from '@/lib/analytics'

interface LeagueImportFlowProps {
  onComplete?: (leagueId: string, teamId: string) => void
  className?: string
}

interface ImportedLeague {
  id: string
  name: string
  season: string
  settingsSnapshot: any
}

interface ImportedTeam {
  id: string
  displayName: string
  userHandle: string | null
  playerCount: number
  unmatchedCount: number
}

interface ImportStats {
  totalTeams: number
  totalPlayers: number
  matchedPlayers: number
  unmatchedPlayers: number
  matchRate: number
  hasPicks: boolean
}

export function LeagueImportFlow({ onComplete, className }: LeagueImportFlowProps) {
  const [step, setStep] = useState<'import' | 'select' | 'settings' | 'picks' | 'complete'>('import')
  const [leagueId, setLeagueId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [importedLeague, setImportedLeague] = useState<ImportedLeague | null>(null)
  const [teams, setTeams] = useState<ImportedTeam[]>([])
  const [stats, setStats] = useState<ImportStats | null>(null)
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null)
  const [confirmedSettings, setConfirmedSettings] = useState<any>(null)
  const [confirmedPicks, setConfirmedPicks] = useState<string[]>([])
  const { toast } = useToast()

  const handleImport = async () => {
    if (!leagueId.trim()) {
      setError('Please enter a league ID')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/league/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ leagueId: leagueId.trim() }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('League not found. Please check the league ID and ensure the league is public.')
        } else if (response.status === 429) {
          throw new Error('Rate limit exceeded. Please try again in a few minutes.')
        } else {
          throw new Error(data.error || 'Import failed')
        }
      }

      setImportedLeague(data.league)
      setTeams(data.teams)
      setStats(data.stats)
      setStep('select')

      toast({
        title: "League imported successfully!",
        description: `${data.stats.totalTeams} teams found with ${data.stats.matchRate}% player match rate.`,
      })

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Import failed'
      setError(errorMessage)
      console.error('Import error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleTeamSelect = (teamId: string) => {
    setSelectedTeamId(teamId)
    setStep('settings')
  }

  const handleSettingsConfirm = (settings: any) => {
    setConfirmedSettings(settings)
    setStep('picks')
  }

  const handlePicksConfirm = (picks: string[]) => {
    setConfirmedPicks(picks)
    setStep('complete')
  }

  const handleComplete = async () => {
    if (!selectedTeamId || !importedLeague) return

    try {
      // Hydrate team profile
      const response = await fetch('/api/team/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          leagueId: importedLeague.id,
          teamId: selectedTeamId,
          settings: confirmedSettings,
          picks: confirmedPicks
        }),
      })

      if (response.ok) {
        toast({
          title: "Team profile updated!",
          description: "Your roster and settings have been imported from Sleeper.",
        })

        if (onComplete) {
          onComplete(importedLeague.id, selectedTeamId)
        }
      } else {
        throw new Error('Failed to update team profile')
      }

    } catch (error) {
      console.error('Profile update error:', error)
      toast({
        title: "Error updating profile",
        description: "Please try again or contact support.",
        variant: "destructive",
      })
    }
  }

  const selectedTeam = teams.find(t => t.id === selectedTeamId)

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5" />
          Import from Sleeper
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {step === 'import' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Sleeper League ID
              </label>
              <Input
                placeholder="Enter your Sleeper league ID"
                value={leagueId}
                onChange={(e) => setLeagueId(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleImport()}
              />
              <p className="text-sm text-muted-foreground mt-1">
                Find your league ID in the Sleeper app URL or league settings
              </p>
              <details className="mt-2">
                <summary className="text-sm text-blue-600 cursor-pointer hover:underline">
                  How to find your League ID
                </summary>
                <div className="text-xs text-muted-foreground mt-1 p-2 bg-muted rounded">
                  <p>1. Open the Sleeper app and go to your league</p>
                  <p>2. Look at the URL - it will be something like: sleeper.app/leagues/1234567890</p>
                  <p>3. The number at the end (1234567890) is your League ID</p>
                  <p>4. Make sure your league is set to "Public" in league settings</p>
                </div>
              </details>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button 
              onClick={handleImport} 
              disabled={loading || !leagueId.trim()}
              className="w-full"
            >
              {loading ? 'Importing...' : 'Import League'}
            </Button>
          </div>
        )}

        {step === 'select' && importedLeague && stats && (
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-semibold">{importedLeague.name}</h3>
              <p className="text-muted-foreground">{importedLeague.season} Season</p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="text-center p-3 bg-muted rounded">
                <div className="font-semibold">{stats.totalTeams}</div>
                <div className="text-muted-foreground">Teams</div>
              </div>
              <div className="text-center p-3 bg-muted rounded">
                <div className="font-semibold">{stats.matchRate}%</div>
                <div className="text-muted-foreground">Match Rate</div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-3">Select Your Team</h4>
              <div className="space-y-2">
                {teams.map((team) => (
                  <div
                    key={team.id}
                    className="flex items-center justify-between p-3 border rounded cursor-pointer hover:bg-muted"
                    onClick={() => handleTeamSelect(team.id)}
                  >
                    <div>
                      <div className="font-medium">{team.displayName}</div>
                      {team.userHandle && (
                        <div className="text-sm text-muted-foreground">@{team.userHandle}</div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">{team.playerCount} players</div>
                      {team.unmatchedCount > 0 && (
                        <div className="text-xs text-orange-600">{team.unmatchedCount} unmatched</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 'settings' && selectedTeam && importedLeague && (
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-semibold">Confirm Settings</h3>
              <p className="text-muted-foreground">Selected: {selectedTeam.displayName}</p>
            </div>

            {importedLeague.settingsSnapshot ? (
              <div className="space-y-3">
                <h4 className="font-semibold">Detected League Settings</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex justify-between">
                    <span>Scoring:</span>
                    <Badge variant="secondary">{importedLeague.settingsSnapshot.scoring}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Superflex:</span>
                    <Badge variant={importedLeague.settingsSnapshot.superflex ? "default" : "secondary"}>
                      {importedLeague.settingsSnapshot.superflex ? "Yes" : "No"}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>TE Premium:</span>
                    <Badge variant={importedLeague.settingsSnapshot.tePremium ? "default" : "secondary"}>
                      {importedLeague.settingsSnapshot.tePremium ? "Yes" : "No"}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>League Size:</span>
                    <Badge variant="secondary">{importedLeague.settingsSnapshot.leagueSize}</Badge>
                  </div>
                </div>
                <Button 
                  onClick={() => handleSettingsConfirm(importedLeague.settingsSnapshot)}
                  className="w-full"
                >
                  Use These Settings
                </Button>
              </div>
            ) : (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Could not detect league settings. You'll need to configure them manually.
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {step === 'picks' && stats && (
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-semibold">Owned Picks</h3>
            </div>

            {stats.hasPicks ? (
              <div className="text-center">
                <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-2" />
                <p className="text-muted-foreground">
                  Picks have been imported from your league. You can add more manually if needed.
                </p>
                <Button 
                  onClick={() => handlePicksConfirm([])}
                  className="w-full mt-4"
                >
                  Continue
                </Button>
              </div>
            ) : (
              <div className="text-center">
                <AlertTriangle className="h-12 w-12 text-orange-600 mx-auto mb-2" />
                <p className="text-muted-foreground">
                  No picks were found in your league. You can add them manually later.
                </p>
                <Button 
                  onClick={() => handlePicksConfirm([])}
                  className="w-full mt-4"
                >
                  Skip for Now
                </Button>
              </div>
            )}
          </div>
        )}

        {step === 'complete' && (
          <div className="text-center space-y-4">
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto" />
            <div>
              <h3 className="text-lg font-semibold">Import Complete!</h3>
              <p className="text-muted-foreground">
                Your team profile has been updated with your Sleeper roster and settings.
              </p>
            </div>
            <Button onClick={handleComplete} className="w-full">
              Finish Setup
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
