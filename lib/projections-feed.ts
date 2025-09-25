import { prisma } from './db'
import { Player } from '@prisma/client'

export interface ProjectionSource {
  id: string
  name: string
  url?: string
  lastUpdated: Date
  version: string
}

export interface ProjectionData {
  sleeperId?: string
  name: string
  team: string
  position: string
  projNow: number // Season projections (0-100 scale)
  projFuture: number // 1-2 year proxy (0-100 scale)
  confidence: number // 0-1 confidence score
  source: string
}

export interface ProjectionIngestResult {
  totalProcessed: number
  matched: number
  unmatched: number
  updated: number
  errors: string[]
  version: string
}

export class ProjectionsFeed {
  private source: ProjectionSource

  constructor(source: ProjectionSource) {
    this.source = source
  }

  async ingestProjections(data: ProjectionData[]): Promise<ProjectionIngestResult> {
    const result: ProjectionIngestResult = {
      totalProcessed: data.length,
      matched: 0,
      unmatched: 0,
      updated: 0,
      errors: [],
      version: this.source.version
    }

    try {
      // Get all players for mapping
      const allPlayers = await prisma.player.findMany({
        select: {
          id: true,
          sleeperId: true,
          name: true,
          team: true,
          position: true
        }
      })

      // Create mapping indexes
      const sleeperIdMap = new Map<string, Player>()
      const nameTeamPosMap = new Map<string, Player>()

      allPlayers.forEach(player => {
        if (player.sleeperId) {
          sleeperIdMap.set(player.sleeperId, player)
        }
        const key = `${player.name.toLowerCase()}|${player.team}|${player.position}`
        nameTeamPosMap.set(key, player)
      })

      // Process each projection
      for (const projection of data) {
        try {
          let matchedPlayer: Player | null = null

          // Try sleeperId first
          if (projection.sleeperId && sleeperIdMap.has(projection.sleeperId)) {
            matchedPlayer = sleeperIdMap.get(projection.sleeperId)!
          } else {
            // Fallback to name + team + position
            const key = `${projection.name.toLowerCase()}|${projection.team}|${projection.position}`
            if (nameTeamPosMap.has(key)) {
              matchedPlayer = nameTeamPosMap.get(key)!
            }
          }

          if (matchedPlayer) {
            result.matched++

            // Normalize projections to 0-100 scale
            const normalizedNow = this.normalizeProjection(projection.projNow, projection.position, 'now')
            const normalizedFuture = this.normalizeProjection(projection.projFuture, projection.position, 'future')

            // Apply smoothing (EMA with existing values)
            const existingValuation = await prisma.valuation.findFirst({
              where: {
                playerId: matchedPlayer.id,
                settingsHash: 'default' // Use default settings for projections
              }
            })

            let smoothedNow = normalizedNow
            let smoothedFuture = normalizedFuture

            if (existingValuation) {
              const smoothingFactor = 0.3 // 30% new, 70% existing
              smoothedNow = (normalizedNow * smoothingFactor) + (existingValuation.projNow * (1 - smoothingFactor))
              smoothedFuture = (normalizedFuture * smoothingFactor) + (existingValuation.projFuture * (1 - smoothingFactor))
            }

            // Upsert valuation with projections
            await prisma.valuation.upsert({
              where: {
                playerId_settingsHash: {
                  playerId: matchedPlayer.id,
                  settingsHash: 'default'
                }
              },
              update: {
                projNow: smoothedNow,
                projFuture: smoothedFuture,
                projNowRaw: projection.projNow,
                projFutureRaw: projection.projFuture,
                projConfidence: projection.confidence,
                projSource: projection.source,
                updatedAt: new Date()
              },
              create: {
                playerId: matchedPlayer.id,
                settingsHash: 'default',
                marketNow: 0, // Will be filled by market ingestion
                marketFuture: 0,
                projNow: smoothedNow,
                projFuture: smoothedFuture,
                projNowRaw: projection.projNow,
                projFutureRaw: projection.projFuture,
                projConfidence: projection.confidence,
                projSource: projection.source,
                nowScore: 0, // Will be computed by valuation engine
                futureScore: 0,
                composite: 0,
                createdAt: new Date(),
                updatedAt: new Date()
              }
            })

            result.updated++
          } else {
            result.unmatched++
            result.errors.push(`Unmatched player: ${projection.name} (${projection.team}, ${projection.position})`)
          }
        } catch (error) {
          result.errors.push(`Error processing ${projection.name}: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
      }

      // Update system status
      await this.updateSystemStatus(result)

    } catch (error) {
      result.errors.push(`Ingest failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

    return result
  }

  private normalizeProjection(value: number, position: string, type: 'now' | 'future'): number {
    // Position-specific normalization ranges
    const ranges = {
      QB: { now: [0, 400], future: [0, 300] },
      RB: { now: [0, 300], future: [0, 200] },
      WR: { now: [0, 300], future: [0, 250] },
      TE: { now: [0, 200], future: [0, 150] }
    }

    const range = ranges[position as keyof typeof ranges] || { now: [0, 300], future: [0, 200] }
    const [min, max] = range[type]

    // Clamp and normalize to 0-100
    const clamped = Math.max(min, Math.min(max, value))
    return ((clamped - min) / (max - min)) * 100
  }

  private async updateSystemStatus(result: ProjectionIngestResult): Promise<void> {
    await prisma.systemStatus.upsert({
      where: { id: 'projections' },
      update: {
        lastRefreshAt: new Date(),
        metadata: {
          version: result.version,
          totalProcessed: result.totalProcessed,
          matched: result.matched,
          unmatched: result.unmatched,
          updated: result.updated,
          errorCount: result.errors.length
        }
      },
      create: {
        id: 'projections',
        lastRefreshAt: new Date(),
        metadata: {
          version: result.version,
          totalProcessed: result.totalProcessed,
          matched: result.matched,
          unmatched: result.unmatched,
          updated: result.updated,
          errorCount: result.errors.length
        }
      }
    })
  }

  // Static method to create from CSV data
  static async fromCSV(csvData: string, source: ProjectionSource): Promise<ProjectionIngestResult> {
    const lines = csvData.trim().split('\n')
    const headers = lines[0].split(',').map(h => h.trim())
    
    const projections: ProjectionData[] = []
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim())
      if (values.length !== headers.length) continue

      const row: Record<string, string> = {}
      headers.forEach((header, index) => {
        row[header] = values[index]
      })

      try {
        const projection: ProjectionData = {
          sleeperId: row.sleeperId || undefined,
          name: row.name,
          team: row.team,
          position: row.position,
          projNow: parseFloat(row.projNow) || 0,
          projFuture: parseFloat(row.projFuture) || 0,
          confidence: parseFloat(row.confidence) || 0.8,
          source: source.name
        }

        projections.push(projection)
      } catch (error) {
        console.error(`Error parsing row ${i}:`, error)
      }
    }

    const feed = new ProjectionsFeed(source)
    return await feed.ingestProjections(projections)
  }

  // Static method to create from API data (placeholder for future integration)
  static async fromAPI(apiUrl: string, source: ProjectionSource): Promise<ProjectionIngestResult> {
    // This would integrate with a real projections API
    // For now, return a placeholder result
    return {
      totalProcessed: 0,
      matched: 0,
      unmatched: 0,
      updated: 0,
      errors: ['API integration not yet implemented'],
      version: source.version
    }
  }
}

// Helper function to get projection statistics
export async function getProjectionStats(): Promise<{
  totalPlayers: number
  withProjections: number
  coverage: number
  lastUpdated: Date | null
  source: string | null
}> {
  const totalPlayers = await prisma.player.count()
  
  const withProjections = await prisma.valuation.count({
    where: {
      projNow: { not: null },
      projFuture: { not: null }
    }
  })

  const systemStatus = await prisma.systemStatus.findUnique({
    where: { id: 'projections' }
  })

  return {
    totalPlayers,
    withProjections,
    coverage: totalPlayers > 0 ? (withProjections / totalPlayers) * 100 : 0,
    lastUpdated: systemStatus?.lastRefreshAt || null,
    source: systemStatus?.metadata?.source as string || null
  }
}
