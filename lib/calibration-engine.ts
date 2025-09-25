import { prisma } from './db'
import { LeagueSettings } from './settings'

export interface CalibrationParameters {
  // Global weights
  alpha: number // Now vs Future balance
  wM_now: number // Market weight for now
  wP_now: number // Projection weight for now
  wM_future: number // Market weight for future
  wP_future: number // Projection weight for future

  // Position age curve parameters
  ageCurves: {
    QB: { breakpoints: number[], multipliers: number[] }
    RB: { breakpoints: number[], multipliers: number[] }
    WR: { breakpoints: number[], multipliers: number[] }
    TE: { breakpoints: number[], multipliers: number[] }
  }

  // Scoring multipliers
  scoringMultipliers: {
    PPR: number
    Half: number
    Standard: number
  }
}

export interface CalibrationResult {
  id: string
  parameters: CalibrationParameters
  metrics: {
    overallRho: number
    positionRhos: Record<string, number>
    overallMAPE: number
    positionMAPEs: Record<string, number>
  }
  rankShifts: {
    position: string
    top50Shifts: Array<{
      playerId: number
      playerName: string
      beforeRank: number
      afterRank: number
      shift: number
    }>
    significantShifts: number // Count of shifts >= 10 ranks
  }[]
  createdAt: Date
  status: 'pending' | 'running' | 'completed' | 'failed'
}

export interface CalibrationRun {
  id: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  parameters: CalibrationParameters
  metrics?: CalibrationResult['metrics']
  rankShifts?: CalibrationResult['rankShifts']
  createdAt: Date
  completedAt?: Date
  error?: string
}

export class CalibrationEngine {
  private readonly GUARDRAILS = {
    alpha: { min: 0.1, max: 0.9 },
    weights: { min: 0.1, max: 0.9 },
    scoringMultipliers: { min: 0.6, max: 1.4 },
    ageMultipliers: { min: 0.5, max: 1.5 }
  }

  async runCalibration(): Promise<CalibrationRun> {
    const runId = `cal_${Date.now()}`
    
    // Create calibration run record
    const run = await prisma.calibrationRun.create({
      data: {
        id: runId,
        status: 'running',
        parameters: this.getDefaultParameters(),
        createdAt: new Date()
      }
    })

    try {
      // Get training data
      const trainingData = await this.getTrainingData()
      
      // Run k-fold cross-validation
      const bestParameters = await this.kFoldCrossValidation(trainingData)
      
      // Validate against guardrails
      if (!this.validateGuardrails(bestParameters)) {
        throw new Error('Calibrated parameters violate guardrails')
      }

      // Compute final metrics
      const metrics = await this.computeMetrics(bestParameters, trainingData)
      
      // Compute rank shifts
      const rankShifts = await this.computeRankShifts(bestParameters, trainingData)

      // Update run with results
      const updatedRun = await prisma.calibrationRun.update({
        where: { id: runId },
        data: {
          status: 'completed',
          parameters: bestParameters,
          metrics,
          rankShifts,
          completedAt: new Date()
        }
      })

      return updatedRun

    } catch (error) {
      // Update run with error
      await prisma.calibrationRun.update({
        where: { id: runId },
        data: {
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
          completedAt: new Date()
        }
      })

      throw error
    }
  }

  private async kFoldCrossValidation(trainingData: any[]): Promise<CalibrationParameters> {
    const k = 5
    const bestScore = -Infinity
    let bestParameters = this.getDefaultParameters()

    // Split data by position and age bands
    const folds = this.createPositionAgeFolds(trainingData, k)

    for (let fold = 0; fold < k; fold++) {
      const { trainSet, validationSet } = this.getFoldData(folds, fold)
      
      // Grid search over parameter space
      const parameters = await this.gridSearch(trainSet, validationSet)
      
      // Evaluate on validation set
      const score = await this.evaluateParameters(parameters, validationSet)
      
      if (score > bestScore) {
        bestParameters = parameters
      }
    }

    return bestParameters
  }

  private createPositionAgeFolds(data: any[], k: number): Record<string, any[]> {
    const folds: Record<string, any[]> = {}
    
    // Group by position and age bands
    const positionAgeGroups = {
      QB: { young: [], mid: [], old: [] },
      RB: { young: [], mid: [], old: [] },
      WR: { young: [], mid: [], old: [] },
      TE: { young: [], mid: [], old: [] }
    }

    data.forEach(player => {
      const age = player.age
      const position = player.position
      
      if (position === 'QB') {
        if (age <= 26) positionAgeGroups.QB.young.push(player)
        else if (age <= 30) positionAgeGroups.QB.mid.push(player)
        else positionAgeGroups.QB.old.push(player)
      } else if (position === 'RB') {
        if (age <= 23) positionAgeGroups.RB.young.push(player)
        else if (age <= 26) positionAgeGroups.RB.mid.push(player)
        else positionAgeGroups.RB.old.push(player)
      } else if (position === 'WR') {
        if (age <= 24) positionAgeGroups.WR.young.push(player)
        else if (age <= 27) positionAgeGroups.WR.mid.push(player)
        else positionAgeGroups.WR.old.push(player)
      } else if (position === 'TE') {
        if (age <= 25) positionAgeGroups.TE.young.push(player)
        else if (age <= 28) positionAgeGroups.TE.mid.push(player)
        else positionAgeGroups.TE.old.push(player)
      }
    })

    // Create k folds for each group
    Object.entries(positionAgeGroups).forEach(([position, groups]) => {
      Object.entries(groups).forEach(([ageGroup, players]) => {
        const foldSize = Math.ceil(players.length / k)
        for (let i = 0; i < k; i++) {
          const start = i * foldSize
          const end = Math.min(start + foldSize, players.length)
          const foldKey = `${position}_${ageGroup}_${i}`
          folds[foldKey] = players.slice(start, end)
        }
      })
    })

    return folds
  }

