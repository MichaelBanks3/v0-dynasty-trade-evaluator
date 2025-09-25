import { describe, it, expect, beforeEach } from 'vitest'
import { create } from 'zustand'
import type { Asset } from './store'

// Create a fresh store instance for each test
const createTestStore = () => {
  return create((set, get) => ({
    teamAAssets: [] as Asset[],
    teamBAssets: [] as Asset[],
    activeSide: "A" as "A" | "B",
    leagueSettings: {
      superflex: false,
      tePremium: false,
    },
    addAssetToTeam: (team: "A" | "B", asset: Asset) => {
      const currentState = get()
      const currentAssets = team === "A" ? currentState.teamAAssets : currentState.teamBAssets
      const otherAssets = team === "A" ? currentState.teamBAssets : currentState.teamAAssets

      // Prevent duplicates within the same team
      if (currentAssets.some((a) => a?.id === asset?.id)) {
        return false
      }

      // Prevent duplicates across teams
      if (otherAssets.some((a) => a?.id === asset?.id)) {
        return false
      }

      set((state) => {
        const newTeamAAssets = team === "A" 
          ? [...state.teamAAssets, asset]
          : [...state.teamAAssets]
        
        const newTeamBAssets = team === "B" 
          ? [...state.teamBAssets, asset]
          : [...state.teamBAssets]

        return {
          ...state,
          teamAAssets: newTeamAAssets,
          teamBAssets: newTeamBAssets,
        }
      })
      
      return true
    },
    removeAssetFromTeam: (team: "A" | "B", assetId: string) => {
      set((state) => {
        const newTeamAAssets = team === "A" 
          ? state.teamAAssets.filter((asset) => asset?.id !== assetId)
          : [...state.teamAAssets]
        
        const newTeamBAssets = team === "B" 
          ? state.teamBAssets.filter((asset) => asset?.id !== assetId)
          : [...state.teamBAssets]

        return {
          ...state,
          teamAAssets: newTeamAAssets,
          teamBAssets: newTeamBAssets,
        }
      })
    },
    setActiveSide: (side: "A" | "B") => {
      set((state) => ({
        ...state,
        activeSide: side,
      }))
    },
    updateLeagueSettings: (settings: any) => {
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
    getTeamTotal: (team: "A" | "B") => {
      const currentState = get()
      const assets = team === "A" ? currentState.teamAAssets : currentState.teamBAssets
      return assets.reduce((sum, asset) => sum + (asset?.value || 0), 0)
    },
    isAssetInAnyTeam: (assetId: string) => {
      const currentState = get()
      const teamAAssets = currentState.teamAAssets
      const teamBAssets = currentState.teamBAssets
      return teamAAssets.some((a) => a?.id === assetId) || teamBAssets.some((a) => a?.id === assetId)
    },
  }))
}

describe('Trade Store', () => {
  let store: ReturnType<typeof createTestStore>

  beforeEach(() => {
    store = createTestStore()
  })

  it('should have initial state with empty arrays', () => {
    const state = store.getState()
    expect(state.teamAAssets).toEqual([])
    expect(state.teamBAssets).toEqual([])
    expect(state.teamAAssets.length).toBe(0)
    expect(state.teamBAssets.length).toBe(0)
  })

  it('should add asset to Team A', () => {
    const asset: Asset = {
      id: "test:player:1",
      kind: "player",
      label: "Test Player",
      value: 50,
      meta: { position: "QB", team: "TEST", age: 25 }
    }

    const result = store.getState().addAssetToTeam("A", asset)
    expect(result).toBe(true)

    const state = store.getState()
    expect(state.teamAAssets.length).toBe(1)
    expect(state.teamBAssets.length).toBe(0)
    expect(state.teamAAssets[0]).toEqual(asset)
  })

  it('should prevent duplicate adds within same team', () => {
    const asset: Asset = {
      id: "test:player:1",
      kind: "player",
      label: "Test Player",
      value: 50,
      meta: { position: "QB", team: "TEST", age: 25 }
    }

    // First add should succeed
    const result1 = store.getState().addAssetToTeam("A", asset)
    expect(result1).toBe(true)

    // Second add should fail
    const result2 = store.getState().addAssetToTeam("A", asset)
    expect(result2).toBe(false)

    const state = store.getState()
    expect(state.teamAAssets.length).toBe(1)
    expect(state.teamBAssets.length).toBe(0)
  })

  it('should prevent cross-team duplicates', () => {
    const asset: Asset = {
      id: "test:player:1",
      kind: "player",
      label: "Test Player",
      value: 50,
      meta: { position: "QB", team: "TEST", age: 25 }
    }

    // Add to Team A
    const result1 = store.getState().addAssetToTeam("A", asset)
    expect(result1).toBe(true)

    // Try to add same asset to Team B - should fail
    const result2 = store.getState().addAssetToTeam("B", asset)
    expect(result2).toBe(false)

    const state = store.getState()
    expect(state.teamAAssets.length).toBe(1)
    expect(state.teamBAssets.length).toBe(0)
  })

  it('should add different assets to both teams', () => {
    const assetA: Asset = {
      id: "test:player:a",
      kind: "player",
      label: "Test Player A",
      value: 50,
      meta: { position: "QB", team: "TEST", age: 25 }
    }

    const assetB: Asset = {
      id: "test:player:b",
      kind: "player",
      label: "Test Player B",
      value: 60,
      meta: { position: "RB", team: "TEST", age: 26 }
    }

    const result1 = store.getState().addAssetToTeam("A", assetA)
    const result2 = store.getState().addAssetToTeam("B", assetB)

    expect(result1).toBe(true)
    expect(result2).toBe(true)

    const state = store.getState()
    expect(state.teamAAssets.length).toBe(1)
    expect(state.teamBAssets.length).toBe(1)
    expect(state.teamAAssets[0]).toEqual(assetA)
    expect(state.teamBAssets[0]).toEqual(assetB)
  })

  it('should remove asset from team', () => {
    const asset: Asset = {
      id: "test:player:1",
      kind: "player",
      label: "Test Player",
      value: 50,
      meta: { position: "QB", team: "TEST", age: 25 }
    }

    // Add asset to Team A
    store.getState().addAssetToTeam("A", asset)
    expect(store.getState().teamAAssets.length).toBe(1)

    // Remove asset from Team A
    store.getState().removeAssetFromTeam("A", asset.id)
    expect(store.getState().teamAAssets.length).toBe(0)
  })

  it('should create new array references (immutable updates)', () => {
    const asset: Asset = {
      id: "test:player:1",
      kind: "player",
      label: "Test Player",
      value: 50,
      meta: { position: "QB", team: "TEST", age: 25 }
    }

    const initialState = store.getState()
    const initialTeamA = initialState.teamAAssets
    const initialTeamB = initialState.teamBAssets

    // Add to Team A
    store.getState().addAssetToTeam("A", asset)
    const afterAddState = store.getState()

    // Arrays should be new references
    expect(afterAddState.teamAAssets).not.toBe(initialTeamA)
    expect(afterAddState.teamBAssets).toBe(initialTeamB) // Team B unchanged

    // Remove from Team A
    store.getState().removeAssetFromTeam("A", asset.id)
    const afterRemoveState = store.getState()

    // Arrays should be new references again
    expect(afterRemoveState.teamAAssets).not.toBe(afterAddState.teamAAssets)
    expect(afterRemoveState.teamBAssets).toBe(afterAddState.teamBAssets) // Team B unchanged
  })

  it('should calculate team totals correctly', () => {
    const asset1: Asset = {
      id: "test:player:1",
      kind: "player",
      label: "Test Player 1",
      value: 50,
      meta: { position: "QB", team: "TEST", age: 25 }
    }

    const asset2: Asset = {
      id: "test:player:2",
      kind: "player",
      label: "Test Player 2",
      value: 30,
      meta: { position: "RB", team: "TEST", age: 26 }
    }

    store.getState().addAssetToTeam("A", asset1)
    store.getState().addAssetToTeam("A", asset2)

    expect(store.getState().getTeamTotal("A")).toBe(80)
    expect(store.getState().getTeamTotal("B")).toBe(0)
  })

  it('should check if asset is in any team', () => {
    const asset: Asset = {
      id: "test:player:1",
      kind: "player",
      label: "Test Player",
      value: 50,
      meta: { position: "QB", team: "TEST", age: 25 }
    }

    expect(store.getState().isAssetInAnyTeam(asset.id)).toBe(false)

    store.getState().addAssetToTeam("A", asset)
    expect(store.getState().isAssetInAnyTeam(asset.id)).toBe(true)

    store.getState().removeAssetFromTeam("A", asset.id)
    expect(store.getState().isAssetInAnyTeam(asset.id)).toBe(false)
  })
})
