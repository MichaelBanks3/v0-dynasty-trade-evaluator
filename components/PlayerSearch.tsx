"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, Plus, ChevronDown, X } from "lucide-react"
import { useTradeStore } from "@/lib/store"
import { safeArray } from "@/lib/safe"
import { useToast } from "./Toast"
import type { Asset } from "@/lib/store"

interface PlayerSearchProps {
  onAssetAdded?: (asset: Asset, team: "A" | "B") => void
}

export function PlayerSearch({ onAssetAdded }: PlayerSearchProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [isOpen, setIsOpen] = useState(false)
  const [searchResults, setSearchResults] = useState<Asset[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [showDropdown, setShowDropdown] = useState<string | null>(null)

  const { activeSide, addAssetToTeam, isAssetInAnyTeam } = useTradeStore()
  const { toast, showToast, hideToast } = useToast()

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

  const handleAddToTeam = (asset: Asset, team: "A" | "B") => {
    if (isAssetInAnyTeam(asset?.id || '')) {
      showToast("This player/pick is already on a team")
      return
    }

    const success = addAssetToTeam(team, asset)
    if (success) {
      onAssetAdded?.(asset, team)
      setSearchTerm("")
      setIsOpen(false)
    } else {
      showToast("Failed to add player/pick")
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent, asset: Asset) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddToTeam(asset, activeSide)
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
    setTimeout(() => {
      setIsOpen(false)
      setShowDropdown(null)
    }, 200)
  }

  return (
    <>
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
                      {searchResults.map((asset) => {
                        const isAlreadyAdded = isAssetInAnyTeam(asset?.id || '')
                        const isDropdownOpen = showDropdown === asset?.id
                        
                        return (
                          <div
                            key={asset?.id || Math.random()}
                            className="flex items-center justify-between p-2 hover:bg-accent rounded cursor-pointer"
                            data-testid={`search-result-${asset?.id || 'unknown'}`}
                            onKeyDown={(e) => handleKeyDown(e, asset)}
                            tabIndex={0}
                          >
                            <div className="flex items-center space-x-3 flex-1">
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
                              {isAlreadyAdded ? (
                                <Badge variant="secondary" className="text-xs">
                                  Added
                                </Badge>
                              ) : (
                                <div className="relative">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                    onClick={() => handleAddToTeam(asset, activeSide)}
                                    data-testid={`add-${asset?.id || 'unknown'}-${activeSide.toLowerCase()}`}
                                  >
                                    <Plus className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-4 p-0 ml-1"
                                    onClick={() => setShowDropdown(isDropdownOpen ? null : asset?.id || '')}
                                    data-testid={`dropdown-${asset?.id || 'unknown'}`}
                                  >
                                    <ChevronDown className="h-3 w-3" />
                                  </Button>
                                  {isDropdownOpen && (
                                    <div className="absolute top-full right-0 mt-1 bg-background border border-border rounded-md shadow-lg z-20">
                                      <div className="p-1 space-y-1">
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="w-full justify-start text-xs"
                                          onClick={() => {
                                            handleAddToTeam(asset, "A")
                                            setShowDropdown(null)
                                          }}
                                          data-testid={`add-${asset?.id || 'unknown'}-a`}
                                        >
                                          Add to Team A
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="w-full justify-start text-xs"
                                          onClick={() => {
                                            handleAddToTeam(asset, "B")
                                            setShowDropdown(null)
                                          }}
                                          data-testid={`add-${asset?.id || 'unknown'}-b`}
                                        >
                                          Add to Team B
                                        </Button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      })}
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
      
      {/* Toast */}
      <div className="fixed top-4 right-4 z-50">
        {toast.isVisible && (
          <div className="bg-background border border-border rounded-lg shadow-lg p-4 max-w-sm">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm text-foreground">{toast.message}</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={hideToast}
                className="h-6 w-6 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </>
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