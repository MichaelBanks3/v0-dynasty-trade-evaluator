"use client"

import { VerdictCard } from "./VerdictCard"
import { RecommendationsCard } from "./RecommendationsCard"
import { TransparencyDrawer } from "./TransparencyDrawer"
import { FeedbackRow } from "./FeedbackRow"

interface TradeResultBottomProps {
  result: any
  settings: any
  teamProfile?: any
}

export function TradeResultBottom({ result, settings, teamProfile }: TradeResultBottomProps) {
  if (!result) {
    return null // Hide entirely when no evaluation
  }

  const teamATotal = result.totals?.teamA?.compositeValue || 0
  const teamBTotal = result.totals?.teamB?.compositeValue || 0
  const delta = Math.abs(teamATotal - teamBTotal)
  const max = Math.max(teamATotal, teamBTotal)
  const deltaPercentage = max > 0 ? delta / max : 0

  return (
    <div className="space-y-6">
      {/* Verdict and Recommendations Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <VerdictCard
          verdict={result.verdict}
          teamATotal={teamATotal}
          teamBTotal={teamBTotal}
        />
        <RecommendationsCard
          suggestion={result.suggestion}
          teamProfile={teamProfile}
          delta={deltaPercentage}
        />
      </div>

      {/* Transparency Drawer */}
      <TransparencyDrawer
        settings={settings}
        result={result}
      />

      {/* Feedback Row */}
      <FeedbackRow
        tradeId={result.id || 'unknown'}
        verdict={result.verdict}
      />
    </div>
  )
}
