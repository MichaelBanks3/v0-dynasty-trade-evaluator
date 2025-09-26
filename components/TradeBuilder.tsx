"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { SrOnly } from "@/components/ui/sr-only"
import { X, Trash2, Users, Calendar } from "lucide-react"
import { useTradeStore, type Asset } from "@/lib/store"
import { safeArray } from "@/lib/safe"
import { PlayerSearchV2 } from "./PlayerSearchV2"
import { ActiveSideControl } from "./ActiveSideControl"
import { trackEvent, generatePayloadHash } from "@/lib/analytics"
import { useEffect, useRef } from "react"

interface TradeBuilderProps {
  searchInputRef?: React.RefObject<HTMLInputElement>
}

export function TradeBuilder({ searchInputRef }: TradeBuilderProps) {
  const { 
    teamAAssets, 
    teamBAssets, 
    activeSide,
    leagueSettings,
    removeAssetFromTeam, 
    setActiveSide,
    addAssetToTeam,
    updateLeagueSettings
  } = useTradeStore()

  const searchRef = searchInputRef || useRef<HTMLInputElement>(null)

  // Safely get arrays
  const safeTeamAAssets = safeArray(teamAAssets)
  const safeTeamBAssets = safeArray(teamBAssets)

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Focus search with /
      if (e.key === '/' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault()
        searchRef.current?.focus()
      }
      
      // Switch active side with 1/2
      if (e.key === '1' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault()
        setActiveSide('A')
      }
      if (e.key === '2' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault()
        setActiveSide('B')
      }
      
      // Remove last asset with Backspace when search is empty
      if (e.key === 'Backspace' && !searchRef.current?.value) {
        e.preventDefault()
        const currentAssets = activeSide === 'A' ? safeTeamAAssets : safeTeamBAssets
        if (currentAssets.length > 0) {
          const lastAsset = currentAssets[currentAssets.length - 1]
          removeAssetFromTeam(activeSide, lastAsset.id)
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [activeSide, safeTeamAAssets, safeTeamBAssets, removeAssetFromTeam, setActiveSide])

  // Debug logging for renders
  console.log("RENDER A/B", safeTeamAAssets.length, safeTeamBAssets.length)

  const teamATotal = safeTeamAAssets.reduce((sum: number, asset: Asset) => sum + (asset?.value || 0), 0)
  const teamBTotal = safeTeamBAssets.reduce((sum: number, asset: Asset) => sum + (asset?.value || 0), 0)

  const handlePanelClick = (team: "A" | "B") => {
    console.log("[PANEL] Clicked", team)
    setActiveSide(team)
  }

  const handleAssetAdded = (asset: Asset, team: "A" | "B") => {
    // Asset was successfully added, no additional action needed
    console.log(`[CALLBACK] Added ${asset.label} to Team ${team}`)
  }

  const clearSide = async (team: "A" | "B") => {
    const assets = team === 'A' ? safeTeamAAssets : safeTeamBAssets
    assets.forEach(asset => {
      removeAssetFromTeam(team, asset.id)
    })

    // Track clear side action
    await trackEvent('remove_asset', {
      payloadHash: generatePayloadHash({ action: 'clear_side', team, count: assets.length })
    })
  }

  const isAssetDuplicate = (assetId: string) => {
    return safeTeamAAssets.some(asset => asset.id === assetId) || 
           safeTeamBAssets.some(asset => asset.id === assetId)
  }

  // Debug button handlers
  const handleDebugAddToA = () => {
    console.log("[DEBUG] Adding debug player to Team A")
    const debugAsset: Asset = {
      id: "debug:player:a",
      kind: "player",
      label: "Debug Player A",
      value: 10,
      meta: { position: "QB", team: "DEBUG", age: 25 }
    }
    const success = addAssetToTeam("A", debugAsset)
    console.log("[DEBUG] Add to A result:", success)
  }

  const handleDebugAddToB = () => {
    console.log("[DEBUG] Adding debug player to Team B")
    const debugAsset: Asset = {
      id: "debug:player:b",
      kind: "player",
      label: "Debug Player B",
      value: 15,
      meta: { position: "RB", team: "DEBUG", age: 26 }
    }
    const success = addAssetToTeam("B", debugAsset)
    console.log("[DEBUG] Add to B result:", success)
  }

  return (
    <div className="space-y-8">
      {/* Debug Badge (dev only) */}
      {process.env.NODE_ENV !== "production" && process.env.NEXT_PUBLIC_DEBUG === "1" && (
        <div className="fixed top-20 right-4 z-40 bg-background border border-border rounded-md px-3 py-1 text-xs font-mono" style={{pointerEvents: 'none'}}>
          A:{safeTeamAAssets.length} | B:{safeTeamBAssets.length}
        </div>
      )}

      {/* Debug Buttons (dev only) */}
      {process.env.NODE_ENV !== "production" && process.env.NEXT_PUBLIC_DEBUG === "1" && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-yellow-800 mb-2">Debug Controls</h3>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDebugAddToA}
              className="text-xs"
            >
              Add Debug Player to A
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDebugAddToB}
              className="text-xs"
            >
              Add Debug Player to B
            </Button>
          </div>
        </div>
      )}

      {/* League Settings */}
      <div className="theme-card p-6">
        <h2 className="text-lg font-semibold mb-4">League Settings</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="superflex">Superflex</Label>
              <p className="text-sm theme-muted">
                QBs can be played in the flex position
              </p>
            </div>
            <Switch
              id="superflex"
              checked={leagueSettings.superflex}
              onCheckedChange={(checked) => updateLeagueSettings({ superflex: checked })}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="te-premium">TE Premium</Label>
              <p className="text-sm theme-muted">
                Tight ends receive bonus points
              </p>
            </div>
            <Switch
              id="te-premium"
              checked={leagueSettings.tePremium}
              onCheckedChange={(checked) => updateLeagueSettings({ tePremium: checked })}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Player Search with Active Side Control */}
      <div className="space-y-4">
        {/* Active Side Control - pinned above search */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium theme-muted">Add to:</span>
          <ActiveSideControl />
        </div>
        
        {/* Player Search */}
        <PlayerSearchV2 
          onAssetAdded={handleAssetAdded} 
          searchRef={searchRef}
          isAssetDuplicate={isAssetDuplicate}
        />
      </div>

      {/* Team A */}
      <div 
        data-testid="team-a-builder"
        className={`theme-card p-4 transition-colors ${activeSide === "A" ? "ring-2 ring-primary ring-offset-2" : ""}`}
        role="region"
        aria-label="Team A trade builder"
        aria-selected={activeSide === "A"}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Team A</h2>
          <div className="flex items-center gap-2">
            <span className="text-sm theme-muted">Total</span>
            <span className="text-sm font-medium" data-testid="team-a-total">
              {Math.round(teamATotal).toLocaleString()}
            </span>
            {safeTeamAAssets.length > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  clearSide('A')
                }}
                className="h-10 w-10 p-0 btn-ghost focus-ring"
                aria-label="Clear all assets from Team A"
              >
                <Trash2 className="h-4 w-4" />
                <SrOnly>Clear all assets from Team A</SrOnly>
              </button>
            )}
          </div>
        </div>
        {safeTeamAAssets.length === 0 ? (
          <div 
            className="border border-dashed theme-border rounded-lg p-6 text-center cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => handlePanelClick("A")}
          >
            <p className="theme-muted">No assets yet</p>
            <p className="text-sm theme-muted mt-1">Search and add players or picks above</p>
          </div>
        ) : (
          <div className="space-y-0" role="list" aria-label="Team A assets">
            {safeTeamAAssets.map((asset: Asset, index: number) => (
              <div
                key={asset.id}
                className={`flex items-center justify-between py-3 ${
                  index < safeTeamAAssets.length - 1 ? 'border-b border-dotted theme-border' : ''
                }`}
                data-testid={`asset-${asset.id}`}
                role="listitem"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Delete' || e.key === 'Backspace') {
                    e.preventDefault()
                    removeAssetFromTeam('A', asset.id)
                  }
                }}
              >
                <div className="flex items-center space-x-3 flex-1">
                  <div>
                    <p className="font-medium">{asset.label}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="chip text-xs">
                        {asset.kind === "player" ? (asset.meta?.position || 'Unknown') : "Pick"}
                      </span>
                      {asset.kind === "player" && (
                        <>
                          <span className="text-xs theme-muted">
                            {asset.meta?.team || 'Unknown'}
                          </span>
                          <span className="text-xs theme-muted">Age {asset.meta?.age || 'Unknown'}</span>
                        </>
                      )}
                      {asset.kind === "pick" && (
                        <span className="text-xs theme-muted">
                          {asset.meta?.year} Round {asset.meta?.round}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium">{asset.value.toLocaleString()}</span>
                  <button
                    type="button"
                    onClick={() => {
                      console.log("[REMOVE] Removing from Team A", asset.id)
                      removeAssetFromTeam("A", asset.id)
                    }}
                    className="h-10 w-10 p-0 btn-ghost focus-ring"
                    data-testid={`remove-${asset.id}`}
                    aria-label={`Remove ${asset.label} from Team A`}
                  >
                    <X className="h-4 w-4" />
                    <SrOnly>Remove {asset.label} from Team A</SrOnly>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Team B */}
      <div 
        data-testid="team-b-builder"
        className={`theme-card p-4 transition-colors ${activeSide === "B" ? "ring-2 ring-primary ring-offset-2" : ""}`}
        role="region"
        aria-label="Team B trade builder"
        aria-selected={activeSide === "B"}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Team B</h2>
          <div className="flex items-center gap-2">
            <span className="text-sm theme-muted">Total</span>
            <span className="text-sm font-medium" data-testid="team-b-total">
              {Math.round(teamBTotal).toLocaleString()}
            </span>
            {safeTeamBAssets.length > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  clearSide('B')
                }}
                className="h-10 w-10 p-0 btn-ghost focus-ring"
                aria-label="Clear all assets from Team B"
              >
                <Trash2 className="h-4 w-4" />
                <SrOnly>Clear all assets from Team B</SrOnly>
              </button>
            )}
          </div>
        </div>
        {safeTeamBAssets.length === 0 ? (
          <div 
            className="border border-dashed theme-border rounded-lg p-6 text-center cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => handlePanelClick("B")}
          >
            <p className="theme-muted">No assets yet</p>
            <p className="text-sm theme-muted mt-1">Search and add players or picks above</p>
          </div>
        ) : (
          <div className="space-y-0" role="list" aria-label="Team B assets">
            {safeTeamBAssets.map((asset: Asset, index: number) => (
              <div
                key={asset.id}
                className={`flex items-center justify-between py-3 ${
                  index < safeTeamBAssets.length - 1 ? 'border-b border-dotted theme-border' : ''
                }`}
                data-testid={`asset-${asset.id}`}
                role="listitem"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Delete' || e.key === 'Backspace') {
                    e.preventDefault()
                    removeAssetFromTeam('B', asset.id)
                  }
                }}
              >
                <div className="flex items-center space-x-3 flex-1">
                  <div>
                    <p className="font-medium">{asset.label}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="chip text-xs">
                        {asset.kind === "player" ? (asset.meta?.position || 'Unknown') : "Pick"}
                      </span>
                      {asset.kind === "player" && (
                        <>
                          <span className="text-xs theme-muted">
                            {asset.meta?.team || 'Unknown'}
                          </span>
                          <span className="text-xs theme-muted">Age {asset.meta?.age || 'Unknown'}</span>
                        </>
                      )}
                      {asset.kind === "pick" && (
                        <span className="text-xs theme-muted">
                          {asset.meta?.year} Round {asset.meta?.round}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium">{asset.value.toLocaleString()}</span>
                  <button
                    type="button"
                    onClick={() => {
                      console.log("[REMOVE] Removing from Team B", asset.id)
                      removeAssetFromTeam("B", asset.id)
                    }}
                    className="h-10 w-10 p-0 btn-ghost focus-ring"
                    data-testid={`remove-${asset.id}`}
                    aria-label={`Remove ${asset.label} from Team B`}
                  >
                    <X className="h-4 w-4" />
                    <SrOnly>Remove {asset.label} from Team B</SrOnly>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}