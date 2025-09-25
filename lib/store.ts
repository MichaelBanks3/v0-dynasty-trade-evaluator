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
    console.log("[STORE] Returning existing singleton instance")
    return (window as any).__TRADE_STORE__
  }

  console.log("[STORE] Creating new singleton instance")
  const store = create<TradeState>((set, get) => ({
    teamAAssets: [],
    teamBAssets: [],
    activeSide: "A",
    leagueSettings: {
      superflex: false,
      tePremium: false,
    },

    addAssetToTeam: (team, asset) => {
      console.log("[STORE] addAssetToTeam called", { team, assetId: asset.id, assetLabel: asset.label })
      
      const currentState = get()
      const currentAssets = safeArray(currentState.teamAAssets)
      const otherAssets = safeArray(currentState.teamBAssets)

      console.log("[STORE] Current state", { 
        currentTeamAssets: currentAssets.length, 
        otherTeamAssets: otherAssets.length,
        currentAssetIds: currentAssets.map(a => a.id),
        otherAssetIds: otherAssets.map(a => a.id)
      })

      // Prevent duplicates within the same team
      if (currentAssets.some((a) => a?.id === asset?.id)) {
        console.log(`[STORE] Asset ${asset.id} already in Team ${team}`)
        return false
      }

      // Prevent duplicates across teams
      if (otherAssets.some((a) => a?.id === asset?.id)) {
        console.log(`[STORE] Asset ${asset.id} already in other team`)
        return false
      }

      console.log("[STORE] Adding asset to team", { team, assetId: asset.id })
      
      // IMMUTABLE UPDATE - create new arrays
      set((state) => {
        const newTeamAAssets = team === "A" 
          ? [...safeArray(state.teamAAssets), asset]
          : [...safeArray(state.teamAAssets)]
        
        const newTeamBAssets = team === "B" 
          ? [...safeArray(state.teamBAssets), asset]
          : [...safeArray(state.teamBAssets)]

        const newState = {
          ...state,
          teamAAssets: newTeamAAssets,
          teamBAssets: newTeamBAssets,
        }
        
        console.log("[STORE] New state after add", { 
          teamAAssets: newState.teamAAssets.length, 
          teamBAssets: newState.teamBAssets.length,
          newTeamAAssetsRef: newTeamAAssets !== state.teamAAssets,
          newTeamBAssetsRef: newTeamBAssets !== state.teamBAssets
        })
        return newState
      })

      // Dev instrumentation
      if (process.env.NODE_ENV !== "production") {
        const newState = get()
        console.log("[STORE] Dev instrumentation", {
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
      console.log("[STORE] removeAssetFromTeam called", { team, assetId })
      
      // IMMUTABLE UPDATE - create new filtered arrays
      set((state) => {
        const newTeamAAssets = team === "A" 
          ? safeArray(state.teamAAssets).filter((asset) => asset?.id !== assetId)
          : [...safeArray(state.teamAAssets)]
        
        const newTeamBAssets = team === "B" 
          ? safeArray(state.teamBAssets).filter((asset) => asset?.id !== assetId)
          : [...safeArray(state.teamBAssets)]

        const newState = {
          ...state,
          teamAAssets: newTeamAAssets,
          teamBAssets: newTeamBAssets,
        }
        
        console.log("[STORE] New state after remove", { 
          teamAAssets: newState.teamAAssets.length, 
          teamBAssets: newState.teamBAssets.length,
          newTeamAAssetsRef: newTeamAAssets !== state.teamAAssets,
          newTeamBAssetsRef: newTeamBAssets !== state.teamBAssets
        })
        return newState
      })

      // Dev instrumentation
      if (process.env.NODE_ENV !== "production") {
        const newState = get()
        console.log("[STORE] Dev instrumentation", {
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
      console.log("[STORE] setActiveSide called", { side })
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
      console.log("[STORE] clearTrade called")
      set((state) => ({
        ...state,
        teamAAssets: [],
        teamBAssets: [],
        activeSide: "A",
      }))
    },

    getTeamTotal: (team) => {
      const currentState = get()
      const assets = team === "A" ? safeArray(currentState.teamAAssets) : safeArray(currentState.teamBAssets)
      return assets.reduce((sum, asset) => sum + (asset?.value || 0), 0)
    },

    isAssetInAnyTeam: (assetId) => {
      const currentState = get()
      const teamAAssets = safeArray(currentState.teamAAssets)
      const teamBAssets = safeArray(currentState.teamBAssets)
      const inA = teamAAssets.some((a) => a?.id === assetId)
      const inB = teamBAssets.some((a) => a?.id === assetId)
      console.log("[STORE] isAssetInAnyTeam", { assetId, inA, inB })
      return inA || inB
    },
  }))

  // Store the singleton instance globally
  if (typeof window !== 'undefined') {
    (window as any).__TRADE_STORE__ = store
    console.log("[STORE] Stored singleton in window.__TRADE_STORE__")
  }

  return store
}

export const useTradeStore = createTradeStore()