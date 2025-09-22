"use client"

import { useState, useMemo } from "react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Search, Plus } from "lucide-react"
import { mockPlayers } from "@/data/mockPlayers"
import { mockPicks } from "@/data/mockPicks"
import type { Asset } from "@/lib/store"

interface PlayerSearchProps {
  onSelectAsset: (asset: Asset) => void
  selectedAssets: Asset[]
}

export function PlayerSearch({ onSelectAsset, selectedAssets }: PlayerSearchProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [isOpen, setIsOpen] = useState(false)

  const allAssets = useMemo(() => [...mockPlayers, ...mockPicks], [])

  const filteredAssets = useMemo(() => {
    if (!searchTerm) return allAssets.slice(0, 10) // Show first 10 by default

    return allAssets.filter((asset) => asset.label.toLowerCase().includes(searchTerm.toLowerCase())).slice(0, 20) // Limit to 20 results
  }, [searchTerm, allAssets])

  const isAssetSelected = (asset: Asset) => {
    return selectedAssets.some((selected) => selected.id === asset.id)
  }

  const handleSelectAsset = (asset: Asset) => {
    if (!isAssetSelected(asset)) {
      onSelectAsset(asset)
      setSearchTerm("")
      setIsOpen(false)
    }
  }

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search players or picks..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value)
            setIsOpen(true)
          }}
          onFocus={() => setIsOpen(true)}
          className="pl-10"
          data-testid="player-search-input"
        />
      </div>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />

          {/* Results */}
          <Card className="absolute top-full left-0 right-0 mt-1 z-20 max-h-80 overflow-y-auto">
            <CardContent className="p-2">
              {filteredAssets.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  <p>No players or picks found</p>
                  <p className="text-sm">Try a different search term</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredAssets.map((asset) => (
                    <div
                      key={asset.id}
                      className={`flex items-center justify-between p-3 rounded-md hover:bg-accent cursor-pointer transition-colors ${
                        isAssetSelected(asset) ? "bg-muted opacity-50" : ""
                      }`}
                      onClick={() => handleSelectAsset(asset)}
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
                        {!isAssetSelected(asset) && <Plus className="h-4 w-4 text-primary" />}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
