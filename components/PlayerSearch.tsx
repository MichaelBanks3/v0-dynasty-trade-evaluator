"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
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
  const [searchResults, setSearchResults] = useState<Asset[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

  // Safely get selected assets
  const safeSelectedAssets = safeArray(selectedAssets)

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(async (query: string) => {
      if (!query.trim()) {
        setSearchResults([])
        setHasSearched(false)
        return
      }

      setIsLoading(true)
      try {
        const response = await fetch(`/api/players?q=${encodeURIComponent(query)}`)
        const data = await response.json()
        
        // Safely handle the response
        const results = safeArray(data)
        setSearchResults(results)
        setHasSearched(true)
      } catch (error) {
        console.error('Error searching players:', error)
        setSearchResults([])
        setHasSearched(true)
      } finally {
        setIsLoading(false)
      }
    }, 300),
    []
  )

  // Effect to trigger search when searchTerm changes
  useEffect(() => {
    debouncedSearch(searchTerm)
  }, [searchTerm, debouncedSearch])

  // Load initial popular players when component mounts
  useEffect(() => {
    const loadPopularPlayers = async () => {
      try {
        const response = await fetch('/api/players')
        const data = await response.json()
        const results = safeArray(data)
        setSearchResults(results.slice(0, 10)) // Show top 10 popular players
        setHasSearched(true)
      } catch (error) {
        console.error('Error loading popular players:', error)
        setSearchResults([])
        setHasSearched(true)
      }
    }

    loadPopularPlayers()
  }, [])

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchTerm(value)
    setIsOpen(true)
  }

  const handleInputFocus = () => {
    setIsOpen(true)
  }

  const handleInputBlur = () => {
    // Delay closing to allow clicks on results
    setTimeout(() => setIsOpen(false), 200)
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
              onChange={handleInputChange}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
              data-testid="player-search-input"
            />
            {isOpen && (
              <div className="absolute top-full left-0 right-0 z-10 mt-1 bg-background border border-border rounded-md shadow-lg max-h-60 overflow-y-auto">
                {isLoading ? (
                  <div className="p-4 text-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
                    <p className="text-sm text-muted-foreground">Searching...</p>
                  </div>
                ) : searchResults.length > 0 ? (
                  <div className="p-2 space-y-1">
                    {searchResults.map((asset) => (
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
                ) : hasSearched ? (
                  <div className="p-4 text-center text-muted-foreground">
                    <p className="text-sm">No players found</p>
                    <p className="text-sm">Try a different search term</p>
                  </div>
                ) : (
                  <div className="p-4 text-center text-muted-foreground">
                    <p className="text-sm">Start typing to search...</p>
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

// Debounce utility function
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  
  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout)
    }
    
    timeout = setTimeout(() => {
      func(...args)
    }, wait)
  }
}