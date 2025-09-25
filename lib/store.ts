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
  leagueSettings: LeagueSettings
  addAssetToTeam: (team: "A" | "B", asset: Asset) => void
  removeAssetFromTeam: (team: "A" | "B", assetId: string) => void
  updateLeagueSettings: (settings: Partial<LeagueSettings>) => void
  clearTrade: () => void
  getTeamTotal: (team: "A" | "B") => number
}

export const useTradeStore = create<TradeState>((set, get) => ({
  teamAAssets: [],
  teamBAssets: [],
  leagueSettings: {
    superflex: false,
    tePremium: false,
  },

  addAssetToTeam: (team, asset) => {
    const key = team === "A" ? "teamAAssets" : "teamBAssets"
    const currentAssets = safeArray(get()[key])

    // Prevent duplicates
    if (currentAssets.some((a) => a?.id === asset?.id)) {
      return
    }

    set((state) => ({
      ...state,
      [key]: [...currentAssets, asset],
    }))
  },

  removeAssetFromTeam: (team, assetId) => {
    const key = team === "A" ? "teamAAssets" : "teamBAssets"
    const currentAssets = safeArray(get()[key])

    set((state) => ({
      ...state,
      [key]: currentAssets.filter((asset) => asset?.id !== assetId),
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
    }))
  },

  getTeamTotal: (team) => {
    const key = team === "A" ? "teamAAssets" : "teamBAssets"
    const assets = safeArray(get()[key])
    return assets.reduce((sum, asset) => sum + (asset?.baseValue || 0), 0)
  },
}))