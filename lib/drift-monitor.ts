import { prisma } from './db'

export interface DriftMetrics {
  overallRho: number
  positionRhos: Record<string, number>
  jsDivergence: number
  topMovers: Array<{
    playerId: number
    playerName: string
    position: string
    rankChange: number
    cause: 'market' | 'projections' | 'config'
  }>
  timestamp: Date
}

export interface DriftAlert {
  id: string
  type: 'correlation' | 'divergence' | 'movers'
  severity: 'warning' | 'critical'
  metric: string
  value: number
  threshold: number
  position?: string
  message: string
  createdAt: Date
  resolved: boolean
  resolvedAt?: Date
}

export class DriftMonitor {
  private readonly THRESHOLDS = {
    correlation: {
      warning: 0.80,
      critical: 0.75
    },
    divergence: {
      warning: 0.10,
      critical: 0.15
    },
    movers: {
      warning: 0.15, // 15% of top players moving significantly
      critical: 0.25
    }
  }

  async checkDrift(): Promise<DriftMetrics> {
    // Get current and previous week's data
    const currentData = await this.getCurrentValuations()
    const previousData = await this.getPreviousValuations()
    
    // Compute correlation metrics
    const correlationMetrics = await this.computeCorrelationMetrics(currentData)
    
    // Compute JS divergence
    const jsDivergence = this.computeJSDivergence(currentData, previousData)
    
    // Identify top movers
    const topMovers = await this.identifyTopMovers(currentData, previousData)
    
    const metrics: DriftMetrics = {
      overallRho: correlationMetrics.overall,
      positionRhos: correlationMetrics.positions,
      jsDivergence,
      topMovers,
      timestamp: new Date()
    }

    // Check for alerts
    await this.checkAlerts(metrics)
    
    // Store metrics
    await this.storeMetrics(metrics)
    
    return metrics
  }

  private async getCurrentValuations(): Promise<any[]> {
    const valuations = await prisma.valuation.findMany({
      where: {
        marketValue: { not: null },
        compositeValue: { not: null }
      },
      include: {
        player: {
          select: {
            id: true,
            name: true,
            position: true,
            age: true
          }
        }
      }
    })

    return valuations.map(v => ({
      playerId: v.player.id,
      playerName: v.player.name,
      position: v.player.position,
      age: v.player.age,
      marketValue: v.marketValue,
      compositeValue: v.compositeValue,
      projNow: v.projNow,
      projFuture: v.projFuture
    }))
  }

  private async getPreviousValuations(): Promise<any[]> {
    // Get valuations from one week ago
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

    const valuations = await prisma.valuation.findMany({
      where: {
        marketValue: { not: null },
        compositeValue: { not: null },
        updatedAt: { lte: oneWeekAgo }
      },
      include: {
        player: {
          select: {
            id: true,
            name: true,
            position: true,
            age: true
          }
        }
      }
    })

    return valuations.map(v => ({
      playerId: v.player.id,
      playerName: v.player.name,
      position: v.player.position,
      age: v.player.age,
      marketValue: v.marketValue,
      compositeValue: v.compositeValue,
      projNow: v.projNow,
      projFuture: v.projFuture
    }))
  }

  private async computeCorrelationMetrics(data: any[]): Promise<{ overall: number, positions: Record<string, number> }> {
    const positionGroups = {
      QB: data.filter(p => p.position === 'QB'),
      RB: data.filter(p => p.position === 'RB'),
      WR: data.filter(p => p.position === 'WR'),
      TE: data.filter(p => p.position === 'TE')
    }

    const positionRhos: Record<string, number> = {}
    let overallRho = 0
    let totalPlayers = 0

    Object.entries(positionGroups).forEach(([position, players]) => {
      if (players.length === 0) return

      const correlations = players.map(player => ({
        predicted: player.compositeValue,
        actual: player.marketValue
      }))

      const rho = this.computeSpearmanCorrelation(correlations)
      positionRhos[position] = rho

      overallRho += rho * players.length
      totalPlayers += players.length
    })

    return {
      overall: totalPlayers > 0 ? overallRho / totalPlayers : 0,
      positions: positionRhos
    }
  }

  private computeJSDivergence(current: any[], previous: any[]): number {
    // Compute Jensen-Shannon divergence between current and previous distributions
    const currentDist = this.computePositionDistribution(current)
    const previousDist = this.computePositionDistribution(previous)
    
    return this.jensenShannonDivergence(currentDist, previousDist)
  }

