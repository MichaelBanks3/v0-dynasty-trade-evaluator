import { create } from "zustand"
import { safeArray } from "./safe"
import type { Player } from "@/data/mockPlayers"
import type { Pick } from "@/data/mockPicks"

export type Asset = Player | Pick

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

export const useTradeStore = create<TradeState>((set, get) => ({
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
      return false
    }

    // Prevent duplicates across teams
    if (otherAssets.some((a) => a?.id === asset?.id)) {
      return false
    }

    set((state) => ({
      ...state,
      [key]: [...currentAssets, asset],
    }))
    
    return true
  },

  removeAssetFromTeam: (team, assetId) => {
    const key = team === "A" ? "teamAAssets" : "teamBAssets"
    const currentAssets = safeArray(get()[key])

    set((state) => ({
      ...state,
      [key]: currentAssets.filter((asset) => asset?.id !== assetId),
    }))
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
    return assets.reduce((sum, asset) => sum + (asset?.baseValue || 0), 0)
  },

  isAssetInAnyTeam: (assetId) => {
    const teamAAssets = safeArray(get().teamAAssets)
    const teamBAssets = safeArray(get().teamBAssets)
    return teamAAssets.some((a) => a?.id === assetId) || teamBAssets.some((a) => a?.id === assetId)
  },
}))