  private getFoldData(folds: Record<string, any[]>, testFold: number): { trainSet: any[], validationSet: any[] } {
    const trainSet: any[] = []
    const validationSet: any[] = []

    Object.entries(folds).forEach(([key, players]) => {
      const foldIndex = parseInt(key.split('_').pop() || '0')
      if (foldIndex === testFold) {
        validationSet.push(...players)
      } else {
        trainSet.push(...players)
      }
    })

    return { trainSet, validationSet }
  }

  private async gridSearch(trainSet: any[], validationSet: any[]): Promise<CalibrationParameters> {
    // Simplified grid search - in production, use more sophisticated optimization
    const parameters = this.getDefaultParameters()
    
    // Adjust parameters based on training data
    const marketCorrelation = this.computeMarketCorrelation(trainSet)
    const projectionCorrelation = this.computeProjectionCorrelation(trainSet)
    
    // Adjust weights based on correlations
    if (marketCorrelation > projectionCorrelation) {
      parameters.wM_now = Math.min(0.7, parameters.wM_now + 0.1)
      parameters.wP_now = Math.max(0.3, parameters.wP_now - 0.1)
    } else {
      parameters.wP_now = Math.min(0.7, parameters.wP_now + 0.1)
      parameters.wM_now = Math.max(0.3, parameters.wM_now - 0.1)
    }

    return parameters
  }

  private async evaluateParameters(parameters: CalibrationParameters, validationSet: any[]): Promise<number> {
    // Compute Spearman correlation with market baseline
    const correlations = validationSet.map(player => {
      const predicted = this.computeCompositeScore(player, parameters)
      const actual = player.marketValue
      return { predicted, actual }
    })

    const rho = this.computeSpearmanCorrelation(correlations)
    return rho
  }

  private computeCompositeScore(player: any, parameters: CalibrationParameters): number {
    // Simplified composite score computation
    const nowScore = (parameters.wM_now * player.marketValue) + (parameters.wP_now * (player.projNow || 0))
    const futureScore = (parameters.wM_future * player.marketValue) + (parameters.wP_future * (player.projFuture || 0))
    
    // Apply age curve
    const ageMultiplier = this.getAgeMultiplier(player.position, player.age, parameters.ageCurves)
    const adjustedFutureScore = futureScore * ageMultiplier
    
    return (parameters.alpha * nowScore) + ((1 - parameters.alpha) * adjustedFutureScore)
  }

  private getAgeMultiplier(position: string, age: number, ageCurves: CalibrationParameters['ageCurves']): number {
    const curve = ageCurves[position as keyof typeof ageCurves]
    if (!curve) return 1.0

    for (let i = 0; i < curve.breakpoints.length; i++) {
      if (age <= curve.breakpoints[i]) {
        return curve.multipliers[i]
      }
    }
    
    return curve.multipliers[curve.multipliers.length - 1]
  }

