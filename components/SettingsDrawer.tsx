"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Settings, Save } from 'lucide-react'
import { LeagueSettings, DEFAULT_SETTINGS, validateSettings, formatSettingsForDisplay } from '@/lib/settings'
import { trackEvent, generatePayloadHash } from '@/lib/analytics'

interface SettingsDrawerProps {
  onSettingsChange: (settings: LeagueSettings) => void
  currentSettings?: LeagueSettings
}

export function SettingsDrawer({ onSettingsChange, currentSettings }: SettingsDrawerProps) {
  const [settings, setSettings] = useState<LeagueSettings>(currentSettings || DEFAULT_SETTINGS)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  // Load user settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      setLoading(true)
      try {
        const response = await fetch('/api/settings')
        if (response.ok) {
          const userSettings = await response.json()
          setSettings(userSettings)
        }
      } catch (error) {
        console.error('Failed to load settings:', error)
      } finally {
        setLoading(false)
      }
    }

    loadSettings()
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      const validatedSettings = validateSettings(settings)
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(validatedSettings),
      })

      if (response.ok) {
        setSettings(validatedSettings)
        onSettingsChange(validatedSettings)

        // Track settings update
        await trackEvent('toggle_setting', {
          payloadHash: generatePayloadHash({ settings: validatedSettings })
        })
      } else {
        console.error('Failed to save settings')
      }
    } catch (error) {
      console.error('Error saving settings:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleApply = () => {
    const validatedSettings = validateSettings(settings)
    setSettings(validatedSettings)
    onSettingsChange(validatedSettings)
  }

  const updateSettings = (updates: Partial<LeagueSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }))
  }

  const updateStarters = (position: keyof LeagueSettings['starters'], value: number) => {
    setSettings(prev => ({
      ...prev,
      starters: {
        ...prev.starters,
        [position]: Math.max(0, Math.min(5, value)) // Cap between 0-5
      }
    }))
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Settings className="h-4 w-4" />
          League Settings
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>League Settings</SheetTitle>
          <SheetDescription>
            Configure your league settings to get accurate trade evaluations.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Scoring System */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Scoring System</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="scoring">Scoring Format</Label>
                <Select
                  value={settings.scoring}
                  onValueChange={(value: 'PPR' | 'Half' | 'Standard') => 
                    updateSettings({ scoring: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PPR">PPR (Point Per Reception)</SelectItem>
                    <SelectItem value="Half">Half PPR</SelectItem>
                    <SelectItem value="Standard">Standard (Non-PPR)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* League Format */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">League Format</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="superflex">Superflex</Label>
                  <p className="text-sm text-muted-foreground">
                    Allows QBs in the FLEX position
                  </p>
                </div>
                <Switch
                  id="superflex"
                  checked={settings.superflex}
                  onCheckedChange={(checked) => updateSettings({ superflex: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="tePremium">TE Premium</Label>
                  <p className="text-sm text-muted-foreground">
                    Bonus points for tight ends
                  </p>
                </div>
                <Switch
                  id="tePremium"
                  checked={settings.tePremium}
                  onCheckedChange={(checked) => updateSettings({ tePremium: checked })}
                />
              </div>

              {settings.tePremium && (
                <div className="space-y-2">
                  <Label htmlFor="tePremiumMultiplier">TE Premium Multiplier</Label>
                  <Input
                    id="tePremiumMultiplier"
                    type="number"
                    min="1.0"
                    max="3.0"
                    step="0.1"
                    value={settings.tePremiumMultiplier}
                    onChange={(e) => updateSettings({ 
                      tePremiumMultiplier: parseFloat(e.target.value) || 1.5 
                    })}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* League Size */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">League Size</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="leagueSize">Number of Teams</Label>
                <Input
                  id="leagueSize"
                  type="number"
                  min="4"
                  max="20"
                  value={settings.leagueSize}
                  onChange={(e) => updateSettings({ 
                    leagueSize: parseInt(e.target.value) || 12 
                  })}
                />
              </div>
            </CardContent>
          </Card>

          {/* Starting Lineup */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Starting Lineup</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="qb">Quarterbacks</Label>
                  <Input
                    id="qb"
                    type="number"
                    min="0"
                    max="3"
                    value={settings.starters.QB}
                    onChange={(e) => updateStarters('QB', parseInt(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rb">Running Backs</Label>
                  <Input
                    id="rb"
                    type="number"
                    min="0"
                    max="4"
                    value={settings.starters.RB}
                    onChange={(e) => updateStarters('RB', parseInt(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="wr">Wide Receivers</Label>
                  <Input
                    id="wr"
                    type="number"
                    min="0"
                    max="5"
                    value={settings.starters.WR}
                    onChange={(e) => updateStarters('WR', parseInt(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="te">Tight Ends</Label>
                  <Input
                    id="te"
                    type="number"
                    min="0"
                    max="3"
                    value={settings.starters.TE}
                    onChange={(e) => updateStarters('TE', parseInt(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="flex">FLEX</Label>
                  <Input
                    id="flex"
                    type="number"
                    min="0"
                    max="3"
                    value={settings.starters.FLEX}
                    onChange={(e) => updateStarters('FLEX', parseInt(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="superflex">SUPERFLEX</Label>
                  <Input
                    id="superflex"
                    type="number"
                    min="0"
                    max="2"
                    value={settings.starters.SUPERFLEX}
                    onChange={(e) => updateStarters('SUPERFLEX', parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-2">
            <Button onClick={handleApply} className="flex-1">
              Apply Settings
            </Button>
            <Button onClick={handleSave} disabled={saving} variant="outline" className="flex-1">
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </>
              )}
            </Button>
          </div>

          {/* Current Settings Display */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Active Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-mono bg-muted p-2 rounded">
                {formatSettingsForDisplay(settings)}
              </p>
            </CardContent>
          </Card>
        </div>
      </SheetContent>
    </Sheet>
  )
}
