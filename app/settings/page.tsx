"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Check, X, RefreshCw, ExternalLink } from "lucide-react"

interface User {
  id: string
  email?: string
  sleeperUserId?: string
  sleeperUsername?: string
}

interface LeagueLink {
  id: string
  leagueId: string
  season: string
  name: string
  sport: string
  selected: boolean
}

export default function SettingsPage() {
  const { isSignedIn, userId } = useAuth()
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [leagues, setLeagues] = useState<LeagueLink[]>([])
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [username, setUsername] = useState("")

  useEffect(() => {
    if (!isSignedIn) {
      router.push('/sign-in')
      return
    }
    fetchUserData()
  }, [isSignedIn, router])

  const fetchUserData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/user/profile')
      if (response.ok) {
        const userData = await response.json()
        setUser(userData)
        setUsername(userData.sleeperUsername || "")
      }
    } catch (err) {
      setError('Failed to load user data')
    } finally {
      setLoading(false)
    }
  }

  const fetchLeagues = async () => {
    try {
      setRefreshing(true)
      const response = await fetch('/api/sleeper/leagues')
      if (response.ok) {
        const leaguesData = await response.json()
        setLeagues(leaguesData)
      } else {
        setError('Failed to fetch leagues')
      }
    } catch (err) {
      setError('Failed to fetch leagues')
    } finally {
      setRefreshing(false)
    }
  }

  const connectSleeper = async () => {
    if (!username.trim()) {
      setError('Please enter a Sleeper username')
      return
    }

    try {
      setConnecting(true)
      setError(null)
      
      const response = await fetch('/api/sleeper/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim() })
      })

      if (response.ok) {
        const result = await response.json()
        setUser(prev => prev ? { ...prev, sleeperUserId: result.userId, sleeperUsername: username.trim() } : null)
        setSuccess('Successfully connected to Sleeper!')
        await fetchLeagues()
      } else {
        const error = await response.json()
        setError(error.message || 'Failed to connect to Sleeper')
      }
    } catch (err) {
      setError('Failed to connect to Sleeper')
    } finally {
      setConnecting(false)
    }
  }

  const toggleLeague = (leagueId: string) => {
    setLeagues(prev => prev.map(league => 
      league.leagueId === leagueId 
        ? { ...league, selected: !league.selected }
        : league
    ))
  }

  const saveLeagueSelection = async () => {
    try {
      setSaving(true)
      const selectedLeagues = leagues.filter(league => league.selected)
      
      const response = await fetch('/api/sleeper/leagues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          leagues: selectedLeagues.map(league => ({
            leagueId: league.leagueId,
            season: league.season,
            name: league.name,
            sport: league.sport
          }))
        })
      })

      if (response.ok) {
        setSuccess(`Saved ${selectedLeagues.length} league(s)`)
      } else {
        setError('Failed to save league selection')
      }
    } catch (err) {
      setError('Failed to save league selection')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-16">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-accent" />
          <p className="text-subtext">Loading settings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-text">Settings</h1>
        <p className="text-subtext mt-2">Manage your account and league connections</p>
      </div>

      {error && (
        <Alert className="border-danger/50 bg-danger/10">
          <X className="h-4 w-4 text-danger" />
          <AlertDescription className="text-danger">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-500/50 bg-green-500/10">
          <Check className="h-4 w-4 text-green-500" />
          <AlertDescription className="text-green-500">
            {success}
          </AlertDescription>
        </Alert>
      )}

      {/* Sleeper Connection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-text">Sleeper Account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {user?.sleeperUserId ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Check className="h-5 w-5 text-green-500" />
                <span className="text-text">Connected as</span>
                <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/30">
                  {user.sleeperUsername}
                </Badge>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  onClick={fetchLeagues}
                  disabled={refreshing}
                  variant="outline"
                  size="sm"
                  className="text-subtext hover:text-text"
                >
                  {refreshing ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  Refresh Leagues
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-text mb-2 block">
                  Sleeper Username
                </label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter your Sleeper username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="bg-surface border-border"
                  />
                  <Button
                    onClick={connectSleeper}
                    disabled={connecting || !username.trim()}
                    className="bg-accent text-accent-contrast hover:bg-accent/90"
                  >
                    {connecting ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <ExternalLink className="h-4 w-4 mr-2" />
                    )}
                    Connect
                  </Button>
                </div>
              </div>
              <p className="text-sm text-subtext">
                Connect your Sleeper account to import leagues and get personalized trade suggestions.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* League Selection */}
      {user?.sleeperUserId && leagues.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-text">Connected Leagues</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {leagues.map((league) => (
                <div key={league.leagueId} className="flex items-center space-x-3 p-3 bg-muted/20 rounded-lg border border-border/30">
                  <Checkbox
                    id={league.leagueId}
                    checked={league.selected}
                    onCheckedChange={() => toggleLeague(league.leagueId)}
                  />
                  <div className="flex-1">
                    <label htmlFor={league.leagueId} className="text-sm font-medium text-text cursor-pointer">
                      {league.name}
                    </label>
                    <div className="text-xs text-subtext">
                      {league.season} • {league.sport.toUpperCase()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-4 pt-4 border-t border-border/30">
              <Button
                onClick={saveLeagueSelection}
                disabled={saving}
                className="bg-accent text-accent-contrast hover:bg-accent/90"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Check className="h-4 w-4 mr-2" />
                )}
                Save Selection
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Account Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-text">Account Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-subtext">Email</span>
              <span className="text-text">{user?.email || 'Not provided'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-subtext">User ID</span>
              <span className="text-text font-mono text-xs">{userId}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
