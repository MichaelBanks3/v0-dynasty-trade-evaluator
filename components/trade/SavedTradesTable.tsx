"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ExternalLink, Calendar, TrendingUp, TrendingDown, Minus } from "lucide-react"
import { formatDate, formatPts, safeNumber } from "@/lib/format"
import { TradeStatus } from "@prisma/client"

interface SavedTrade {
  id: string
  slug?: string
  verdict?: string
  teamATotal?: number
  teamBTotal?: number
  deltaPct?: number
  status: TradeStatus
  createdAt: string
}

interface SavedTradesTableProps {
  trades: SavedTrade[]
  onStatusChange?: (tradeId: string, newStatus: TradeStatus) => void
  className?: string
}

export function SavedTradesTable({ trades, onStatusChange, className }: SavedTradesTableProps) {
  const getVerdictIcon = (verdict?: string) => {
    switch (verdict) {
      case 'FAVORS_A':
        return <TrendingUp className="h-4 w-4 text-blue-400" />
      case 'FAVORS_B':
        return <TrendingDown className="h-4 w-4 text-purple-400" />
      case 'FAIR':
        return <Minus className="h-4 w-4 text-green-400" />
      default:
        return <Minus className="h-4 w-4 text-subtext" />
    }
  }

  const getVerdictColor = (verdict?: string) => {
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

  const getStatusColor = (status: TradeStatus) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'REQUESTED':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      case 'DENIED':
        return 'bg-red-500/20 text-red-400 border-red-500/30'
      case 'SANDBOX':
        return 'bg-muted/20 text-muted border-[color:var(--border)]'
      default:
        return 'bg-muted/20 text-muted border-[color:var(--border)]'
    }
  }

  const handleStatusChange = (tradeId: string, newStatus: TradeStatus) => {
    onStatusChange?.(tradeId, newStatus)
  }

  if (trades.length === 0) {
    return (
      <div className={`text-center py-8 text-subtext ${className}`}>
        No trades found
      </div>
    )
  }

  return (
    <div className={className}>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-subtext">Date</TableHead>
            <TableHead className="text-subtext">Verdict</TableHead>
            <TableHead className="text-subtext">Team A Total</TableHead>
            <TableHead className="text-subtext">Team B Total</TableHead>
            <TableHead className="text-subtext">Delta</TableHead>
            <TableHead className="text-subtext">Status</TableHead>
            <TableHead className="text-subtext">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {trades.map((trade) => (
            <TableRow key={trade.id}>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-subtext" />
                  {formatDate(trade.createdAt)}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  {getVerdictIcon(trade.verdict)}
                  <Badge className={getVerdictColor(trade.verdict)}>
                    {trade.verdict?.replace('_', ' ') || 'Unknown'}
                  </Badge>
                </div>
              </TableCell>
              <TableCell>
                <span className="font-mono text-text">
                  {formatPts(trade.teamATotal)}
                </span>
              </TableCell>
              <TableCell>
                <span className="font-mono text-text">
                  {formatPts(trade.teamBTotal)}
                </span>
              </TableCell>
              <TableCell>
                <span className="font-mono text-text">
                  {safeNumber(trade.deltaPct).toFixed(1)}%
                </span>
              </TableCell>
              <TableCell>
                <Select
                  value={trade.status}
                  onValueChange={(value: TradeStatus) => handleStatusChange(trade.id, value)}
                >
                  <SelectTrigger className="w-32 bg-surface border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SANDBOX">Sandbox</SelectItem>
                    <SelectItem value="REQUESTED">Requested</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                    <SelectItem value="DENIED">Denied</SelectItem>
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                  className="text-subtext hover:text-text"
                >
                  <a href={trade.slug ? `/t/${trade.slug}` : `/trade/${trade.id}`}>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View
                  </a>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
