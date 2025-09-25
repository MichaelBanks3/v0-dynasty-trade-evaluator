"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { X } from "lucide-react"
import { useTradeStore } from "@/lib/store"
import { PlayerSearch } from "./PlayerSearch"

export function TradeBuilder() {
  const { teamAAssets, teamBAssets, removeAssetFromTeam } = useTradeStore()

  const teamATotal = teamAAssets?.reduce((sum: number, asset: any) => sum + asset.baseValue, 0) || 0
  const teamBTotal = teamBAssets?.reduce((sum: number, asset: any) => sum + asset.baseValue, 0) || 0

  return (
    <div className="space-y-8">
      {/* Player Search */}
      <PlayerSearch />

      {/* Team A */}
      <Card data-testid="team-a-builder">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Team A</CardTitle>
            <Badge variant="outline" className="text-sm font-medium" data-testid="team-a-total">
              Total: {Math.round(teamATotal)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {(!teamAAssets || teamAAssets.length === 0) ? (
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
              <p className="text-muted-foreground">No assets yet</p>
              <p className="text-sm text-muted-foreground mt-1">Search and add players or picks above</p>
            </div>
          ) : (
            <div className="space-y-3">
              {teamAAssets.map((asset: any) => (
                <div
                  key={asset.id}
                  className="flex items-center justify-between p-3 bg-accent rounded-lg"
                  data-testid={`asset-${asset.id}`}
                >
                  <div className="flex items-center space-x-3">
                    <div>
                      <p className="font-medium text-foreground">{asset.label}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant={asset.type === "player" ? "default" : "secondary"} className="text-xs">
                          {asset.type === "player" ? asset.position : "Pick"}
                        </Badge>
                        {asset.type === "player" && (
                          <>
                            <Badge variant="outline" className="text-xs">
                              {asset.team}
                            </Badge>
                            <span className="text-xs text-muted-foreground">Age {asset.age}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-muted-foreground">{asset.baseValue}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeAssetFromTeam("A", asset.id)}
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
      <Card data-testid="team-b-builder">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Team B</CardTitle>
            <Badge variant="outline" className="text-sm font-medium" data-testid="team-b-total">
              Total: {Math.round(teamBTotal)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {(!teamBAssets || teamBAssets.length === 0) ? (
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
              <p className="text-muted-foreground">No assets yet</p>
              <p className="text-sm text-muted-foreground mt-1">Search and add players or picks above</p>
            </div>
          ) : (
            <div className="space-y-3">
              {teamBAssets.map((asset: any) => (
                <div
                  key={asset.id}
                  className="flex items-center justify-between p-3 bg-accent rounded-lg"
                  data-testid={`asset-${asset.id}`}
                >
                  <div className="flex items-center space-x-3">
                    <div>
                      <p className="font-medium text-foreground">{asset.label}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant={asset.type === "player" ? "default" : "secondary"} className="text-xs">
                          {asset.type === "player" ? asset.position : "Pick"}
                        </Badge>
                        {asset.type === "player" && (
                          <>
                            <Badge variant="outline" className="text-xs">
                              {asset.team}
                            </Badge>
                            <span className="text-xs text-muted-foreground">Age {asset.age}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-muted-foreground">{asset.baseValue}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeAssetFromTeam("B", asset.id)}
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