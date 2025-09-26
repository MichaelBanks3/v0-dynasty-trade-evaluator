"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { SrOnly } from "@/components/ui/sr-only"
import { 
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command"
import { Search, Plus, X } from "lucide-react"
import { useTradeStore, type Asset } from "@/lib/store"
import { safeArray } from "@/lib/safe"
import { useToast } from "./Toast"
import { trackEvent, generatePayloadHash } from "@/lib/analytics"

interface PlayerSearchV2Props {
  onAssetAdded?: (asset: Asset, team: "A" | "B") => void
  searchRef?: React.RefObject<HTMLInputElement>
  isAssetDuplicate?: (assetId: string) => boolean
}

// Normalize API response to our Asset shape
function normalizeAsset(apiAsset: any): Asset {
  if (apiAsset.type === "pick") {
    return {
      id: apiAsset.id,
      label: apiAsset.label,
      value: apiAsset.value || 0,
      kind: "pick",
      meta: {
        year: apiAsset.meta?.year,
        round: apiAsset.meta?.round
      }
    }
  } else {
    return {
      id: apiAsset.id,
      label: apiAsset.label,
      value: apiAsset.value || 0,
      kind: "player",
      meta: {
        position: apiAsset.meta?.position,
        team: apiAsset.meta?.team,
        age: apiAsset.meta?.age || apiAsset.age
      }
    }
  }
}

export function PlayerSearchV2({ onAssetAdded, searchRef, isAssetDuplicate }: PlayerSearchV2Props) {
  const [searchTerm, setSearchTerm] = useState("")
  const [searchResults, setSearchResults] = useState<Asset[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const commandRef = useRef<HTMLDivElement>(null)

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
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
        const data = await response.json()
        
        // Safely handle the response and normalize assets
        const results = safeArray(data).map(normalizeAsset)
        setSearchResults(results)
        setHasSearched(true)

        // Track search query
        await trackEvent('search_query', {
          payloadHash: generatePayloadHash({ queryLength: query.length })
        })
      } catch (error) {
        console.error('Error searching players:', error)
        setSearchResults([])
        setHasSearched(true)
      } finally {
        setIsLoading(false)
      }
    }, 250),
    []
  )

  // Effect to trigger search when searchTerm changes
  useEffect(() => {
    debouncedSearch(searchTerm)
  }, [searchTerm, debouncedSearch])

  const handleAdd = async (asset: Asset, team: "A" | "B") => {
    try {
      console.log("[ADD] Adding asset:", asset, "to team:", team)
      
      // Check if asset is already in any team
      if (isAssetInAnyTeam(asset.id)) {
        showToast("Player already added to trade")
        return
      }

      // Add to store
      addAssetToTeam(asset, team)
      
      // Call optional callback
      if (onAssetAdded) {
        onAssetAdded(asset, team)
      }

      // Clear search
      setSearchTerm("")
      setSearchResults([])
      setHasSearched(false)
      setIsOpen(false)

      showToast(`Added ${asset.label} to Team ${team}`)

      // Track add event
      await trackEvent('asset_added', {
        payloadHash: generatePayloadHash({ 
          assetType: asset.kind,
          team: team,
          assetId: asset.id
        })
      })
    } catch (error) {
      console.error("[ADD] Error adding asset:", error)
      showToast("Cannot add—unknown error")
    }
  }

  const handleSelect = (asset: Asset) => {
    handleAdd(asset, activeSide)
  }

  const handleInputChange = (value: string) => {
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
    }, 200)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false)
      setSearchTerm("")
    }
  }

  return (
    <>
      <div className="theme-card p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Search className="h-5 w-5" />
          Search Players & Picks
        </h2>
        <div className="space-y-4">
          <div className="relative">
            <Command 
              ref={commandRef}
              className="rounded-lg theme-border popover"
              onKeyDown={handleKeyDown}
            >
              <CommandInput
                ref={searchRef}
                placeholder="Search for players or picks... (Press / to focus)"
                value={searchTerm}
                onValueChange={handleInputChange}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
                data-testid="search-input"
                className="input focus-ring w-full text-base"
              />
                {isOpen && (
                  <CommandList 
                    className="popover"
                    style={{position:'absolute', zIndex:60, maxHeight: '18rem', overflowY:'auto'}}
                    data-testid="search-results"
                  >
                    {isLoading ? (
                      <div className="p-4 text-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 mx-auto mb-2" style={{borderColor: 'hsl(var(--primary))'}}></div>
                        <p className="text-sm theme-muted">Searching...</p>
                      </div>
                    ) : searchResults.length > 0 ? (
                      <CommandGroup>
                        {searchResults.map((asset) => {
                          const isAlreadyAdded = isAssetDuplicate?.(asset.id) || isAssetInAnyTeam(asset.id)
                          
                          return (
                            <CommandItem
                              key={asset.id}
                              value={asset.label}
                              onSelect={() => !isAlreadyAdded && handleSelect(asset)}
                              disabled={isAlreadyAdded}
                              className="flex items-center justify-between p-3 cursor-pointer hover:opacity-80 transition-opacity"
                              data-testid={`search-result-${asset.id}`}
                            >
                              <div className="flex items-center space-x-3 flex-1">
                                <div>
                                  <p className="font-semibold">{asset.label}</p>
                                  <div className="flex items-center space-x-2 mt-1">
                                    <span className="text-xs theme-muted">
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
                                <span className="text-sm font-medium theme-muted">{asset.value}</span>
                                {isAlreadyAdded ? (
                                  <span className="chip text-xs">
                                    Added
                                  </span>
                                ) : (
                                  <button
                                    type="button"
                                    className="h-10 w-10 p-0 btn-ghost focus-ring"
                                    onClick={(e) => {
                                      e.preventDefault()
                                      e.stopPropagation()
                                      handleAdd(asset, activeSide)
                                    }}
                                    data-testid={`add-${asset.id}-${activeSide.toLowerCase()}`}
                                    aria-label={`Add ${asset.label} to Team ${activeSide}`}
                                  >
                                    <Plus className="h-4 w-4" />
                                    <SrOnly>Add {asset.label} to Team {activeSide}</SrOnly>
                                  </button>
                                )}
                              </div>
                            </CommandItem>
                          )
                        })}
                      </CommandGroup>
                    ) : hasSearched ? (
                      <CommandEmpty>
                        <div className="p-4">
                          <p className="text-sm theme-muted">No results. Try 'Williams' or '2026 1st'</p>
                        </div>
                      </CommandEmpty>
                    ) : (
                      <CommandEmpty>
                        <div className="p-4">
                          <p className="text-sm theme-muted">Start typing to search...</p>
                        </div>
                      </CommandEmpty>
                    )}
                  </CommandList>
                )}
              </Command>
            </div>
          </div>
        </div>
      
      {/* Toast */}
      <div className="fixed top-4 right-4 z-50" style={{pointerEvents: 'none'}}>
        {toast.isVisible && (
          <div className="theme-card p-4 max-w-sm" style={{pointerEvents: 'auto'}}>
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm">{toast.message}</p>
              <button
                onClick={hideToast}
                className="h-6 w-6 p-0 btn-ghost focus-ring"
              >
                <X className="h-4 w-4" />
              </button>
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
