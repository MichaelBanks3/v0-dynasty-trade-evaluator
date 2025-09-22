"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { X } from "lucide-react"
import type { Asset } from "@/lib/store"

interface TradeBuilderProps {
  teamLabel: string
  assets: Asset[]
  total: number
  onRemoveAsset: (assetId: string) => void
  testId?: string
}

export function TradeBuilder({ teamLabel, assets, total, onRemoveAsset, testId }: TradeBuilderProps) {
  return (
    <Card data-testid={testId}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{teamLabel}</CardTitle>
          <Badge variant="outline" className="text-sm font-medium">
            Total: {Math.round(total)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {assets.length === 0 ? (
          <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
            <p className="text-muted-foreground">No assets yet</p>
            <p className="text-sm text-muted-foreground mt-1">Search and add players or picks above</p>
          </div>
        ) : (
          <div className="space-y-3">
            {assets.map((asset) => (
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
                        {asset.type === "player" ? (asset as any).position : "Pick"}
                      </Badge>
                      {asset.type === "player" && (
                        <>
                          <Badge variant="outline" className="text-xs">
                            {(asset as any).team}
                          </Badge>
                          <span className="text-xs text-muted-foreground">Age {(asset as any).age}</span>
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
                    onClick={() => onRemoveAsset(asset.id)}
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
  )
}