  private computePositionDistribution(data: any[]): Record<string, number> {
    const distribution: Record<string, number> = { QB: 0, RB: 0, WR: 0, TE: 0 }
    const total = data.length

    data.forEach(player => {
      distribution[player.position]++
    })

    // Normalize
    Object.keys(distribution).forEach(position => {
      distribution[position] = distribution[position] / total
    })

    return distribution
  }

  private jensenShannonDivergence(p: Record<string, number>, q: Record<string, number>): number {
    const m: Record<string, number> = {}
    const positions = Object.keys(p)
    
    // Compute mixture distribution
    positions.forEach(pos => {
      m[pos] = (p[pos] + q[pos]) / 2
    })

    // Compute KL divergences
    const klPM = this.klDivergence(p, m)
    const klQM = this.klDivergence(q, m)

    return (klPM + klQM) / 2
  }

  private klDivergence(p: Record<string, number>, q: Record<string, number>): number {
    let kl = 0
    const positions = Object.keys(p)

    positions.forEach(pos => {
      if (p[pos] > 0 && q[pos] > 0) {
        kl += p[pos] * Math.log(p[pos] / q[pos])
      }
    })

    return kl
  }

  private async identifyTopMovers(current: any[], previous: any[]): Promise<DriftMetrics['topMovers']> {
    const movers: DriftMetrics['topMovers'] = []

    // Create maps for efficient lookup
    const currentMap = new Map(current.map(p => [p.playerId, p]))
    const previousMap = new Map(previous.map(p => [p.playerId, p]))

    // Find players that exist in both datasets
    const commonPlayers = current.filter(p => previousMap.has(p.playerId))

    // Sort by current composite value to get top players
    const topPlayers = commonPlayers
      .sort((a, b) => b.compositeValue - a.compositeValue)
      .slice(0, 100) // Top 100

    topPlayers.forEach(player => {
      const previous = previousMap.get(player.playerId)!
      const rankChange = this.computeRankChange(player, previous, current, previous)
      
      if (Math.abs(rankChange) >= 10) { // Significant rank change
        const cause = this.determineCause(player, previous)
        movers.push({
          playerId: player.playerId,
          playerName: player.playerName,
          position: player.position,
          rankChange,
          cause
        })
      }
    })

    return movers.slice(0, 20) // Top 20 movers
  }

  private computeRankChange(current: any, previous: any, currentData: any[], previousData: any[]): number {
    // Compute rank in current data
    const currentRank = currentData
      .filter(p => p.position === current.position)
      .sort((a, b) => b.compositeValue - a.compositeValue)
      .findIndex(p => p.playerId === current.playerId) + 1

    // Compute rank in previous data
    const previousRank = previousData
      .filter(p => p.position === previous.position)
      .sort((a, b) => b.compositeValue - a.compositeValue)
      .findIndex(p => p.playerId === previous.playerId) + 1

    return previousRank - currentRank // Positive means moved up
  }

  private determineCause(current: any, previous: any): 'market' | 'projections' | 'config' {
    const marketChange = Math.abs(current.marketValue - previous.marketValue) / previous.marketValue
    const projNowChange = Math.abs((current.projNow || 0) - (previous.projNow || 0)) / Math.max(previous.projNow || 1, 1)
    const projFutureChange = Math.abs((current.projFuture || 0) - (previous.projFuture || 0)) / Math.max(previous.projFuture || 1, 1)

    const maxChange = Math.max(marketChange, projNowChange, projFutureChange)

    if (marketChange === maxChange) return 'market'
    if (projNowChange === maxChange || projFutureChange === maxChange) return 'projections'
    return 'config'
  }

  private computeSpearmanCorrelation(pairs: Array<{ predicted: number, actual: number }>): number {
    const n = pairs.length
    if (n < 2) return 0

    const sortedPredicted = [...pairs].sort((a, b) => a.predicted - b.predicted)
    const sortedActual = [...pairs].sort((a, b) => a.actual - b.actual)

    let sumD2 = 0
    for (let i = 0; i < n; i++) {
      const rankPredicted = sortedPredicted.findIndex(p => p.predicted === pairs[i].predicted)
      const rankActual = sortedActual.findIndex(p => p.actual === pairs[i].actual)
      const d = rankPredicted - rankActual
      sumD2 += d * d
    }

    return 1 - (6 * sumD2) / (n * (n * n - 1))
  }

