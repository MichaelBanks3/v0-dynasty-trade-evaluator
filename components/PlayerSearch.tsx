"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, Plus } from "lucide-react"
import { useTradeStore } from "@/lib/store"
import { safeArray } from "@/lib/safe"
import type { Asset } from "@/lib/store"

interface PlayerSearchProps {
  onSelectAsset: (asset: Asset) => void
  selectedAssets: Asset[]
}

export function PlayerSearch({ onSelectAsset, selectedAssets }: PlayerSearchProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [isOpen, setIsOpen] = useState(false)
  const [allAssets, setAllAssets] = useState<Asset[]>([])

  // Safely get selected assets
  const safeSelectedAssets = safeArray(selectedAssets)

  useEffect(() => {
    // Fetch players from API
    fetch('/api/players')
      .then(res => res.json())
      .then(data => {
        // Safely handle the response
        const players = safeArray(data)
        setAllAssets(players)
      })
      .catch(error => {
        console.error('Error fetching players:', error)
        setAllAssets([])
      })
  }, [])

  const filteredAssets = useMemo(() => {
    if (!searchTerm.trim()) return []
    
    // Safely filter assets
    const safeAssets = safeArray(allAssets)
    return safeAssets.filter((asset) => 
      asset?.label?.toLowerCase().includes(searchTerm.toLowerCase())
    ).slice(0, 20) // Limit to 20 results
  }, [searchTerm, allAssets])

  const isAssetSelected = (asset: Asset) => {
    return safeSelectedAssets.some((selected) => selected?.id === asset?.id)
  }

  const handleSelectAsset = (asset: Asset) => {
    if (!isAssetSelected(asset)) {
      onSelectAsset(asset)
      setSearchTerm("")
      setIsOpen(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          Search Players & Picks
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="relative">
            <Input
              placeholder="Search for players or picks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={() => setIsOpen(true)}
              data-testid="player-search-input"
            />
            {isOpen && searchTerm && (
              <div className="absolute top-full left-0 right-0 z-10 mt-1 bg-background border border-border rounded-md shadow-lg max-h-60 overflow-y-auto">
                {filteredAssets.length > 0 ? (
                  <div className="p-2 space-y-1">
                    {filteredAssets.map((asset) => (
                      <div
                        key={asset?.id || Math.random()}
                        className="flex items-center justify-between p-2 hover:bg-accent rounded cursor-pointer"
                        onClick={() => handleSelectAsset(asset)}
                        data-testid={`search-result-${asset?.id || 'unknown'}`}
                      >
                        <div className="flex items-center space-x-3">
                          <div>
                            <p className="font-medium">{asset?.label || 'Unknown Asset'}</p>
                            <div className="flex items-center space-x-2 mt-1">
                              <Badge variant={asset?.type === "player" ? "default" : "secondary"} className="text-xs">
                                {asset?.type === "player" ? (asset?.position || 'Unknown') : "Pick"}
                              </Badge>
                              {asset?.type === "player" && (
                                <>
                                  <Badge variant="outline" className="text-xs">
                                    {asset?.team || 'Unknown'}
                                  </Badge>
                                  <span className="text-xs text-muted-foreground">Age {asset?.age || 'Unknown'}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-muted-foreground">{asset?.baseValue || 0}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            data-testid={`add-${asset?.id || 'unknown'}`}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center text-muted-foreground">
                    <p className="text-sm">No players found</p>
                    <p className="text-sm">Try a different search term</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}