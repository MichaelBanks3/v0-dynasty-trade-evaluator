"use client"

import { create } from "zustand"
import { safeArray } from "./safe"

// Normalized asset shape used across the entire app
export interface Asset {
  id: string // Globally unique identifier
  kind: "player" | "pick"
  label: string // Display name
  value: number // Base value
  meta?: {
    position?: string
    team?: string
    year?: number
    round?: number
    age?: number
  }
}

export interface LeagueSettings {
  superflex: boolean
  tePremium: boolean
}

export interface TradeState {
  teamAAssets: Asset[]
  teamBAssets: Asset[]
  activeSide: "A" | "B"
  leagueSettings: LeagueSettings
  addAssetToTeam: (team: "A" | "B", asset: Asset) => boolean
  removeAssetFromTeam: (team: "A" | "B", assetId: string) => void
  setActiveSide: (side: "A" | "B") => void
  updateLeagueSettings: (settings: Partial<LeagueSettings>) => void
  clearTrade: () => void
  getTeamTotal: (team: "A" | "B") => number
  isAssetInAnyTeam: (assetId: string) => boolean
}

// Singleton guard to ensure only one store instance
const createTradeStore = () => {
  if (typeof window !== 'undefined' && (window as any).__TRADE_STORE__) {
    return (window as any).__TRADE_STORE__
  }

  const store = create<TradeState>((set, get) => ({
    teamAAssets: [],
    teamBAssets: [],
    activeSide: "A",
    leagueSettings: {
      superflex: false,
      tePremium: false,
    },

    addAssetToTeam: (team, asset) => {
      const key = team === "A" ? "teamAAssets" : "teamBAssets"
      const currentAssets = safeArray(get()[key])
      const otherKey = team === "A" ? "teamBAssets" : "teamAAssets"
      const otherAssets = safeArray(get()[otherKey])

      // Prevent duplicates within the same team
      if (currentAssets.some((a) => a?.id === asset?.id)) {
        if (process.env.NODE_ENV !== "production") {
          console.log(`Asset ${asset.id} already in Team ${team}`)
        }
        return false
      }

      // Prevent duplicates across teams
      if (otherAssets.some((a) => a?.id === asset?.id)) {
        if (process.env.NODE_ENV !== "production") {
          console.log(`Asset ${asset.id} already in other team`)
        }
        return false
      }

      set((state) => ({
        ...state,
        [key]: [...currentAssets, asset],
      }))

      // Dev instrumentation
      if (process.env.NODE_ENV !== "production") {
        const newState = get()
        console.log({
          activeSide: newState.activeSide,
          added: { id: asset.id, kind: asset.kind },
          counts: { 
            a: newState.teamAAssets.length, 
            b: newState.teamBAssets.length 
          }
        })
      }
      
      return true
    },

    removeAssetFromTeam: (team, assetId) => {
      const key = team === "A" ? "teamAAssets" : "teamBAssets"
      const currentAssets = safeArray(get()[key])

      set((state) => ({
        ...state,
        [key]: currentAssets.filter((asset) => asset?.id !== assetId),
      }))

      // Dev instrumentation
      if (process.env.NODE_ENV !== "production") {
        const newState = get()
        console.log({
          action: 'remove',
          team,
          removed: assetId,
          counts: { 
            a: newState.teamAAssets.length, 
            b: newState.teamBAssets.length 
          }
        })
      }
    },

    setActiveSide: (side) => {
      set((state) => ({
        ...state,
        activeSide: side,
      }))
    },

    updateLeagueSettings: (settings) => {
      set((state) => ({
        ...state,
        leagueSettings: { ...state.leagueSettings, ...settings },
      }))
    },

    clearTrade: () => {
      set((state) => ({
        ...state,
        teamAAssets: [],
        teamBAssets: [],
        activeSide: "A",
      }))
    },

    getTeamTotal: (team) => {
      const key = team === "A" ? "teamAAssets" : "teamBAssets"
      const assets = safeArray(get()[key])
      return assets.reduce((sum, asset) => sum + (asset?.value || 0), 0)
    },

    isAssetInAnyTeam: (assetId) => {
      const teamAAssets = safeArray(get().teamAAssets)
      const teamBAssets = safeArray(get().teamBAssets)
      return teamAAssets.some((a) => a?.id === assetId) || teamBAssets.some((a) => a?.id === assetId)
    },
  }))

  // Store the singleton instance globally
  if (typeof window !== 'undefined') {
    (window as any).__TRADE_STORE__ = store
  }

  return store
}

export const useTradeStore = createTradeStore()