  private async checkAlerts(metrics: DriftMetrics): Promise<void> {
    const alerts: DriftAlert[] = []

    // Check overall correlation
    if (metrics.overallRho < this.THRESHOLDS.correlation.critical) {
      alerts.push({
        id: `correlation_critical_${Date.now()}`,
        type: 'correlation',
        severity: 'critical',
        metric: 'overall_rho',
        value: metrics.overallRho,
        threshold: this.THRESHOLDS.correlation.critical,
        message: `Overall correlation dropped to ${metrics.overallRho.toFixed(3)}, below critical threshold`,
        createdAt: new Date(),
        resolved: false
      })
    } else if (metrics.overallRho < this.THRESHOLDS.correlation.warning) {
      alerts.push({
        id: `correlation_warning_${Date.now()}`,
        type: 'correlation',
        severity: 'warning',
        metric: 'overall_rho',
        value: metrics.overallRho,
        threshold: this.THRESHOLDS.correlation.warning,
        message: `Overall correlation dropped to ${metrics.overallRho.toFixed(3)}, below warning threshold`,
        createdAt: new Date(),
        resolved: false
      })
    }

    // Check position correlations
    Object.entries(metrics.positionRhos).forEach(([position, rho]) => {
      if (rho < this.THRESHOLDS.correlation.critical) {
        alerts.push({
          id: `correlation_${position}_critical_${Date.now()}`,
          type: 'correlation',
          severity: 'critical',
          metric: `${position}_rho`,
          value: rho,
          threshold: this.THRESHOLDS.correlation.critical,
          position,
          message: `${position} correlation dropped to ${rho.toFixed(3)}, below critical threshold`,
          createdAt: new Date(),
          resolved: false
        })
      }
    })

    // Check JS divergence
    if (metrics.jsDivergence > this.THRESHOLDS.divergence.critical) {
      alerts.push({
        id: `divergence_critical_${Date.now()}`,
        type: 'divergence',
        severity: 'critical',
        metric: 'js_divergence',
        value: metrics.jsDivergence,
        threshold: this.THRESHOLDS.divergence.critical,
        message: `Distribution divergence increased to ${metrics.jsDivergence.toFixed(3)}, above critical threshold`,
        createdAt: new Date(),
        resolved: false
      })
    }

    // Check top movers
    const significantMovers = metrics.topMovers.length
    const totalTopPlayers = 100
    const moverPercentage = significantMovers / totalTopPlayers

    if (moverPercentage > this.THRESHOLDS.movers.critical) {
      alerts.push({
        id: `movers_critical_${Date.now()}`,
        type: 'movers',
        severity: 'critical',
        metric: 'mover_percentage',
        value: moverPercentage,
        threshold: this.THRESHOLDS.movers.critical,
        message: `${significantMovers} top players moved significantly (${(moverPercentage * 100).toFixed(1)}%), above critical threshold`,
        createdAt: new Date(),
        resolved: false
      })
    }

    // Store alerts
    for (const alert of alerts) {
      await this.storeAlert(alert)
    }
  }

  private async storeMetrics(metrics: DriftMetrics): Promise<void> {
    await prisma.driftMetrics.create({
      data: {
        overallRho: metrics.overallRho,
        positionRhos: metrics.positionRhos,
        jsDivergence: metrics.jsDivergence,
        topMovers: metrics.topMovers,
        timestamp: metrics.timestamp
      }
    })
  }

  private async storeAlert(alert: DriftAlert): Promise<void> {
    await prisma.driftAlert.create({
      data: {
        id: alert.id,
        type: alert.type,
        severity: alert.severity,
        metric: alert.metric,
        value: alert.value,
        threshold: alert.threshold,
        position: alert.position,
        message: alert.message,
        createdAt: alert.createdAt,
        resolved: alert.resolved,
        resolvedAt: alert.resolvedAt
      }
    })
  }

  async getActiveAlerts(): Promise<DriftAlert[]> {
    const alerts = await prisma.driftAlert.findMany({
      where: { resolved: false },
      orderBy: { createdAt: 'desc' }
    })

    return alerts.map(alert => ({
      id: alert.id,
      type: alert.type as 'correlation' | 'divergence' | 'movers',
      severity: alert.severity as 'warning' | 'critical',
      metric: alert.metric,
      value: alert.value,
      threshold: alert.threshold,
      position: alert.position,
      message: alert.message,
      createdAt: alert.createdAt,
      resolved: alert.resolved,
      resolvedAt: alert.resolvedAt
    }))
  }
}
