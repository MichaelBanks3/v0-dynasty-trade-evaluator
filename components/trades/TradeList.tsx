"use client"

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, TrendingDown, Minus, Plus } from 'lucide-react'
import { formatPts } from '@/lib/format'
import { UserTrade } from '@/lib/server/getUserTrades'

interface TradeListProps {
  trades: UserTrade[]
}

export function TradeList({ trades }: TradeListProps) {
  if (trades.length === 0) {
    return (
      <div data-testid="dashboard-empty" className="text-center py-16">
        <div className="max-w-md mx-auto">
          <div className="w-16 h-16 theme-muted rounded-full flex items-center justify-center mx-auto mb-4 opacity-20">
            <Plus className="h-8 w-8 theme-muted" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No trades yet</h3>
          <p className="theme-muted mb-6">
            Create your first trade to get started with evaluating player values and making informed decisions.
          </p>
          <Link href="/trade" className="btn-primary focus-ring">
            <Plus className="h-4 w-4 mr-2" />
            Create Trade
          </Link>
        </div>
      </div>
    )
  }

  const getVerdictIcon = (verdict: string | null) => {
    switch (verdict) {
      case 'FAVORS_A':
        return <TrendingUp className="h-4 w-4 text-blue-600" />
      case 'FAVORS_B':
        return <TrendingDown className="h-4 w-4 text-purple-600" />
      case 'FAIR':
        return <Minus className="h-4 w-4 text-green-600" />
      default:
        return <Minus className="h-4 w-4 text-muted" />
    }
  }

  const getVerdictColor = (verdict: string | null) => {
    switch (verdict) {
      case 'FAVORS_A':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      case 'FAVORS_B':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30'
      case 'FAIR':
        return 'bg-green-500/20 text-green-400 border-green-500/30'
      default:
        return 'bg-muted/20 text-muted border-[color:var(--border)]'
    }
  }

  const getVerdictLabel = (verdict: string | null) => {
    switch (verdict) {
      case 'FAVORS_A':
        return 'Favors Team A'
      case 'FAVORS_B':
        return 'Favors Team B'
      case 'FAIR':
        return 'Fair Trade'
      default:
        return 'Unknown'
    }
  }

  return (
    <div data-testid="dashboard-list" className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Recent Trades</h2>
        <span className="text-sm theme-muted">{trades.length} trades</span>
      </div>
      
      <div className="space-y-3">
        {trades.map((trade) => (
          <div key={trade.id} className="theme-card p-4 hover:opacity-80 transition-opacity">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {getVerdictIcon(trade.verdict)}
                <div>
                  <div className="flex items-center space-x-2">
                    <span className={`chip ${getVerdictColor(trade.verdict)}`}>
                      {getVerdictLabel(trade.verdict)}
                    </span>
                  </div>
                  <p className="text-sm theme-muted mt-1">
                    {new Date(trade.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-sm font-medium">
                  {formatPts(trade.totalA)} vs {formatPts(trade.totalB)}
                </div>
                <div className="text-xs theme-muted">
                  {Math.abs(trade.totalA - trade.totalB) > 0 
                    ? `${Math.abs(trade.totalA - trade.totalB)} point difference`
                    : 'Even trade'
                  }
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
