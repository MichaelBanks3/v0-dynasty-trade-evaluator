import { create } from "zustand"
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
    set((state) => {
      const key = team === "A" ? "teamAAssets" : "teamBAssets"
      const currentAssets = state[key]

      // Prevent duplicates
      if (currentAssets.some((a) => a.id === asset.id)) {
        return state
      }

      return {
        ...state,
        [key]: [...currentAssets, asset],
      }
    })
  },

  removeAssetFromTeam: (team, assetId) => {
    set((state) => {
      const key = team === "A" ? "teamAAssets" : "teamBAssets"
      return {
        ...state,
        [key]: state[key].filter((asset) => asset.id !== assetId),
      }
    })
  },

  updateLeagueSettings: (settings) => {
    set((state) => ({
      ...state,
      leagueSettings: { ...state.leagueSettings, ...settings },
    }))
  },

  clearTrade: () => {
    set({
      teamAAssets: [],
      teamBAssets: [],
    })
  },

  getTeamTotal: (team) => {
    const state = get()
    const assets = team === "A" ? state.teamAAssets : state.teamBAssets
    const { superflex, tePremium } = state.leagueSettings

    return assets.reduce((total, asset) => {
      let value = asset.baseValue

      // Apply league setting modifiers
      if ("position" in asset) {
        if (superflex && asset.position === "QB") {
          value *= 1.2 // 20% boost for QBs in superflex
        }
        if (tePremium && asset.position === "TE") {
          value *= 1.15 // 15% boost for TEs in TE premium
        }
      }

      return total + value
    }, 0)
  },
}))
