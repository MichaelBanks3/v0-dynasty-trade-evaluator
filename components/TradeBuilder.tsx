"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { X } from "lucide-react"
import { useTradeStore, type Asset } from "@/lib/store"
import { safeArray } from "@/lib/safe"
import { PlayerSearch } from "./PlayerSearch"
import { ActiveSideControl } from "./ActiveSideControl"

export function TradeBuilder() {
  const { 
    teamAAssets, 
    teamBAssets, 
    activeSide,
    removeAssetFromTeam, 
    setActiveSide,
    addAssetToTeam
  } = useTradeStore()

  // Safely get arrays
  const safeTeamAAssets = safeArray(teamAAssets)
  const safeTeamBAssets = safeArray(teamBAssets)

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
        <div className="fixed top-20 right-4 z-40 bg-background border border-border rounded-md px-3 py-1 text-xs font-mono">
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

      {/* Active Side Control */}
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium text-muted-foreground">Add to:</span>
        <ActiveSideControl />
      </div>

      {/* Player Search */}
      <PlayerSearch onAssetAdded={handleAssetAdded} />

      {/* Team A */}
      <Card 
        data-testid="team-a-builder"
        className={`transition-colors ${activeSide === "A" ? "ring-2 ring-primary ring-offset-2" : ""}`}
      >
        <CardHeader 
          className="cursor-pointer"
          onClick={() => handlePanelClick("A")}
        >
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Team A</CardTitle>
            <Badge variant="outline" className="text-sm font-medium" data-testid="team-a-total">
              Total: {Math.round(teamATotal)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {safeTeamAAssets.length === 0 ? (
            <div 
              className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:bg-accent/50 transition-colors"
              onClick={() => handlePanelClick("A")}
            >
              <p className="text-muted-foreground">No assets yet</p>
              <p className="text-sm text-muted-foreground mt-1">Search and add players or picks above</p>
            </div>
          ) : (
            <div className="space-y-3">
              {safeTeamAAssets.map((asset: Asset) => (
                <div
                  key={asset.id}
                  className="flex items-center justify-between p-3 bg-accent rounded-lg"
                  data-testid={`asset-${asset.id}`}
                >
                  <div className="flex items-center space-x-3">
                    <div>
                      <p className="font-medium text-foreground">{asset.label}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant={asset.kind === "player" ? "default" : "secondary"} className="text-xs">
                          {asset.kind === "player" ? (asset.meta?.position || 'Unknown') : "Pick"}
                        </Badge>
                        {asset.kind === "player" && (
                          <>
                            <Badge variant="outline" className="text-xs">
                              {asset.meta?.team || 'Unknown'}
                            </Badge>
                            <span className="text-xs text-muted-foreground">Age {asset.meta?.age || 'Unknown'}</span>
                          </>
                        )}
                        {asset.kind === "pick" && (
                          <Badge variant="outline" className="text-xs">
                            {asset.meta?.year} Round {asset.meta?.round}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-muted-foreground">{asset.value}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        console.log("[REMOVE] Removing from Team A", asset.id)
                        removeAssetFromTeam("A", asset.id)
                      }}
                      className="h-8 w-8 p-0 hover:bg-destructive hover:text-destructive-foreground"
                      data-testid={`remove-${asset.id}`}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Team B */}
      <Card 
        data-testid="team-b-builder"
        className={`transition-colors ${activeSide === "B" ? "ring-2 ring-primary ring-offset-2" : ""}`}
      >
        <CardHeader 
          className="cursor-pointer"
          onClick={() => handlePanelClick("B")}
        >
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Team B</CardTitle>
            <Badge variant="outline" className="text-sm font-medium" data-testid="team-b-total">
              Total: {Math.round(teamBTotal)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {safeTeamBAssets.length === 0 ? (
            <div 
              className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:bg-accent/50 transition-colors"
              onClick={() => handlePanelClick("B")}
            >
              <p className="text-muted-foreground">No assets yet</p>
              <p className="text-sm text-muted-foreground mt-1">Search and add players or picks above</p>
            </div>
          ) : (
            <div className="space-y-3">
              {safeTeamBAssets.map((asset: Asset) => (
                <div
                  key={asset.id}
                  className="flex items-center justify-between p-3 bg-accent rounded-lg"
                  data-testid={`asset-${asset.id}`}
                >
                  <div className="flex items-center space-x-3">
                    <div>
                      <p className="font-medium text-foreground">{asset.label}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant={asset.kind === "player" ? "default" : "secondary"} className="text-xs">
                          {asset.kind === "player" ? (asset.meta?.position || 'Unknown') : "Pick"}
                        </Badge>
                        {asset.kind === "player" && (
                          <>
                            <Badge variant="outline" className="text-xs">
                              {asset.meta?.team || 'Unknown'}
                            </Badge>
                            <span className="text-xs text-muted-foreground">Age {asset.meta?.age || 'Unknown'}</span>
                          </>
                        )}
                        {asset.kind === "pick" && (
                          <Badge variant="outline" className="text-xs">
                            {asset.meta?.year} Round {asset.meta?.round}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-muted-foreground">{asset.value}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        console.log("[REMOVE] Removing from Team B", asset.id)
                        removeAssetFromTeam("B", asset.id)
                      }}
                      className="h-8 w-8 p-0 hover:bg-destructive hover:text-destructive-foreground"
                      data-testid={`remove-${asset.id}`}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}