  private computeSpearmanCorrelation(pairs: Array<{ predicted: number, actual: number }>): number {
    // Simplified Spearman correlation computation
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

  private computeMarketCorrelation(players: any[]): number {
    // Compute correlation between market value and composite score
    return 0.8 // Placeholder
  }

  private computeProjectionCorrelation(players: any[]): number {
    // Compute correlation between projections and composite score
    return 0.7 // Placeholder
  }

  private async getTrainingData(): Promise<any[]> {
    // Get players with market values and projections
    const players = await prisma.player.findMany({
      where: {
        valuations: {
          some: {
            marketValue: { not: null },
            projNow: { not: null },
            projFuture: { not: null }
          }
        }
      },
      include: {
        valuations: {
          where: {
            scoring: 'PPR',
            superflex: false,
            tePremium: 1.0
          }
        }
      }
    })

    return players.map(player => ({
      id: player.id,
      name: player.name,
      position: player.position,
      age: player.age,
      marketValue: player.valuations[0]?.marketValue || 0,
      projNow: player.valuations[0]?.projNow || 0,
      projFuture: player.valuations[0]?.projFuture || 0
    }))
  }

  private async computeMetrics(parameters: CalibrationParameters, trainingData: any[]): Promise<CalibrationResult['metrics']> {
    const positionRhos: Record<string, number> = {}
    const positionMAPEs: Record<string, number> = {}
    
    // Group by position
    const positionGroups = {
      QB: trainingData.filter(p => p.position === 'QB'),
      RB: trainingData.filter(p => p.position === 'RB'),
      WR: trainingData.filter(p => p.position === 'WR'),
      TE: trainingData.filter(p => p.position === 'TE')
    }

    let overallRho = 0
    let overallMAPE = 0
    let totalPlayers = 0

    Object.entries(positionGroups).forEach(([position, players]) => {
      if (players.length === 0) return

      const correlations = players.map(player => {
        const predicted = this.computeCompositeScore(player, parameters)
        const actual = player.marketValue
        return { predicted, actual }
      })

      const rho = this.computeSpearmanCorrelation(correlations)
      positionRhos[position] = rho

      const mape = this.computeMAPE(correlations)
      positionMAPEs[position] = mape

      overallRho += rho * players.length
      overallMAPE += mape * players.length
      totalPlayers += players.length
    })

    return {
      overallRho: totalPlayers > 0 ? overallRho / totalPlayers : 0,
      positionRhos,
      overallMAPE: totalPlayers > 0 ? overallMAPE / totalPlayers : 0,
      positionMAPEs
    }
  }

  private computeMAPE(pairs: Array<{ predicted: number, actual: number }>): number {
    if (pairs.length === 0) return 0

    const mape = pairs.reduce((sum, pair) => {
      if (pair.actual === 0) return sum
      return sum + Math.abs((pair.predicted - pair.actual) / pair.actual)
    }, 0)

    return mape / pairs.length
  }

  private async computeRankShifts(parameters: CalibrationParameters, trainingData: any[]): Promise<CalibrationResult['rankShifts']> {
    const rankShifts: CalibrationResult['rankShifts'] = []

    // Group by position
    const positionGroups = {
      QB: trainingData.filter(p => p.position === 'QB'),
      RB: trainingData.filter(p => p.position === 'RB'),
      WR: trainingData.filter(p => p.position === 'WR'),
      TE: trainingData.filter(p => p.position === 'TE')
    }

    Object.entries(positionGroups).forEach(([position, players]) => {
      if (players.length === 0) return

      // Sort by current market value (before)
      const beforeRanking = [...players].sort((a, b) => b.marketValue - a.marketValue)
      
      // Sort by new composite score (after)
      const afterRanking = [...players].sort((a, b) => {
        const scoreA = this.computeCompositeScore(a, parameters)
        const scoreB = this.computeCompositeScore(b, parameters)
        return scoreB - scoreA
      })

      // Compute rank shifts for top 50
      const top50Shifts = beforeRanking.slice(0, 50).map((player, index) => {
        const beforeRank = index + 1
        const afterRank = afterRanking.findIndex(p => p.id === player.id) + 1
        const shift = afterRank - beforeRank

        return {
          playerId: player.id,
          playerName: player.name,
          beforeRank,
          afterRank,
          shift
        }
      })

      const significantShifts = top50Shifts.filter(shift => Math.abs(shift.shift) >= 10).length

      rankShifts.push({
        position,
        top50Shifts,
        significantShifts
      })
    })

    return rankShifts
  }

  private validateGuardrails(parameters: CalibrationParameters): boolean {
    // Check global weight bounds
    if (parameters.alpha < this.GUARDRAILS.alpha.min || parameters.alpha > this.GUARDRAILS.alpha.max) {
      return false
    }

    // Check individual weight bounds
    const weights = [parameters.wM_now, parameters.wP_now, parameters.wM_future, parameters.wP_future]
    if (weights.some(w => w < this.GUARDRAILS.weights.min || w > this.GUARDRAILS.weights.max)) {
      return false
    }

    // Check scoring multiplier bounds
    const scoringValues = Object.values(parameters.scoringMultipliers)
    if (scoringValues.some(m => m < this.GUARDRAILS.scoringMultipliers.min || m > this.GUARDRAILS.scoringMultipliers.max)) {
      return false
    }

    // Check age curve monotonicity for RB (future should decrease after age 26)
    const rbCurve = parameters.ageCurves.RB
    if (rbCurve.breakpoints.length >= 2) {
      const oldIndex = rbCurve.breakpoints.findIndex(bp => bp > 26)
      if (oldIndex > 0 && rbCurve.multipliers[oldIndex] > rbCurve.multipliers[oldIndex - 1]) {
        return false
      }
    }

    return true
  }

  private getDefaultParameters(): CalibrationParameters {
    return {
      alpha: 0.6,
      wM_now: 0.6,
      wP_now: 0.4,
      wM_future: 0.4,
      wP_future: 0.6,
      ageCurves: {
        QB: { breakpoints: [26, 30, 35], multipliers: [1.0, 0.95, 0.85, 0.7] },
        RB: { breakpoints: [23, 26, 29], multipliers: [1.0, 0.9, 0.7, 0.5] },
        WR: { breakpoints: [24, 27, 30], multipliers: [1.0, 0.95, 0.85, 0.7] },
        TE: { breakpoints: [25, 28, 31], multipliers: [1.0, 0.95, 0.8, 0.6] }
      },
      scoringMultipliers: {
        PPR: 1.0,
        Half: 0.85,
        Standard: 0.7
      }
    }
  }
}
